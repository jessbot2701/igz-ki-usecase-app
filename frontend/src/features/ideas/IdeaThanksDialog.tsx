import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { IdeaSpark } from './IdeaSpark';

export function IdeaThanksDialog({
  open,
  onClose,
  demoLink
}: {
  open: boolean;
  onClose: () => void;
  demoLink?: string;
}) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="idea-thanks-title"
      aria-describedby="idea-thanks-description"
      transitionDuration={reducedMotion ? 0 : 240}
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', m: 2, width: 'calc(100% - 32px)' } }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          py: 2,
          background: 'radial-gradient(ellipse at 50% 110%, #275b76 0%, #102d49 55%, #0b2239 100%)'
        }}
      >
        <IconButton
          aria-label="Danke-Fenster schließen"
          onClick={onClose}
          sx={{ position: 'absolute', top: 12, right: 12, color: '#d6e7f0' }}
        >
          <CloseIcon />
        </IconButton>
        <IdeaSpark celebrate />
        <Typography variant="overline" sx={{ color: '#a9e6cb', letterSpacing: '.14em', mb: 1, px: 3, textAlign: 'center', fontSize: { xs: '.62rem', sm: '.7rem' } }}>
          Jede Veränderung beginnt mit einer Idee
        </Typography>
      </Box>
      <DialogTitle
        id="idea-thanks-title"
        sx={{
          textAlign: 'center',
          fontSize: { xs: '1.65rem', sm: '2rem' },
          pt: 3,
          pb: 1,
          borderBottom: 0
        }}
      >
        Danke für Ihren Impuls!
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', px: { xs: 3, sm: 5 } }}>
        <Typography id="idea-thanks-description" color="text.secondary">
          Sie kennen Ihren Arbeitsalltag am besten. Mit Ihrem Vorschlag helfen Sie, KI bei IGZ
          sinnvoll einzusetzen.
        </Typography>
        <Stack
          spacing={0.75}
          sx={{ mt: 3, p: 2.5, bgcolor: 'background.default', borderRadius: 2.5 }}
        >
          <Typography fontWeight={700}>Nur noch kurz bestätigen</Typography>
          <Typography variant="body2" color="text.secondary">
            {demoLink
              ? 'Öffnen Sie den Demo-Link und bestätigen Sie Ihre Idee. Erst dann wird sie beim AI-Team eingereicht.'
              : 'Öffnen Sie den Link in Ihrer E-Mail. Erst nach Ihrer Bestätigung wird die Idee beim AI-Team eingereicht.'}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', borderTop: 0, px: 3, pb: 3, pt: 0 }}>
        {demoLink ? (
          <Button
            autoFocus
            component="a"
            href={demoLink}
            variant="contained"
            size="large"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ px: 3 }}
          >
            Demo-Idee jetzt bestätigen
          </Button>
        ) : (
          <Button
            autoFocus
            onClick={onClose}
            variant="contained"
            size="large"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ px: 3 }}
          >
            Alles klar, E-Mail prüfen
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
