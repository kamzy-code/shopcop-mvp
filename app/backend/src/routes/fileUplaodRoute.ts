import { Router } from 'express';
import { FileUploadController } from '@controllers/fileUploadController.js';
import { authenticate } from '@middleware/authMiddleware.js';

const fileUploadRouter = Router();

// api/v1/uplaod/signature - For sensitive docs: get a signed upload signature
fileUploadRouter.get('/signature', authenticate, FileUploadController.getUploadSignature);

// api/v1/uplaod/confirm - For all uploads: confirm and save metadata to DB
fileUploadRouter.post('/confirm', authenticate, FileUploadController.confirmUpload);

export default fileUploadRouter;
