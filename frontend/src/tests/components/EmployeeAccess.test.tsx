import { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubmitIdeaPage } from '../../features/ideas/SubmitIdeaPage';
import { VerifyEmailPage } from '../../features/ideas/VerifyEmailPage';
import { EmailAccessPage } from '../../features/ideas/EmailAccessPage';
import { RequireEmployee } from '../../components/RouteGuards';
import { authApi } from '../../api/authApi';
import { Role, User } from '../../types';

const auth = vi.hoisted(() => ({ user: null as User | null, verifyEmailLink: vi.fn() }));
const accessMode = vi.hoisted(() => ({
  demoMode: false,
  demoEmail: 'demo.mitarbeiter@igz.com',
  loading: false,
  unavailable: false
}));
vi.mock('../../features/ideas/useEmailAccessConfig', () => ({
  useEmailAccessConfig: () => accessMode
}));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../../api/authApi', () => ({ authApi: { requestEmailLink: vi.fn() } }));

describe('Employee submission and email access', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.user = null;
    accessMode.demoMode = false;
    window.history.replaceState({}, '', '/');
  });

  it('sends the short idea form and explains that email confirmation is still required', async () => {
    vi.mocked(authApi.requestEmailLink).mockResolvedValue({ message: 'Link angefordert' });
    render(
      <MemoryRouter>
        <SubmitIdeaPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Ihr Name/), { target: { value: 'Mia Mitarbeiterin' } });
    fireEvent.change(screen.getByLabelText(/Firmen-E-Mail-Adresse/), {
      target: { value: 'mia@test.local' }
    });
    fireEvent.change(screen.getByLabelText(/Titel Ihrer Idee/), {
      target: { value: 'Wissen schneller finden' }
    });
    fireEvent.change(screen.getByLabelText(/Bereich/), { target: { value: 'IT' } });
    fireEvent.change(screen.getByLabelText(/Welches Problem/), {
      target: { value: 'Die Suche kostet sehr viel Zeit.' }
    });
    fireEvent.change(screen.getByLabelText(/Wie könnte KI/), {
      target: { value: 'KI kann die Handbücher durchsuchen.' }
    });
    await userEvent.click(screen.getByRole('button', { name: 'Bestätigungslink anfordern' }));
    expect(
      await screen.findByRole('dialog', { name: 'Danke für Ihren Impuls!' })
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Alles klar, E-Mail prüfen' }));
    expect(await screen.findByText(/Erst nach Ihrer Bestätigung/)).toBeInTheDocument();
    expect(authApi.requestEmailLink).toHaveBeenCalledWith({
      email: 'mia@test.local',
      name: 'Mia Mitarbeiterin',
      idea: {
        title: 'Wissen schneller finden',
        department: 'IT',
        problemDescription: 'Die Suche kostet sehr viel Zeit.',
        solutionIdea: 'KI kann die Handbücher durchsuchen.'
      }
    });
    expect(auth.verifyEmailLink).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Adresse prüfen oder Link erneut anfordern' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Bestätigungslink anfordern' }));
    await waitFor(() => expect(authApi.requestEmailLink).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('offers inspiration without overwriting an idea already being written', async () => {
    render(
      <MemoryRouter>
        <SubmitIdeaPage />
      </MemoryRouter>
    );
    const problem = screen.getByLabelText(/Welches Problem/);
    fireEvent.change(problem, { target: { value: 'Meine eigene Problembeschreibung.' } });
    await userEvent.click(screen.getByRole('button', { name: 'Routine vereinfachen' }));
    expect(screen.getByText(/Welche Aufgabe wiederholt sich ständig/)).toBeInTheDocument();
    expect(problem).toHaveValue('Meine eigene Problembeschreibung.');
  });

  it('shows a direct demo link without claiming to have sent email and fixes the demo identity', async () => {
    accessMode.demoMode = true;
    const demoLink = 'http://localhost:5175/zugang/bestaetigen#token=' + 'a'.repeat(64);
    vi.mocked(authApi.requestEmailLink).mockResolvedValue({ message: 'Demo', demoLink });
    render(
      <MemoryRouter>
        <EmailAccessPage />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Demo-E-Mail-Adresse/)).toBeDisabled();
    expect(screen.getByLabelText(/Demo-E-Mail-Adresse/)).toHaveValue('demo.mitarbeiter@igz.com');
    await userEvent.click(screen.getByRole('button', { name: 'Demo-Zugangslink erstellen' }));
    expect(
      await screen.findByRole('link', { name: 'Demo-Bestätigungslink öffnen' })
    ).toHaveAttribute('href', demoLink);
    expect(screen.getByText(/Es wurde keine E-Mail versendet/)).toBeInTheDocument();
    expect(authApi.requestEmailLink).toHaveBeenCalledWith({
      email: 'demo.mitarbeiter@igz.com',
      targetId: undefined
    });
    expect(auth.verifyEmailLink).not.toHaveBeenCalled();
  });

  it('does not consume a link on page load, even in StrictMode; confirms explicitly once', async () => {
    const token = 'a'.repeat(64);
    window.history.replaceState({}, '', `/zugang/bestaetigen#token=${token}`);
    auth.verifyEmailLink.mockResolvedValue({ useCaseId: 'idea1', submitted: true });
    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/zugang/bestaetigen']}>
          <Routes>
            <Route path="/zugang/bestaetigen" element={<VerifyEmailPage />} />
            <Route path="/meine-ideen/idea1" element={<div>Bestätigte Idee</div>} />
          </Routes>
        </MemoryRouter>
      </StrictMode>
    );
    expect(auth.verifyEmailLink).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('');
    await userEvent.click(
      screen.getByRole('button', { name: 'Bestätigen und Meine Ideen öffnen' })
    );
    expect(await screen.findByText('Bestätigte Idee')).toBeInTheDocument();
    expect(auth.verifyEmailLink).toHaveBeenCalledTimes(1);
    expect(auth.verifyEmailLink).toHaveBeenCalledWith(token);
  });

  it('offers a new link when a verification has expired', async () => {
    window.history.replaceState({}, '', `/zugang/bestaetigen#token=${'b'.repeat(64)}`);
    auth.verifyEmailLink.mockRejectedValue(new Error('Expired'));
    render(
      <MemoryRouter>
        <VerifyEmailPage />
      </MemoryRouter>
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Bestätigen und Meine Ideen öffnen' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Der Zugang konnte nicht bestätigt werden.'
    );
    expect(screen.getByRole('link', { name: 'Neuen Zugangslink anfordern' })).toHaveAttribute(
      'href',
      '/zugang'
    );
  });

  it('preserves the notified idea as the target when requesting a new link', async () => {
    const id = 'c123456789012345678901234';
    vi.mocked(authApi.requestEmailLink).mockResolvedValue({ message: 'Link angefordert' });
    render(
      <MemoryRouter initialEntries={[`/zugang?idee=${id}`]}>
        <EmailAccessPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Firmen-E-Mail-Adresse/), {
      target: { value: 'mia@test.local' }
    });
    await userEvent.click(screen.getByRole('button', { name: 'Zugangslink anfordern' }));
    await waitFor(() =>
      expect(authApi.requestEmailLink).toHaveBeenCalledWith({
        email: 'mia@test.local',
        targetId: id
      })
    );
  });

  it('redirects an unauthenticated employee deep link to email access, not password login', () => {
    render(
      <MemoryRouter initialEntries={['/meine-ideen/idea1']}>
        <Routes>
          <Route
            path="/meine-ideen/:id"
            element={
              <RequireEmployee>
                <div>Protected</div>
              </RequireEmployee>
            }
          />
          <Route path="/zugang" element={<div>E-Mail-Zugang</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('E-Mail-Zugang')).toBeInTheDocument();
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('directs management users to their existing creation flow', () => {
    auth.user = {
      id: 'champion',
      name: 'Chris Champion',
      email: 'chris@test.local',
      role: Role.AI_CHAMPION
    };
    render(
      <MemoryRouter>
        <SubmitIdeaPage />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('link', { name: 'Use Case in der Verwaltung anlegen' })
    ).toHaveAttribute('href', '/use-cases?create=1');
    expect(
      screen.queryByRole('button', { name: 'Bestätigungslink anfordern' })
    ).not.toBeInTheDocument();
  });
});
