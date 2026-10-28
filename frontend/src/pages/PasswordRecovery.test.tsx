import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PasswordRecovery from './PasswordRecovery';
const { resetPassword, toast } = vi.hoisted(() => ({ resetPassword: vi.fn(), toast: vi.fn() }));
vi.mock('@/integrations/api/client', () => ({ api: { auth: { resetPassword } } }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
beforeEach(() => { vi.clearAllMocks(); history.replaceState(null, '', '/reset-password'); });
afterEach(() => { history.replaceState(null, '', '/'); });
function mount() {
  return render(<MemoryRouter initialEntries={['/reset-password']}><Routes>
    <Route path="/reset-password" element={<PasswordRecovery reset />} />
    <Route path="/login" element={<p>Sign in again</p>} />
  </Routes></MemoryRouter>);
}
it('resets with the email token without requiring a signed-in session', async () => {
  history.replaceState(null, '', '/reset-password#token=email-recovery-token');
  resetPassword.mockResolvedValue({ error: null }); mount();
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'new-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save password' }));
  await screen.findByText('Sign in again');
  expect(resetPassword).toHaveBeenCalledWith('email-recovery-token', 'new-password');
  expect(window.location.hash).toBe('');
});
it('shows a recovery link when the email token is missing', () => {
  mount(); expect(screen.getByRole('alert')).toHaveTextContent('expired or is invalid');
  expect(screen.queryByRole('button', { name: 'Save password' })).not.toBeInTheDocument();
});
it('keeps the recovery form open when the server rejects an expired token', async () => {
  history.replaceState(null, '', '/reset-password#token=expired');
  resetPassword.mockResolvedValue({ error: new Error('Recovery link expired') }); mount();
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'new-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save password' }));
  await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Recovery link expired', variant: 'destructive' })));
  expect(screen.queryByText('Sign in again')).not.toBeInTheDocument();
});
