import { Comment } from '@prisma/client';
import { ICommentRepository, commentRepository } from '../repositories/commentRepository';

export class CommentService {
  constructor(private readonly comments: ICommentRepository = commentRepository) {}

  add(useCaseId: string, authorId: string, text: string): Promise<Comment> {
    return this.comments.create({ useCaseId, authorId, text });
  }

  list(useCaseId: string): Promise<Comment[]> {
    return this.comments.findByUseCase(useCaseId);
  }
}

export const commentService = new CommentService();
