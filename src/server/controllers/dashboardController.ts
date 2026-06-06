import { Response } from 'express';
import { prisma } from '../db/client.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 1. Room Counters
    const totalRooms = await prisma.room.count();
    const occupiedRooms = await prisma.room.count({ where: { status: 'OCUPADA' } });
    const availableRooms = await prisma.room.count({ where: { status: 'DISPONIBLE' } });
    const maintenanceRooms = await prisma.room.count({ where: { status: 'MANTENIMIENTO' } });

    // 2. Active Reservations
    const activeReservations = await prisma.reservation.count({
      where: { status: { in: ['PENDIENTE', 'CONFIRMADA'] } },
    });

    // 3. Today Checklist
    const todayCheckIns = await prisma.reservation.count({
      where: {
        checkIn: { gte: today, lt: tomorrow },
        status: 'PENDIENTE',
      },
    });

    const todayCheckOuts = await prisma.reservation.count({
      where: {
        checkOut: { gte: today, lt: tomorrow },
        status: 'CONFIRMADA',
      },
    });

    // 4. Financial Sum (Today's Income)
    const paymentsToday = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: today, lt: tomorrow },
      },
      select: { amount: true },
    });
    const todayIncome = paymentsToday.reduce((acc, p) => acc + p.amount, 0);

    // 5. Monthly Income Forecast (Sum of all active reservations total cost)
    const activeResTotal = await prisma.reservation.findMany({
      where: {
        status: { in: ['CONFIRMADA', 'COMPLETADA'] },
        checkIn: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
        },
      },
      select: { total: true },
    });
    const monthlyForecast = activeResTotal.reduce((acc, r) => acc + r.total, 0);

    // 6. Recent Activity Log (from AuditLog database table)
    const recentLogs = await prisma.auditLog.findMany({
      take: 7,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    const activityLog = recentLogs.map(log => ({
      id: log.id,
      type: log.action,
      description: log.details,
      user: {
        name: log.user.name,
        role: log.user.role,
      },
      date: log.createdAt,
    }));

    // 7. Weekly Revenue Dataset for Charts (Last 7 Days)
    const weeklyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayPayments = await prisma.payment.findMany({
        where: {
          paymentDate: { gte: d, lt: nextD },
        },
        select: { amount: true },
      });

      const totalAmount = dayPayments.reduce((acc, p) => acc + p.amount, 0);

      // Format date name (e.g. Lunes, Martes...)
      const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
      weeklyRevenue.push({
        date: dayName,
        monto: totalAmount,
      });
    }

    // Occupancy Rate Calculation
    const activeRooms = totalRooms - maintenanceRooms;
    const occupancyRate = activeRooms > 0 ? (occupiedRooms / activeRooms) * 100 : 0;

    res.json({
      roomStats: {
        total: totalRooms,
        occupied: occupiedRooms,
        available: availableRooms,
        maintenance: maintenanceRooms,
        occupancyRate: Math.round(occupancyRate),
      },
      activeReservations,
      todayTasks: {
        checkIns: todayCheckIns,
        checkOuts: todayCheckOuts,
      },
      financialStats: {
        todayIncome,
        monthlyForecast,
      },
      activityLog,
      weeklyRevenue,
    });
  } catch (error) {
    console.error('Error al compilar estadísticas del dashboard:', error);
    res.status(500).json({ error: 'Error al compilar estadísticas del dashboard.' });
  }
}
