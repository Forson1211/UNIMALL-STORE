import { matchesOrder, orderProgress, orderStatusMessage } from "./orderTracking";
describe("order tracking", () => {
  it.each([["pending", 0], ["confirmed", 1], ["processing", 1], ["shipped", 2], ["delivered", 3]])("maps %s to its recorded stage", (status, stage) => {
    expect(orderProgress(String(status))).toBe(stage);
  });
  it("matches full IDs, short IDs and tracking numbers without exposing unrelated matches", () => {
    const order = { id: "abcdef12-3456-7890-abcd-123456789000", trackingNumber: "UM-ABCDEF12-GH" };
    expect(matchesOrder(order, " abcdef12 ")).toBe(true);
    expect(matchesOrder(order, "um-abcdef12-gh")).toBe(true);
    expect(matchesOrder(order, order.id)).toBe(true);
    expect(matchesOrder(order, "abc")).toBe(false);
    expect(matchesOrder(order, "")).toBe(false);
  });
  it("reports cancellation without implying that the order was delivered", () => {
    expect(orderStatusMessage("cancelled")).toMatch(/cancelled/);
    expect(orderStatusMessage("pending")).toMatch(/awaiting/);
  });
});
