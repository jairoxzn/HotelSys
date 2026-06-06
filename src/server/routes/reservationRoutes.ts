import { Router } from 'express';
import {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  checkInReservation,
  checkOutReservation,
  cancelReservation,
} from '../controllers/reservationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getReservations);
router.get('/:id', authenticateToken, getReservationById);
router.post('/', authenticateToken, createReservation);
router.put('/:id', authenticateToken, updateReservation);
router.post('/:id/check-in', authenticateToken, checkInReservation);
router.post('/:id/check-out', authenticateToken, checkOutReservation);
router.post('/:id/cancel', authenticateToken, cancelReservation);

export default router;
