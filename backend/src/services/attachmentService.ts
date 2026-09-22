import path from 'node:path';
import fs from 'node:fs';
import { Attachment } from '@prisma/client';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { IAttachmentRepository, attachmentRepository } from '../repositories/attachmentRepository';

export class AttachmentService {
  constructor(private readonly attachments: IAttachmentRepository = attachmentRepository) {}

  async add(
    useCaseId: string,
    uploadedById: string,
    file: Express.Multer.File
  ): Promise<Attachment> {
    return this.attachments.create({
      useCaseId,
      uploadedById,
      fileName: file.originalname,
      storedPath: file.filename,
      mimeType: file.mimetype,
      size: file.size
    });
  }

  list(useCaseId: string): Promise<Attachment[]> {
    return this.attachments.findByUseCase(useCaseId);
  }

  async resolveDownloadPath(attachmentId: string): Promise<{ attachment: Attachment; absolutePath: string }> {
    const attachment = await this.attachments.findById(attachmentId);
    if (!attachment) {
      throw ApiError.notFound('Anhang nicht gefunden');
    }
    const absolutePath = path.join(process.cwd(), env.uploadDir, attachment.storedPath);
    if (!fs.existsSync(absolutePath)) {
      throw ApiError.notFound('Datei nicht mehr vorhanden');
    }
    return { attachment, absolutePath };
  }
}

export const attachmentService = new AttachmentService();
