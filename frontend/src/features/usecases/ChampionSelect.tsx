import { MenuItem, TextField } from '@mui/material';
import { ChampionOption, UseCase } from '../../types';

interface ChampionSelectProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  options: ChampionOption[];
  current?: UseCase['assignedChampion'];
  legacyName?: string | null;
  error?: string;
  loading?: boolean;
  unavailable?: boolean;
}

export function ChampionSelect({
  value,
  onChange,
  options,
  current,
  legacyName,
  error,
  loading,
  unavailable
}: ChampionSelectProps) {
  const missingCurrent = Boolean(value) && !options.some((option) => option.id === value);
  return (
    <TextField
      select
      label="AI Champion"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value || null)}
      fullWidth
      disabled={loading || unavailable}
      error={Boolean(error || unavailable)}
      helperText={
        error ||
        (unavailable
          ? 'Champions konnten nicht geladen werden. Die bisherige Zuordnung bleibt erhalten.'
          : !value && legacyName
            ? `Bisherige Angabe: ${legacyName}. Bitte eindeutig zuordnen.`
            : missingCurrent
              ? 'Die bisherige Zuordnung ist nicht mehr auswählbar. Sie können sie beibehalten oder neu vergeben.'
              : loading
                ? 'Champions werden geladen…'
                : 'Zuständiger Champion für die Abstimmung mit dem Einreicher.')
      }
    >
      <MenuItem value="">Noch nicht zugeordnet</MenuItem>
      {missingCurrent ? (
        <MenuItem value={value!} disabled>
          {current?.name ?? legacyName ?? 'Bisheriger Champion'} (bisherige Zuordnung)
        </MenuItem>
      ) : null}
      {options.map((option) => (
        <MenuItem key={option.id} value={option.id}>
          {option.name}
          {option.department ? ` · ${option.department}` : ''}
          {option.email ? ` (${option.email})` : ''}
        </MenuItem>
      ))}
    </TextField>
  );
}
