import { Router } from 'express';
import {
  getFinancialReport,
  getRoomReport,
  getFrequentCustomersReport,
  getAuditLogsReport,
} from '../controllers/reportController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/financial', authenticateToken, authorizeRoles(['ADMIN', 'CONTADOR']), getFinancialReport);
router.get('/rooms', authenticateToken, authorizeRoles(['ADMIN', 'CONTADOR', 'RECEPCIONISTA']), getRoomReport);
router.get('/customers', authenticateToken, authorizeRoles(['ADMIN', 'CONTADOR']), getFrequentCustomersReport);
router.get('/audit', authenticateToken, authorizeRoles(['ADMIN', 'CONTADOR']), getAuditLogsReport);

export default router;
