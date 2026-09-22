import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppLayout } from '../../components/AppLayout';
import { ThemeModeProvider } from '../../context/ThemeModeContext';
import { Role } from '../../types';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Cora Coreteam', email: 'core@test.local', role: Role.AI_CORE_TEAM },
    logout: vi.fn()
  })
}));

describe('AppLayout', () => {
  it('shows the logged-in user name and role in the top bar', () => {
    render(
      <ThemeModeProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<div>content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeModeProvider>
    );

    expect(screen.getByText('Cora Coreteam · AI Core Team')).toBeInTheDocument();
  });
});
