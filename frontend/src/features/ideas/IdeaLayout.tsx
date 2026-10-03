import { ReactNode } from 'react';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import igzLogo from '../../assets/igz-logo.jpg';
import { DemoNotice } from './DemoNotice';

export function IdeaLayout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        component="header"
        sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: 2 }}
          >
            <RouterLink to="/" aria-label="IGZ Ideenportal Startseite">
              <Box
                component="img"
                src={igzLogo}
                alt="IGZ – Die SAP Ingenieure"
                sx={{ width: 170, display: 'block' }}
              />
            </RouterLink>
            <Stack
              component="nav"
              aria-label="Ideenportal"
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              justifyContent="center"
            >
              <Button component={RouterLink} to="/idee-melden">
                Idee melden
              </Button>
              <Button
                component={RouterLink}
                to={user?.role === Role.EMPLOYEE ? '/meine-ideen' : '/zugang'}
              >
                Meine Ideen
              </Button>
              {user ? (
                <Button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  Abmelden
                </Button>
              ) : (
                <Button component={RouterLink} to="/login" color="inherit">
                  Verwaltung
                </Button>
              )}
              {user && user.role !== Role.EMPLOYEE ? (
                <Button component={RouterLink} to="/">
                  Verwaltung
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Container>
      </Box>
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
        <DemoNotice />
        {children ?? <Outlet />}
      </Container>
      <Container component="footer" maxWidth="lg" sx={{ pb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          IGZ · Gemeinsam KI-Ideen weiterentwickeln
        </Typography>
      </Container>
    </Box>
  );
}
