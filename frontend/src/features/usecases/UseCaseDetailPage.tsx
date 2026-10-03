import { useRef, useState } from 'react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import EditIcon from '@mui/icons-material/EditOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHorizOutlined';
import RateReviewIcon from '@mui/icons-material/RateReviewOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFileOutlined';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import UploadIcon from '@mui/icons-material/UploadFileOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useCaseApi, UseCaseFormValues } from '../../api/useCaseApi';
import { departmentApi } from '../../api/departmentApi';
import { apiClient } from '../../api/client';
import {
  AI_SOLUTION_TYPE_LABELS,
  BENEFIT_TYPE_LABELS,
  DATA_CLASSIFICATION_LABELS,
  LEVEL_LABELS,
  REACH_LABELS,
  Role,
  UseCaseStatus
} from '../../types';
import { StatusChip } from '../../components/StatusChip';
import { ClarificationChip } from '../../components/ClarificationChip';
import { championApi } from '../../api/championApi';
import { UseCaseWizardDialog } from './UseCaseWizardDialog';
import { IdeaInput } from '../../api/authApi';
import { IdeaFields, emptyIdea } from '../ideas/IdeaFields';
import { StatusChangeDialog } from './StatusChangeDialog';
import { EvaluationDialog } from './EvaluationDialog';

function DetailField({
  label,
  value
}: {
  label: string;
  value?: string | number | string[] | null;
}) {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return null;
  }
  const display = Array.isArray(value) ? value.join(', ') : value;
  return (
    <Grid item xs={12} sm={6}>
      <Box sx={{ height: '100%', bgcolor: 'background.default', borderRadius: 2, p: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }}
        >
          {label}
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.75 }}>
          {display}
        </Typography>
      </Box>
    </Grid>
  );
}

