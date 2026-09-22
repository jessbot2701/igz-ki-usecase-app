import { Control, Controller, FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Grid, MenuItem, TextField } from '@mui/material';
import {
  AiSolutionType,
  AI_SOLUTION_TYPE_LABELS,
  BenefitType,
  BENEFIT_TYPE_LABELS,
  DataClassification,
  DATA_CLASSIFICATION_LABELS,
  Level,
  LEVEL_LABELS,
  Reach,
  REACH_LABELS,
  UseCase
} from '../../types';

// Mirrors the backend's useCaseInputSchema; kept as a small duplicated schema per
// architecture decision (two independently deployable packages, no shared package).
// Field set and labels are aligned 1:1 with AI_Vorlage_UseCaseSteckbrief_MSi.docx.
export const useCaseFormSchema = z.object({
  title: z.string().min(3, 'Mindestens 3 Zeichen').max(200),
  requestor: z.string().min(2, 'Pflichtfeld'),
  department: z.string().min(2, 'Pflichtfeld'),
  aiChampion: z.string().optional(),
  problemDescription: z.string().min(10, 'Bitte ausführlicher beschreiben'),
  currentProcess: z.string().optional(),
  painPoints: z.string().optional(),
  frequency: z.string().optional(),
  solutionIdea: z.string().min(10, 'Bitte ausführlicher beschreiben'),
  dataSources: z.string().optional(),
  expectedOutput: z.string().optional(),
  targetGroup: z.string().optional(),
  reach: z.nativeEnum(Reach).optional(),
  estimatedUsers: z.coerce.number().int().nonnegative().optional(),
  usageFrequency: z.string().optional(),
  benefits: z.string().optional(),
  benefitTypes: z.array(z.nativeEnum(BenefitType)).optional(),
  estimatedEffect: z.nativeEnum(Level).optional(),
  estimatedTimeSavings: z.string().optional(),
  businessValueNote: z.string().optional(),
  aiSolutionType: z.nativeEnum(AiSolutionType).optional(),
  aiSolutionOtherText: z.string().optional(),
  implementationEffort: z.nativeEnum(Level).optional(),
  dependencies: z.string().optional(),
  dataClassifications: z.array(z.nativeEnum(DataClassification)).optional(),
  riskAssessment: z.string().optional(),
  securityNotes: z.string().optional(),
  responsible: z.string().optional(),
  targetDate: z.string().optional()
});

export type UseCaseFormData = z.infer<typeof useCaseFormSchema>;

export function buildDefaultValues(defaultValues?: Partial<UseCase>): UseCaseFormData {
  return {
    title: defaultValues?.title ?? '',
    requestor: defaultValues?.requestor ?? '',
    department: defaultValues?.department ?? '',
    aiChampion: defaultValues?.aiChampion ?? '',
    problemDescription: defaultValues?.problemDescription ?? '',
    currentProcess: defaultValues?.currentProcess ?? '',
    painPoints: defaultValues?.painPoints ?? '',
    frequency: defaultValues?.frequency ?? '',
    solutionIdea: defaultValues?.solutionIdea ?? '',
    dataSources: defaultValues?.dataSources ?? '',
    expectedOutput: defaultValues?.expectedOutput ?? '',
    targetGroup: defaultValues?.targetGroup ?? '',
    reach: defaultValues?.reach ?? undefined,
    estimatedUsers: defaultValues?.estimatedUsers ?? undefined,
    usageFrequency: defaultValues?.usageFrequency ?? '',
    benefits: defaultValues?.benefits ?? '',
    benefitTypes: defaultValues?.benefitTypes ?? [],
    estimatedEffect: defaultValues?.estimatedEffect ?? undefined,
    estimatedTimeSavings: defaultValues?.estimatedTimeSavings ?? '',
    businessValueNote: defaultValues?.businessValueNote ?? '',
    aiSolutionType: defaultValues?.aiSolutionType ?? undefined,
    aiSolutionOtherText: defaultValues?.aiSolutionOtherText ?? '',
    implementationEffort: defaultValues?.implementationEffort ?? undefined,
    dependencies: defaultValues?.dependencies ?? '',
    dataClassifications: defaultValues?.dataClassifications ?? [],
    riskAssessment: defaultValues?.riskAssessment ?? '',
    securityNotes: defaultValues?.securityNotes ?? '',
    responsible: defaultValues?.responsible ?? '',
    targetDate: defaultValues?.targetDate ?? ''
  };
}

type FieldName = keyof UseCaseFormData;
type FormControl = Control<UseCaseFormData>;
type FormErrors = FieldErrors<UseCaseFormData>;

// Shared field renderers — parameterized (not closures) so both the single-page
// UseCaseForm and the step-by-step UseCaseWizardDialog can reuse the exact same
// field definitions without duplicating validation/label logic.
export function renderTextField(
  control: FormControl,
  errors: FormErrors,
  name: FieldName,
  label: string,
  options?: { required?: boolean; multiline?: boolean; grid?: number; type?: string }
) {
  return (
    <Grid item xs={12} sm={options?.grid ?? 6} key={name}>
      <Controller
        name={name}
        control={control}
        render={({ field: rhfField }) => (
          <TextField
            {...rhfField}
            value={rhfField.value ?? ''}
            label={label}
            fullWidth
            required={options?.required}
            multiline={options?.multiline}
            minRows={options?.multiline ? 3 : undefined}
            type={options?.type ?? 'text'}
            error={Boolean(errors[name])}
            helperText={errors[name]?.message as string | undefined}
          />
        )}
      />
    </Grid>
  );
}

