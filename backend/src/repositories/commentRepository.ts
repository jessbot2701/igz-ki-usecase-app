import { Comment, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

const recentInclude = {
  author: { select: { id: true, name: true, role: true } },
  useCase: { select: { id: true, title: true } }
} satisfies Prisma.CommentInclude;

export type CommentWithRelations = Prisma.CommentGetPayload<{ include: typeof recentInclude }>;

export interface CreateCommentInput {
  useCaseId: string;
  authorId: string;
  text: string;
}

export interface ICommentRepository {
  create(input: CreateCommentInput): Promise<Comment>;
  findByUseCase(useCaseId: string): Promise<CommentWithRelations[]>;
  findRecent(limit: number): Promise<CommentWithRelations[]>;
}

export class PrismaCommentRepository implements ICommentRepository {
  create(input: CreateCommentInput): Promise<Comment> {
    return prisma.comment.create({ data: input });
  }

  findByUseCase(useCaseId: string): Promise<CommentWithRelations[]> {
    return prisma.comment.findMany({
      where: { useCaseId },
      orderBy: { createdAt: 'desc' },
      include: recentInclude
    });
  }

  findRecent(limit: number): Promise<CommentWithRelations[]> {
    return prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: recentInclude
    });
  }
}

export const commentRepository: ICommentRepository = new PrismaCommentRepository();
