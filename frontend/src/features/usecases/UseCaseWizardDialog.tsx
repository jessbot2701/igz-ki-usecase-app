import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Step,
  StepLabel,
  Stepper,
  Typography
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import { IllustrationKey } from '../../assets/illustrations/manifest';
import { IllustrationPanel } from '../../components/IllustrationPanel';
import pptAbstractShapes from '../../assets/illustrations/ppt-abstract-shapes.jpg';
import pptNetworkCool from '../../assets/illustrations/ppt-network-cool.jpg';
import pptNetworkWarm from '../../assets/illustrations/ppt-network-warm.jpg';
import {
  AiSolutionType,
  AI_SOLUTION_TYPE_LABELS,
  BENEFIT_TYPE_LABELS,
  DATA_CLASSIFICATION_LABELS,
  LEVEL_LABELS,
  REACH_LABELS,
  UseCase
} from '../../types';
import {
  buildDefaultValues,
  renderMultiSelectField,
  renderSelectField,
  renderTextField,
  STEP_FIELDS,
  useCaseFormSchema,
  UseCaseFormData
} from './UseCaseForm';

interface StepDefinition {
  title: string;
  illustrationKey: IllustrationKey;
  icon: JSX.Element;
  imageSrc?: string;
}

const STEP_DEFINITIONS: StepDefinition[] = [
  { title: 'Basisinformationen', illustrationKey: 'basics', icon: <InfoOutlinedIcon />, imageSrc: pptAbstractShapes },
  { title: 'Ausgangssituation & Problem', illustrationKey: 'problem', icon: <ReportProblemOutlinedIcon />, imageSrc: pptNetworkWarm },
  { title: 'Lösungsidee & Zielgruppe', illustrationKey: 'solution', icon: <LightbulbOutlinedIcon />, imageSrc: pptAbstractShapes },
  { title: 'Nutzen & Aufwand', illustrationKey: 'value', icon: <TrendingUpOutlinedIcon /> },
  { title: 'Daten & Sicherheit', illustrationKey: 'security', icon: <SecurityOutlinedIcon />, imageSrc: pptNetworkCool },
  { title: 'Entscheidung & Review', illustrationKey: 'decision', icon: <FactCheckOutlinedIcon />, imageSrc: pptAbstractShapes }
];

interface UseCaseWizardDialogProps {
  open: boolean;
  title: string;
  initialValues?: Partial<UseCase>;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: UseCaseFormData) => void;
  departments?: { id: string; name: string; active: boolean }[];
}

