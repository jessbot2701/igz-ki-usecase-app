import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MyIdeasPage } from '../../features/ideas/MyIdeasPage';
import { useCaseApi } from '../../api/useCaseApi';
import { UseCase, UseCaseStatus } from '../../types';

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'employee' } }) }));
vi.mock('../../api/useCaseApi', () => ({ useCaseApi: { search: vi.fn() } }));

describe('Personal clarification inbox', () => {
  it('distinguishes unanswered and answered questions and requests a server-side filter', async () => {
    const base = {
      status: UseCaseStatus.NEED_MORE_INFO,
      department: 'IT',
      updatedAt: '2026-10-03T10:00:00Z'
    };
    const pending = {
      ...base,
      id: 'pending',
      title: 'Offene Frage',
      hasUnansweredQuestion: true
    } as UseCase;
    const answered = {
      ...base,
      id: 'answered',
      title: 'Beantwortete Frage',
      clarificationAnsweredAt: '2026-10-03T09:00:00Z'
    } as UseCase;
    vi.mocked(useCaseApi.search).mockImplementation(async (params) => ({
      items: params?.unansweredOnly ? [pending] : [pending, answered],
      total: params?.unansweredOnly ? 1 : 2,
      page: 1,
      pageSize: 10
    }));
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter>
          <MyIdeasPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(await screen.findByText('Antwort ausstehend')).toBeInTheDocument();
    expect(screen.getByText('Antwort eingegangen')).toBeInTheDocument();
    expect(screen.getByText(/Ihre Antwort ist eingegangen/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Nur unbeantwortete Rückfragen' }));
    await waitFor(() => expect(screen.queryByText('Beantwortete Frage')).not.toBeInTheDocument());
    expect(useCaseApi.search).toHaveBeenLastCalledWith({
      unansweredOnly: true,
      page: 1,
      pageSize: 10
    });
    expect(screen.getByRole('link', { name: /Offene Frage/ })).toHaveAttribute(
      'href',
      '/meine-ideen/pending'
    );
  });
});