export function renderSelectField(
  control: FormControl,
  _errors: FormErrors,
  name: FieldName,
  label: string,
  options: Record<string, string>,
  grid = 6
) {
  return (
    <Grid item xs={12} sm={grid} key={name}>
      <Controller
        name={name}
        control={control}
        render={({ field: rhfField }) => (
          <TextField {...rhfField} value={rhfField.value ?? ''} select label={label} fullWidth>
            <MenuItem value="">–</MenuItem>
            {Object.entries(options).map(([value, optionLabel]) => (
              <MenuItem key={value} value={value}>
                {optionLabel}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
    </Grid>
  );
}

export function renderMultiSelectField(
  control: FormControl,
  _errors: FormErrors,
  name: FieldName,
  label: string,
  options: Record<string, string>,
  grid = 6
) {
  return (
    <Grid item xs={12} sm={grid} key={name}>
      <Controller
        name={name}
        control={control}
        render={({ field: rhfField }) => (
          <TextField
            {...rhfField}
            value={rhfField.value ?? []}
            select
            SelectProps={{ multiple: true }}
            label={label}
            fullWidth
          >
            {Object.entries(options).map(([value, optionLabel]) => (
              <MenuItem key={value} value={value}>
                {optionLabel}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
    </Grid>
  );
}

// One group per Steckbrief section — drives both the wizard's steps and, via
// STEP_FIELDS, react-hook-form's per-step `trigger()` validation gate.
export const STEP_FIELDS: FieldName[][] = [
  ['title', 'requestor', 'department', 'aiChampion'],
  ['problemDescription', 'currentProcess', 'painPoints', 'frequency'],
  ['solutionIdea', 'dataSources', 'expectedOutput', 'reach', 'estimatedUsers', 'usageFrequency', 'targetGroup'],
  [
    'benefitTypes',
    'estimatedEffect',
    'estimatedTimeSavings',
    'benefits',
    'aiSolutionType',
    'aiSolutionOtherText',
    'implementationEffort',
    'dependencies'
  ],
  ['dataClassifications', 'riskAssessment', 'securityNotes'],
  ['responsible', 'targetDate']
];

interface UseCaseFormProps {
  formId: string;
  defaultValues?: Partial<UseCase>;
  onSubmit: (values: UseCaseFormData) => void;
}

export function UseCaseForm({ formId, defaultValues, onSubmit }: UseCaseFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<UseCaseFormData>({
    resolver: zodResolver(useCaseFormSchema),
    defaultValues: buildDefaultValues(defaultValues)
  });

  const aiSolutionType = watch('aiSolutionType');

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        {/* 1. Basisinformationen */}
        {renderTextField(control, errors, 'title', 'Titel des Use Cases', { required: true, grid: 12 })}
        {renderTextField(control, errors, 'requestor', 'Ansprechpartner / Einreicher', { required: true })}
        {renderTextField(control, errors, 'department', 'Bereich / Abteilung', { required: true })}
        {renderTextField(control, errors, 'aiChampion', 'AI Champion')}

        {/* 2. Ausgangssituation und Problem */}
        {renderTextField(control, errors, 'problemDescription', 'Beschreibung des heutigen Ablaufs / Problems', {
          required: true,
          multiline: true,
          grid: 12
        })}
        {renderTextField(control, errors, 'currentProcess', 'Aktueller Prozess', { multiline: true })}
        {renderTextField(control, errors, 'painPoints', 'Pain Points', { multiline: true })}
        {renderTextField(control, errors, 'frequency', 'Häufigkeit oder Aufwand des Problems')}

        {/* 3. Lösungsidee */}
        {renderTextField(control, errors, 'solutionIdea', 'Kurzbeschreibung der AI-Lösung', {
          required: true,
          multiline: true,
          grid: 12
        })}
        {renderTextField(control, errors, 'dataSources', 'Eingaben / Datenquellen')}
        {renderTextField(control, errors, 'expectedOutput', 'Ergebnis / Output')}

        {/* 4. Zielgruppe und Reichweite */}
        {renderSelectField(control, errors, 'reach', 'Reichweite', REACH_LABELS)}
        {renderTextField(control, errors, 'estimatedUsers', 'Geschätzte Anzahl Nutzer', { type: 'number' })}
        {renderTextField(control, errors, 'usageFrequency', 'Nutzungshäufigkeit')}
        {renderTextField(control, errors, 'targetGroup', 'Weitere Angaben zur Zielgruppe')}

        {/* 5. Erwarteter Nutzen */}
        {renderMultiSelectField(control, errors, 'benefitTypes', 'Nutzenart', BENEFIT_TYPE_LABELS)}
        {renderSelectField(control, errors, 'estimatedEffect', 'Geschätzter Effekt', LEVEL_LABELS)}
        {renderTextField(control, errors, 'estimatedTimeSavings', 'Geschätzte Zeitersparnis')}
        {renderTextField(control, errors, 'benefits', 'Nutzen kurz erläutern', { multiline: true, grid: 12 })}

        {/* 6. Lösungsweg und Aufwand */}
        {renderSelectField(control, errors, 'aiSolutionType', 'KI-Lösung', AI_SOLUTION_TYPE_LABELS)}
        {aiSolutionType === AiSolutionType.SONSTIGES &&
          renderTextField(control, errors, 'aiSolutionOtherText', 'KI-Lösung: sonstige, bitte benennen')}
        {renderSelectField(control, errors, 'implementationEffort', 'Umsetzungsaufwand', LEVEL_LABELS)}
        {renderTextField(control, errors, 'dependencies', 'Abhängigkeiten / Voraussetzungen')}

        {/* 7. Daten, Sicherheit und Compliance */}
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

        {/* 9. Entscheidung / nächster Schritt */}
        {renderTextField(control, errors, 'responsible', 'Verantwortlich')}
        {renderTextField(control, errors, 'targetDate', 'Zieltermin / Review')}
      </Grid>
    </form>
  );
}
