import { Router } from 'express';
import { Role, UseCaseStatus } from '../domain/enums';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  commentSchema,
  evaluationSchema,
  statusTransitionSchema,
  useCaseInputSchema,
  useCaseSearchSchema,
  useCaseUpdateSchema
} from '../validation/schemas';
import { asyncHandler } from '../utils/asyncHandler';
import { useCaseService } from '../services/useCaseService';
import { workflowService } from '../services/workflowService';
import { commentService } from '../services/commentService';
import { evaluationService } from '../services/evaluationService';
import { attachmentService } from '../services/attachmentService';
import { statusHistoryRepository } from '../repositories/statusHistoryRepository';
import { aiService } from '../ai/aiServiceFactory';
import { upload } from '../middleware/upload';
import { ApiError } from '../utils/ApiError';

export const useCaseRouter = Router();

useCaseRouter.use(authenticate);

useCaseRouter.get(
  '/',
  validateQuery(useCaseSearchSchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as {
      search?: string;
      status?: UseCaseStatus;
      department?: string;
      requestor?: string;
      page: number;
      pageSize: number;
      sortBy: 'title' | 'createdAt' | 'updatedAt' | 'status' | 'department';
      sortDir: 'asc' | 'desc';
    };
    const createdById = req.user!.role === Role.EMPLOYEE ? req.user!.sub : undefined;
    const result = await useCaseService.search({ ...query, createdById });
    res.json(result);
  })
);

useCaseRouter.post(
  '/',
  validateBody(useCaseInputSchema),
  asyncHandler(async (req, res) => {
    const useCase = await useCaseService.create(req.body, { id: req.user!.sub, role: req.user!.role });
    res.status(201).json(useCase);
  })
);

useCaseRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const useCase = await useCaseService.getById(req.params.id);
    useCaseService.assertViewable(useCase, { id: req.user!.sub, role: req.user!.role });
    res.json({
      ...useCase,
      allowedNextStatuses: workflowService.allowedNextStatuses(useCase.status as UseCaseStatus)
    });
  })
);

useCaseRouter.patch(
  '/:id',
  validateBody(useCaseUpdateSchema),
  asyncHandler(async (req, res) => {
    const useCase = await useCaseService.update(req.params.id, req.body, {
      id: req.user!.sub,
      role: req.user!.role
    });
    res.json(useCase);
  })
);

useCaseRouter.post(
  '/:id/status',
  validateBody(statusTransitionSchema),
  asyncHandler(async (req, res) => {
    const useCase = await useCaseService.getById(req.params.id);
    await workflowService.transition(
      useCase,
      req.body.toStatus,
      { id: req.user!.sub, role: req.user!.role },
      req.body.note
    );
    res.json(await useCaseService.getById(req.params.id));
  })
);

useCaseRouter.get(
  '/:id/history',
  asyncHandler(async (req, res) => {
    const history = await statusHistoryRepository.findByUseCase(req.params.id);
    res.json(history);
  })
);

useCaseRouter.get(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    res.json(await commentService.list(req.params.id));
  })
);

useCaseRouter.post(
  '/:id/comments',
  validateBody(commentSchema),
  asyncHandler(async (req, res) => {
    const comment = await commentService.add(req.params.id, req.user!.sub, req.body.text);
    res.status(201).json(comment);
  })
);

useCaseRouter.get(
  '/:id/evaluations',
  asyncHandler(async (req, res) => {
    res.json(await evaluationService.list(req.params.id));
  })
);

useCaseRouter.post(
  '/:id/evaluations',
  requireRole(Role.AI_CHAMPION, Role.AI_CORE_TEAM),
  validateBody(evaluationSchema),
  asyncHandler(async (req, res) => {
    const evaluation = await evaluationService.add(req.params.id, req.user!.sub, req.body);
    res.status(201).json(evaluation);
  })
);

useCaseRouter.get(
  '/:id/attachments',
  asyncHandler(async (req, res) => {
    res.json(await attachmentService.list(req.params.id));
  })
);

useCaseRouter.post(
  '/:id/attachments',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequest('Keine Datei übermittelt');
    }
    const attachment = await attachmentService.add(req.params.id, req.user!.sub, req.file);
    res.status(201).json(attachment);
  })
);

useCaseRouter.post(
  '/:id/ai/summarize',
  asyncHandler(async (req, res) => {
    const useCase = await useCaseService.getById(req.params.id);
    res.json({ summary: await aiService.summarizeUseCase(useCase) });
  })
);

useCaseRouter.post(
  '/:id/ai/classify',
  asyncHandler(async (req, res) => {
    const useCase = await useCaseService.getById(req.params.id);
    res.json(await aiService.classifyUseCase(useCase));
  })
);

useCaseRouter.post(
  '/:id/ai/management-summary',
  asyncHandler(async (req, res) => {
    const useCase = await useCaseService.getById(req.params.id);
    res.json({ summary: await aiService.generateManagementSummary(useCase) });
  })
);
