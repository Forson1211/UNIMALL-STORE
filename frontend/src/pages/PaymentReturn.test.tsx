import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
const mocks = vi.hoisted(() => ({ request: vi.fn(), clearCart: vi.fn(), items: [{ id: 'book', quantity: 1 }], user: { id: 'buyer' } }));
vi.mock('@/integrations/api/client', () => ({ financeRequest: mocks.request }));
vi.mock('@/contexts/CartContext', () => ({ useCart: () => ({ items: mocks.items, clearCart: mocks.clearCart }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/components/layout/Navbar', () => ({ default: () => null }));
vi.mock('@/components/layout/Footer', () => ({ default: () => null }));
import PaymentReturn from './PaymentReturn';
const clients: QueryClient[] = [];
function page() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } }); clients.push(client);
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/payment-return?payment=payment-1&status=success']}><PaymentReturn /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); });
afterEach(() => { cleanup(); clients.splice(0).forEach(c => c.clear()); });
it('does not trust a success callback or clear the cart while server verification is pending', async () => {
  mocks.request.mockResolvedValue({ id: 'payment-1', status: 'pending', order_id: 'order-1' }); page();
  await screen.findByText('pending');
  expect(mocks.request).toHaveBeenCalledWith('/payments/payment-1/verify', {});
  expect(mocks.clearCart).not.toHaveBeenCalled();
});
it('clears only the matching checkout cart after verified payment', async () => {
  sessionStorage.setItem('unimall_payment_cart_payment-1', JSON.stringify(mocks.items));
  mocks.request.mockResolvedValue({ id: 'payment-1', status: 'successful', order_id: 'order-1' }); page();
  await screen.findByText('Payment verified'); await waitFor(() => expect(mocks.clearCart).toHaveBeenCalledTimes(1));
});
it('preserves a newer cart when returning from an older verified payment', async () => {
  sessionStorage.setItem('unimall_payment_cart_payment-1', JSON.stringify([{ id: 'another-book', quantity: 1 }]));
  mocks.request.mockResolvedValue({ id: 'payment-1', status: 'successful', order_id: 'order-1' }); page();
  await screen.findByText('Payment verified'); expect(mocks.clearCart).not.toHaveBeenCalled();
});
it('shows a verification error without claiming the payment succeeded', async () => {
  mocks.request.mockRejectedValue(new Error('Provider verification unavailable')); page();
  await screen.findByText('Provider verification unavailable'); expect(screen.queryByText('Payment verified')).not.toBeInTheDocument(); expect(mocks.clearCart).not.toHaveBeenCalled();
});
