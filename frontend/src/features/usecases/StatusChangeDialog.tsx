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
import { STATUS_LABELS, UseCaseStatus } from '../../types';

interface StatusChangeDialogProps {
  open: boolean;
  allowedNextStatuses: UseCaseStatus[];
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (toStatus: UseCaseStatus, note?: string) => void;
}

export function StatusChangeDialog({
  open,
  allowedNextStatuses,
  submitting,
  onClose,
  onConfirm
}: StatusChangeDialogProps) {
  const [toStatus, setToStatus] = useState<UseCaseStatus | ''>('');
  const [note, setNote] = useState('');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Status ändern</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Neuer Status"
            value={toStatus}
            onChange={(e) => setToStatus(e.target.value as UseCaseStatus)}
            fullWidth
          >
            {allowedNextStatuses.map((s) => (
              <MenuItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Kommentar (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          variant="contained"
          disabled={!toStatus || submitting}
          onClick={() => toStatus && onConfirm(toStatus, note || undefined)}
        >
          Bestätigen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
