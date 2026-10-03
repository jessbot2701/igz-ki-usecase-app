import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { IdeaLayout } from './IdeaLayout';

export function IdeaLandingPage() {
  return (
    <IdeaLayout>
      <Box sx={{ maxWidth: 760, mb: 5 }}>
        <Typography variant="overline" color="primary">
          KI bei IGZ
        </Typography>
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontSize: { xs: '2rem', md: '3rem' }, mt: 1, mb: 2 }}
        >
          Aus Ihrer Idee wird eine Verbesserung.
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Wo könnte KI Ihren Arbeitsalltag erleichtern? Beschreiben Sie Ihre Idee – das AI-Team
          unterstützt Sie bei den nächsten Schritten.
        </Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 3, md: 4 },
              height: '100%',
              borderTop: 4,
              borderTopColor: 'secondary.main'
            }}
          >
            <LightbulbOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
            <Typography variant="h5" component="h2" sx={{ my: 2 }}>
              Eine KI-Idee melden
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Ein kurzes Formular und ein Bestätigungslink genügen. Sie benötigen kein
              eigenes Passwort.
            </Typography>
            <Button component={RouterLink} to="/idee-melden" variant="contained" size="large">
              Idee melden
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, height: '100%' }}>
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
              Schon eine Idee eingereicht?
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Verfolgen Sie den Status und beantworten Sie Rückfragen direkt bei Ihrer Idee.
            </Typography>
            <Stack spacing={2} alignItems="flex-start">
              <Button component={RouterLink} to="/zugang" variant="outlined">
                Meine Ideen öffnen
              </Button>
              <Button component={RouterLink} to="/login" color="inherit">
                Zum Verwaltungszugang
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </IdeaLayout>
  );
}
