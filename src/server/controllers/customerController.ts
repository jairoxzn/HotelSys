import { Request, Response } from 'express';
import { prisma } from '../db/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { logActivity } from '../utils/logger';

export async function getCustomers(req: Request, res: Response): Promise<void> {
  const { search } = req.query;

  try {
    const filters: any = {};
    if (search) {
      const q = search as string;
      filters.OR = [
        { fullname: { contains: q, mode: 'insensitive' } },
        { dni: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: filters,
      orderBy: { fullname: 'asc' },
    });

    res.json(customers);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener los clientes.' });
  }
}

export async function getCustomerById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        reservations: {
          include: { room: true },
          orderBy: { checkIn: 'desc' },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ error: 'Cliente no encontrado.' });
      return;
    }

    res.json(customer);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: 'Error al obtener la ficha del cliente.' });
  }
}

export async function createCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { fullname, dni, phone, email } = req.body;

  if (!fullname || !dni || !phone || !email) {
    res.status(400).json({ error: 'Todos los campos (fullname, dni, phone, email) son requeridos.' });
    return;
  }

  try {
    const existing = await prisma.customer.findUnique({
      where: { dni },
    });

    if (existing) {
      res.status(400).json({ error: 'El DNI/Identificación ya está registrado.' });
      return;
    }

    const customer = await prisma.customer.create({
      data: { fullname, dni, phone, email },
    });

    if (req.user) {
      await logActivity(req.user.id, 'CREAR_CLIENTE', `Registró al huésped ${customer.fullname} (DNI: ${customer.dni}).`);
    }

    res.status(201).json(customer);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error al registrar el cliente.' });
  }
}

export async function updateCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { fullname, dni, phone, email } = req.body;

  try {
    if (dni) {
      const existing = await prisma.customer.findFirst({
        where: { dni, NOT: { id } },
      });
      if (existing) {
        res.status(400).json({ error: 'El DNI/Identificación ya está registrado por otro cliente.' });
        return;
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: { fullname, dni, phone, email },
    });

    if (req.user) {
      await logActivity(req.user.id, 'MODIFICAR_CLIENTE', `Modificó datos del huésped ${updated.fullname} (DNI: ${updated.dni}).`);
    }

    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error al actualizar el cliente.' });
  }
}

export async function deleteCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  try {
    const targetCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    const activeReservations = await prisma.reservation.count({
      where: {
        customerId: id,
        status: { in: ['PENDIENTE', 'CONFIRMADA'] },
      },
    });

    if (activeReservations > 0) {
      res.status(400).json({ error: 'No se puede eliminar un cliente con reservas activas o pendientes.' });
      return;
    }

    await prisma.customer.delete({
      where: { id },
    });

    if (req.user && targetCustomer) {
      await logActivity(req.user.id, 'ELIMINAR_CLIENTE', `Eliminó la ficha del huésped ${targetCustomer.fullname} (DNI: ${targetCustomer.dni}).`);
    }

    res.json({ message: 'Cliente eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error al eliminar el cliente.' });
  }
}
