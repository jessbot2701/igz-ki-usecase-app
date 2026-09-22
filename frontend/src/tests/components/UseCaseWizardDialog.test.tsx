import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UseCaseWizardDialog } from '../../features/usecases/UseCaseWizardDialog';

describe('UseCaseWizardDialog', () => {
  it('blocks advancing to step 2 when step 1 required fields are invalid', async () => {
    render(
      <UseCaseWizardDialog open title="Neuen Use Case anlegen" onClose={vi.fn()} onSubmit={vi.fn()} />
    );

    expect(screen.getByText('Basisinformationen')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Weiter' }));

    expect((await screen.findAllByText(/Pflichtfeld/i)).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Titel des Use Cases/i)).toBeInTheDocument();
  });

  it('advances through steps when required fields are filled and shows the review step', async () => {
    render(
      <UseCaseWizardDialog open title="Neuen Use Case anlegen" onClose={vi.fn()} onSubmit={vi.fn()} />
    );

    await userEvent.type(screen.getByLabelText(/Titel des Use Cases/i), 'Ein valider Titel');
    await userEvent.type(screen.getByLabelText(/Ansprechpartner/i), 'Max Mustermann');
    await userEvent.type(screen.getByLabelText(/^Bereich/i), 'IT');
    await userEvent.click(screen.getByRole('button', { name: 'Weiter' }));

    expect(await screen.findByLabelText(/Beschreibung des heutigen Ablaufs/i)).toBeInTheDocument();
    await userEvent.type(
      screen.getByLabelText(/Beschreibung des heutigen Ablaufs/i),
      'Eine ausreichend lange Problembeschreibung.'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Weiter' }));

    expect(await screen.findByLabelText(/Kurzbeschreibung der AI-Lösung/i)).toBeInTheDocument();
    await userEvent.type(
      screen.getByLabelText(/Kurzbeschreibung der AI-Lösung/i),
      'Eine ausreichend lange Lösungsidee.'
    );
    // Skip through steps 4 and 5 (no required fields), reach the review step
    await userEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Weiter' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Weiter' }));

    expect(await screen.findByText(/Bitte prüfen Sie Ihre Angaben/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument();
  });
});
