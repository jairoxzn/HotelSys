import { Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logActivity } from '../utils/logger.js';

export async function getReservations(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { status, roomId, customerId } = req.query;

  try {
    const filters: any = {};
    if (status) filters.status = status as any;
    if (roomId) filters.roomId = roomId as string;
    if (customerId) filters.customerId = customerId as string;

    const reservations = await prisma.reservation.findMany({
      where: filters,
      include: {
        customer: true,
        room: true,
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        payments: true,
      },
      orderBy: { checkIn: 'desc' },
    });

    res.json(reservations);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener las reservas.' });
  }
}

export async function getReservationById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: true,
        room: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        payments: true,
      },
    });

    if (!reservation) {
      res.status(404).json({ error: 'Reserva no encontrada.' });
      return;
    }

    res.json(reservation);
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    res.status(500).json({ error: 'Error al obtener la reserva.' });
  }
}

export async function createReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { customerId, roomId, checkIn, checkOut, status } = req.body;
  const userId = req.user?.id;

  if (!customerId || !roomId || !checkIn || !checkOut || !userId) {
    res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    return;
  }

  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);

  if (inDate >= outDate) {
    res.status(400).json({ error: 'La fecha de check-in debe ser anterior a la de check-out.' });
    return;
  }

  try {
    // 1. Fetch the room to compute price and check if it's in maintenance
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      res.status(404).json({ error: 'Habitación no encontrada.' });
      return;
    }

    if (room.status === 'MANTENIMIENTO') {
      res.status(400).json({ error: 'La habitación está en mantenimiento y no se puede reservar.' });
      return;
    }

    // 2. Validate double booking
    const conflicting = await prisma.reservation.findFirst({
      where: {
        roomId,
        status: { in: ['PENDIENTE', 'CONFIRMADA', 'COMPLETADA'] }, // Allow bookings if previous was canceled
        AND: [
          { checkIn: { lt: outDate } },
          { checkOut: { gt: inDate } },
        ],
      },
    });

    if (conflicting) {
      res.status(400).json({ error: 'La habitación ya está ocupada o reservada en el rango de fechas seleccionado.' });
      return;
    }

    // Calculate total price
    const nights = Math.max(1, Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
    const total = room.price * nights;

    const reservation = await prisma.reservation.create({
      data: {
        userId,
        customerId,
        roomId,
        checkIn: inDate,
        checkOut: outDate,
        total,
        status: status || 'PENDIENTE',
      },
      include: {
        customer: true,
        room: true,
      },
    });

    // If reservation is confirmed, update room status to OCUPADA
    if (status === 'CONFIRMADA') {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'OCUPADA' },
      });
    }

    if (req.user) {
      await logActivity(
        req.user.id,
        'CREAR_RESERVA',
        `Creó la reserva ${reservation.id} para el huésped ${reservation.customer.fullname} en la Habitación ${reservation.room.number} (Total: S/. ${reservation.total.toFixed(2)}).`
      );
    }

    res.status(201).json(reservation);
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: 'Error al registrar la reserva.' });
  }
}

