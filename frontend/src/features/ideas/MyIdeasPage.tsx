import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  FormControlLabel,
  Pagination,
  Stack,
  Typography
} from '@mui/material';
import { useCaseApi } from '../../api/useCaseApi';
import { useAuth } from '../../context/AuthContext';
import { StatusChip } from '../../components/StatusChip';
import { ClarificationChip } from '../../components/ClarificationChip';
import { UseCaseStatus } from '../../types';

export function MyIdeasPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [unansweredOnly, setUnansweredOnly] = useState(false);
  const { data, isPending, isError } = useQuery({
    queryKey: ['my-ideas', user?.id, page, unansweredOnly],
    queryFn: () =>
      useCaseApi.search({ page, pageSize: 10, unansweredOnly: unansweredOnly || undefined })
  });
  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            Meine Ideen
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Hier sehen Sie den Status Ihrer Ideen und können Rückfragen beantworten.
          </Typography>
        </Box>
        <Button component={RouterLink} to="/idee-melden" variant="contained">
          Neue Idee melden
        </Button>
      </Stack>
      <FormControlLabel
        label="Nur unbeantwortete Rückfragen"
        control={
          <Checkbox
            checked={unansweredOnly}
            onChange={(_event, checked) => {
              setUnansweredOnly(checked);
              setPage(1);
            }}
          />
        }
        sx={{ mb: 2 }}
      />
      <Stack spacing={2}>
        {isPending ? <Typography>Ihre Ideen werden geladen…</Typography> : null}
        {isError ? (
          <Alert severity="error">
            Ihre Ideen konnten nicht geladen werden. Bitte versuchen Sie es erneut.
          </Alert>
        ) : null}
        {data?.items.length === 0 ? (
          <Alert severity="info">
            {unansweredOnly
              ? 'Keine unbeantworteten Rückfragen.'
              : 'Sie haben noch keine Ideen eingereicht.'}
          </Alert>
        ) : null}
        {data?.items.map((idea) => (
          <Card
            key={idea.id}
            variant="outlined"
            sx={idea.hasUnansweredQuestion ? { borderColor: 'warning.main' } : undefined}
          >
            <CardActionArea component={RouterLink} to={`/meine-ideen/${idea.id}`}>
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Typography variant="h6" component="h2">
                    {idea.title}
                  </Typography>
                  <StatusChip status={idea.status} />
                </Stack>
                <ClarificationChip useCase={idea} />
                <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                  {idea.department} · Aktualisiert am{' '}
                  {new Date(idea.updatedAt).toLocaleDateString('de-DE')}
                </Typography>
                {idea.status === UseCaseStatus.NEED_MORE_INFO ? (
                  <Typography color="warning.main" sx={{ mt: 2, fontWeight: 600 }}>
                    {idea.clarificationAnsweredAt
                      ? 'Ihre Antwort ist eingegangen. Reichen Sie die Idee nach Ihren Ergänzungen erneut ein.'
                      : 'Das AI-Team hat eine Rückfrage. Bitte öffnen Sie Ihre Idee.'}
                  </Typography>
                ) : null}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
        {data && data.total > 10 ? (
          <Pagination
            count={Math.ceil(data.total / 10)}
            page={page}
            onChange={(_event, value) => setPage(value)}
          />
        ) : null}
      </Stack>
    </Box>
  );
}
