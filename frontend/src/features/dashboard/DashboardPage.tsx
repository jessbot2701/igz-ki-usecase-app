import { useQuery } from '@tanstack/react-query';
import { Box, Card, CardContent, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../api/useCaseApi';
import { useAuth } from '../../context/AuthContext';
import {
  AI_SOLUTION_TYPE_LABELS,
  LEVEL_LABELS,
  Role,
  STATUS_LABELS,
  UseCaseStatus
} from '../../types';
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
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: dashboardApi.stats });

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {KPI_STATUSES.map((kpi) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={kpi.label}>
            <Card
              onClick={() => navigate(kpi.status ? `/use-cases?status=${kpi.status}` : '/use-cases')}
              sx={{ cursor: 'pointer', height: '100%' }}
            >
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {kpi.label}
                </Typography>
                {isLoading || !data ? (
                  <Skeleton width={60} height={40} />
                ) : (
                  <Typography variant="h4">
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
          <Card>
            <CardContent>
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
          <Card>
            <CardContent>
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
                  series={[{ data: Object.values(data.byStatus), color: '#4338CA' }]}
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
function PortfolioOverview() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-portfolio'], queryFn: dashboardApi.portfolio });

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Portfolio-Überblick
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'warning.main', height: '100%' }}>
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
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'secondary.main', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Reichweite gesamt
              </Typography>
              {isLoading || !data ? (
                <Skeleton width={60} height={40} />
              ) : (
                <Typography variant="h4">{data.totalEstimatedUsers.toLocaleString('de-DE')}</Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Summe geschätzte Nutzer (aktive Use Cases)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderTop: '4px solid', borderColor: 'primary.main', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Ø Durchlaufzeit bis Entscheidung
              </Typography>
              {isLoading || !data ? (
                <Skeleton width={60} height={40} />
              ) : (
                <Typography variant="h4">
                  {data.avgDecisionDays !== null ? `${Math.round(data.avgDecisionDays)} Tage` : '–'}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Einreichung bis Genehmigung/Ablehnung
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Use Cases pro Abteilung
              </Typography>
              {!isLoading && data && (
                <BarChart
                  height={260}
                  xAxis={[{ scaleType: 'band', data: Object.keys(data.byDepartment) }]}
                  series={[{ data: Object.values(data.byDepartment), color: '#6D28D9' }]}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Umsetzungsaufwand
              </Typography>
              {!isLoading && data && (
                <PieChart
                  height={260}
                  series={[{ data: distributionSeries(data.byEffort, LEVEL_LABELS), innerRadius: 40 }]}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Risiko (aus Bewertungen)
              </Typography>
              {!isLoading && data && (
                <PieChart
                  height={260}
                  series={[{ data: distributionSeries(data.byRisk, LEVEL_LABELS), innerRadius: 40 }]}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Strategische Relevanz (aus Bewertungen)
              </Typography>
              {!isLoading && data && (
                <PieChart
                  height={260}
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
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Verteilung KI-Lösungstyp
              </Typography>
              {!isLoading && data && (
                <BarChart
                  height={260}
                  layout="horizontal"
                  yAxis={[
                    {
                      scaleType: 'band',
                      data: Object.keys(data.byAiSolutionType).map(
                        (k) => AI_SOLUTION_TYPE_LABELS[k as keyof typeof AI_SOLUTION_TYPE_LABELS] ?? k
                      )
                    }
                  ]}
                  series={[{ data: Object.values(data.byAiSolutionType), color: '#0EA5A4' }]}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const isPortfolioViewer = user?.role === Role.AI_CORE_TEAM || user?.role === Role.ADMINISTRATOR;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {isPortfolioViewer && <PortfolioOverview />}

      {isPortfolioViewer && (
        <Typography variant="h5" sx={{ mb: 2 }}>
          Allgemeine Übersicht
        </Typography>
      )}
      <GeneralOverview />

      <Stack sx={{ mt: 2 }} />
    </Box>
  );
}
