import { Chip } from '@mui/material';
import { STATUS_LABELS, UseCaseStatus } from '../types';
import { statusColors } from '../theme/theme';

export function StatusChip({ status }: { status: UseCaseStatus }) {
  const color = statusColors[status];

  return (
    <Chip
      label={STATUS_LABELS[status]}
      size="small"
      sx={{
        width: 112,
        height: 28,
        justifyContent: 'center',
        bgcolor: `${color}18`,
        color,
        border: `1px solid ${color}35`
      }}
    />
  );
}
