import { isSafeMenuUrl } from "./navigation";
describe("published navigation links", () => {
  it.each(["/", "/products?category=Books", "/pages/help", "https://example.com/help"])("allows %s", url => expect(isSafeMenuUrl(url)).toBe(true));
  it.each(["javascript:alert(1)", "data:text/html,hello", "//evil.example", "/\\evil.example", "https://example.com/ bad"])("rejects %s", url => expect(isSafeMenuUrl(url)).toBe(false));
});
