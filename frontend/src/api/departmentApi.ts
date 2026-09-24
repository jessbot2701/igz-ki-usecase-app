import { apiClient } from './client';
import { Department } from '../types';

export const departmentApi = {
  list: (includeInactive = false) =>
    apiClient
      .get<Department[]>('/departments', { params: { includeInactive } })
      .then((response) => response.data),
  create: (name: string) =>
    apiClient.post<Department>('/departments', { name }).then((response) => response.data),
  update: (id: string, input: Partial<Pick<Department, 'name' | 'active'>>) =>
    apiClient.patch<Department>(`/departments/${id}`, input).then((response) => response.data),
  remove: (id: string) => apiClient.delete(`/departments/${id}`)
};