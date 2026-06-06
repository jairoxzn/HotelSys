import { Router } from 'express';
import { getConfig, updateConfig } from '../controllers/configController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Public endpoint — login page and any user can read system branding
router.get('/', getConfig);

// Admin-only — only the administrator can modify branding
router.put('/', authenticateToken, authorizeRoles(['ADMIN']), updateConfig);

export default router;
