import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import AssignmentLateOutlinedIcon from '@mui/icons-material/AssignmentLateOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../api/useCaseApi';
import { useAuth } from '../../context/AuthContext';
import { PortfolioStats, Role, STATUS_LABELS, UseCaseStatus } from '../../types';
import { StatusChip } from '../../components/StatusChip';
import { statusColors } from '../../theme/theme';

const KPI_STATUSES: { label: string; status?: UseCaseStatus }[] = [
  { label: 'Gesamt' },
  { label: 'Neu', status: UseCaseStatus.SUBMITTED },
  { label: 'In Prüfung', status: UseCaseStatus.IN_REVIEW },
  { label: 'Pilot', status: UseCaseStatus.PILOT },
  { label: 'Umgesetzt', status: UseCaseStatus.IMPLEMENTED },
  { label: 'Abgelehnt', status: UseCaseStatus.REJECTED }
];

const PIPELINE_STATUSES: UseCaseStatus[] = [
  UseCaseStatus.DRAFT,
  UseCaseStatus.SUBMITTED,
  UseCaseStatus.IN_REVIEW,
  UseCaseStatus.APPROVED,
  UseCaseStatus.PILOT,
  UseCaseStatus.IMPLEMENTED
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

      <Card>
        <CardContent sx={{ p: 2.75 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 2.5 }}>
            <Box>
              <Typography variant="h6">Workflow-Pipeline</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                Wo stehen die Use Cases gerade und wo sammelt sich Arbeit?
              </Typography>
            </Box>
            <Chip label={data ? `${data.total} Use Cases gesamt` : 'Lädt…'} size="small" variant="outlined" />
          </Stack>
          <Stack spacing={1.6}>
            {PIPELINE_STATUSES.map((pipelineStatus) => {
              const count = data?.byStatus[pipelineStatus] ?? 0;
              const progress = data?.total ? Math.round((count / data.total) * 100) : 0;
              return (
                <Box
                  key={pipelineStatus}
                  onClick={() => navigate(`/use-cases?status=${pipelineStatus}`)}
                  sx={{ cursor: 'pointer', '&:hover .pipeline-label': { color: 'primary.main' } }}
                >
                  <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 0.55 }}>
                    <Typography className="pipeline-label" variant="body2" sx={{ fontWeight: 700, transition: 'color 160ms ease' }}>
                      {STATUS_LABELS[pipelineStatus]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {isLoading ? '–' : count}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant={isLoading ? 'indeterminate' : 'determinate'}
                    value={progress}
                    sx={{
                      height: 9,
                      borderRadius: 5,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': { bgcolor: statusColors[pipelineStatus], borderRadius: 5 }
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

// Portfolio-level analytics for the AI Core Team / Administrator monitoring view
const ATTENTION_REASON_LABELS = {
  NEED_MORE_INFO: 'Rückfrage beantworten',
  OVERDUE_TARGET_DATE: 'Zieltermin überschritten',
  MISSING_EVALUATION: 'Bewertung ausstehend'
};

const LEVEL_DISPLAY: Record<string, string> = {
  NIEDRIG: 'Niedrig',
  MITTEL: 'Mittel',
  HOCH: 'Hoch'
};

const RISK_DISPLAY: Record<string, string> = {
  NIEDRIG: 'Niedrig',
  MITTEL: 'Mittel',
  HOCH: 'Hoch'
};

const PRIORITY_DISPLAY = {
  HIGH: { label: 'Hoch', color: 'error' as const, accent: 'error.main' },
  MEDIUM: { label: 'Mittel', color: 'warning' as const, accent: 'warning.main' },
  LOW: { label: 'Niedrig', color: 'default' as const, accent: 'divider' }
};

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-');
  return new Date(Number(year), Number(monthNumber) - 1, 1).toLocaleDateString('de-DE', {
    month: 'short',
    year: '2-digit'
  });
}

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

function TopUseCases({ data, isLoading }: { data?: PortfolioStats; isLoading: boolean }) {
  const navigate = useNavigate();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Box sx={{ px: 2.75, py: 2.25, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Top-Use-Cases</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            Priorisierte Fälle mit Nutzen, Aufwand, Risiko und nächster Aktion.
          </Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 430 }}>
          <Table stickyHeader size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>Priorität / Use Case</span>
                    <Tooltip title="Die Priorität wird aus Workflow-Status, erwartetem Effekt, Aufwand und Risiko abgeleitet.">
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </Tooltip>
                  </Stack>
                </TableCell>
                <TableCell>Erwarteter Nutzen</TableCell>
                <TableCell>Aufwand</TableCell>
                <TableCell>Risiko</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Nächste Aktion</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={6}><Skeleton height={180} /></TableCell></TableRow>
              )}
              {!isLoading && data?.topUseCases?.map((useCase) => (
                <TableRow
                  key={useCase.id}
                  hover
                  onClick={() => navigate(`/use-cases/${useCase.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.25} alignItems="flex-start">
                      <Box sx={{ width: 4, minWidth: 4, height: 42, borderRadius: 2, bgcolor: PRIORITY_DISPLAY[useCase.priority].accent }} />
                      <Box>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{useCase.title}</Typography>
                          <Tooltip
                            title={`${PRIORITY_DISPLAY[useCase.priority].label}: Score ${useCase.priorityScore}. Je höher der Score, desto dringlicher sollte der Use Case bearbeitet werden.`}
                          >
                            <Chip size="small" color={PRIORITY_DISPLAY[useCase.priority].color} label={PRIORITY_DISPLAY[useCase.priority].label} />
                          </Tooltip>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">{useCase.department}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 230 }}>
                    <Typography variant="body2" noWrap title={useCase.expectedBenefit ?? undefined}>
                      {useCase.expectedBenefit || 'Noch nicht beschrieben'}
                    </Typography>
                  </TableCell>
                  <TableCell>{LEVEL_DISPLAY[useCase.effort ?? ''] ?? '–'}</TableCell>
                  <TableCell>{RISK_DISPLAY[useCase.risk ?? ''] ?? '–'}</TableCell>
                  <TableCell><StatusChip status={useCase.status} /></TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={<ArrowForwardOutlinedIcon />}
                      sx={{ width: 190, minWidth: 190, minHeight: 40, justifyContent: 'space-between', whiteSpace: 'nowrap' }}
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/use-cases/${useCase.id}`);
                      }}
                    >
                      {useCase.nextAction}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && data?.topUseCases && data.topUseCases.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Keine Use Cases vorhanden.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

function DecisionDuration({ data, isLoading }: { data?: PortfolioStats; isLoading: boolean }) {
  const trend = data?.decisionDuration?.trend ?? [];
  const maxDays = Math.max(...trend.map((point) => point.averageDays), 1);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.75 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <TimerOutlinedIcon color="primary" />
          <Typography variant="h6">Entscheidungsdauer</Typography>
          <Chip size="small" label={`Zielwert ${data?.decisionDuration?.targetDays ?? 10} Tage`} variant="outlined" />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Durchschnitt von „Eingereicht“ bis „Genehmigt“ oder „Abgelehnt“.
        </Typography>
        <Typography variant="h3" color="primary.main" sx={{ mt: 2, fontWeight: 800 }}>
          {isLoading || !data?.decisionDuration || data.decisionDuration.averageDays === null
            ? '–'
            : `${data.decisionDuration.averageDays.toFixed(1)} Tage`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {isLoading || !data?.decisionDuration
            ? 'Entscheidungsdaten werden geladen'
            : `${data.decisionDuration.decidedCount} entschiedene Use Cases`}
        </Typography>
        {trend.length > 0 ? (
          <Stack spacing={1.25} sx={{ mt: 3 }}>
            {trend.map((point) => (
              <Box key={point.month}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{formatMonth(point.month)}</Typography>
                  <Typography variant="caption" color="text.secondary">{point.averageDays.toFixed(1)} Tage · {point.decidedCount} Fälle</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(point.averageDays / maxDays) * 100}
                  sx={{ height: 7, borderRadius: 4, '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                />
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Noch keine abgeschlossenen Entscheidungen vorhanden.
          </Typography>
        )}
        {data?.decisionDuration?.averageDays !== null && data?.decisionDuration?.averageDays !== undefined && (
          <Typography variant="caption" color={data.decisionDuration.averageDays <= data.decisionDuration.targetDays ? 'success.main' : 'warning.main'} sx={{ display: 'block', mt: 0.5, fontWeight: 700 }}>
            {data.decisionDuration.averageDays <= data.decisionDuration.targetDays ? 'Im Zielkorridor' : 'Über dem Zielwert'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function DepartmentOverview({ data, isLoading }: { data?: PortfolioStats; isLoading: boolean }) {
  const departments = data?.departmentOverview ?? [];
  const maxWorkload = Math.max(...departments.map((item) => item.openWorkload), 1);

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Box sx={{ px: 2.75, py: 2.25, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BusinessOutlinedIcon color="primary" />
            <Box>
              <Typography variant="h6">Bereichsübersicht</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                Einreichungen und offene Arbeitslast je Abteilung.
              </Typography>
            </Box>
          </Stack>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bereich</TableCell>
                <TableCell align="right">Gesamt</TableCell>
                <TableCell align="right">Offene Arbeitslast</TableCell>
                <TableCell align="right">Überfällig</TableCell>
                <TableCell align="right">Ohne Verantwortlichen</TableCell>
                <TableCell sx={{ width: '34%' }}>Auslastung</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6}><Skeleton height={120} /></TableCell></TableRow>}
              {!isLoading && departments.map((item) => (
                <TableRow key={item.department}>
                  <TableCell sx={{ fontWeight: 700 }}>{item.department}</TableCell>
                  <TableCell align="right">{item.total}</TableCell>
                  <TableCell align="right">{item.openWorkload}</TableCell>
                  <TableCell align="right">{item.overdueTargetDates || '–'}</TableCell>
                  <TableCell align="right">{item.missingResponsible || '–'}</TableCell>
                  <TableCell>
                    <LinearProgress
                      variant="determinate"
                      value={(item.openWorkload / maxWorkload) * 100}
                      sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

function PortfolioAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-portfolio'],
    queryFn: dashboardApi.portfolio
  });

  return (
    <Box sx={{ mb: 4.5 }}>
      <TopUseCases data={data} isLoading={isLoading} />
      <DepartmentOverview data={data} isLoading={isLoading} />
      <Box sx={{ mt: 2 }}>
        <DecisionDuration data={data} isLoading={isLoading} />
      </Box>
    </Box>
  );
}


export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPortfolioViewer = user?.role === Role.AI_CORE_TEAM || user?.role === Role.ADMINISTRATOR;
  const intro = user?.role === Role.AI_CHAMPION
    ? 'Bewertungen, Rückfragen und nächste Entscheidungen im Blick behalten.'
    : user?.role === Role.AI_CORE_TEAM || user?.role === Role.ADMINISTRATOR
      ? 'Portfolio priorisieren, Entscheidungen treffen und Umsetzung steuern.'
      : 'Eigene AI-Ideen einreichen und den Fortschritt verfolgen.';

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3.5 }}>
        <Box>
          <Typography variant="h4">Dashboard</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>{intro}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => navigate('/use-cases?create=1')}>
          Use Case anlegen
        </Button>
      </Stack>

      {isPortfolioViewer && <DecisionQueue />}

      {isPortfolioViewer && <PortfolioAnalytics />}

      {isPortfolioViewer && (
        <Typography variant="h5" sx={{ mb: 2.25 }}>
          Allgemeine Übersicht
        </Typography>
      )}
      <GeneralOverview />

      <Stack sx={{ mt: 2 }} />
    </Box>
  );
}
