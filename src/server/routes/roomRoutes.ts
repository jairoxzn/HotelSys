import { Router } from 'express';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
} from '../controllers/roomController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getRooms);
router.get('/:id', authenticateToken, getRoomById);
router.post('/', authenticateToken, authorizeRoles(['ADMIN']), createRoom);
router.put('/:id', authenticateToken, authorizeRoles(['ADMIN']), updateRoom);
router.patch('/:id/status', authenticateToken, authorizeRoles(['ADMIN', 'RECEPCIONISTA']), updateRoomStatus);
router.delete('/:id', authenticateToken, authorizeRoles(['ADMIN']), deleteRoom);

export default router;
