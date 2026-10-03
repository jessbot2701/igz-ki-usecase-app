import { Box, Stack, TextField } from '@mui/material';
import { IdeaInput } from '../../api/authApi';

export const emptyIdea: IdeaInput = {
  title: '',
  department: '',
  problemDescription: '',
  solutionIdea: ''
};

export function IdeaFields({
  value,
  onChange,
  disabled = false,
  inspiring = false
}: {
  value: IdeaInput;
  onChange: (value: IdeaInput) => void;
  disabled?: boolean;
  inspiring?: boolean;
}) {
  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: inspiring ? { xs: '1fr', sm: '1.3fr 1fr' } : '1fr',
          gap: 2.5
        }}
      >
        <TextField
          label="Titel Ihrer Idee"
          placeholder={inspiring ? 'z. B. Wissen schneller finden' : undefined}
          required
          value={value.title}
          disabled={disabled}
          inputProps={{ minLength: 3, maxLength: 200 }}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          fullWidth
        />
        <TextField
          label="Bereich / Abteilung"
          placeholder={inspiring ? 'z. B. Vertrieb' : undefined}
          required
          value={value.department}
          disabled={disabled}
          inputProps={{ minLength: 2, maxLength: 120 }}
          onChange={(e) => onChange({ ...value, department: e.target.value })}
          fullWidth
        />
      </Box>
      <TextField
        label="Welches Problem möchten Sie lösen?"
        placeholder={
          inspiring ? 'Was kostet heute Zeit oder macht die Arbeit unnötig kompliziert?' : undefined
        }
        helperText="Beschreiben Sie kurz die heutige Situation (mindestens 10 Zeichen)."
        required
        multiline
        minRows={3}
        value={value.problemDescription}
        disabled={disabled}
        inputProps={{ minLength: 10, maxLength: 5000 }}
        onChange={(e) => onChange({ ...value, problemDescription: e.target.value })}
        fullWidth
      />
      <TextField
        label="Wie könnte KI dabei helfen?"
        placeholder={
          inspiring
            ? 'Was wäre einfacher, wenn Sie einen intelligenten Helfer an Ihrer Seite hätten?'
            : undefined
        }
        helperText="Eine erste Idee genügt – technische Details klären wir gemeinsam (mindestens 10 Zeichen)."
        required
        multiline
        minRows={3}
        value={value.solutionIdea}
        disabled={disabled}
        inputProps={{ minLength: 10, maxLength: 5000 }}
        onChange={(e) => onChange({ ...value, solutionIdea: e.target.value })}
        fullWidth
      />
    </Stack>
  );
}
