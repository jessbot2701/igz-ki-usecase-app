import { Comment } from '@prisma/client';
import { ICommentRepository, commentRepository } from '../repositories/commentRepository';
import { prisma } from '../config/prisma';
import { queueUseCaseNotification } from './notificationService';
import { UseCaseStatus } from '../domain/enums';

export class CommentService {
  constructor(private readonly comments: ICommentRepository = commentRepository) {}

  add(useCaseId: string, authorId: string, text: string): Promise<Comment> {
    return prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({ data: { useCaseId, authorId, text } });
      await tx.useCase.updateMany({
        where: { id: useCaseId, createdById: authorId, status: UseCaseStatus.NEED_MORE_INFO },
        data: { clarificationAnsweredAt: comment.createdAt }
      });
      await queueUseCaseNotification(tx, useCaseId, authorId, 'COMMENT');
      return comment;
    });
  }

  list(useCaseId: string): Promise<Comment[]> {
    return this.comments.findByUseCase(useCaseId);
  }
}

export const commentService = new CommentService();
