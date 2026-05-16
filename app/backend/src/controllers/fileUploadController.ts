import { Request, Response, NextFunction } from 'express';
import { CloudinaryService } from '@services/cloudinaryService.js';
import { fileUplaodLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';

export class FileUploadController {
  static async getUploadSignature(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    if (!user) {
      fileUplaodLogger.warn('Authentication is required', {
        action: 'getUplaodSignature',
      });
      throw new AppError('Get uplaod signature attempt without authentication', 401);
    }

    try {
      const signature = await CloudinaryService.generateUplaodSignature('sopcop/documents');

      res.status(200).json({
        success: true,
        data: signature,
        message: 'Ulaod signature generated successfully',
      });

      fileUplaodLogger.info('Uplaod signature generated successfully', {
        userId: user.userId,
        role: user.role,
        folder: signature.folder,
        action: 'getUploadSignature',
      });
    } catch (error) {
      fileUplaodLogger.error('Error generating uplaod signature', {
        userId: user.userId,
        action: 'getUploadSignature',
        error: error instanceof Error ? error.message : error,
      });
      next(error);
      return;
    }
  }

  static async confirmUpload(req: Request, res: Response) {
    // Called after client uploads sensitive doc
    // Backend stores the public_id / URL in database
    //const { publicId, url, docType } = req.body;
    // Save to VendorDocument table
    res.json({ success: true });
  }
}
