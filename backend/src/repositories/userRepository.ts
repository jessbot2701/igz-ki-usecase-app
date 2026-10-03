import { Prisma, User } from '@prisma/client';
import { Role } from '../domain/enums';
import { prisma } from '../config/prisma';

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  department?: string;
}

// Preserve access for older accounts whose email was saved with mixed casing.
export async function findUserByEmail(
  db: Prisma.TransactionClient,
  email: string
): Promise<User | null> {
  const matches = await db.$queryRaw<
    Array<{ id: string }>
  >`SELECT id FROM users WHERE email = ${email} COLLATE NOCASE LIMIT 1`;
  return matches[0] ? db.user.findUnique({ where: { id: matches[0].id } }) : null;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  department?: string;
  active?: boolean;
}

// Abstraction over user persistence so the datastore can be swapped without touching services
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, input: UpdateUserInput): Promise<User>;
}

export class PrismaUserRepository implements IUserRepository {
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return findUserByEmail(prisma, email);
  }

  findAll(): Promise<User[]> {
    return prisma.user.findMany({ orderBy: { name: 'asc' } });
  }

  create(input: CreateUserInput): Promise<User> {
    return prisma.user.create({ data: input });
  }

  update(id: string, input: UpdateUserInput): Promise<User> {
    return prisma.user.update({ where: { id }, data: input });
  }
}

export const userRepository: IUserRepository = new PrismaUserRepository();
