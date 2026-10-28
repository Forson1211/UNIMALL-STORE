const ALLOWED_TAGS = new Set(["P", "BR", "HR", "STRONG", "EM", "B", "I", "U", "S", "UL", "OL", "LI", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6", "A", "IMG", "DIV", "SPAN", "PRE", "CODE", "TABLE", "THEAD", "TBODY", "TR", "TD", "TH"]);
const DROP_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "FORM", "INPUT", "BUTTON", "TEXTAREA", "SELECT", "TEMPLATE"]);
function safeUrl(value: string) {
  return (/^\/(?!\/)/.test(value) && !/[\\\s]/.test(value)) || /^https:\/\/[^\s\\]+$/i.test(value);
}
export function sanitizeContent(html: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  const clean = (node: Element) => {
    Array.from(node.children).forEach(child => {
      if (DROP_TAGS.has(child.tagName)) { child.remove(); return; }
      clean(child);
      if (!ALLOWED_TAGS.has(child.tagName)) { child.replaceWith(...Array.from(child.childNodes)); return; }
      const href = child.getAttribute("href");
      const src = child.getAttribute("src");
      const alt = child.getAttribute("alt");
      Array.from(child.attributes).forEach(attribute => child.removeAttribute(attribute.name));
      if (child.tagName === "A" && href && safeUrl(href)) { child.setAttribute("href", href); child.setAttribute("rel", "noopener noreferrer"); }
      if (child.tagName === "IMG") {
        if (!src || !safeUrl(src)) { child.remove(); return; }
        child.setAttribute("src", src); child.setAttribute("alt", alt || ""); child.setAttribute("loading", "lazy");
      }
    });
  };
  clean(document.body);
  return document.body.innerHTML;
}
