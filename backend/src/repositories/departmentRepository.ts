import { Department } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CreateDepartmentInput {
  name: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  active?: boolean;
}

export interface IDepartmentRepository {
  findAll(includeInactive?: boolean): Promise<Department[]>;
  findById(id: string): Promise<Department | null>;
  findByName(name: string): Promise<Department | null>;
  create(input: CreateDepartmentInput): Promise<Department>;
  update(id: string, input: UpdateDepartmentInput): Promise<Department>;
  delete(id: string): Promise<void>;
}

export class PrismaDepartmentRepository implements IDepartmentRepository {
  findAll(includeInactive = false): Promise<Department[]> {
    return prisma.department.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { name: 'asc' }
    });
  }

  findById(id: string): Promise<Department | null> {
    return prisma.department.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<Department | null> {
    return prisma.department.findUnique({ where: { name } });
  }

  create(input: CreateDepartmentInput): Promise<Department> {
    return prisma.department.create({ data: input });
  }

  update(id: string, input: UpdateDepartmentInput): Promise<Department> {
    return prisma.department.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    await prisma.department.delete({ where: { id } });
  }
}

export const departmentRepository: IDepartmentRepository = new PrismaDepartmentRepository();
