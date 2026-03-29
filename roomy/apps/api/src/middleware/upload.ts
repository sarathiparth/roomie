import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import multer, { StorageEngine, FileFilterCallback } from 'multer';
import { env } from '../config/env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/** Memory storage (files uploaded to Cloudinary, not disk) */
const storage: StorageEngine = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/** Upload buffer to Cloudinary, returns secure URL */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  options?: Record<string, unknown>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: `roomy/${folder}`, ...options },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      },
    ).end(buffer);
  });
}
