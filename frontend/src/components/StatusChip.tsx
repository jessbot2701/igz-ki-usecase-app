import { Chip } from '@mui/material';
import { STATUS_LABELS, UseCaseStatus } from '../types';
import { statusColors } from '../theme/theme';

export function StatusChip({ status }: { status: UseCaseStatus }) {
  return (
    <Chip
      label={STATUS_LABELS[status]}
      size="small"
      sx={{ bgcolor: statusColors[status], color: '#fff' }}
    />
  );
}
