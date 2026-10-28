const { rpc, from, lookup } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), lookup: vi.fn() }));
vi.mock("@/integrations/api/client", () => ({ api: { rpc, from } }));
import { orderService } from "./orderService";
const params = { buyerId: "buyer", totalAmount: 50, items: [{ id: "product", quantity: 2, price: 25, vendor_id: "vendor" }], paymentMethod: "cod", requestId: "request-1", shippingDetails: { fullName: "Campus Buyer", email: "buyer@example.com", phone: "0241234567", address: "Hall 1, Accra" } };
beforeEach(() => {
  rpc.mockReset(); from.mockReset(); lookup.mockReset();
  lookup.mockResolvedValue({ data: null, error: null });
  const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle: lookup };
  chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); from.mockReturnValue(chain);
});
it("uses atomic checkout with a stable retry ID", async () => {
  rpc.mockResolvedValue({ data: "order-id", error: null });
  expect(await orderService.placeOrder(params)).toBe("order-id");
  expect(rpc).toHaveBeenCalledWith("create_order_v2", expect.objectContaining({ _buyer_id: "buyer", _request_id: "request-1", _shipping_details: params.shippingDetails }));
});
it("recovers a committed order after the checkout response is lost", async () => {
  rpc.mockResolvedValue({ data: null, error: new Error("Network error") });
  lookup.mockResolvedValue({ data: { id: "committed-order" }, error: null });
  expect(await orderService.placeOrder(params)).toBe("committed-order");
  expect(from).toHaveBeenCalledWith("orders");
});
it("surfaces stock and price failures without inventing an order", async () => {
  rpc.mockResolvedValue({ data: null, error: new Error("Not enough stock") });
  await expect(orderService.placeOrder(params)).rejects.toThrow("Not enough stock");
});
it("requires an order confirmation before the cart can be cleared", async () => {
  rpc.mockResolvedValue({ data: null, error: null });
  await expect(orderService.placeOrder(params)).rejects.toThrow("order confirmation");
});
