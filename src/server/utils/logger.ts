import { prisma } from '../db/client.js';

export async function logActivity(userId: string, action: string, details: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log audit activity:', error);
  }
}
