import { Router } from 'express';
import { getPayments, createPayment } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getPayments);
router.post('/', authenticateToken, createPayment);

export default router;
