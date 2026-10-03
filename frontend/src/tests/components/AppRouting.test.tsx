import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { Role, User } from '../../types';

const auth = vi.hoisted(() => ({ user: null as User | null, logout: vi.fn() }));
vi.mock('../../features/ideas/useEmailAccessConfig', () => ({
  useEmailAccessConfig: () => ({ demoMode: false })
}));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../../components/AppLayout', () => ({ AppLayout: () => <Outlet /> }));
vi.mock('../../features/dashboard/DashboardPage', () => ({
  DashboardPage: () => <div>Verwaltungsdashboard</div>
}));
vi.mock('../../features/ideas/MyIdeasPage', () => ({
  MyIdeasPage: () => <div>Persönliche Ideenliste</div>
}));

describe('Separate public, employee and management entry points', () => {
  beforeEach(() => {
    auth.user = null;
  });
  it('shows the public landing page at / and navigates to the idea form', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('heading', { name: 'Aus Ihrer Idee wird eine Verbesserung.' })
    ).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('link', { name: 'Idee melden' })[0]);
    expect(await screen.findByRole('heading', { name: 'Ihre KI-Idee' })).toBeInTheDocument();
  });
  it('opens the personal ideas area for an employee', () => {
    auth.user = { id: 'employee', name: 'Mia', email: 'mia@test.local', role: Role.EMPLOYEE };
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Persönliche Ideenliste')).toBeInTheDocument();
    expect(screen.queryByText('Verwaltungsdashboard')).not.toBeInTheDocument();
  });
  it('preserves the dashboard entry for a champion', () => {
    auth.user = {
      id: 'champion',
      name: 'Chris',
      email: 'chris@test.local',
      role: Role.AI_CHAMPION
    };
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Verwaltungsdashboard')).toBeInTheDocument();
  });
});
