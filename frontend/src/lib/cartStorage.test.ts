import { readCart, writeCart } from "./cartStorage";
import type { CartItem } from "@/contexts/CartContext";
const item: CartItem = { id: "product-1", name: "Notebook", price: 25, quantity: 2, image: "/placeholder.svg", vendor: "Campus Store", vendorId: "vendor-1" };
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());
describe("cart persistence", () => {
  it("restores a valid cart", () => { writeCart([item]); expect(readCart()).toEqual([item]); });
  it.each(["broken-json", '{"items":[]}', "null"])("recovers from corrupt saved data: %s", value => {
    localStorage.setItem("cart", value); expect(readCart()).toEqual([]);
  });
  it("discards unsafe quantities, prices and duplicate IDs", () => {
    localStorage.setItem("cart", JSON.stringify([item, item,
      { ...item, id: "negative", quantity: -1 }, { ...item, id: "fraction", quantity: 1.5 },
      { ...item, id: "huge", quantity: 100 }, { ...item, id: "price", price: -20 }]));
    expect(readCart()).toEqual([item]);
  });
  it("keeps the app usable when browser storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Full"); });
    expect(readCart()).toEqual([]); expect(() => writeCart([item])).not.toThrow();
  });
});
