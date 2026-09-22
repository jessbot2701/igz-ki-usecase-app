import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import AssignmentLateOutlinedIcon from '@mui/icons-material/AssignmentLateOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../api/useCaseApi';
import { useAuth } from '../../context/AuthContext';
import { LEVEL_LABELS, Role, STATUS_LABELS, UseCaseStatus } from '../../types';
import { statusColors } from '../../theme/theme';

const KPI_STATUSES: { label: string; status?: UseCaseStatus }[] = [
  { label: 'Gesamt' },
  { label: 'Neu', status: UseCaseStatus.SUBMITTED },
  { label: 'In Prüfung', status: UseCaseStatus.IN_REVIEW },
  { label: 'Pilot', status: UseCaseStatus.PILOT },
  { label: 'Umgesetzt', status: UseCaseStatus.IMPLEMENTED },
  { label: 'Abgelehnt', status: UseCaseStatus.REJECTED }
];

function GeneralOverview() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.stats
  });

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {KPI_STATUSES.map((kpi) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={kpi.label}>
            <Card
              onClick={() =>
                navigate(kpi.status ? `/use-cases?status=${kpi.status}` : '/use-cases')
              }
              sx={{
                cursor: 'pointer',
                height: '100%',
                transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  borderColor: 'primary.light',
                  boxShadow: '0 14px 30px rgba(18, 61, 99, 0.10)'
                }
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 800 }}
                >
                  {kpi.label}
                </Typography>
                {isLoading || !data ? (
                  <Skeleton width={60} height={40} />
                ) : (
                  <Typography variant="h4" sx={{ mt: 1, color: 'primary.dark' }}>
                    {kpi.status ? data.byStatus[kpi.status] : data.total}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.75 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Verteilung nach Status
              </Typography>
              {!isLoading && data && (
                <PieChart
                  height={280}
                  series={[
                    {
                      data: Object.entries(data.byStatus)
                        .filter(([, value]) => value > 0)
                        .map(([status, value]) => ({
                          id: status,
                          value,
                          label: STATUS_LABELS[status as UseCaseStatus],
                          color: statusColors[status as UseCaseStatus]
                        })),
                      innerRadius: 50
                    }
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.75 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Anzahl je Status
              </Typography>
              {!isLoading && data && (
                <BarChart
                  height={280}
                  xAxis={[
                    {
                      scaleType: 'band',
                      data: Object.keys(data.byStatus).map((s) => STATUS_LABELS[s as UseCaseStatus])
                    }
                  ]}
                  series={[{ data: Object.values(data.byStatus), color: '#1F4E79' }]}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function distributionSeries(byKey: Record<string, number>, labels: Record<string, string>) {
  return Object.entries(byKey)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({ id: key, value, label: labels[key] ?? key }));
}

// Portfolio-level analytics for the AI Core Team / Administrator monitoring view
const ATTENTION_REASON_LABELS = {
  NEED_MORE_INFO: 'Rückfrage beantworten',
  OVERDUE_TARGET_DATE: 'Zieltermin überschritten',
  MISSING_EVALUATION: 'Bewertung ausstehend'
};

function DecisionQueue() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-portfolio'],
    queryFn: dashboardApi.portfolio
  });

  return (
    <Box sx={{ mb: 4.5 }}>
      <Box sx={{ mb: 2.25 }}>
        <Typography
          variant="overline"
          sx={{ color: 'primary.light', fontWeight: 800, letterSpacing: '0.12em' }}
        >
          Portfoliosteuerung
        </Typography>
        <Typography variant="h5">Entscheidungszentrale</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Offene Entscheidungen und priorisierte Vorgänge auf einen Blick.
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid', borderLeftColor: 'warning.main', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Offene Entscheidungen
              </Typography>
              {isLoading || !data ? (
                <Skeleton width={60} height={40} />
              ) : (
                <Typography variant="h4" color="warning.main">
                  {data.openDecisions}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                In Prüfung, Rückfrage oder zurückgestellt
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid', borderLeftColor: 'error.main', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Rückfragen
              </Typography>
              {isLoading || !data ? (
                <Skeleton width={60} height={40} />
              ) : (
                <Typography variant="h4" color="error.main">
                  {data.needMoreInfo}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Benötigen eine Rückmeldung
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid', borderLeftColor: 'secondary.main', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Bewertungen ausstehend
              </Typography>
              {isLoading || !data ? (
                <Skeleton width={60} height={40} />
              ) : (
                <Typography variant="h4" color="secondary.main">
                  {data.missingEvaluations}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Offene Fälle ohne Bewertung
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid', borderLeftColor: 'primary.main', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Zieltermine überfällig
              </Typography>
              {isLoading || !data ? (
                <Skeleton width={60} height={40} />
              ) : (
                <Typography variant="h4" color="primary.main">
                  {data.overdueTargetDates}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Fälle mit Handlungsbedarf
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ overflow: 'hidden' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ px: 2.75, py: 2.25, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <AssignmentLateOutlinedIcon color="warning" />
              <Typography variant="h6">Benötigt Aufmerksamkeit</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Rückfragen, fehlende Bewertungen und überfällige Zieltermine.
            </Typography>
          </Box>
          {isLoading && <Skeleton height={230} sx={{ mx: 2.75 }} />}
          {!isLoading && data?.attentionItems.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 2.75 }}>
              Aktuell gibt es keine priorisierten Fälle.
            </Typography>
          )}
          {!isLoading && data && data.attentionItems.length > 0 && (
            <List disablePadding>
              {data.attentionItems.map((item) => (
                <ListItem key={item.id} disablePadding divider>
                  <CardActionArea
                    onClick={() => navigate(`/use-cases/${item.id}`)}
                    sx={{ px: 2.75, py: 1.5 }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <ListItemText
                        primary={item.title}
                        secondary={`${item.department}${item.responsible ? ` · ${item.responsible}` : ''}`}
                      />
                      <Stack
                        direction="row"
                        spacing={0.75}
                        flexWrap="wrap"
                        useFlexGap
                        alignItems="center"
                      >
                        <Chip size="small" label={STATUS_LABELS[item.status]} />
                        {item.reasons.map((reason) => (
                          <Chip
                            key={reason}
                            size="small"
                            color="warning"
                            variant="outlined"
                            label={ATTENTION_REASON_LABELS[reason]}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  </CardActionArea>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// Risk/relevance distributions, rendered further down the page (after the general overview)
function PortfolioInsights() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-portfolio'],
    queryFn: dashboardApi.portfolio
  });

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid item xs={12} lg={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 2.75 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <HelpOutlineOutlinedIcon color="error" />
              <Typography variant="h6">Risiko (aus Bewertungen)</Typography>
            </Stack>
            {!isLoading && data && (
              <PieChart
                height={250}
                series={[{ data: distributionSeries(data.byRisk, LEVEL_LABELS), innerRadius: 40 }]}
              />
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 2.75 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <RateReviewOutlinedIcon color="primary" />
              <Typography variant="h6">Strategische Relevanz (aus Bewertungen)</Typography>
            </Stack>
            {!isLoading && data && (
              <PieChart
                height={250}
                series={[
                  {
                    data: distributionSeries(data.byStrategicRelevance, {
                      QUICK_WIN: 'Quick Win',
                      BEREICH: 'Bereich',
                      IGZ_WEIT: 'IGZ-weit'
                    }),
                    innerRadius: 40
                  }
                ]}
              />
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Card
          sx={{
            height: '100%',
            background: 'linear-gradient(145deg, #09243A 0%, #123D63 100%)',
            color: '#FFFFFF'
          }}
        >
          <CardContent sx={{ p: 2.75 }}>
            <Typography
              variant="overline"
              sx={{ color: '#8FCB94', fontWeight: 800, letterSpacing: '0.1em' }}
            >
              Empfohlene Reihenfolge
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, color: '#FFFFFF' }}>
              Arbeitslogik
            </Typography>
            <Stack spacing={1.25}>
              {['Rückfragen klären', 'Bewertungen ergänzen', 'Zieltermine bearbeiten'].map(
                (step, index) => (
                  <Stack key={step} direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1,
                        bgcolor: index === 0 ? 'secondary.main' : 'rgba(255,255,255,0.10)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {step}
                    </Typography>
                  </Stack>
                )
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const isPortfolioViewer = user?.role === Role.AI_CORE_TEAM || user?.role === Role.ADMINISTRATOR;

  return (
    <Box>
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
          Willkommen im IGZ AI Use Case Portal.
        </Typography>
      </Box>

      {isPortfolioViewer && <DecisionQueue />}

      {isPortfolioViewer && (
        <Typography variant="h5" sx={{ mb: 2.25 }}>
          Allgemeine Übersicht
        </Typography>
      )}
      <GeneralOverview />

      {isPortfolioViewer && <PortfolioInsights />}

      <Stack sx={{ mt: 2 }} />
    </Box>
  );
}
