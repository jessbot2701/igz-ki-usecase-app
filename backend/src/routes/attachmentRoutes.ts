import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { attachmentService } from '../services/attachmentService';

export const attachmentRouter = Router();

attachmentRouter.use(authenticate);

attachmentRouter.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const { attachment, absolutePath } = await attachmentService.resolveDownloadPath(req.params.id);
    res.download(absolutePath, attachment.fileName);
  })
);
