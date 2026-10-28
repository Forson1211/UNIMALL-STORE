import { sanitizeContent } from "./sanitizeContent";
it("keeps basic page formatting and safe links", () => {
  expect(sanitizeContent('<h2>Welcome</h2><p><strong>Campus</strong> <a href="/products">shop</a></p>')).toContain('<h2>Welcome</h2>');
  expect(sanitizeContent('<a href="/products">shop</a>')).toContain('href="/products"');
});
it("removes executable markup, event handlers and script URLs", () => {
  const clean = sanitizeContent('<script>alert(1)</script><iframe src="https://evil.example"></iframe><svg onload="alert(1)"></svg><p onclick="alert(1)" style="display:none">Hello</p><a href="javascript:alert(1)">link</a><img src="/photo.png" onerror="alert(1)">');
  expect(clean).not.toMatch(/script|iframe|svg|onclick|onerror|style=|javascript:/);
  expect(clean).toContain('<p>Hello</p>'); expect(clean).toContain('src="/photo.png"');
});
it("rejects protocol-relative URLs and data payloads", () => {
  expect(sanitizeContent('<img src="//evil.example/p.png"><img src="data:image/svg+xml,bad">')).toBe("");
});
