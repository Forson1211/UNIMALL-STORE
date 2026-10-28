export const ORDER_STEPS = ["Ordered", "Confirmed", "Shipped", "Delivered"];
export function orderProgress(status: string): number {
  return ({ pending: 0, confirmed: 1, processing: 1, shipped: 2, delivered: 3, completed: 3 } as Record<string, number>)[status] ?? 0;
}
export function orderStatusMessage(status: string): string {
  return ({ pending: "Your order is awaiting vendor confirmation.", confirmed: "The vendor confirmed your order.",
    processing: "The vendor is preparing your order.", shipped: "Your order is on its way.",
    delivered: "Your order has been delivered.", completed: "Your order is complete.",
    cancelled: "This order was cancelled.", canceled: "This order was cancelled." } as Record<string, string>)[status]
    || "Contact support for an update on this order.";
}
export function matchesOrder(order: { id: string; trackingNumber: string }, value: string) {
  const term = value.trim().toLowerCase();
  return !!term && [order.id, order.id.slice(0, 8), order.trackingNumber].some(id => id.toLowerCase() === term);
}
