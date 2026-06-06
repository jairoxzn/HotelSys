import { Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logActivity } from '../utils/logger.js';

export async function getRooms(req: Request, res: Response): Promise<void> {
  const { status, type } = req.query;

  try {
    const filters: any = {};
    if (status) filters.status = status as any;
    if (type) filters.type = type as string;

    const rooms = await prisma.room.findMany({
      where: filters,
      orderBy: { number: 'asc' },
    });

    res.json(rooms);
  } catch (error) {
    console.error('Error al obtener habitaciones:', error);
    res.status(500).json({ error: 'Error al obtener habitaciones.' });
  }
}

export async function getRoomById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  try {
    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      res.status(404).json({ error: 'Habitación no encontrada.' });
      return;
    }

    res.json(room);
  } catch (error) {
    console.error('Error al obtener habitación:', error);
    res.status(500).json({ error: 'Error al obtener la habitación.' });
  }
}

export async function createRoom(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { number, type, price, status } = req.body;

  if (!number || !type || price === undefined) {
    res.status(400).json({ error: 'El número, tipo y precio son requeridos.' });
    return;
  }

  try {
    const existing = await prisma.room.findUnique({
      where: { number },
    });

    if (existing) {
      res.status(400).json({ error: 'El número de habitación ya existe.' });
      return;
    }

    const room = await prisma.room.create({
      data: {
        number,
        type,
        price: parseFloat(price),
        status: status || 'DISPONIBLE',
      },
    });

    if (req.user) {
      await logActivity(req.user.id, 'CREAR_HABITACION', `Creó la Habitación ${room.number} (${room.type}) con tarifa de S/. ${room.price}.`);
    }

    res.status(201).json(room);
  } catch (error) {
    console.error('Error al crear habitación:', error);
    res.status(500).json({ error: 'Error al crear la habitación.' });
  }
}

export async function updateRoom(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { number, type, price, status } = req.body;

  try {
    if (number) {
      const existing = await prisma.room.findFirst({
        where: { number, NOT: { id } },
      });
      if (existing) {
        res.status(400).json({ error: 'El número de habitación ya está en uso por otra habitación.' });
        return;
      }
    }

    const updated = await prisma.room.update({
      where: { id },
      data: {
        number,
        type,
        price: price !== undefined ? parseFloat(price) : undefined,
        status,
      },
    });

    if (req.user) {
      await logActivity(req.user.id, 'MODIFICAR_HABITACION', `Modificó la Habitación ${updated.number} (${updated.type}) a tarifa S/. ${updated.price}.`);
    }

    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar habitación:', error);
    res.status(500).json({ error: 'Error al actualizar la habitación.' });
  }
}

export async function updateRoomStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { status } = req.body;

  if (!status || !['DISPONIBLE', 'OCUPADA', 'MANTENIMIENTO'].includes(status)) {
    res.status(400).json({ error: 'Estado no válido.' });
    return;
  }

  try {
    const updated = await prisma.room.update({
      where: { id },
      data: { status },
    });

    if (req.user) {
      await logActivity(req.user.id, 'MODIFICAR_ESTADO_HABITACION', `Cambió estado de la Habitación ${updated.number} a ${updated.status}.`);
    }

    res.json(updated);
  } catch (error) {
    console.error('Error al cambiar estado de habitación:', error);
    res.status(500).json({ error: 'Error al cambiar estado de la habitación.' });
  }
}

export async function deleteRoom(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  try {
    // Fetch room before deleting for audit log details
    const targetRoom = await prisma.room.findUnique({
      where: { id },
    });

    // Check if it has active reservations
    const activeReservations = await prisma.reservation.count({
      where: {
        roomId: id,
        status: { in: ['PENDIENTE', 'CONFIRMADA'] },
      },
    });

    if (activeReservations > 0) {
      res.status(400).json({ error: 'No se puede eliminar una habitación con reservas activas o pendientes.' });
      return;
    }

    await prisma.room.delete({
      where: { id },
    });

    if (req.user && targetRoom) {
      await logActivity(req.user.id, 'ELIMINAR_HABITACION', `Eliminó la Habitación ${targetRoom.number}.`);
    }

    res.json({ message: 'Habitación eliminada exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar habitación:', error);
    res.status(500).json({ error: 'Error al eliminar la habitación.' });
  }
}
