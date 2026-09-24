import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { APP_BAR_GRADIENT } from '../../theme/theme';
import igzLogo from '../../assets/igz-logo.jpg';
import pptNetworkWarm from '../../assets/illustrations/ppt-network-warm.jpg';

export function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch {
      setError('Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: APP_BAR_GRADIENT,
        backgroundImage: `linear-gradient(135deg, rgba(9,36,58,0.9), rgba(31,78,121,0.72)), url(${pptNetworkWarm})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        p: 2
      }}
    >
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, width: 430, borderRadius: 3 }}>
        <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <Box
            component="img"
            src={igzLogo}
            alt="IGZ – Die SAP Ingenieure"
            sx={{ width: 260, maxWidth: '100%', mb: 3 }}
          />
          <Typography variant="h5" fontWeight={700}>
            AI Use Case Portal
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Erfassen, bewerten und verwalten Sie Ihre AI Use Cases zentral.
          </Typography>
        </Stack>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="E-Mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Passwort"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
              {loading ? 'Anmeldung läuft…' : 'Anmelden'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
