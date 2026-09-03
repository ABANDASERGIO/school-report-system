import { Router } from 'express';
import { sequenceController } from '../controllers/sequence.controller';
import { authenticate, requireProprietor } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createSequenceSchema,
  updateSequenceSchema,
  sequenceIdParamSchema,
} from '../validators/sequence.validator';

const router = Router();

router.use(authenticate);

// Must come BEFORE /:id
router.get('/active', sequenceController.getActive);

router.get('/', sequenceController.list);

router.get(
  '/:id',
  validateParams(sequenceIdParamSchema),
  sequenceController.getById
);

router.post(
  '/',
  requireProprietor,
  validateBody(createSequenceSchema),
  sequenceController.create
);

router.patch(
  '/:id',
  requireProprietor,
  validateParams(sequenceIdParamSchema),
  validateBody(updateSequenceSchema),
  sequenceController.update
);

router.post(
  '/:id/set-active',
  requireProprietor,
  validateParams(sequenceIdParamSchema),
  sequenceController.setActive
);

export default router;
