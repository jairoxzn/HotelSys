import { Router } from 'express';
import { login, register, getMe } from '../controllers/authController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/login', login);

// Protected routes
router.post('/register', authenticateToken, authorizeRoles(['ADMIN']), register);
router.get('/me', authenticateToken, getMe);

export default router;
