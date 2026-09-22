import '../testEnv';
import bcrypt from 'bcryptjs';
import { prisma } from '../../src/config/prisma';
import { Role } from '../../src/domain/enums';

export async function createTestUser(role: Role, email: string, department = 'IT') {
  const passwordHash = await bcrypt.hash('Test123!', 4);
  return prisma.user.create({
    data: { name: `${role} Test`, email, passwordHash, role, department }
  });
}

export async function resetDatabase(): Promise<void> {
  await prisma.attachment.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.useCase.deleteMany();
  await prisma.user.deleteMany();
}
