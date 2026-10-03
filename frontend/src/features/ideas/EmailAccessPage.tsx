import { FormEvent, useState } from 'react';
import { Link as RouterLink, Navigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { useEmailAccessConfig } from './useEmailAccessConfig';
import { DemoConfirmation } from './DemoNotice';

export function EmailAccessPage() {
  const { user } = useAuth();
  const { demoMode, demoEmail, loading, unavailable } = useEmailAccessConfig();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const requestedId = params.get('idee') ?? '';
  const targetId = /^c[a-z0-9]{24}$/.test(requestedId) ? requestedId : undefined;
  if (user?.role === Role.EMPLOYEE)
    return <Navigate to={targetId ? `/meine-ideen/${targetId}` : '/meine-ideen'} replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    setMessage('');
    setDemoLink('');
    try {
      const result = await authApi.requestEmailLink({
        email: demoMode ? demoEmail! : email,
        targetId
      });
      setMessage(result.message);
      setDemoLink(result.demoLink ?? '');
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data?.message ?? 'Bitte versuchen Sie es erneut.')
          : 'Bitte versuchen Sie es erneut.'
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Meine Ideen öffnen
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {demoMode
          ? 'Öffnen Sie die Ideen des Demo-Mitarbeiters ohne E-Mail-Versand. Melden Sie bei der ersten Vorführung zunächst eine Idee.'
          : 'Geben Sie die Firmen-E-Mail-Adresse an, mit der Sie Ihre Idee eingereicht haben. Wir senden Ihnen einen einmaligen Zugangslink.'}
      </Typography>
      <Paper component="form" onSubmit={submit} variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {unavailable ? (
            <Alert severity="error">
              Der Zugang konnte nicht geladen werden. Bitte laden Sie die Seite erneut.
            </Alert>
          ) : null}
          {demoLink ? (
            <DemoConfirmation link={demoLink} />
          ) : message ? (
            <Alert severity="success">
              {message}{' '}
              {!demoMode ? 'Der Link gilt 15 Minuten. Prüfen Sie auch Ihren Spam-Ordner.' : ''}
            </Alert>
          ) : null}
          <TextField
            label={demoMode ? 'Demo-E-Mail-Adresse' : 'Ihre Firmen-E-Mail-Adresse'}
            type="email"
            autoComplete="email"
            required
            value={demoMode ? (demoEmail ?? '') : email}
            disabled={pending || demoMode}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" variant="contained" disabled={pending || loading || unavailable}>
            {pending
              ? 'Link wird angefordert…'
              : demoMode
                ? 'Demo-Zugangslink erstellen'
                : 'Zugangslink anfordern'}
          </Button>
          <Button component={RouterLink} to="/idee-melden">
            Noch keine Idee eingereicht? Jetzt melden
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
