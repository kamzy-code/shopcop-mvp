import { Request, Response, NextFunction } from 'express';
import { CloudinaryService } from '@services/cloudinaryService.js';
import { fileUplaodLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';

export class FileUploadController {
  /**
   * GET /api/v1/uploads/signature
   * Returns a Cloudinary signed upload signature for authenticated client-side uploads.
   * The client uses this signature to upload sensitive documents directly to Cloudinary
   * without exposing the API secret.
   *
   * @param req.user - Authenticated user (auto-populated by auth middleware)
   * @returns 200 `{ success, data: { timestamp, upload_preset, folder, type, signature, apiKey } }`
   * @throws {AppError} 401 — No authenticated user on the request
   */
  static async getUploadSignature(req: Request, res: Response, next: NextFunction) {
    const action = 'getUploadSignature';
    const user = req.user;
    if (!user) {
      fileUplaodLogger.warn('Authentication is required', { action });
      throw new AppError('Get upload signature attempt without authentication', 401);
    }

    try {
      const signature = await CloudinaryService.generateUplaodSignature('shopcop/documents');

      res.status(200).json({
        success: true,
        data: signature,
        message: 'Upload signature generated successfully',
      });

      fileUplaodLogger.info('Upload signature generated successfully', {
        userId: user.userId,
        role: user.role,
        folder: signature.folder,
        action,
      });
    } catch (error) {
      fileUplaodLogger.error('Error generating upload signature', {
        userId: user.userId,
        action,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * POST /api/v1/uploads/confirm
   * Confirms that a client-side upload completed and persists the asset metadata.
   *
   * @param req.body.publicId - Cloudinary public ID of the uploaded asset (optional, stub)
   * @param req.body.url - Cloudinary URL of the uploaded asset (optional, stub)
   * @param req.body.docType - Document type identifier (optional, stub)
   * @remarks Stub implementation — full persistence logic is not yet implemented.
   * @returns 200 `{ success: true }`
   */
  static async confirmUpload(req: Request, res: Response) {
    // Called after client uploads sensitive doc
    // Backend stores the public_id / URL in database
    //const { publicId, url, docType } = req.body;
    // Save to VendorDocument table
    res.json({ success: true });
  }

  /**
   * POST /api/v1/uploads/delete
   * Permanently deletes a Cloudinary asset by its public ID.
   *
   * @param req.body.publicId - Cloudinary public ID of the asset to delete
   * @returns 200 `{ success: true }`
   * @throws {AppError} 401 — Not authenticated
   * @throws {AppError} 400 — Missing publicId
   */
  static async deleteMedia(req: Request, res: Response, next: NextFunction) {
    const action = 'deleteMedia';
    const user = req.user;
    if (!user) {
      fileUplaodLogger.warn('Authentication required to delete media', { action });
      throw new AppError('Authentication required', 401);
    }

    const { publicId } = req.body;
    if (!publicId) {
      fileUplaodLogger.warn('Delete media attempt without publicId', { action });
      throw new AppError('publicId is required', 400);
    }

    try {
      await CloudinaryService.deleteMedia(publicId);
      fileUplaodLogger.info('Media deleted successfully', { publicId, action });
      res.json({ success: true, message: 'Media deleted successfully' });
    } catch (error) {
      fileUplaodLogger.error('Error deleting media', {
        publicId,
        action,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }
}
