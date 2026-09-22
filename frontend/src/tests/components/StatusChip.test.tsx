import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusChip } from '../../components/StatusChip';
import { UseCaseStatus } from '../../types';

describe('StatusChip', () => {
  it('renders the German label for a status', () => {
    render(<StatusChip status={UseCaseStatus.IN_REVIEW} />);
    expect(screen.getByText('In Prüfung')).toBeInTheDocument();
  });

  it('renders a different label for PILOT', () => {
    render(<StatusChip status={UseCaseStatus.PILOT} />);
    expect(screen.getByText('Pilot')).toBeInTheDocument();
  });
});
