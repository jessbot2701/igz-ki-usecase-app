import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Chip, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { adminApi } from '../../api/useCaseApi';

export function ActivityLogPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['admin-activity'], queryFn: () => adminApi.activity(50) });

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Aktivitätsprotokoll
      </Typography>
      <Card>
        <CardContent>
          {isLoading && <Typography>Lädt…</Typography>}
          <List>
            {data?.map((entry, idx) => (
              <ListItemButton
                key={`${entry.useCaseId}-${idx}`}
                onClick={() => navigate(`/use-cases/${entry.useCaseId}`)}
                divider
              >
                <ListItemText
                  primary={
                    <>
                      <Chip
                        label={entry.type === 'STATUS_CHANGE' ? 'Status' : 'Kommentar'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {entry.useCaseTitle}: {entry.detail}
                    </>
                  }
                  secondary={`${entry.actorName} · ${new Date(entry.timestamp).toLocaleString('de-DE')}`}
                />
              </ListItemButton>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