export async function updateReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { customerId, roomId, checkIn, checkOut, status } = req.body;

  try {
    const currentRes = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!currentRes) {
      res.status(404).json({ error: 'Reserva no encontrada.' });
      return;
    }

    const rId = roomId || currentRes.roomId;
    const inDate = checkIn ? new Date(checkIn) : currentRes.checkIn;
    const outDate = checkOut ? new Date(checkOut) : currentRes.checkOut;

    if (inDate >= outDate) {
      res.status(400).json({ error: 'La fecha de check-in debe ser anterior a la de check-out.' });
      return;
    }

    // Validate double booking if room or dates changed
    if (roomId !== currentRes.roomId || checkIn || checkOut) {
      const conflicting = await prisma.reservation.findFirst({
        where: {
          id: { not: id },
          roomId: rId,
          status: { in: ['PENDIENTE', 'CONFIRMADA', 'COMPLETADA'] },
          AND: [
            { checkIn: { lt: outDate } },
            { checkOut: { gt: inDate } },
          ],
        },
      });

      if (conflicting) {
        res.status(400).json({ error: 'La habitación ya está ocupada o reservada en el rango de fechas seleccionado.' });
        return;
      }
    }

    // Re-calculate total if dates or room changed
    let total = currentRes.total;
    if (roomId !== currentRes.roomId || checkIn || checkOut) {
      const targetRoom = await prisma.room.findUnique({ where: { id: rId } });
      if (targetRoom) {
        const nights = Math.max(1, Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
        total = targetRoom.price * nights;
      }
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        customerId,
        roomId: rId,
        checkIn: inDate,
        checkOut: outDate,
        total,
        status: status || undefined,
      },
      include: {
        customer: true,
        room: true,
      },
    });

    // Handle room status updates based on reservation status changes
    if (status && status !== currentRes.status) {
      if (status === 'CONFIRMADA') {
        await prisma.room.update({
          where: { id: rId },
          data: { status: 'OCUPADA' },
        });
      } else if (status === 'CANCELADA' || status === 'COMPLETADA') {
        await prisma.room.update({
          where: { id: rId },
          data: { status: 'DISPONIBLE' },
        });
      }
    }

    if (req.user) {
      await logActivity(
        req.user.id,
        'MODIFICAR_RESERVA',
        `Modificó la reserva ${updated.id} para el huésped ${updated.customer.fullname} en la Habitación ${updated.room.number} (Total: S/. ${updated.total.toFixed(2)}, Estado: ${updated.status}).`
      );
    }

    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    res.status(500).json({ error: 'Error al actualizar la reserva.' });
  }
}

export async function checkInReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      res.status(404).json({ error: 'Reserva no encontrada.' });
      return;
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: 'CONFIRMADA' },
      include: { customer: true, room: true },
    });

    await prisma.room.update({
      where: { id: reservation.roomId },
      data: { status: 'OCUPADA' },
    });

    if (req.user) {
      await logActivity(
        req.user.id,
        'CHECK_IN',
        `Realizó Check-in para el huésped ${updated.customer.fullname} en la Habitación ${updated.room.number} (Reserva: ${updated.id}).`
      );
    }

    res.json({ message: 'Check-in realizado exitosamente.', reservation: updated });
  } catch (error) {
    console.error('Error en check-in:', error);
    res.status(500).json({ error: 'Error al realizar check-in.' });
  }
}

export async function checkOutReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!reservation) {
      res.status(404).json({ error: 'Reserva no encontrada.' });
      return;
    }

    // Check if the total has been fully paid
    const paidAmount = reservation.payments.reduce((acc, p) => acc + p.amount, 0);
    if (paidAmount < reservation.total) {
      res.status(400).json({
        error: `No se puede realizar check-out. Resta pagar S/. ${(reservation.total - paidAmount).toFixed(2)} del total.`,
      });
      return;
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: 'COMPLETADA' },
      include: { customer: true, room: true },
    });

    await prisma.room.update({
      where: { id: reservation.roomId },
      data: { status: 'DISPONIBLE' },
    });

    if (req.user) {
      await logActivity(
        req.user.id,
        'CHECK_OUT',
        `Realizó Check-out para el huésped ${updated.customer.fullname} de la Habitación ${updated.room.number} (Reserva: ${updated.id}).`
      );
    }

    res.json({ message: 'Check-out realizado exitosamente.', reservation: updated });
  } catch (error) {
    console.error('Error en check-out:', error);
    res.status(500).json({ error: 'Error al realizar check-out.' });
  }
}

export async function cancelReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      res.status(404).json({ error: 'Reserva no encontrada.' });
      return;
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELADA' },
      include: { customer: true, room: true },
    });

    await prisma.room.update({
      where: { id: reservation.roomId },
      data: { status: 'DISPONIBLE' },
    });

    if (req.user) {
      await logActivity(
        req.user.id,
        'CANCELAR_RESERVA',
        `Canceló la reserva ${updated.id} del huésped ${updated.customer.fullname} (Habitación ${updated.room.number}).`
      );
    }

    res.json({ message: 'Reserva cancelada exitosamente.', reservation: updated });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error al cancelar la reserva.' });
  }
}
