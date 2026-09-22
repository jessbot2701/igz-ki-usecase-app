import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '../../features/dashboard/DashboardPage';
import { Role } from '../../types';

const mockUser = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser() })
}));

vi.mock('../../api/useCaseApi', () => ({
  dashboardApi: {
    stats: () =>
      Promise.resolve({
        total: 2,
        byStatus: {
          DRAFT: 0,
          SUBMITTED: 1,
          IN_REVIEW: 0,
          NEED_MORE_INFO: 0,
          ON_HOLD: 0,
          APPROVED: 0,
          PILOT: 0,
          IMPLEMENTED: 1,
          ARCHIVED: 0,
          REJECTED: 0
        }
      }),
    portfolio: () =>
      Promise.resolve({
        byDepartment: { IT: 2 },
        byEffort: { NIEDRIG: 1, MITTEL: 1 },
        byRisk: { NIEDRIG: 2 },
        byStrategicRelevance: { QUICK_WIN: 1 },
        byAiSolutionType: { M365_COPILOT: 1 },
        totalEstimatedUsers: 50,
        openDecisions: 1,
        avgDecisionDays: 3
      })
  }
}));

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DashboardPage', () => {
  it('does not show the portfolio overview for an Employee', () => {
    mockUser.mockReturnValue({ role: Role.EMPLOYEE });
    renderDashboard();
    expect(screen.queryByText('Portfolio-Überblick')).not.toBeInTheDocument();
  });

  it('shows the portfolio overview for the AI Core Team', async () => {
    mockUser.mockReturnValue({ role: Role.AI_CORE_TEAM });
    renderDashboard();
    expect(await screen.findByText('Portfolio-Überblick')).toBeInTheDocument();
  });

  it('shows the portfolio overview for an Administrator', async () => {
    mockUser.mockReturnValue({ role: Role.ADMINISTRATOR });
    renderDashboard();
    expect(await screen.findByText('Portfolio-Überblick')).toBeInTheDocument();
  });
});
