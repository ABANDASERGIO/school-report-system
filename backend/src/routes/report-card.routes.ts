import { Router } from 'express';
import { reportCardController } from '../controllers/report-card.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/report-cards/bulk?classId=&sessionId=&type=
 * Bulk generate. Must come BEFORE /:id routes.
 */
router.get('/bulk', reportCardController.getBulk);

/**
 * GET /api/v1/report-cards/subject?studentId=&subjectId=&sessionId=
 * Single subject's breakdown. Must come BEFORE /:id routes.
 */
router.get('/subject', reportCardController.getSubject);

/**
 * GET /api/v1/report-cards?studentId=&sessionId=&type=&classId=
 * Single report card.
 */
router.get('/', reportCardController.getOne);

export default router;
