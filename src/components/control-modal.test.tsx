import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// The spy only records calls; see overview/page.test.tsx for why promises come
// from a plain function.
const apiSend = vi.fn();
let impl: () => Promise<unknown> = () => Promise.resolve({ ok: true });
vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    constructor(public status: number, message: string) { super(message); }
  }
  return { apiSend: (...a: unknown[]) => { apiSend(...a); return impl(); }, ApiError };
});

import { ControlModal } from './control-modal';
import { ApiError } from '@/lib/api';

function renderModal(kind: 'suspend' | 'wallet_enforcement' = 'suspend') {
  const onDone = vi.fn();
  const onClose = vi.fn();
  render(<ControlModal clinicId="c1" clinicName="Apollo Dental" kind={kind} currentWallet="on" onClose={onClose} onDone={onDone} />);
  return { onDone, onClose };
}

describe('ControlModal', () => {
  beforeEach(() => { apiSend.mockClear(); impl = () => Promise.resolve({ ok: true }); });

  it('shows the narrowed suspend wording (D10)', () => {
    renderModal('suspend');
    expect(screen.getByText(/Open tabs lose access within 15 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/ERP-paired traffic continue until reload/)).toBeInTheDocument();
  });

  it('refuses a reason shorter than 10 characters without calling the API', () => {
    renderModal();
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'late' } });
    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));
    expect(screen.getByRole('alert')).toHaveTextContent('at least 10 characters');
    expect(apiSend).not.toHaveBeenCalled();
  });

  it('sends the action with a trimmed reason and reports done', async () => {
    impl = () => Promise.resolve({ ok: true });
    const { onDone } = renderModal();
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: '  Payment overdue 45 days ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(apiSend).toHaveBeenCalledWith('POST', '/crm/clinics/c1/actions', { action: 'suspend', reason: 'Payment overdue 45 days' });
  });

  it('on failure says nothing changed and keeps the modal open (D3)', async () => {
    impl = () => Promise.reject(new ApiError(409, 'clinic changed, reload'));
    const { onDone } = renderModal();
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'Payment overdue 45 days' } });
    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t save: clinic changed, reload. Nothing changed.');
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Suspend' })).toBeEnabled();
  });

  it('wallet billing requires a different value than the current one', () => {
    renderModal('wallet_enforcement');
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'Pilot clinic, no charging yet' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a different setting.');
    fireEvent.click(screen.getByRole('radio', { name: 'shadow' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(apiSend).toHaveBeenCalledWith('POST', '/crm/clinics/c1/actions', { action: 'wallet_enforcement', value: 'shadow', reason: 'Pilot clinic, no charging yet' });
  });

  it('closes on Escape (D7)', () => {
    const { onClose } = renderModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
