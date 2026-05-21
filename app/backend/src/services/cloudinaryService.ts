import { v2 as cloudinary } from 'cloudinary';
import { env } from '@config/env.js';
import { fileUplaodLogger } from '@utils/logger.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  /**
   * Generates a signed upload signature for authenticated client-side uploads to Cloudinary.
   * Returns the params needed for the client to upload directly without exposing the API secret.
   *
   * @param folder - Cloudinary folder path where the asset will be stored
   * @returns Object containing timestamp, upload_preset, folder, type, signature, and apiKey
   */
  static async generateUplaodSignature(folder: string) {
    const timestamp = Math.round(Date.now() / 1000);

    const params = {
      timestamp,
      upload_preset: env.CLOUDINARY_UPLOAD_PRESET,
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
      apiKey: env.CLOUDINARY_API_KEY,
    };
  }

  /**
   * Permanently deletes a Cloudinary asset by its public ID.
   *
   * @param publicId - Cloudinary public ID of the asset to remove
   * @returns Cloudinary deletion result object
   */
  static async deleteMedia(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }

  /**
   * Generate a signed URL for an authenticated (private) Cloudinary asset.
   * Signed URLs are time-bound and require the API secret to generate.
   *
   * @param publicId - Cloudinary public ID of the asset
   * @param options.expiresIn - Seconds from now until URL expiry (default: 3600)
   * @param options.resourceType - Cloudinary resource type: 'image', 'raw', 'video', or 'auto' (default: 'image')
   * @returns Signed Cloudinary URL string with expiration
   */
  static getSignedUrl(
    publicId: string,
    options?: {
      expiresIn?: number;
      resourceType?: string;
    }
  ): string {
    const expiresAt = Math.floor(Date.now() / 1000) + (options?.expiresIn ?? 3600);

    return cloudinary.url(publicId, {
      type: 'authenticated',
      sign_url: true,
      secure: true,
      expires_at: expiresAt,
      resource_type: options?.resourceType ?? 'image',
    });
  }
}
