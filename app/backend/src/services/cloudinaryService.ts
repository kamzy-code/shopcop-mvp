import { v2 as cloudinary } from 'cloudinary';
import { env } from '@config/env.js';
import { prisma } from '@config/prisma.js';
import { fileUplaodLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';

/**
 * True if any surviving ProductMedia, VendorProfile, or VendorPost row still references this
 * Cloudinary public_id. The same asset can end up referenced by more than one row (e.g. product
 * duplication copies `public_id` without copying the underlying Cloudinary asset), so a public_id
 * being replaced/removed on one record doesn't necessarily mean it's safe to destroy.
 */
async function isPublicIdStillReferenced(publicId: string): Promise<boolean> {
  const [mediaCount, profileCount, postCount] = await Promise.all([
    prisma.productMedia.count({ where: { public_id: publicId } }),
    prisma.vendorProfile.count({ where: { profile_photo_public_id: publicId } }),
    prisma.vendorPost.count({ where: { public_id: publicId, deleted_at: null } }),
  ]);
  return mediaCount + profileCount + postCount > 0;
}

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Parses the Cloudinary resource type out of a stored URL.
 * Cloudinary URLs have the format:
 *   https://res.cloudinary.com/{cloud}/{resource_type}/{delivery_type}/...
 * Returns 'image', 'raw', or 'video'. Falls back to 'image'.
 */
export function getResourceTypeFromCloudinaryUrl(url: string | null | undefined): string {
  if (!url) return 'image';
  const match = url.match(/res\.cloudinary\.com\/[^/]+\/([^/]+)\//);
  const type = match?.[1];
  if (type === 'raw' || type === 'video') return type;
  return 'image';
}

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

    // upload_preset is intentionally excluded from the signed params.
    // If the preset is configured for 'public' delivery in the Cloudinary dashboard
    // it would silently override type: 'authenticated', causing signed-URL access to 401.
    // Signed uploads without a preset still respect all explicit params (folder, type).
    const params = {
      timestamp,
      folder,
      type: 'authenticated',
    };

    const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET!);

    fileUplaodLogger.info('Upload signature generated', {
      action: 'generateUplaodSignature',
      timestamp,
      folder,
    });
    return {
      ...params,
      signature,
      apiKey: env.CLOUDINARY_API_KEY,
      // upload_preset intentionally absent
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
   * Deletes a Cloudinary asset if a public_id is present — but only if no other ProductMedia,
   * VendorProfile, or VendorPost row still references it (e.g. a duplicated product sharing the
   * same asset). Swallows errors so a failed cleanup never blocks the caller's write.
   *
   * @param publicId - Cloudinary public ID to remove, or null/undefined to no-op
   */
  static async deleteMediaSafe(publicId: string | null | undefined) {
    if (!publicId) return;
    try {
      if (await isPublicIdStillReferenced(publicId)) {
        fileUplaodLogger.info('Skipped Cloudinary cleanup — asset still referenced by another record', {
          action: 'deleteMediaSafe',
          publicId,
        });
        return;
      }
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      fileUplaodLogger.error('Failed to delete Cloudinary asset during cleanup', {
        action: 'deleteMediaSafe',
        publicId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Verifies that a client-reported Cloudinary asset actually exists (and matches the
   * claimed URL's resource type) via the Admin API, before its metadata is trusted and persisted.
   *
   * @param publicId - Cloudinary public ID reported by the client
   * @param options.url - The URL reported alongside the public_id, used to infer resource_type
   * @param options.type - Cloudinary delivery type ('upload' for public assets, 'authenticated' for signed docs)
   * @returns The verified Cloudinary resource (authoritative secure_url, bytes, width, height, format, resource_type)
   * @throws {AppError} 400 — Asset could not be found/verified on Cloudinary
   */
  static async verifyAsset(
    publicId: string,
    options?: { url?: string | null; type?: 'upload' | 'authenticated' }
  ) {
    const resourceType = getResourceTypeFromCloudinaryUrl(options?.url);
    try {
      const resource = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
        type: options?.type ?? 'upload',
      });
      return resource as {
        secure_url: string;
        public_id: string;
        bytes: number;
        width?: number;
        height?: number;
        format: string;
        resource_type: string;
      };
    } catch (error) {
      fileUplaodLogger.warn('Cloudinary asset verification failed', {
        action: 'verifyAsset',
        publicId,
        resourceType,
        error: error instanceof Error ? error.message : error,
      });
      throw new AppError('Uploaded file could not be verified. Please re-upload and try again.', 400);
    }
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