export function UseCaseDetailPage({ employeeView = false }: { employeeView?: boolean }) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const { notify } = useNotification();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [ideaDraft, setIdeaDraft] = useState<IdeaInput>(emptyIdea);

  const useCaseQuery = useQuery({
    queryKey: ['use-case', id],
    queryFn: () => useCaseApi.get(id!),
    enabled: Boolean(id)
  });
  const commentsQuery = useQuery({
    queryKey: ['use-case', id, 'comments'],
    queryFn: () => useCaseApi.comments(id!),
    enabled: Boolean(id)
  });
  const evaluationsQuery = useQuery({
    queryKey: ['use-case', id, 'evaluations'],
    queryFn: () => useCaseApi.evaluations(id!),
    enabled: Boolean(id)
  });
  const historyQuery = useQuery({
    queryKey: ['use-case', id, 'history'],
    queryFn: () => useCaseApi.history(id!),
    enabled: Boolean(id)
  });
  const attachmentsQuery = useQuery({
    queryKey: ['use-case', id, 'attachments'],
    queryFn: () => useCaseApi.attachments(id!),
    enabled: Boolean(id)
  });

  const invalidateUseCase = () => {
    queryClient.invalidateQueries({ queryKey: ['use-case', id] });
    queryClient.invalidateQueries({ queryKey: ['my-ideas'] });
    queryClient.invalidateQueries({ queryKey: ['use-cases'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-portfolio'] });
  };

  const updateMutation = useMutation({
    mutationFn: (values: Partial<UseCaseFormValues>) => useCaseApi.update(id!, values),
    onSuccess: () => {
      setEditOpen(false);
      notify('Änderungen wurden gespeichert.', 'success');
      invalidateUseCase();
      queryClient.invalidateQueries({ queryKey: ['my-ideas'] });
    }
  });
  const statusMutation = useMutation({
    mutationFn: ({ toStatus, note }: { toStatus: UseCaseStatus; note?: string }) =>
      useCaseApi.changeStatus(id!, toStatus, note),
    onSuccess: () => {
      setStatusOpen(false);
      notify('Status wurde geändert.', 'success');
      invalidateUseCase();
      queryClient.invalidateQueries({ queryKey: ['use-case', id, 'history'] });
      queryClient.invalidateQueries({ queryKey: ['my-ideas'] });
    }
  });
  const commentMutation = useMutation({
    mutationFn: (text: string) => useCaseApi.addComment(id!, text),
    onSuccess: () => {
      setCommentText('');
      notify('Kommentar wurde hinzugefügt.', 'success');
      invalidateUseCase();
    }
  });
  const evaluationMutation = useMutation({
    mutationFn: (input: Parameters<typeof useCaseApi.addEvaluation>[1]) =>
      useCaseApi.addEvaluation(id!, input),
    onSuccess: () => {
      setEvalOpen(false);
      notify('Bewertung wurde gespeichert.', 'success');
      queryClient.invalidateQueries({ queryKey: ['use-case', id, 'evaluations'] });
    }
  });
  const uploadMutation = useMutation({
    mutationFn: (file: File) => useCaseApi.uploadAttachment(id!, file),
    onSuccess: () => {
      notify('Datei wurde hochgeladen.', 'success');
      queryClient.invalidateQueries({ queryKey: ['use-case', id, 'attachments'] });
    }
  });
  const summaryMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ summary: string }>(`/use-cases/${id}/ai/summarize`).then((r) => r.data),
    onSuccess: (data) => setAiSummary(data.summary)
  });

  const useCase = useCaseQuery.data;
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.list()
  });
  const canEvaluate = user && (user.role === Role.AI_CHAMPION || user.role === Role.AI_CORE_TEAM);
  const championsQuery = useQuery({
    queryKey: ['champions'],
    queryFn: championApi.list,
    enabled: !employeeView && editOpen
  });

  if (useCaseQuery.isError) {
    return (
      <Alert severity="error">
        Die Idee konnte nicht geladen werden oder Sie haben keinen Zugriff darauf.
      </Alert>
    );
  }
  if (!useCase) {
    return <Typography>Lädt…</Typography>;
  }

  return (
    <Box>
      {employeeView ? (
        <Button component={RouterLink} to="/meine-ideen" sx={{ mb: 2 }}>
          Zurück zu meinen Ideen
        </Button>
      ) : null}
      {employeeView &&
      useCase.status === UseCaseStatus.SUBMITTED &&
      (location.state as { submitted?: boolean } | null)?.submitted ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {(location.state as { demo?: boolean } | null)?.demo
            ? 'Ihre Demo-Idee wurde eingereicht und kann jetzt vom AI-Team geprüft werden.'
            : 'Ihre E-Mail-Adresse ist bestätigt. Ihre Idee wurde eingereicht und kann jetzt vom AI-Team geprüft werden.'}
        </Alert>
      ) : null}
      {useCase.status === UseCaseStatus.NEED_MORE_INFO ? (
        <Alert
          severity={useCase.clarificationAnsweredAt ? 'success' : 'warning'}
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" onClick={() => setTab(2)}>
              {employeeView && !useCase.clarificationAnsweredAt
                ? 'Antworten'
                : 'Kommentare ansehen'}
            </Button>
          }
        >
          <Typography fontWeight={600}>
            {useCase.clarificationAnsweredAt
              ? 'Antwort des Einreichers eingegangen.'
              : 'Antwort des Einreichers ausstehend.'}
          </Typography>
          {
            historyQuery.data?.find((entry) => entry.toStatus === UseCaseStatus.NEED_MORE_INFO)
              ?.note
          }
          <Typography variant="body2">
            {employeeView
              ? 'Antworten Sie unter „Kommentare“ und ergänzen Sie bei Bedarf Ihre Angaben. Reichen Sie die Idee anschließend erneut ein.'
              : useCase.clarificationAnsweredAt
                ? 'Bitte prüfen Sie die Antwort und klären Sie den nächsten Schritt mit dem Einreicher.'
                : 'Der Einreicher wurde um weitere Informationen gebeten.'}
          </Typography>
        </Alert>
      ) : null}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
          p: { xs: 2.5, md: 3.5 },
          mb: 2.5,
          boxShadow: '0 12px 30px rgba(18,61,99,0.07)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: '0 auto 0 0',
            width: 5,
            bgcolor: 'secondary.main'
          }
        }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', lg: 'center' }}
          spacing={2.5}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{ color: 'primary.light', fontWeight: 800, letterSpacing: '0.12em' }}
            >
              {employeeView ? 'Meine Idee' : 'Use Case Detail'}
            </Typography>
            <Typography variant="h4">{useCase.title}</Typography>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              alignItems="center"
              sx={{ mt: 1.5 }}
            >
              <StatusChip status={useCase.status} />
              <ClarificationChip useCase={useCase} />
              <Chip
                label={`AI Champion: ${useCase.assignedChampion?.name ?? 'Noch nicht zugeordnet'}`}
                variant="outlined"
                size="small"
              />
              <Chip label={useCase.department} variant="outlined" size="small" />
              <Chip label={`Einreicher: ${useCase.requestor}`} variant="outlined" size="small" />
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {!employeeView ? (
              <Button startIcon={<AutoAwesomeIcon />} onClick={() => summaryMutation.mutate()}>
                KI-Zusammenfassung
              </Button>
            ) : null}
            {useCase.canEdit ? (
              <Button
                startIcon={<EditIcon />}
                onClick={() => {
                  setIdeaDraft({
                    title: useCase.title,
                    department: useCase.department,
                    problemDescription: useCase.problemDescription,
                    solutionIdea: useCase.solutionIdea
                  });
                  setEditOpen(true);
                }}
              >
                Bearbeiten
              </Button>
            ) : null}
            {(useCase.allowedNextStatuses?.length ?? 0) > 0 && (
              <Button
                variant="contained"
                startIcon={<SwapHorizIcon />}
                disabled={statusMutation.isPending}
                onClick={() =>
                  employeeView
                    ? statusMutation.mutate({ toStatus: UseCaseStatus.SUBMITTED })
                    : setStatusOpen(true)
                }
              >
                {employeeView
                  ? useCase.status === UseCaseStatus.DRAFT
                    ? 'Idee einreichen'
                    : 'Erneut einreichen'
                  : 'Status ändern'}
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>

      {aiSummary && (
        <Card sx={{ mb: 2, bgcolor: 'rgba(67,168,94,0.08)', borderColor: 'rgba(67,168,94,0.28)' }}>
          <CardContent>
            <Typography variant="subtitle2" color="primary">
              KI-Zusammenfassung (Mock)
            </Typography>
            <Typography variant="body2">{aiSummary}</Typography>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab icon={<DescriptionOutlinedIcon />} iconPosition="start" label="Übersicht" />
        <Tab icon={<RateReviewIcon />} iconPosition="start" label="Bewertungen" />
        <Tab icon={<ChatBubbleOutlineIcon />} iconPosition="start" label="Kommentare" />
        <Tab icon={<HistoryOutlinedIcon />} iconPosition="start" label="Historie" />
        <Tab icon={<AttachFileIcon />} iconPosition="start" label="Anhänge" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Grid container spacing={2}>
              <DetailField label="Problembeschreibung" value={useCase.problemDescription} />
              <DetailField label="Aktueller Prozess" value={useCase.currentProcess} />
              <DetailField label="Pain Points" value={useCase.painPoints} />
              <DetailField label="Häufigkeit" value={useCase.frequency} />
              <DetailField label="Lösungsidee" value={useCase.solutionIdea} />
              <DetailField label="Datenquellen" value={useCase.dataSources} />
              <DetailField label="Erwartetes Ergebnis" value={useCase.expectedOutput} />
              <DetailField
                label="Reichweite"
                value={useCase.reach ? REACH_LABELS[useCase.reach] : null}
              />
              <DetailField label="Weitere Angaben zur Zielgruppe" value={useCase.targetGroup} />
              <DetailField label="Geschätzte Nutzerzahl" value={useCase.estimatedUsers} />
              <DetailField label="Nutzungshäufigkeit" value={useCase.usageFrequency} />
              <DetailField
                label="Nutzenart"
                value={useCase.benefitTypes?.map(
                  (t) => BENEFIT_TYPE_LABELS[t as keyof typeof BENEFIT_TYPE_LABELS]
                )}
              />
              <DetailField
                label="Geschätzter Effekt"
                value={useCase.estimatedEffect ? LEVEL_LABELS[useCase.estimatedEffect] : null}
              />
              <DetailField label="Nutzen" value={useCase.benefits} />
              <DetailField label="Geschätzte Zeitersparnis" value={useCase.estimatedTimeSavings} />
              <DetailField
                label="KI-Lösung"
                value={
                  useCase.aiSolutionType
                    ? `${AI_SOLUTION_TYPE_LABELS[useCase.aiSolutionType]}${
                        useCase.aiSolutionOtherText ? ` (${useCase.aiSolutionOtherText})` : ''
                      }`
                    : null
                }
              />
              <DetailField
                label="Umsetzungsaufwand"
                value={
                  useCase.implementationEffort ? LEVEL_LABELS[useCase.implementationEffort] : null
                }
              />
              <DetailField label="Abhängigkeiten" value={useCase.dependencies} />
              <DetailField
                label="Daten, Sicherheit und Compliance"
                value={useCase.dataClassifications?.map(
                  (c) => DATA_CLASSIFICATION_LABELS[c as keyof typeof DATA_CLASSIFICATION_LABELS]
                )}
              />
              <DetailField
                label="Besondere Risiken oder Anforderungen"
                value={useCase.riskAssessment}
              />
              <DetailField label="Weitere Sicherheitshinweise" value={useCase.securityNotes} />
              <DetailField label="Verantwortlich" value={useCase.responsible} />
              <DetailField label="Zieltermin / Review" value={useCase.targetDate} />
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card sx={{ p: { xs: 2, md: 2.5 } }}>
          {canEvaluate && (
            <Button startIcon={<RateReviewIcon />} onClick={() => setEvalOpen(true)} sx={{ mb: 2 }}>
              Neue Bewertung
            </Button>
          )}
          <Stack spacing={2}>
            {evaluationsQuery.data?.map((ev) => (
              <Card key={ev.id}>
                <CardContent>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <Chip label={`Nutzen: ${ev.businessValue}`} size="small" />
                    <Chip label={`Umsetzbarkeit: ${ev.feasibility}`} size="small" />
                    <Chip label={`Risiko: ${ev.risk}`} size="small" />
                    <Chip label={`Relevanz: ${ev.strategicRelevance}`} size="small" />
                  </Stack>
                  {ev.note && <Typography variant="body2">{ev.note}</Typography>}
                  <Typography variant="caption" color="text.secondary">
                    {ev.evaluator.name} · {new Date(ev.createdAt).toLocaleString('de-DE')}
                  </Typography>
                </CardContent>
              </Card>
            ))}
            {evaluationsQuery.data?.length === 0 && (
              <Typography color="text.secondary">Noch keine Bewertungen vorhanden.</Typography>
            )}
          </Stack>
        </Card>
      )}

      {tab === 2 && (
        <Card sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Kommentar hinzufügen"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button
              variant="contained"
              disabled={!commentText.trim() || commentMutation.isPending}
              onClick={() => commentMutation.mutate(commentText)}
            >
              Senden
            </Button>
          </Stack>
          <List>
            {commentsQuery.data?.map((c) => (
              <ListItem key={c.id} divider>
                <ListItemText
                  primary={c.text}
                  secondary={`${c.author.name} · ${new Date(c.createdAt).toLocaleString('de-DE')}`}
                />
              </ListItem>
            ))}
          </List>
        </Card>
      )}

      {tab === 3 && (
        <Card>
          <List disablePadding>
            {historyQuery.data?.map((h) => (
              <ListItem key={h.id} divider>
                <ListItemText
                  primary={`${h.fromStatus ?? '—'} → ${h.toStatus}`}
                  secondary={`${h.changedBy.name} · ${new Date(h.changedAt).toLocaleString('de-DE')}${
                    h.note ? ` · ${h.note}` : ''
                  }`}
                />
              </ListItem>
            ))}
          </List>
        </Card>
      )}

      {tab === 4 && (
        <Card sx={{ p: { xs: 2, md: 2.5 } }}>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMutation.mutate(file);
              e.target.value = '';
            }}
          />
          <Button
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ mb: 2 }}
          >
            Datei hochladen
          </Button>
          <List>
            {attachmentsQuery.data?.map((a) => (
              <ListItem
                key={a.id}
                divider
                secondaryAction={
                  <IconButton
                    aria-label={`${a.fileName} herunterladen`}
                    onClick={() => {
                      void useCaseApi.downloadAttachment(a.id, a.fileName).catch(() => undefined);
                    }}
                  >
                    <DownloadIcon />
                  </IconButton>
                }
              >
                <AttachFileIcon sx={{ mr: 1 }} />
                <ListItemText
                  primary={a.fileName}
                  secondary={`${(a.size / 1024).toFixed(1)} KB · ${new Date(a.uploadedAt).toLocaleString('de-DE')}`}
                />
              </ListItem>
            ))}
          </List>
        </Card>
      )}

      {employeeView ? (
        <Dialog
          open={editOpen}
          onClose={() => {
            if (!updateMutation.isPending) setEditOpen(false);
          }}
          fullWidth
          maxWidth="sm"
        >
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              updateMutation.mutate(ideaDraft);
            }}
          >
            <DialogTitle>Idee ergänzen</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 1 }}>
                <IdeaFields
                  value={ideaDraft}
                  onChange={setIdeaDraft}
                  disabled={updateMutation.isPending}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditOpen(false)} disabled={updateMutation.isPending}>
                Abbrechen
              </Button>
              <Button type="submit" variant="contained" disabled={updateMutation.isPending}>
                Änderungen speichern
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      ) : (
        <UseCaseWizardDialog
          open={editOpen}
          title="Use Case bearbeiten"
          initialValues={useCase}
          submitting={updateMutation.isPending}
          departments={departments}
          champions={championsQuery.data}
          championsLoading={championsQuery.isPending}
          championsUnavailable={championsQuery.isError}
          onClose={() => setEditOpen(false)}
          onSubmit={(values) => updateMutation.mutate(values)}
        />
      )}
      <StatusChangeDialog
        open={statusOpen}
        allowedNextStatuses={useCase.allowedNextStatuses ?? []}
        submitting={statusMutation.isPending}
        onClose={() => setStatusOpen(false)}
        onConfirm={(toStatus, note) => statusMutation.mutate({ toStatus, note })}
      />
      <EvaluationDialog
        open={evalOpen}
        submitting={evaluationMutation.isPending}
        onClose={() => setEvalOpen(false)}
        onSubmit={(input) => evaluationMutation.mutate(input)}
      />
    </Box>
  );
}
