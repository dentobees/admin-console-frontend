import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

// The spy only records calls; promises come from a plain function (README "Test note").
const apiSend = vi.fn();
let impl: () => Promise<unknown> = () => Promise.resolve({});
vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    constructor(public status: number, message: string) { super(message); }
  }
  return { apiSend: (...a: unknown[]) => { apiSend(...a); return impl(); }, ApiError };
});

import { NewAccountModal } from './new-account-modal';
import { ApiError } from '@/lib/api';

const writeText = vi.fn();

function renderModal() {
  const onClose = vi.fn();
  const onOpenAccount = vi.fn();
  render(<NewAccountModal onClose={onClose} onOpenAccount={onOpenAccount} />);
  return { onClose, onOpenAccount };
}

function fillForm(over: Partial<Record<'owner' | 'email' | 'phone' | 'business' | 'password', string>> = {}) {
  const v = { owner: 'Dr. Meera Rao', email: 'meera@smile.example', phone: '9876543210', business: 'Smile Studio', password: 'Temp-pass-1', ...over };
  fireEvent.change(screen.getByLabelText('Owner name'), { target: { value: v.owner } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: v.email } });
  fireEvent.change(screen.getByLabelText('WhatsApp number'), { target: { value: v.phone } });
  fireEvent.change(screen.getByLabelText('Business name'), { target: { value: v.business } });
  fireEvent.change(screen.getByLabelText('Temporary password'), { target: { value: v.password } });
}
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

describe('NewAccountModal', () => {
  beforeEach(() => {
    apiSend.mockClear();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    impl = () => Promise.resolve({ clinicId: 'c99', clinicName: 'Smile Studio', email: 'meera@smile.example' });
  });

  // protects=staff see a message under each wrong field and nothing is sent; fails_when=an empty form, a bad email or a 7-character password reaches the API; no_claim=the admin-api's own validation (only mirrored here)
  it('shows validation errors inline and does not call the API', () => {
    renderModal();
    fillForm({ owner: '  ', email: 'not-an-email', phone: '12', business: '', password: 'short12' });
    submit();
    expect(screen.getByText('Enter the owner’s name.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter the WhatsApp number, 4 to 20 characters.')).toBeInTheDocument();
    expect(screen.getByText('Enter the business name.')).toBeInTheDocument();
    expect(screen.getByText('Password needs at least 8 characters.')).toBeInTheDocument();
    expect(apiSend).not.toHaveBeenCalled();
  });

  // protects=the exact body the admin-api expects, sent once, with the button locked while pending; fails_when=a second click sends a second create or the body has untrimmed/misnamed fields; no_claim=the real route (apiSend is a stub, shapes copied from the spec)
  it('sends the spec body once and blocks a double submit while pending', async () => {
    let resolve: (v: unknown) => void = () => {};
    impl = () => new Promise((r) => { resolve = r; });
    renderModal();
    fillForm({ owner: '  Dr. Meera Rao ', business: ' Smile Studio ' });
    fireEvent.change(screen.getByLabelText('Country code'), { target: { value: 'AE' } });
    submit();
    const pending = screen.getByRole('button', { name: 'Creating…' });
    expect(pending).toBeDisabled();
    fireEvent.click(pending);
    fireEvent.submit(pending.closest('form')!);
    expect(apiSend).toHaveBeenCalledTimes(1);
    expect(apiSend).toHaveBeenCalledWith('POST', '/crm/accounts', {
      ownerName: 'Dr. Meera Rao', email: 'meera@smile.example', phoneCountry: 'AE', phone: '9876543210', businessName: 'Smile Studio', password: 'Temp-pass-1',
    });
    await act(async () => { resolve({ clinicId: 'c99', clinicName: 'Smile Studio', email: 'meera@smile.example' }); });
    expect(await screen.findByText('Account created')).toBeInTheDocument();
    expect(screen.getByText('Smile Studio is ready. Send the customer their login details.')).toBeInTheDocument();
  });

  // protects=a duplicate email shows the banner and staff keep what they typed; fails_when=a 409 clears the form, hides the message or leaves the button disabled; no_claim=that the backend really answers 409 for a duplicate (ApiError is faked)
  it('on a 409 shows the banner and keeps the form values', async () => {
    impl = () => Promise.reject(new ApiError(409, 'This email already has an account.'));
    renderModal();
    fillForm();
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t create the account: This email already has an account.');
    expect(screen.getByLabelText('Owner name')).toHaveValue('Dr. Meera Rao');
    expect(screen.getByLabelText('Email')).toHaveValue('meera@smile.example');
    expect(screen.getByLabelText('Temporary password')).toHaveValue('Temp-pass-1');
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();
  });

  // protects=the customer message copied is exactly the spec text with the response email and the typed password; fails_when=any line, the login URL, the email or the password differs by a character; no_claim=a real clipboard (navigator.clipboard is a spy) or the env override of the login URL
  it('copies the exact login text and shows Copied for 2 s', async () => {
    renderModal();
    fillForm();
    submit();
    const copyBtn = await screen.findByRole('button', { name: 'Copy login details' });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await act(async () => { fireEvent.click(copyBtn); });
      expect(writeText).toHaveBeenCalledWith(
        'Your salestrack account is ready.\n'
        + 'Sign in: https://app.salestrackcrm.com/login\n'
        + 'Email: meera@smile.example\n'
        + 'Password: Temp-pass-1\n'
        + 'To change your password, use "Forgot password" on the sign-in page.',
      );
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
      await act(async () => { vi.advanceTimersByTime(2100); });
      expect(screen.getByRole('button', { name: 'Copy login details' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  // protects=closing the modal drops the temporary password from state; fails_when=after Close the password is still held and shown/copyable when the modal stays mounted; no_claim=memory outside React state (the browser clipboard keeps what was copied)
  it('closing clears the password from state', async () => {
    const { onClose } = renderModal();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.getByLabelText('Temporary password')).toHaveAttribute('type', 'text');
    submit();
    await screen.findByText('Account created');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledWith(true);
    // onClose is a spy, so the modal stays mounted: it must be back to an empty form.
    await waitFor(() => expect(screen.getByLabelText('Temporary password')).toHaveValue(''));
    expect(screen.getByLabelText('Temporary password')).toHaveAttribute('type', 'password');
    expect(screen.queryByText('Account created')).not.toBeInTheDocument();
  });

  // protects=Cancel before creating tells the page nothing was made (no list refresh); fails_when=onClose reports true or is not called; no_claim=the page's refresh itself (page wiring)
  it('Cancel on the form closes with created=false', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledWith(false);
  });

  // protects=Open account hands the new clinic id to the page; fails_when=it passes another id or never calls back; no_claim=that the drawer opens (the page does that)
  it('Open account reports the new clinic id', async () => {
    const { onOpenAccount } = renderModal();
    fillForm();
    submit();
    fireEvent.click(await screen.findByRole('button', { name: 'Open account' }));
    expect(onOpenAccount).toHaveBeenCalledWith('c99');
  });
});
