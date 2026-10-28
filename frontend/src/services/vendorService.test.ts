const { auth, from } = vi.hoisted(() => ({ auth: { getUser: vi.fn() }, from: vi.fn() }));
vi.mock("@/integrations/api/client", () => ({ api: { auth, from } }));
import { vendorService, packProductMetadata, unpackProductMetadata, validateProductInput } from "./vendorService";
import { calculateVendorProfileCompleteness } from "@/lib/vendorProfileUtils";

const vendorId = "a0000000-0000-0000-0000-000000000002";
const product = {
  id: "b0000000-0000-0000-0000-000000000001", vendor_id: vendorId,
  name: "Coffee mug", description: "Ceramic mug", price: 25, stock: 3,
  category: "Home", is_active: true, image_url: "https://example.com/mug.webp",
};

function query(result: { data?: unknown; error?: unknown }) {
  const chain: any = {};
  for (const name of ["select", "eq", "in", "order", "update", "insert"]) chain[name] = vi.fn(() => chain);
  chain.single = vi.fn(async () => result);
  chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  auth.getUser.mockResolvedValue({ data: { user: { id: vendorId } }, error: null });
});

it("changes only stock and scopes the write to the authenticated seller", async () => {
  const db = query({ data: { ...product, stock: 0 }, error: null });
  from.mockReturnValue(db);
  const result = await vendorService.updateProduct(product.id, { stock: 0, expected_stock: 3 });
  expect(db.update).toHaveBeenCalledWith({ stock: 0 });
  expect(db.eq).toHaveBeenCalledWith("vendor_id", vendorId);
  expect(db.eq).toHaveBeenCalledWith("stock", 3);
  expect(result.name).toBe(product.name);
  expect(result.price).toBe(25);
  expect(result.status).toBe("out_of_stock");
  expect(result.is_active).toBe(true);
});

it("asks the seller to refresh when an order changed the stock during editing", async () => {
  from.mockReturnValue(query({ error: { code: "PGRST116", message: "No matching row" } }));
  await expect(vendorService.updateProduct(product.id, { stock: 4, expected_stock: 3 })).rejects.toThrow("stock changed");
});

it("preserves gallery and description when changing a metadata option", async () => {
  const packed = packProductMetadata({ ...product, status: "active", images: [product.image_url], condition: "Brand New" });
  const read = query({ data: packed, error: null });
  const write = query({ data: { ...packed }, error: null });
  from.mockReturnValueOnce(read).mockReturnValueOnce(write);
  await vendorService.updateProduct(product.id, { is_negotiable: true, vendor_id: "another-user" });
  const payload = write.update.mock.calls[0][0];
  expect(Object.keys(payload)).toEqual(["description"]);
  const decoded = unpackProductMetadata({ ...packed, ...payload });
  expect(decoded.description).toBe("Ceramic mug");
  expect(decoded.images).toEqual([product.image_url]);
  expect(decoded.is_negotiable).toBe(true);
});

it("cannot publish using only a locally forged complete profile", async () => {
  const complete = { store_name: "Test", phone: "0241234567", campus: "Legon", store_description: "Shop", avatar_url: "https://example.com/logo", banner_url: "https://example.com/banner" };
  localStorage.setItem(`unimall_vendor_profile_${vendorId}`, JSON.stringify(complete));
  from.mockReturnValue(query({ data: { ...complete, phone: null }, error: null }));
  await expect(vendorService.createProduct(product)).rejects.toThrow("Save your complete store profile");
  expect(calculateVendorProfileCompleteness({ phone: null }, complete).isComplete).toBe(false);
});

