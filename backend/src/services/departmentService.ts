import { Department } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import {
  CreateDepartmentInput,
  departmentRepository,
  IDepartmentRepository,
  UpdateDepartmentInput
} from '../repositories/departmentRepository';

export class DepartmentService {
  constructor(private readonly departments: IDepartmentRepository = departmentRepository) {}

  list(includeInactive = false): Promise<Department[]> {
    return this.departments.findAll(includeInactive);
  }

  async create(input: CreateDepartmentInput): Promise<Department> {
    const name = input.name.trim();
    if (!name) throw ApiError.badRequest('Der Bereichsname darf nicht leer sein');
    if (await this.departments.findByName(name)) {
      throw ApiError.conflict('Dieser Bereich existiert bereits');
    }
    return this.departments.create({ name });
  }

  async update(id: string, input: UpdateDepartmentInput): Promise<Department> {
    const existing = await this.departments.findById(id);
    if (!existing) throw ApiError.notFound('Bereich nicht gefunden');
    const name = input.name?.trim();
    if (name && name !== existing.name && (await this.departments.findByName(name))) {
      throw ApiError.conflict('Dieser Bereich existiert bereits');
    }
    return this.departments.update(id, { ...input, ...(name ? { name } : {}) });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.departments.findById(id);
    if (!existing) throw ApiError.notFound('Bereich nicht gefunden');
    await this.departments.delete(id);
  }
}

export const departmentService = new DepartmentService();
