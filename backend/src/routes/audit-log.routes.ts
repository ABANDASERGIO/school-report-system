import { Router } from 'express';
import { auditLogController } from '../controllers/audit-log.controller';
import { authenticate, requireProprietor } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireProprietor);

/**
 * GET /api/v1/audit-logs?userId=&entityType=&entityId=&action=&limit=
 * List audit log entries. Proprietor only.
 */
router.get('/', auditLogController.list);

export default router;
