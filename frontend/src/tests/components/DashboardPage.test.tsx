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
        byRisk: { NIEDRIG: 2 },
        byStrategicRelevance: { QUICK_WIN: 1 },
        openDecisions: 1,
        needMoreInfo: 1,
        missingEvaluations: 1,
        overdueTargetDates: 1,
        attentionItems: [
          {
            id: 'case-1',
            title: 'Offener Use Case',
            department: 'IT',
            responsible: 'AI Core Team',
            targetDate: '2026-09-01',
            status: 'NEED_MORE_INFO',
            reasons: ['NEED_MORE_INFO']
          }
        ]
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
    expect(screen.queryByText('Entscheidungszentrale')).not.toBeInTheDocument();
  });

  it('shows the portfolio overview for the AI Core Team', async () => {
    mockUser.mockReturnValue({ role: Role.AI_CORE_TEAM });
    renderDashboard();
    expect(await screen.findByText('Entscheidungszentrale')).toBeInTheDocument();
    expect(await screen.findByText('Offener Use Case')).toBeInTheDocument();
  });

  it('shows the portfolio overview for an Administrator', async () => {
    mockUser.mockReturnValue({ role: Role.ADMINISTRATOR });
    renderDashboard();
    expect(await screen.findByText('Entscheidungszentrale')).toBeInTheDocument();
  });
});
