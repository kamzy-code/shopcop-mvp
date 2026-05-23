import { Router } from 'express';
import { FileUploadController } from '@controllers/fileUploadController.js';
import { authenticate } from '@middleware/authMiddleware.js';

const fileUploadRouter = Router();

/** GET /api/v1/uploads/signature — Get a Cloudinary signed upload signature for sensitive docs. */
fileUploadRouter.get('/signature', authenticate, FileUploadController.getUploadSignature);

/** POST /api/v1/uploads/confirm — Confirm upload and persist asset metadata. */
fileUploadRouter.post('/confirm', authenticate, FileUploadController.confirmUpload);

/** POST /api/v1/uploads/delete — Delete a Cloudinary asset by public ID. */
fileUploadRouter.post('/delete', authenticate, FileUploadController.deleteMedia);

export default fileUploadRouter;
