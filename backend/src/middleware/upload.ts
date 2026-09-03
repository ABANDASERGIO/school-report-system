import multer from 'multer';
import { FILE_UPLOAD } from '../config/constants';

// Memory storage keeps the upload in a Buffer that we stream directly to
// Cloudinary. We never write user uploads to the local filesystem.
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FILE_UPLOAD.MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: JPEG, PNG, WEBP.'));
    }
  },
});
