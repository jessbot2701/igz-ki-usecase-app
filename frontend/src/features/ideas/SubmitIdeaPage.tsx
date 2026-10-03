import { FormEvent, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { isAxiosError } from 'axios';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { emptyIdea, IdeaFields } from './IdeaFields';
import { useEmailAccessConfig } from './useEmailAccessConfig';
import { DemoConfirmation } from './DemoNotice';
import { IdeaSpark } from './IdeaSpark';
import { IdeaThanksDialog } from './IdeaThanksDialog';

const INSPIRATIONS = [
  {
    label: 'Wissen finden',
    text: 'Wo suchen Sie häufig nach Informationen? Denken Sie an Handbücher, Projekterfahrungen oder wiederkehrende Fragen.'
  },
  {
    label: 'Routine vereinfachen',
    text: 'Welche Aufgabe wiederholt sich ständig? Denken Sie an das Übertragen von Daten, Zusammenfassungen oder die Prüfung von Dokumenten.'
  },
  {
    label: 'Qualität verbessern',
    text: 'Wo könnte ein zweiter Blick helfen? Denken Sie an fehlende Angaben, ungewöhnliche Werte oder Fehler, die heute erst spät auffallen.'
  }
];

export function SubmitIdeaPage() {
  const { user } = useAuth();
  const { demoMode, demoEmail, loading, unavailable } = useEmailAccessConfig();
  const [idea, setIdea] = useState(emptyIdea);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const [thanksOpen, setThanksOpen] = useState(false);
  const thanked = useRef(false);
  const [inspiration, setInspiration] = useState(0);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const result = await authApi.requestEmailLink({
        email: demoMode ? demoEmail! : email,
        name,
        idea
      });
      setDemoLink(result.demoLink ?? '');
      setSent(true);
      if ((!demoMode || result.demoLink) && !thanked.current) {
        thanked.current = true;
        setThanksOpen(true);
      }
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
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          mb: 3,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          color: '#fff',
          background:
            'radial-gradient(ellipse at 95% 0%, #285f7d 0%, transparent 60%), linear-gradient(120deg, #0b2239, #143751)',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.2,
            backgroundImage: 'radial-gradient(#a3def0 .7px, transparent .7px)',
            backgroundSize: '22px 22px',
            maskImage: 'linear-gradient(to right, transparent 30%, black)'
          }
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={3}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1.5, color: '#a9e6cb' }}
            >
              <AutoAwesomeOutlinedIcon fontSize="small" />
              <Typography variant="overline" sx={{ letterSpacing: '.16em', fontWeight: 700 }}>
                IGZ · Ideenwerkstatt
              </Typography>
            </Stack>
            <Typography
              variant="h3"
              component="h1"
              sx={{ fontSize: { xs: '2rem', sm: '2.6rem' }, fontWeight: 750, mb: 1.5 }}
            >
              Ihre KI-Idee
            </Typography>
            <Typography sx={{ color: '#d0e2ef', maxWidth: 580, lineHeight: 1.7 }}>
              Kleine Idee. Neue Möglichkeiten. Was würden Sie in Ihrem Arbeitsalltag gerne einfacher
              machen?
            </Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <IdeaSpark />
          </Box>
        </Stack>
      </Paper>
      <Stack
        component="ol"
        aria-label="So wird aus Ihrer Idee ein Use Case"
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.25, sm: 3 }}
        sx={{ listStyle: 'none', p: 0, m: 0, mb: 3.5 }}
      >
        {['Idee beschreiben', 'Zugang bestätigen', 'Gemeinsam weiterdenken'].map((label, index) => (
          <Stack component="li" key={label} direction="row" alignItems="center" spacing={1}>
            <Box
              component="span"
              sx={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: 12,
                fontWeight: 800,
                bgcolor: index === (sent ? 1 : 0) ? 'primary.main' : 'action.hover',
                color: index === (sent ? 1 : 0) ? 'primary.contrastText' : 'text.secondary'
              }}
            >
              {index + 1}
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: index === (sent ? 1 : 0) ? 700 : 400,
                color: index === (sent ? 1 : 0) ? 'text.primary' : 'text.secondary'
              }}
            >
              {label}
            </Typography>
          </Stack>
        ))}
      </Stack>
      {user && user.role !== Role.EMPLOYEE ? (
        <Alert severity="info">
          Sie sind mit einem Verwaltungskonto angemeldet.{' '}
          <Button component={RouterLink} to="/use-cases?create=1">
            Use Case in der Verwaltung anlegen
          </Button>
        </Alert>
      ) : sent && demoLink ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <DemoConfirmation link={demoLink} />
        </Paper>
      ) : sent && demoMode ? (
        <Alert severity="info">
          Für dieses Demo-Konto ist kein Zugang verfügbar. Bitte wenden Sie sich an die Person, die
          die Demo betreut.
        </Alert>
      ) : sent ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Alert severity="success">Bitte prüfen Sie Ihr E-Mail-Postfach.</Alert>
            <Typography>
              Wenn Ihre Adresse für den Mitarbeiterzugang zugelassen ist, erhalten Sie einen
              Bestätigungslink an <strong>{email}</strong>. Der Link ist 15 Minuten gültig.
            </Typography>
            <Typography>
              Erst nach Ihrer Bestätigung wird die Idee eingereicht. Danach können Sie den Status
              sehen und mit dem AI-Team Rückfragen klären.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Keine E-Mail erhalten? Prüfen Sie auch den Spam-Ordner. Für Verwaltungskonten gilt
              weiterhin die Anmeldung mit Passwort.
            </Typography>
            <Button onClick={() => setSent(false)}>
              Adresse prüfen oder Link erneut anfordern
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 285px' },
            gap: 3,
            alignItems: 'start'
          }}
        >
          <Paper
            component="form"
            onSubmit={submit}
            variant="outlined"
            sx={{
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 3,
              boxShadow: '0 12px 40px rgba(18,61,99,.04)',
              '& .MuiOutlinedInput-root': { borderRadius: 2.5 }
            }}
          >
            <Stack spacing={3}>
              {error ? <Alert severity="error">{error}</Alert> : null}
              {unavailable ? (
                <Alert severity="error">
                  Der Zugang konnte nicht geladen werden. Bitte laden Sie die Seite erneut.
                </Alert>
              ) : null}
              <Box>
                <Typography variant="h6" component="h2" sx={{ mb: 0.75 }}>
                  Geben Sie Ihrer Idee eine Form.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vier Felder reichen für den Anfang. Die Details entwickeln wir gemeinsam.
                </Typography>
              </Box>
              <IdeaFields value={idea} onChange={setIdea} disabled={pending} inspiring />
              <Divider />
              <Box>
                <Typography variant="subtitle1" component="h2" fontWeight={700}>
                  Mit wem dürfen wir weiterdenken?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  So bleiben Sie mit Ihrem AI Champion in Kontakt.
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2.5
                }}
              >
                <TextField
                  label="Ihr Name"
                  required
                  autoComplete="name"
                  value={name}
                  disabled={pending}
                  inputProps={{ minLength: 2, maxLength: 120 }}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  label={demoMode ? 'Demo-E-Mail-Adresse' : 'Ihre Firmen-E-Mail-Adresse'}
                  type="email"
                  required
                  autoComplete="email"
                  value={demoMode ? (demoEmail ?? '') : email}
                  disabled={pending || demoMode}
                  inputProps={{ maxLength: 254 }}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {demoMode
                  ? 'Alle Vorführungen verwenden dasselbe Demo-Mitarbeiterkonto. E-Mails und Benachrichtigungen werden nicht versendet.'
                  : 'Ihre Idee ist für Sie und das zuständige AI-Team sichtbar. Über Ihre E-Mail-Adresse erhalten Sie den Zugang und Benachrichtigungen.'}
              </Typography>
              <Button
                type="submit"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  alignSelf: { xs: 'stretch', sm: 'flex-start' },
                  py: 1.5,
                  px: 3,
                  borderRadius: 2.5,
                  boxShadow: '0 6px 18px rgba(31,78,121,.18)'
                }}
                disabled={pending || loading || unavailable}
              >
                {pending
                  ? 'Link wird angefordert…'
                  : demoMode
                    ? 'Demo-Bestätigungslink erstellen'
                    : 'Bestätigungslink anfordern'}
              </Button>
            </Stack>
          </Paper>
          <Stack
            component="aside"
            aria-label="Denkanstöße für Ihre Idee"
            spacing={2.5}
            sx={{ position: { md: 'sticky' }, top: { md: 24 } }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 2.75,
                borderRadius: 3,
                backgroundImage:
                  'linear-gradient(145deg, rgba(76,169,203,.09), rgba(107,98,180,.05))'
              }}
            >
              <LightbulbOutlinedIcon sx={{ color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                Ein Gedanke genügt.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
                Sie müssen kein KI-Profi sein. Starten Sie mit etwas, das Sie im Alltag beschäftigt.
              </Typography>
              <Stack direction="row" useFlexGap flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                {INSPIRATIONS.map((item, index) => (
                  <Chip
                    key={item.label}
                    label={item.label}
                    onClick={() => setInspiration(index)}
                    aria-pressed={index === inspiration}
                    color={index === inspiration ? 'primary' : 'default'}
                    variant={index === inspiration ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Stack>
              <Typography variant="body2" aria-live="polite" sx={{ lineHeight: 1.75 }}>
                {INSPIRATIONS[inspiration].text}
              </Typography>
            </Paper>
            <Box sx={{ px: 1 }}>
              <ForumOutlinedIcon sx={{ color: 'secondary.main', mb: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                Ihre Idee bleibt im Gespräch.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
                Nach der Bestätigung können Sie den Status verfolgen und Rückfragen direkt mit dem
                AI-Team klären.
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
      <IdeaThanksDialog
        open={thanksOpen}
        onClose={() => setThanksOpen(false)}
        demoLink={demoLink || undefined}
      />
    </Box>
  );
}
