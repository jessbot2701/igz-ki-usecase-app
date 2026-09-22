import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UseCaseForm } from '../../features/usecases/UseCaseForm';

describe('UseCaseForm', () => {
  it('shows validation errors when required fields are too short', async () => {
    const onSubmit = vi.fn();
    render(<UseCaseForm formId="test-form" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/Titel/i), 'ab');

    const form = document.getElementById('test-form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(await screen.findByText(/Mindestens 3 Zeichen/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn();
    render(<UseCaseForm formId="test-form-2" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/^Titel/i), 'Ein valider Use Case Titel');
    await userEvent.type(screen.getByLabelText(/Ansprechpartner|Einreicher/i), 'Max Mustermann');
    await userEvent.type(screen.getByLabelText(/^Bereich/i), 'IT');
    await userEvent.type(
      screen.getByLabelText(/Beschreibung des heutigen Ablaufs/i),
      'Eine ausreichend lange Problembeschreibung.'
    );
    await userEvent.type(
      screen.getByLabelText(/Kurzbeschreibung der AI-Lösung/i),
      'Eine ausreichend lange Lösungsidee.'
    );

    const form = document.getElementById('test-form-2') as HTMLFormElement;
    fireEvent.submit(form);

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});
