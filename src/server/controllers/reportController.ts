import { Request, Response } from 'express';
import { prisma } from '../db/client';

export async function getFinancialReport(req: Request, res: Response): Promise<void> {
  const { year } = req.query;
  const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

  try {
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear + 1, 0, 1);

    // 1. Fetch all payments in the target year
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: startOfYear, lt: endOfYear },
      },
    });

    const totalIncome = payments.reduce((acc, p) => acc + p.amount, 0);

    // 2. Payments by method
    const methods = {
      EFECTIVO: 0,
      TARJETA: 0,
      TRANSFERENCIA: 0,
    };
    payments.forEach(p => {
      const m = p.method as keyof typeof methods;
      if (methods[m] !== undefined) {
        methods[m] += p.amount;
      }
    });

    const methodDistribution = Object.keys(methods).map(k => ({
      name: k,
      value: methods[k as keyof typeof methods],
    }));

    // 3. Monthly Breakdown
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    const monthlyIncome = months.map((m, index) => {
      const monthPayments = payments.filter(p => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === index;
      });
      const total = monthPayments.reduce((acc, p) => acc + p.amount, 0);
      return { month: m, ingresos: total };
    });

    res.json({
      year: targetYear,
      totalIncome,
      methodDistribution,
      monthlyIncome,
    });
  } catch (error) {
    console.error('Error al generar reporte financiero:', error);
    res.status(500).json({ error: 'Error al generar reporte financiero.' });
  }
}

export async function getRoomReport(req: Request, res: Response): Promise<void> {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        reservations: {
          where: { status: 'COMPLETADA' },
          include: { payments: true },
        },
      },
    });

    const report = rooms.map(room => {
      const totalBookings = room.reservations.length;
      let totalNights = 0;
      let totalRevenue = 0;

      room.reservations.forEach(res => {
        const nights = Math.max(1, Math.ceil((new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
        totalNights += nights;
        const resPaid = res.payments.reduce((acc, p) => acc + p.amount, 0);
        totalRevenue += resPaid;
      });

      return {
        id: room.id,
        number: room.number,
        type: room.type,
        price: room.price,
        status: room.status,
        bookingsCount: totalBookings,
        nightsOccupied: totalNights,
        revenueGenerated: totalRevenue,
      };
    });

    res.json(report);
  } catch (error) {
    console.error('Error al generar reporte de habitaciones:', error);
    res.status(500).json({ error: 'Error al generar reporte de habitaciones.' });
  }
}

export async function getFrequentCustomersReport(req: Request, res: Response): Promise<void> {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        reservations: {
          where: { status: { in: ['CONFIRMADA', 'COMPLETADA'] } },
          include: { payments: true },
        },
      },
    });

    const report = customers
      .map(customer => {
        const reservationsCount = customer.reservations.length;
        let totalNights = 0;
        let totalSpent = 0;

        customer.reservations.forEach(res => {
          const nights = Math.max(1, Math.ceil((new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
          totalNights += nights;
          const paid = res.payments.reduce((acc, p) => acc + p.amount, 0);
          totalSpent += paid;
        });

        return {
          id: customer.id,
          fullname: customer.fullname,
          dni: customer.dni,
          email: customer.email,
          phone: customer.phone,
          reservationsCount,
          nightsStayed: totalNights,
          totalSpent,
        };
      })
      .filter(c => c.reservationsCount > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    res.json(report);
  } catch (error) {
    console.error('Error al generar reporte de clientes frecuentes:', error);
    res.status(500).json({ error: 'Error al generar reporte de clientes frecuentes.' });
  }
}

export async function getAuditLogsReport(req: Request, res: Response): Promise<void> {
  const { action, userId, search } = req.query;

  try {
    const filters: any = {};
    if (action) {
      filters.action = action as string;
    }
    if (userId) {
      filters.userId = userId as string;
    }
    if (search) {
      const q = search as string;
      filters.OR = [
        { details: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: filters,
      include: {
        user: {
          select: { id: true, name: true, role: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(auditLogs);
  } catch (error) {
    console.error('Error al obtener reporte de auditoría:', error);
    res.status(500).json({ error: 'Error al generar reporte de auditoría.' });
  }
}
