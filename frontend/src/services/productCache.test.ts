vi.mock("@/integrations/api/client", () => ({ api: {} }));
beforeEach(() => { localStorage.clear(); vi.resetModules(); });
it("does not invent inventory when the catalog is unavailable", async () => {
  const { productService } = await import("./productService");
  expect(productService.getCachedProducts()).toEqual([]);
});
it("preserves actual cached listings regardless of their names", async () => {
  const product = { id: "b0000000-0000-0000-0000-000000000001", name: "Coffee mug", price: 25 };
  localStorage.setItem("unimall_products_v5_real", JSON.stringify([product, { id: "demo-1", name: "Sample" }]));
  localStorage.setItem("unimall_products_cache_ts_v5", String(Date.now()));
  const { productService } = await import("./productService");
  expect(productService.getCachedProducts()).toEqual([product]);
});
it("does not resurrect expired browser inventory", async () => {
  localStorage.setItem("unimall_products_v5_real", JSON.stringify([{ id: "b0000000-0000-0000-0000-000000000001", name: "Old mug", price: 25 }]));
  localStorage.setItem("unimall_products_cache_ts_v5", String(Date.now() - 60000));
  const { productService } = await import("./productService");
  expect(productService.getCachedProducts()).toEqual([]);
});
it("clears stale inventory when the server returns an empty catalog", async () => {
  const { productService } = await import("./productService");
  productService._updateCache([{ id: "b0000000-0000-0000-0000-000000000001", name: "Coffee mug", price: 25 } as never]);
  productService._updateCache([]);
  expect(productService.getCachedProducts()).toEqual([]);
});

it("removes old catalog rows after an inventory mutation", async () => {
  const { productService } = await import("./productService");
  productService._updateCache([{ id: "b0000000-0000-0000-0000-000000000001", name: "Coffee mug", price: 25 } as never]);
  productService.bustCache();
  expect(productService.getCachedProducts()).toEqual([]);
});
