import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/dashboard/proprietor
 * Proprietor KPI summary. Must come before /:id routes (none here, but
 * the order is documented).
 */
router.get('/proprietor', dashboardController.proprietor);

/**
 * GET /api/v1/dashboard/teacher
 * Teacher KPI summary for the currently authenticated user.
 */
router.get('/teacher', dashboardController.teacher);

export default router;
