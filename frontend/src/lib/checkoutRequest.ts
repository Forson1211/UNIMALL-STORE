export function checkoutRequestId(buyerId: string, cart: string): string {
  const key = `unimall_checkout_request_${buyerId}`;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || "null");
    if (saved?.cart === cart && typeof saved.id === "string" && /^[0-9a-f-]{36}$/i.test(saved.id)) return saved.id;
  } catch { /* Replace invalid or unavailable storage. */ }
  const id = crypto.randomUUID();
  try { sessionStorage.setItem(key, JSON.stringify({ cart, id })); } catch { /* The caller retains the ID in memory. */ }
  return id;
}
export function clearCheckoutRequest(buyerId: string) {
  try { sessionStorage.removeItem(`unimall_checkout_request_${buyerId}`); } catch { /* Storage may be blocked. */ }
}
