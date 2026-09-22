import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField
} from '@mui/material';
import { BusinessValue, EvaluationEntry, Feasibility, Risk, StrategicRelevance } from '../../types';

interface EvaluationDialogProps {
  open: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (
    input: Pick<EvaluationEntry, 'businessValue' | 'feasibility' | 'risk' | 'strategicRelevance' | 'note'>
  ) => void;
}

const LABELS = {
  businessValue: { NIEDRIG: 'Niedrig', MITTEL: 'Mittel', HOCH: 'Hoch' },
  feasibility: { EINFACH: 'Einfach', MITTEL: 'Mittel', KOMPLEX: 'Komplex' },
  risk: { NIEDRIG: 'Niedrig', MITTEL: 'Mittel', HOCH: 'Hoch' },
  strategicRelevance: { QUICK_WIN: 'Quick Win', BEREICH: 'Bereich', IGZ_WEIT: 'IGZ-weit' }
};

export function EvaluationDialog({ open, submitting, onClose, onSubmit }: EvaluationDialogProps) {
  const [businessValue, setBusinessValue] = useState<BusinessValue>(BusinessValue.MITTEL);
  const [feasibility, setFeasibility] = useState<Feasibility>(Feasibility.MITTEL);
  const [risk, setRisk] = useState<Risk>(Risk.NIEDRIG);
  const [strategicRelevance, setStrategicRelevance] = useState<StrategicRelevance>(
    StrategicRelevance.BEREICH
  );
  const [note, setNote] = useState('');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Use Case bewerten</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Business Nutzen"
            value={businessValue}
            onChange={(e) => setBusinessValue(e.target.value as BusinessValue)}
          >
            {Object.entries(LABELS.businessValue).map(([k, v]) => (
              <MenuItem key={k} value={k}>
                {v}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Umsetzbarkeit"
            value={feasibility}
            onChange={(e) => setFeasibility(e.target.value as Feasibility)}
          >
            {Object.entries(LABELS.feasibility).map(([k, v]) => (
              <MenuItem key={k} value={k}>
                {v}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Risiko" value={risk} onChange={(e) => setRisk(e.target.value as Risk)}>
            {Object.entries(LABELS.risk).map(([k, v]) => (
              <MenuItem key={k} value={k}>
                {v}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Strategische Relevanz"
            value={strategicRelevance}
            onChange={(e) => setStrategicRelevance(e.target.value as StrategicRelevance)}
          >
            {Object.entries(LABELS.strategicRelevance).map(([k, v]) => (
              <MenuItem key={k} value={k}>
                {v}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Notiz (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          variant="contained"
          disabled={submitting}
          onClick={() =>
            onSubmit({ businessValue, feasibility, risk, strategicRelevance, note: note || undefined })
          }
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
