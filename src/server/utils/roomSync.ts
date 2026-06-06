import { prisma } from '../db/client.js';

export async function syncRoomStatuses(): Promise<void> {
  try {
    const today = new Date();

    // 1. Fetch all rooms
    const rooms = await prisma.room.findMany();

    for (const room of rooms) {
      // Skip rooms that are currently in maintenance (cleaning)
      if (room.status === 'MANTENIMIENTO') continue;

      // Check if there is an active CONFIRMED reservation right now (today)
      // active means: status === 'CONFIRMADA' AND checkIn <= today AND checkOut > today
      const activeRes = await prisma.reservation.findFirst({
        where: {
          roomId: room.id,
          status: 'CONFIRMADA',
          checkIn: { lte: today },
          checkOut: { gt: today },
        },
      });

      const expectedStatus = activeRes ? 'OCUPADA' : 'DISPONIBLE';

      if (room.status !== expectedStatus) {
        await prisma.room.update({
          where: { id: room.id },
          data: { status: expectedStatus },
        });
        console.log(`[AutoSync] Room ${room.number} updated to ${expectedStatus} (Active confirmed reservation: ${activeRes ? 'YES' : 'NO'})`);
      }
    }
  } catch (error) {
    console.error('[AutoSync] Error during room status sync:', error);
  }
}
