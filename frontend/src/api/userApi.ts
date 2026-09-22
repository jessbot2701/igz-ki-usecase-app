import { apiClient } from './client';
import { Role, User } from '../types';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  department?: string;
}

export const userApi = {
  list: () => apiClient.get<User[]>('/users').then((r) => r.data),
  create: (input: CreateUserInput) => apiClient.post<User>('/users', input).then((r) => r.data),
  update: (id: string, input: Partial<Pick<User, 'name' | 'role' | 'department' | 'active'>>) =>
    apiClient.patch<User>(`/users/${id}`, input).then((r) => r.data)
};
