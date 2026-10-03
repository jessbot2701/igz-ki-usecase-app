import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useEmailAccessConfig } from './useEmailAccessConfig';

export function VerifyEmailPage() {
  const { demoMode } = useEmailAccessConfig();
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? ''
  );
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const { verifyEmailLink } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    // Keep the credential out of copied URLs/history; no automatic consumption by mail scanners.
    window.history.replaceState(window.history.state, '', window.location.pathname);
  }, []);
  async function confirm() {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      const result = await verifyEmailLink(token);
      navigate(result.useCaseId ? `/meine-ideen/${result.useCaseId}` : '/meine-ideen', {
        replace: true,
        state: { submitted: result.submitted, demo: demoMode }
      });
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data?.message ?? 'Der Zugang konnte nicht bestätigt werden.')
          : 'Der Zugang konnte nicht bestätigt werden.'
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Stack spacing={2.5}>
          <Typography variant="h4" component="h1">
            {demoMode ? 'Demo-Zugang bestätigen' : 'E-Mail bestätigen'}
          </Typography>
          <Typography>
            Bestätigen Sie den von Ihnen angeforderten Zugang. Wenn Sie eine neue Idee gemeldet
            haben, wird sie mit dieser Bestätigung eingereicht.
          </Typography>
          {error || !token ? (
            <Alert severity="error">
              {error ||
                'Kein gültiger Zugangslink vorhanden. Bitte öffnen Sie den vollständigen Link aus Ihrer E-Mail.'}
            </Alert>
          ) : null}
          <Button variant="contained" size="large" disabled={pending || !token} onClick={confirm}>
            {pending ? 'Zugang wird bestätigt…' : 'Bestätigen und Meine Ideen öffnen'}
          </Button>
          <Button component={RouterLink} to="/zugang">
            Neuen Zugangslink anfordern
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
