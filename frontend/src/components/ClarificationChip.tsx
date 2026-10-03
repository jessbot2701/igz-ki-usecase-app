import { Chip } from '@mui/material';
import { UseCase, UseCaseStatus } from '../types';

export function ClarificationChip({
  useCase
}: {
  useCase: Pick<UseCase, 'status' | 'clarificationAnsweredAt'>;
}) {
  if (useCase.status !== UseCaseStatus.NEED_MORE_INFO) return null;
  return (
    <Chip
      size="small"
      variant="outlined"
      color={useCase.clarificationAnsweredAt ? 'success' : 'warning'}
      label={useCase.clarificationAnsweredAt ? 'Antwort eingegangen' : 'Antwort ausstehend'}
    />
  );
}
