import { checkoutRequestId, clearCheckoutRequest } from "./checkoutRequest";
beforeEach(() => sessionStorage.clear());
it("reuses an ID for retries and page reloads of the same cart", () => {
  expect(checkoutRequestId("buyer", "cart-1")).toBe(checkoutRequestId("buyer", "cart-1"));
});
it("creates separate IDs for different accounts or changed carts", () => {
  const first = checkoutRequestId("buyer", "cart-1");
  expect(checkoutRequestId("other-buyer", "cart-1")).not.toBe(first);
  expect(checkoutRequestId("buyer", "cart-2")).not.toBe(first);
});
it("allows a fresh purchase of the same products after a confirmed checkout", () => {
  const first = checkoutRequestId("buyer", "cart-1");
  clearCheckoutRequest("buyer");
  expect(checkoutRequestId("buyer", "cart-1")).not.toBe(first);
});
