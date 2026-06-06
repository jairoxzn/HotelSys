import { Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logActivity } from '../utils/logger.js';

export async function getPayments(req: Request, res: Response): Promise<void> {
  const { reservationId } = req.query;

  try {
    const filters: any = {};
    if (reservationId) filters.reservationId = reservationId as string;

    const payments = await prisma.payment.findMany({
      where: filters,
      include: {
        reservation: {
          include: {
            customer: true,
            room: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    res.json(payments);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ error: 'Error al obtener los pagos.' });
  }
}

export async function createPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { reservationId, amount, method } = req.body;

  if (!reservationId || amount === undefined || !method) {
    res.status(400).json({ error: 'La reserva, el monto y el método de pago son obligatorios.' });
    return;
  }

  const paymentAmount = parseFloat(amount);
  if (paymentAmount <= 0) {
    res.status(400).json({ error: 'El monto de pago debe ser mayor a cero.' });
    return;
  }

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { payments: true, customer: true, room: true },
    });

    if (!reservation) {
      res.status(404).json({ error: 'Reserva no encontrada.' });
      return;
    }

    if (reservation.status === 'CANCELADA') {
      res.status(400).json({ error: 'No se pueden procesar pagos para una reserva cancelada.' });
      return;
    }

    const totalPaid = reservation.payments.reduce((acc, p) => acc + p.amount, 0);
    const pending = reservation.total - totalPaid;

    if (paymentAmount > pending + 0.01) { // allowance for floating point accuracy
      res.status(400).json({
        error: `El monto ingresado (S/. ${paymentAmount.toFixed(2)}) supera la deuda pendiente (S/. ${pending.toFixed(2)}).`,
      });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        reservationId,
        amount: paymentAmount,
        method,
      },
    });

    // If fully paid and status was pending, update reservation status to CONFIRMADA or check if it needs update
    const newTotalPaid = totalPaid + paymentAmount;
    if (Math.abs(newTotalPaid - reservation.total) < 0.05 && reservation.status === 'PENDIENTE') {
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { status: 'CONFIRMADA' },
      });
    }

    if (req.user && reservation) {
      await logActivity(
        req.user.id,
        'PAGO_REGISTRADO',
        `Registró un pago de S/. ${paymentAmount.toFixed(2)} (${method}) para la reserva ${reservation.id} del huésped ${reservation.customer.fullname} (Habitación ${reservation.room.number}).`
      );
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ error: 'Error al registrar el pago.' });
  }
}
