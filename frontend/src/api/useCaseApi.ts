import { apiClient } from './client';
import {
  ActivityFeedEntry,
  AttachmentEntry,
  CommentEntry,
  DashboardStats,
  EvaluationEntry,
  PagedResult,
  PortfolioStats,
  StatusHistoryEntry,
  UseCase,
  UseCaseStatus
} from '../types';

export interface UseCaseSearchParams {
  search?: string;
  status?: UseCaseStatus;
  department?: string;
  requestor?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export type UseCaseFormValues = Omit<
  UseCase,
  'id' | 'status' | 'createdById' | 'lastModifiedById' | 'createdAt' | 'updatedAt' | 'allowedNextStatuses'
>;

export const useCaseApi = {
  search: (params: UseCaseSearchParams) =>
    apiClient.get<PagedResult<UseCase>>('/use-cases', { params }).then((r) => r.data),
  get: (id: string) => apiClient.get<UseCase>(`/use-cases/${id}`).then((r) => r.data),
  create: (input: UseCaseFormValues) => apiClient.post<UseCase>('/use-cases', input).then((r) => r.data),
  update: (id: string, input: Partial<UseCaseFormValues>) =>
    apiClient.patch<UseCase>(`/use-cases/${id}`, input).then((r) => r.data),
  changeStatus: (id: string, toStatus: UseCaseStatus, note?: string) =>
    apiClient.post<UseCase>(`/use-cases/${id}/status`, { toStatus, note }).then((r) => r.data),
  history: (id: string) =>
    apiClient.get<StatusHistoryEntry[]>(`/use-cases/${id}/history`).then((r) => r.data),
  comments: (id: string) => apiClient.get<CommentEntry[]>(`/use-cases/${id}/comments`).then((r) => r.data),
  addComment: (id: string, text: string) =>
    apiClient.post<CommentEntry>(`/use-cases/${id}/comments`, { text }).then((r) => r.data),
  evaluations: (id: string) =>
    apiClient.get<EvaluationEntry[]>(`/use-cases/${id}/evaluations`).then((r) => r.data),
  addEvaluation: (
    id: string,
    input: Pick<EvaluationEntry, 'businessValue' | 'feasibility' | 'risk' | 'strategicRelevance' | 'note'>
  ) => apiClient.post<EvaluationEntry>(`/use-cases/${id}/evaluations`, input).then((r) => r.data),
  attachments: (id: string) =>
    apiClient.get<AttachmentEntry[]>(`/use-cases/${id}/attachments`).then((r) => r.data),
  uploadAttachment: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<AttachmentEntry>(`/use-cases/${id}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then((r) => r.data);
  },
  downloadAttachmentUrl: (attachmentId: string) => `/api/v1/attachments/${attachmentId}/download`
};

export const dashboardApi = {
  stats: () => apiClient.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
  portfolio: () => apiClient.get<PortfolioStats>('/dashboard/portfolio').then((r) => r.data)
};

export const adminApi = {
  activity: (limit = 25) =>
    apiClient.get<ActivityFeedEntry[]>('/admin/activity', { params: { limit } }).then((r) => r.data)
};
