import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';
import { ApiErrorClass } from '../utils/response';
import {
  CLOUDINARY_FOLDERS,
  FILE_UPLOAD,
} from '../config/constants';

export type UploadFolder =
  (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiErrorClass(
      500,
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the backend .env.',
      'CloudinaryNotConfigured'
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

export const cloudinaryService = {
  /**
   * Whether the Cloudinary credentials are present in the environment.
   * Uploads will fail if this returns false.
   */
  isConfigured(): boolean {
    const { cloudName, apiKey, apiSecret } = env.cloudinary;
    return Boolean(cloudName && apiKey && apiSecret);
  },

  /**
   * Validate an upload payload before sending it to Cloudinary.
   * Throws ApiErrorClass with a 4xx code on rejection.
   */
  validateFile(file: Express.Multer.File | undefined): void {
    if (!file) {
      throw new ApiErrorClass(400, 'No file was uploaded.', 'NoFile');
    }
    if (file.size > FILE_UPLOAD.MAX_SIZE) {
      throw new ApiErrorClass(
        400,
        `File too large. Maximum size is ${Math.round(
          FILE_UPLOAD.MAX_SIZE / 1024
        )}KB.`,
        'FileTooLarge'
      );
    }
    if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
      throw new ApiErrorClass(
        400,
        'Unsupported file type. Allowed: JPEG, PNG, WEBP.',
        'UnsupportedFileType'
      );
    }
  },

  /**
   * Upload a buffer to Cloudinary under the given folder.
   * Returns the secure URL and the publicId (for later deletion).
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: UploadFolder,
    publicIdHint?: string
  ): Promise<{ url: string; publicId: string }> {
    ensureConfigured();
    this.validateFile(file);

    // Build a stable public_id when an entity id is provided so the same
    // entity always overwrites its previous photo (no orphan assets).
    const publicId = publicIdHint ? `${folder}/${publicIdHint}` : undefined;

    return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          overwrite: true,
          invalidate: true,
          resource_type: 'image',
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            // eslint-disable-next-line no-console
            console.error('[cloudinaryService] upload error:', error);
            reject(
              new ApiErrorClass(
                502,
                'Failed to upload image to Cloudinary.',
                'CloudinaryUploadFailed'
              )
            );
            return;
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(file.buffer);
    });
  },

  /**
   * Delete a Cloudinary asset by its public_id. Best-effort: returns false
   * instead of throwing when the asset is missing or deletion fails, so
   * callers can clear the local reference without blocking on the CDN.
   */
  async deleteImage(publicId: string | null | undefined): Promise<boolean> {
    if (!publicId) return false;
    if (!this.isConfigured()) {
      // eslint-disable-next-line no-console
      console.warn('[cloudinaryService] delete skipped: Cloudinary not configured');
      return false;
    }
    ensureConfigured();
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: 'image',
      });
      return result?.result === 'ok' || result?.result === 'not found';
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[cloudinaryService] delete error:', err);
      return false;
    }
  },

  /**
   * Rename a Cloudinary asset so it lives under a new public_id. Used after
   * entity creation to re-key a pre-creation upload from a temp id to the
   * canonical entity id (avoids orphan assets when a user uploads a photo
   * before saving the form).
   *
   * Cloudinary's `rename` moves the asset and returns the new public_id +
   * secure_url. We invalidate the CDN so cached variants pick up the new
   * path. If the source asset doesn't exist (e.g. an upload was rolled
   * back), we return the new publicId without an error so the caller can
   * still persist the new reference.
   */
  async rebindPhoto(
    fromPublicId: string,
    toFolder: UploadFolder,
    toEntityId: string
  ): Promise<{ publicId: string; url: string; renamed: boolean }> {
    const toPublicId = `${toFolder}/${toEntityId}`;
    // No-op when the public_id already matches.
    if (fromPublicId === toPublicId) {
      return { publicId: toPublicId, url: '', renamed: false };
    }
    if (!this.isConfigured()) {
      // eslint-disable-next-line no-console
      console.warn('[cloudinaryService] rebind skipped: Cloudinary not configured');
      // Return the new id; the entity record can still be saved with the
      // expected public_id, and the asset is just not present on the CDN.
      return { publicId: toPublicId, url: '', renamed: false };
    }
    ensureConfigured();
    try {
      // Cloudinary's rename requires the asset to exist; a missing source
      // returns an error. We don't want to fail the entity create in that
      // case, so we swallow not-found errors and return the new id.
      let result: any;
      try {
        result = await cloudinary.uploader.rename(fromPublicId, toPublicId, {
          overwrite: true,
          invalidate: true,
          resource_type: 'image',
        });
      } catch (err: any) {
        const msg = String(err?.message ?? err);
        if (/not found/i.test(msg) || err?.http_code === 404) {
          return { publicId: toPublicId, url: '', renamed: false };
        }
        throw err;
      }
      return {
        publicId: result.public_id,
        url: result.secure_url,
        renamed: true,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[cloudinaryService] rebind error:', err);
      throw new ApiErrorClass(
        502,
        'Failed to rebind image on Cloudinary.',
        'CloudinaryRebindFailed'
      );
    }
  },
};
