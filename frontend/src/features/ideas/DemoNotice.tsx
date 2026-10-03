import { Alert, Button, Stack, Typography } from '@mui/material';
import { useEmailAccessConfig } from './useEmailAccessConfig';

export function DemoNotice() {
  const { demoMode } = useEmailAccessConfig();
  return demoMode ? (
    <Alert severity="info" sx={{ mb: 3 }}>
      Demo-Modus · Kein E-Mail-Versand. Die Bestätigung wird in der App simuliert. Bitte verwenden
      Sie ausschließlich Beispieldaten.
    </Alert>
  ) : null;
}

export function DemoConfirmation({ link }: { link: string }) {
  // A full navigation makes the fragment available to the existing confirmation page.
  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Demo: Ihr Bestätigungslink ist bereit. Es wurde keine E-Mail versendet.
      </Alert>
      <Typography>
        Im späteren Betrieb kommt dieser Link per E-Mail. Für die Vorführung können Sie ihn direkt
        öffnen.
      </Typography>
      <Button component="a" href={link} variant="contained">
        Demo-Bestätigungslink öffnen
      </Button>
    </Stack>
  );
}
