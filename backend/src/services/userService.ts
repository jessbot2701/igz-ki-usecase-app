import { User } from '@prisma/client';
import { Role } from '../domain/enums';
import { ApiError } from '../utils/ApiError';
import { AuthService } from './authService';
import { IUserRepository, userRepository } from '../repositories/userRepository';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
  department?: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: Role;
  department?: string;
  active?: boolean;
}

export class UserService {
  constructor(private readonly users: IUserRepository = userRepository) {}

  list(): Promise<User[]> {
    return this.users.findAll();
  }

  async create(input: CreateUserRequest): Promise<User> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict('Ein Benutzer mit dieser E-Mail existiert bereits');
    }
    const passwordHash = await AuthService.hashPassword(input.password);
    return this.users.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      department: input.department
    });
  }

  async update(id: string, input: UpdateUserRequest): Promise<User> {
    const existing = await this.users.findById(id);
    if (!existing) {
      throw ApiError.notFound('Benutzer nicht gefunden');
    }
    return this.users.update(id, input);
  }
}

export const userService = new UserService();