it("does not retry product inserts by removing required ownership columns", async () => {
  const profile = query({ data: { store_name: "Test", phone: "0241234567", campus: "Legon", store_description: "Shop", avatar_url: "https://example.com/logo", banner_url: "https://example.com/banner" } });
  const insert = query({ error: { message: "Could not find the 'vendor_id' column" } });
  from.mockReturnValueOnce(profile).mockReturnValue(insert);
  await expect(vendorService.createProduct(product)).rejects.toMatchObject({ message: expect.stringContaining("vendor_id") });
  expect(insert.insert).toHaveBeenCalledTimes(1);
  expect(insert.insert.mock.calls[0][0].vendor_id).toBe(vendorId);
});

it("archives listings without deleting customer reviews or order history", async () => {
  const db = query({ data: { id: product.id } }); from.mockReturnValue(db);
  await vendorService.deleteProduct(product.id);
  expect(from).toHaveBeenCalledTimes(1);
  expect(from).toHaveBeenCalledWith("products");
  expect(db.update).toHaveBeenCalledWith({ is_active: false });
  expect(db.eq).toHaveBeenCalledWith("vendor_id", vendorId);
});

it("surfaces order query errors instead of reporting an empty order book", async () => {
  from.mockReturnValue(query({ error: { message: "View is missing" } }));
  await expect(vendorService.getOrders(vendorId)).rejects.toMatchObject({ message: "View is missing" });
});

it("normalizes numeric order totals returned by Postgres", async () => {
  from.mockReturnValue(query({ data: [{ order_id: "order", vendor_total: "50.00", item_count: "2" }] }));
  expect(await vendorService.getOrders(vendorId)).toEqual([{ order_id: "order", vendor_total: 50, item_count: 2 }]);
});

it("counts only delivered and collected orders as revenue", async () => {
  vi.spyOn(vendorService, "getProducts").mockResolvedValue([product]);
  vi.spyOn(vendorService, "getOrders").mockResolvedValue([
    { order_status: "delivered", payment_status: "paid", vendor_total: 50 },
    { order_status: "pending", payment_status: "pending", vendor_total: 100 },
    { order_status: "cancelled", payment_status: "paid", vendor_total: 20 },
    { order_status: "delivered", payment_status: "pending", vendor_total: 80 },
  ]);
  expect((await vendorService.getDashboardStats(vendorId)).total_revenue).toBe(50);
  vi.restoreAllMocks();
});

it("excludes cancelled vendor lines from the payout balance of delivered orders", async () => {
  from.mockReturnValueOnce(query({ data: [
    { vendor_total: 50, order_status: "delivered", payment_status: "paid" },
    { vendor_total: 0, order_status: "cancelled", payment_status: "paid" },
  ] })).mockReturnValueOnce(query({ data: [{ amount: 10, status: "approved" }] }));
  expect(await vendorService.getAvailableBalance(vendorId)).toBe(40);
});

it("derives availability from current stock instead of stale embedded status", () => {
  const row = packProductMetadata({ ...product, stock: 0, status: "out_of_stock" });
  expect(unpackProductMetadata({ ...row, stock: 4 }).status).toBe("active");
  expect(unpackProductMetadata({ ...row, stock: 4, is_active: false }).status).toBe("draft");
});

it("rounds available earnings to cents before requesting a payout", async () => {
  from.mockReturnValueOnce(query({ data: [
    { vendor_total: 10.1, order_status: "delivered", payment_status: "paid" },
    { vendor_total: 10.2, order_status: "delivered", payment_status: "paid" },
  ] })).mockReturnValueOnce(query({ data: [] }));
  expect(await vendorService.getAvailableBalance(vendorId)).toBe(20.3);
});

it.each([-1, 1.5, NaN, Infinity, "", null])("rejects invalid stock %s", stock => {
  expect(() => validateProductInput({ stock }, true)).toThrow("Stock");
});

it("accepts a deliberate zero stock and rejects an unsaved upload", () => {
  expect(() => validateProductInput({ ...product, stock: 0 })).not.toThrow();
  expect(() => validateProductInput({ ...product, image_url: "data:image/webp;base64,AA" })).toThrow("uploads");
});
