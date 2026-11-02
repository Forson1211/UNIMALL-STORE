import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/integrations/api/client', () => ({ financeRequest: mocks.request }));
import ItemFinanceActions from './ItemFinanceActions';
let client: QueryClient;
beforeEach(() => { vi.clearAllMocks(); mocks.request.mockResolvedValue(true); client = new QueryClient({ defaultOptions: { mutations: { retry: false } } }); });
afterEach(() => { cleanup(); client.clear(); });
function page(cod = false, delivered = true) { return render(<QueryClientProvider client={client}><ItemFinanceActions cod={cod} item={{ id: 'item-1', finance_version: 1, fulfillment_status: delivered ? 'delivered' : 'shipped' }} /></QueryClientProvider>); }
it('requires explicit buyer confirmation and never preselects COD payment confirmation', async () => {
  page(true); fireEvent.click(screen.getByRole('button', { name: 'Confirm delivery' }));
  expect(screen.getByRole('checkbox')).not.toBeChecked(); expect(mocks.request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('button', { name: 'Confirm receipt' }));
  await waitFor(() => expect(mocks.request).toHaveBeenCalledWith('/orders/items/item-1/confirm-delivery', { cash_paid: true }));
});
it('allows reporting a problem before delivery without offering delivery confirmation', async () => {
  page(false, false); expect(screen.queryByRole('button', { name: 'Confirm delivery' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Report a problem' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Problem details' }), { target: { value: 'My package has not arrived.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send to support' }));
  await waitFor(() => expect(mocks.request).toHaveBeenCalledWith('/disputes', { order_item_id: 'item-1', reason: 'My package has not arrived.' }));
});