function ReviewSummary({ values }: { values: UseCaseFormData }) {
  const rows: [string, string][] = [
    ['Titel', values.title],
    ['Einreicher', values.requestor],
    ['Bereich', values.department],
    ['Problembeschreibung', values.problemDescription],
    ['Lösungsidee', values.solutionIdea],
    ['Reichweite', values.reach ? REACH_LABELS[values.reach] : '–'],
    ['Nutzenart', values.benefitTypes?.length ? values.benefitTypes.map((v) => BENEFIT_TYPE_LABELS[v]).join(', ') : '–'],
    ['Geschätzter Effekt', values.estimatedEffect ? LEVEL_LABELS[values.estimatedEffect] : '–'],
    [
      'KI-Lösung',
      values.aiSolutionType
        ? `${AI_SOLUTION_TYPE_LABELS[values.aiSolutionType]}${
            values.aiSolutionType === AiSolutionType.SONSTIGES && values.aiSolutionOtherText
              ? ` (${values.aiSolutionOtherText})`
              : ''
          }`
        : '–'
    ],
    ['Umsetzungsaufwand', values.implementationEffort ? LEVEL_LABELS[values.implementationEffort] : '–'],
    [
      'Daten, Sicherheit und Compliance',
      values.dataClassifications?.length
        ? values.dataClassifications.map((v) => DATA_CLASSIFICATION_LABELS[v]).join(', ')
        : '–'
    ],
    ['Verantwortlich', values.responsible || '–'],
    ['Zieltermin / Review', values.targetDate || '–']
  ];

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Bitte prüfen Sie Ihre Angaben vor dem Speichern:
      </Typography>
      <Grid container spacing={1.5}>
        {rows.map(([label, value]) => (
          <Grid item xs={12} sm={6} key={label}>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {value}
            </Typography>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export function UseCaseWizardDialog({
  open,
  title,
  initialValues,
  submitting,
  onClose,
  onSubmit,
  departments = []
}: UseCaseWizardDialogProps) {
  const departmentOptions = Object.fromEntries(departments.map((department) => [department.name, department.name]));
  const [activeStep, setActiveStep] = useState(0);
  const {
    control,
    handleSubmit,
    trigger,
    watch,
    reset,
    formState: { errors }
  } = useForm<UseCaseFormData>({
    resolver: zodResolver(useCaseFormSchema),
    defaultValues: buildDefaultValues(initialValues)
  });

  const aiSolutionType = watch('aiSolutionType');
  const isLastStep = activeStep === STEP_DEFINITIONS.length - 1;

  const handleClose = () => {
    setActiveStep(0);
    reset(buildDefaultValues(initialValues));
    onClose();
  };

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[activeStep]);
    if (valid) {
      setActiveStep((s) => Math.min(s + 1, STEP_DEFINITIONS.length - 1));
    }
  };

  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
          {STEP_DEFINITIONS.map((step) => (
            <Step key={step.title}>
              <StepLabel>{step.title}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <IllustrationPanel
          illustrationKey={STEP_DEFINITIONS[activeStep].illustrationKey}
          icon={STEP_DEFINITIONS[activeStep].icon}
          imageSrc={STEP_DEFINITIONS[activeStep].imageSrc}
        />

        <form id="use-case-wizard-form" onSubmit={handleSubmit(onSubmit)}>
          {activeStep === 0 && (
            <Grid container spacing={2}>
              {renderTextField(control, errors, 'title', 'Titel des Use Cases', { required: true, grid: 12 })}
              {renderTextField(control, errors, 'requestor', 'Ansprechpartner / Einreicher', { required: true })}
              {departments.length > 0
                ? renderSelectField(control, errors, 'department', 'Bereich / Abteilung', departmentOptions)
                : renderTextField(control, errors, 'department', 'Bereich / Abteilung', { required: true })}
              {renderTextField(control, errors, 'aiChampion', 'AI Champion')}
            </Grid>
          )}

          {activeStep === 1 && (
            <Grid container spacing={2}>
              {renderTextField(
                control,
                errors,
                'problemDescription',
                'Beschreibung des heutigen Ablaufs / Problems',
                { required: true, multiline: true, grid: 12 }
              )}
              {renderTextField(control, errors, 'currentProcess', 'Aktueller Prozess', { multiline: true })}
              {renderTextField(control, errors, 'painPoints', 'Pain Points', { multiline: true })}
              {renderTextField(control, errors, 'frequency', 'Häufigkeit oder Aufwand des Problems')}
            </Grid>
          )}

          {activeStep === 2 && (
            <Grid container spacing={2}>
              {renderTextField(control, errors, 'solutionIdea', 'Kurzbeschreibung der AI-Lösung', {
                required: true,
                multiline: true,
                grid: 12
              })}
              {renderTextField(control, errors, 'dataSources', 'Eingaben / Datenquellen')}
              {renderTextField(control, errors, 'expectedOutput', 'Ergebnis / Output')}
              {renderSelectField(control, errors, 'reach', 'Reichweite', REACH_LABELS)}
              {renderTextField(control, errors, 'estimatedUsers', 'Geschätzte Anzahl Nutzer', { type: 'number' })}
              {renderTextField(control, errors, 'usageFrequency', 'Nutzungshäufigkeit')}
              {renderTextField(control, errors, 'targetGroup', 'Weitere Angaben zur Zielgruppe')}
            </Grid>
          )}

          {activeStep === 3 && (
            <Grid container spacing={2}>
              {renderMultiSelectField(control, errors, 'benefitTypes', 'Nutzenart', BENEFIT_TYPE_LABELS)}
              {renderSelectField(control, errors, 'estimatedEffect', 'Geschätzter Effekt', LEVEL_LABELS)}
              {renderTextField(control, errors, 'estimatedTimeSavings', 'Geschätzte Zeitersparnis')}
              {renderTextField(control, errors, 'benefits', 'Nutzen kurz erläutern', { multiline: true, grid: 12 })}
              {renderSelectField(control, errors, 'aiSolutionType', 'KI-Lösung', AI_SOLUTION_TYPE_LABELS)}
              {aiSolutionType === AiSolutionType.SONSTIGES &&
                renderTextField(control, errors, 'aiSolutionOtherText', 'KI-Lösung: sonstige, bitte benennen')}
              {renderSelectField(control, errors, 'implementationEffort', 'Umsetzungsaufwand', LEVEL_LABELS)}
              {renderTextField(control, errors, 'dependencies', 'Abhängigkeiten / Voraussetzungen')}
            </Grid>
          )}

          {activeStep === 4 && (
            <Grid container spacing={2}>
              {renderMultiSelectField(
                control,
                errors,
                'dataClassifications',
                'Daten, Sicherheit und Compliance',
                DATA_CLASSIFICATION_LABELS,
                12
              )}
              {renderTextField(control, errors, 'riskAssessment', 'Besondere Risiken oder Anforderungen', {
                multiline: true,
                grid: 12
              })}
              {renderTextField(control, errors, 'securityNotes', 'Weitere Sicherheitshinweise', {
                multiline: true,
                grid: 12
              })}
            </Grid>
          )}

          {activeStep === 5 && (
            <>
              <Grid container spacing={2}>
                {renderTextField(control, errors, 'responsible', 'Verantwortlich')}
                {renderTextField(control, errors, 'targetDate', 'Zieltermin / Review')}
              </Grid>
              <ReviewSummary values={watch()} />
            </>
          )}
        </form>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={handleBack} disabled={activeStep === 0}>
          Zurück
        </Button>
        {isLastStep ? (
          <Button type="submit" form="use-case-wizard-form" variant="contained" disabled={submitting}>
            Speichern
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained">
            Weiter
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
