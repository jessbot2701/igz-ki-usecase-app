import { Attachment } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CreateAttachmentInput {
  useCaseId: string;
  fileName: string;
  storedPath: string;
  mimeType: string;
  size: number;
  uploadedById: string;
}

export interface IAttachmentRepository {
  create(input: CreateAttachmentInput): Promise<Attachment>;
  findByUseCase(useCaseId: string): Promise<Attachment[]>;
  findById(id: string): Promise<Attachment | null>;
}

export class PrismaAttachmentRepository implements IAttachmentRepository {
  create(input: CreateAttachmentInput): Promise<Attachment> {
    return prisma.attachment.create({ data: input });
  }

  findByUseCase(useCaseId: string): Promise<Attachment[]> {
    return prisma.attachment.findMany({ where: { useCaseId }, orderBy: { uploadedAt: 'desc' } });
  }

  findById(id: string): Promise<Attachment | null> {
    return prisma.attachment.findUnique({ where: { id } });
  }
}

export const attachmentRepository: IAttachmentRepository = new PrismaAttachmentRepository();
