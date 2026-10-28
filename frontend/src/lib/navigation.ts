export interface MenuLink { label: string; url: string }
export function isSafeMenuUrl(url: string) {
  return (/^\/(?!\/)/.test(url) && !/[\\\s]/.test(url)) || /^https:\/\/[^\s\\]+$/i.test(url);
}
