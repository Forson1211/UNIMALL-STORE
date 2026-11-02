import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { financeRequest } from '@/integrations/api/client';
import { toast } from 'sonner';

export interface FinancialItem { id: string; finance_version?: number; fulfillment_status?: string; buyer_confirmed_at?: string; buyer_cash_confirmed_at?: string }
export default function ItemFinanceActions({ item, cod }: { item: FinancialItem; cod: boolean }) {
  const [dialog, setDialog] = useState<'delivery' | 'dispute' | null>(null);
  const [cash, setCash] = useState(false), [reason, setReason] = useState('');
  const client = useQueryClient();
  const change = useMutation({ mutationFn: () => dialog === 'delivery'
    ? financeRequest('/orders/items/' + item.id + '/confirm-delivery', { cash_paid: cod && cash })
    : financeRequest('/disputes', { order_item_id: item.id, reason }),
    onSuccess: () => { toast.success(dialog === 'delivery' ? 'Delivery confirmation recorded.' : 'Dispute opened. Related earnings are held for review.'); setDialog(null); setReason(''); void client.invalidateQueries({ queryKey: ['buyer-orders'] }); },
    onError: (error: Error) => toast.error(error.message) });
  if (!item.finance_version) return null;
  return <div className="mt-2 flex flex-wrap gap-2">
    {item.fulfillment_status === 'delivered' && (!item.buyer_confirmed_at || (cod && !item.buyer_cash_confirmed_at)) && <Button size="sm" variant="outline" onClick={() => setDialog('delivery')}>{item.buyer_confirmed_at ? 'Confirm cash payment' : 'Confirm delivery'}</Button>}
    {item.buyer_confirmed_at && <span className="self-center text-xs text-muted-foreground">Delivery confirmed</span>}
    {item.fulfillment_status !== 'cancelled' && <Button size="sm" variant="ghost" onClick={() => setDialog('dispute')}>Report a problem</Button>}
    <Dialog open={!!dialog} onOpenChange={open => { if (!open) setDialog(null); }}><DialogContent><DialogHeader><DialogTitle>{dialog === 'delivery' ? 'Did you receive this item?' : 'Report an order problem'}</DialogTitle><DialogDescription>{dialog === 'delivery' ? 'Confirm only after receiving your item. This starts the seller payout waiting period.' : 'Describe what happened so support can review your order.'}</DialogDescription></DialogHeader>
      {dialog === 'delivery' ? cod && <Label className="flex items-center gap-3"><input type="checkbox" checked={cash} onChange={e => setCash(e.target.checked)} />I paid cash to the seller for this item</Label> : <Textarea aria-label="Problem details" value={reason} onChange={e => setReason(e.target.value)} minLength={10} maxLength={2000} placeholder="Describe the problem (at least 10 characters)" />}
      <Button disabled={change.isPending || (dialog === 'dispute' && reason.trim().length < 10) || (dialog === 'delivery' && !!item.buyer_confirmed_at && !cash)} onClick={() => change.mutate()}>{change.isPending ? 'Saving...' : dialog === 'delivery' ? 'Confirm receipt' : 'Send to support'}</Button>
    </DialogContent></Dialog>
  </div>;
}
