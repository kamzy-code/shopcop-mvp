import { v2 as cloudinary } from 'cloudinary';
import { env } from '@config/env.js';
import { fileUplaodLogger } from '@utils/logger.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  static async generateUplaodSignature(folder: string) {
    const timestamp = Math.round(Date.now() / 1000);

    const params = {
      timestamp,
      upload_presets: env.CLOUDINARY_UPLOAD_PRESET,
      folder,
      type: 'authenticated',
    };

    const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET!);

    fileUplaodLogger.info('Uplaod signuature generated', {
      action: 'generateUplaodSignature',
      timestamp,
      folder,
    });
    return {
      ...params,
      signature,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
    };
  }

  static async deleteMedia(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }
}
