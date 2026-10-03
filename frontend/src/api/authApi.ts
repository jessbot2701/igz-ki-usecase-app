import { apiClient } from './client';
import { User } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export interface IdeaInput {
  title: string;
  department: string;
  problemDescription: string;
  solutionIdea: string;
}

export interface EmailLinkResponse extends LoginResponse {
  useCaseId?: string;
  submitted: boolean;
}

export interface EmailAccessConfig {
  demoMode: boolean;
  demoEmail?: string;
}

export const authApi = {
  accessConfig: () => apiClient.get<EmailAccessConfig>('/auth/access-config').then((r) => r.data),
  requestEmailLink: (input: {
    email: string;
    name?: string;
    idea?: IdeaInput;
    targetId?: string;
  }) =>
    apiClient
      .post<{ message: string; demoLink?: string }>('/auth/email-link', input)
      .then((r) => r.data),
  verifyEmailLink: (token: string) =>
    apiClient.post<EmailLinkResponse>('/auth/email-link/verify', { token }).then((r) => r.data),
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
  me: () => apiClient.get<User>('/auth/me').then((r) => r.data)
};
