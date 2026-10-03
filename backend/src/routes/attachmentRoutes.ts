import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { attachmentService } from '../services/attachmentService';
import { attachmentRepository } from '../repositories/attachmentRepository';
import { useCaseService } from '../services/useCaseService';
import { ApiError } from '../utils/ApiError';

export const attachmentRouter = Router();

attachmentRouter.use(authenticate);

attachmentRouter.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const entry = await attachmentRepository.findById(req.params.id);
    if (!entry) throw ApiError.notFound('Anhang nicht gefunden');
    const useCase = await useCaseService.getById(entry.useCaseId);
    useCaseService.assertViewable(useCase, { id: req.user!.sub, role: req.user!.role });
    const { attachment, absolutePath } = await attachmentService.resolveDownloadPath(req.params.id);
    res.download(absolutePath, attachment.fileName);
  })
);
