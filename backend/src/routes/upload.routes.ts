import { Router, Request, Response, NextFunction } from 'express';
import { uploadController } from '../controllers/upload.controller';
import { uploadMiddleware } from '../middleware/upload';
import { authenticate, requireProprietor } from '../middleware/auth';
import { ApiErrorClass } from '../utils/response';

const router = Router();

// All upload routes require authentication.
router.use(authenticate);

// Wraps multer.single so the controller can rely on req.file being present
// (or having thrown already). We translate multer's errors into ApiErrorClass
// so the global error handler returns a consistent JSON shape.
function singleImage(field: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware.single(field)(req, res, (err: unknown) => {
      if (!err) return next();
      const message = err instanceof Error ? err.message : 'Upload failed';
      next(new ApiErrorClass(400, message, 'UploadError'));
    });
  };
}

/**
 * POST /api/v1/uploads/school-logo
 * Upload the school logo and persist the resulting URL to the school_logo setting.
 * Proprietor only.
 */
router.post(
  '/school-logo',
  requireProprietor,
  singleImage('file'),
  uploadController.uploadSchoolLogo
);

/**
 * POST /api/v1/uploads/:kind
 * Upload a single image. kind: 'student' | 'teacher' | 'school-logo'.
 */
router.post('/:kind', singleImage('file'), uploadController.upload);

/**
 * DELETE /api/v1/uploads/:publicId
 * Best-effort delete of a Cloudinary asset by public_id.
 */
router.delete('/:publicId', uploadController.remove);

/**
 * POST /api/v1/uploads/:kind/rebind
 * Move an existing upload to a new public_id (used to re-key a pre-creation
 * upload once the entity has a real id). Body: { fromPublicId, entityId }.
 *
 * The `:kind` and `rebind` literal must come AFTER the generic /:kind and
 * /:publicId routes for Express's path matcher to behave correctly. We
 * register the more specific route first using the sub-path form.
 */
router.post('/:kind/rebind', uploadController.rebind);

export default router;
