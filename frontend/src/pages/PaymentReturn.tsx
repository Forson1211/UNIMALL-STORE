import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { financeRequest } from '@/integrations/api/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { clearCheckoutRequest } from '@/lib/checkoutRequest';

interface Payment { id: string; status: string; order_id: string; amount_pesewas: number; exception?: string }
export default function PaymentReturn() {
  const [params] = useSearchParams(), paymentId = params.get('payment');
  const { items, clearCart } = useCart(), { user } = useAuth(), cleared = useRef(false);
  const query = useQuery({ queryKey: ['payment-return', paymentId], enabled: !!paymentId && !!user, retry: false,
    queryFn: () => financeRequest<Payment>('/payments/' + encodeURIComponent(paymentId!) + '/verify', {}),
    refetchInterval: q => q.state.data && ['successful', 'refunded', 'partially_refunded', 'failed'].includes(q.state.data.status) ? false : 5000 });
  const paid = query.data && ['successful', 'refunded', 'partially_refunded'].includes(query.data.status);
  useEffect(() => { if (query.data?.status === 'failed' && user) clearCheckoutRequest(user.id); }, [query.data?.status, user]);
  useEffect(() => {
    if (!paid || !user || cleared.current) return;
    cleared.current = true;
    try {
      const key = 'unimall_payment_cart_' + paymentId, snapshot = sessionStorage.getItem(key);
      if (snapshot === JSON.stringify(items.map(({ id, quantity }) => ({ id, quantity })))) { clearCart(); clearCheckoutRequest(user.id); }
      sessionStorage.removeItem(key);
    } catch { /* Preserve the current cart if its checkout snapshot is unavailable. */ }
  }, [paid, user, paymentId, items, clearCart]);
  return <><Navbar /><main className="mx-auto min-h-[60vh] max-w-2xl px-4 py-12"><Card><CardHeader><CardTitle>{paid ? 'Payment verified' : query.data?.status === 'failed' ? 'Payment not completed' : 'Checking your payment'}</CardTitle></CardHeader><CardContent className="space-y-5">
    <p>{query.error ? query.error.message : paid ? query.data?.exception ? 'Payment arrived after cancellation. A refund is being reviewed and processed.' : 'Your payment is verified. Your order still needs to be fulfilled and delivered.' : 'We verify the payment with the provider. Returning to this page alone does not confirm payment.'}</p>
    {query.data && <p>Status: <strong>{query.data.status.replace(/_/g, ' ')}</strong></p>}
    {!user && <Button asChild><Link to="/login">Sign in to check payment</Link></Button>}
    <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={query.isFetching || !user} onClick={() => void query.refetch()}>Check again</Button><Button asChild><Link to={query.data ? '/account/orders?order=' + query.data.order_id : '/account/orders'}>View orders</Link></Button></div>
  </CardContent></Card></main><Footer /></>;
}
