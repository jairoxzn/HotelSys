import { Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logActivity } from '../utils/logger.js';

// GET /api/config — Public, no auth required (so login page can show hotel branding)
export async function getConfig(req: Request, res: Response): Promise<void> {
  try {
    const config = await prisma.systemConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        hotelName: 'HotelFlow',
        primaryColor: '#6366f1',
        logoUrl: null,
      },
      update: {},
    });

    res.json(config);
  } catch (error) {
    console.error('Error al obtener configuración del sistema:', error);
    res.status(500).json({ error: 'Error al obtener la configuración.' });
  }
}

// PUT /api/config — Admin only
export async function updateConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { hotelName, primaryColor, logoUrl } = req.body;

  if (!hotelName && !primaryColor && logoUrl === undefined) {
    res.status(400).json({ error: 'Se requiere al menos hotelName, primaryColor o logoUrl para actualizar.' });
    return;
  }

  // Validate hex color format
  if (primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
    res.status(400).json({ error: 'El color debe ser un código hexadecimal válido (ej: #6366f1).' });
    return;
  }

  try {
    const updated = await prisma.systemConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        hotelName: hotelName || 'HotelFlow',
        primaryColor: primaryColor || '#6366f1',
        logoUrl: logoUrl || null,
      },
      update: {
        ...(hotelName && { hotelName }),
        ...(primaryColor && { primaryColor }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
    });

    if (req.user) {
      const changes = [];
      if (hotelName) changes.push(`nombre de hotel a "${hotelName}"`);
      if (primaryColor) changes.push(`color principal a ${primaryColor}`);
      if (logoUrl !== undefined) changes.push(logoUrl ? 'logotipo cargado' : 'logotipo eliminado');
      await logActivity(
        req.user.id,
        'MODIFICAR_CONFIGURACION_SISTEMA',
        `Actualizó la configuración del sistema: ${changes.join(', ')}.`
      );
    }

    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar configuración del sistema:', error);
    res.status(500).json({ error: 'Error al actualizar la configuración.' });
  }
}
