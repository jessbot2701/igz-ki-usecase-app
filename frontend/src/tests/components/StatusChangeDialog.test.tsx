import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatusChangeDialog } from '../../features/usecases/StatusChangeDialog';
import { UseCaseStatus } from '../../types';

describe('StatusChangeDialog', () => {
  it('only offers the allowed next statuses in the select', async () => {
    render(
      <StatusChangeDialog
        open
        allowedNextStatuses={[UseCaseStatus.IN_REVIEW]}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    await userEvent.click(screen.getByLabelText(/Neuer Status/i));
    expect(await screen.findByText('In Prüfung')).toBeInTheDocument();
    expect(screen.queryByText('Genehmigt')).not.toBeInTheDocument();
  });

  it('calls onConfirm with the selected status', async () => {
    const onConfirm = vi.fn();
    render(
      <StatusChangeDialog
        open
        allowedNextStatuses={[UseCaseStatus.APPROVED]}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    await userEvent.click(screen.getByLabelText(/Neuer Status/i));
    await userEvent.click(await screen.findByText('Genehmigt'));
    await userEvent.click(screen.getByRole('button', { name: /Bestätigen/i }));

    expect(onConfirm).toHaveBeenCalledWith(UseCaseStatus.APPROVED, undefined);
  });
});
