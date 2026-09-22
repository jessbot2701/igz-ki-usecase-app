import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Card,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { adminApi } from '../../api/useCaseApi';

export function ActivityLogPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => adminApi.activity(50)
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="overline"
          sx={{ color: 'primary.light', fontWeight: 800, letterSpacing: '0.12em' }}
        >
          Administration
        </Typography>
        <Typography variant="h4">Aktivitätsprotokoll</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          Die letzten Änderungen und Kommentare im Portfolio.
        </Typography>
      </Box>
      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: 2.75, py: 2.25, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <HistoryOutlinedIcon color="primary" />
            <Typography variant="h6">Letzte Aktivitäten</Typography>
          </Stack>
        </Box>
        {isLoading && <Typography>Lädt…</Typography>}
        <List disablePadding>
          {data?.map((entry, idx) => (
            <ListItemButton
              key={`${entry.useCaseId}-${idx}`}
              onClick={() => navigate(`/use-cases/${entry.useCaseId}`)}
              divider
              sx={{ px: 2.75, py: 1.5, gap: 1.5 }}
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.78rem' }}>
                {entry.actorName.charAt(0)}
              </Avatar>
              <ListItemText
                primary={
                  <>
                    <Chip
                      label={entry.type === 'STATUS_CHANGE' ? 'Status' : 'Kommentar'}
                      size="small"
                      sx={{ mr: 1, bgcolor: 'rgba(31,78,121,0.08)', color: 'primary.main' }}
                    />
                    {entry.useCaseTitle}: {entry.detail}
                  </>
                }
                secondary={`${entry.actorName} · ${new Date(entry.timestamp).toLocaleString('de-DE')}`}
              />
            </ListItemButton>
          ))}
        </List>
      </Card>
    </Box>
  );
}
