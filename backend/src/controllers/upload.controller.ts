import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { successResponse, ApiErrorClass } from '../utils/response';
import { cloudinaryService } from '../services/cloudinary.service';
import { CLOUDINARY_FOLDERS } from '../config/constants';

// Folder resolution per upload "kind". Centralised so the route file stays
// clean and the public_id strategy is consistent.
function folderFor(kind: string): (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS] {
  switch (kind) {
    case 'student':
      return CLOUDINARY_FOLDERS.STUDENT;
    case 'teacher':
      return CLOUDINARY_FOLDERS.TEACHER;
    case 'school-logo':
      return CLOUDINARY_FOLDERS.SCHOOL_LOGO;
    default:
      throw new ApiErrorClass(400, `Unknown upload kind: ${kind}`, 'InvalidUploadKind');
  }
}

export const uploadController = {
  /**
   * POST /api/v1/uploads/:kind
   * kind: 'student' | 'teacher' | 'school-logo'
   *
   * multipart/form-data with field "file".
   * - student/teacher: query param `entityId` is recommended so the same
   *   entity overwrites its previous photo. The frontend may pass
   *   `entityId=temp-{ts}` before the record exists; a follow-up call
   *   after creation should be made if you want the asset re-keyed.
   * - school-logo: single shared asset; no entityId required.
   */
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kind = String(req.params.kind);
      const folder = folderFor(kind);
      const entityId = (req.query.entityId as string | undefined) || (req.body?.entityId as string | undefined);
      const file = req.file;
      if (!file) {
        throw new ApiErrorClass(400, 'No file was uploaded.', 'NoFile');
      }

      const uploaded = await cloudinaryService.uploadImage(file, folder, entityId);
      res.status(201).json(successResponse(uploaded, 'Image uploaded'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/uploads/:publicId
   * Best-effort deletion of a Cloudinary asset by its public_id. The
   * publicId is URL-decoded by Express automatically.
   */
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const raw = req.params.publicId;
      const publicId = Array.isArray(raw) ? raw[0] : raw;
      if (!publicId) {
        throw new ApiErrorClass(400, 'publicId is required', 'MissingPublicId');
      }
      const ok = await cloudinaryService.deleteImage(publicId);
      res.status(200).json(successResponse({ deleted: ok }, ok ? 'Image deleted' : 'Image not deleted'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/uploads/school-logo
   * Convenience endpoint that uploads the school logo and updates the
   * `school_logo` setting in one call. Proprietor only.
   */
  async uploadSchoolLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        throw new ApiErrorClass(400, 'No file was uploaded.', 'NoFile');
      }
      const uploaded = await cloudinaryService.uploadImage(file, CLOUDINARY_FOLDERS.SCHOOL_LOGO, 'logo');

      await prisma.schoolSetting.upsert({
        where: { key: 'school_logo' },
        create: {
          key: 'school_logo',
          value: uploaded.url,
          description: 'School logo URL (Cloudinary)',
        },
        update: { value: uploaded.url },
      });

      res.status(200).json(successResponse(uploaded, 'School logo uploaded'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/uploads/:kind/rebind
   * Move a previously uploaded asset to a new public_id under the same
   * kind/folder. Body: { fromPublicId, entityId }. The new public_id is
   * `edugrade/{kind}/{entityId}`. The previous public_id should be the
   * one returned by /uploads/:kind when the form was first opened.
   *
   * Returns the new public_id (and secure_url when the rename succeeded)
   * so the caller can persist the canonical reference on the entity.
   */
  async rebind(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kind = String(req.params.kind);
      const folder = folderFor(kind);
      const body = (req.body ?? {}) as { fromPublicId?: string; entityId?: string };
      const fromPublicId = body.fromPublicId;
      const entityId = body.entityId;
      if (!fromPublicId || !entityId) {
        throw new ApiErrorClass(
          400,
          'fromPublicId and entityId are required',
          'MissingRebindParams'
        );
      }
      const result = await cloudinaryService.rebindPhoto(fromPublicId, folder, entityId);
      res.status(200).json(successResponse(result, 'Image rebound'));
    } catch (error) {
      next(error);
    }
  },
};
