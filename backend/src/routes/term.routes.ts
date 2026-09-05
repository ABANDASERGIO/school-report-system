import { Router } from 'express';
import { termController } from '../controllers/term.controller';
import { authenticate, requireProprietor } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createTermSchema,
  updateTermSchema,
  termIdParamSchema,
} from '../validators/term.validator';

const router = Router();

router.use(authenticate);

router.get('/', termController.list);

router.get(
  '/:id',
  validateParams(termIdParamSchema),
  termController.getById
);

router.post(
  '/',
  requireProprietor,
  validateBody(createTermSchema),
  termController.create
);

router.patch(
  '/:id',
  requireProprietor,
  validateParams(termIdParamSchema),
  validateBody(updateTermSchema),
  termController.update
);

router.post(
  '/:id/set-current',
  requireProprietor,
  validateParams(termIdParamSchema),
  termController.setCurrent
);

export default router;
