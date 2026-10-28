import { api } from "@/integrations/api/client";

const TABLES = ["profiles", "products", "orders", "order_items", "transactions", "reviews", "coupons", "support_tickets", "site_settings", "site_pages", "navigation_menus"];
export async function exportMarketplaceData() {
  const tables: Record<string, unknown[]> = {};
  for (const table of TABLES) {
    const rows: unknown[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await (api as any).from(table).select("*").order("id").range(offset, offset + 499);
      if (error) throw new Error(`Unable to export ${table}: ${error.message}`);
      rows.push(...(data || []));
      if (!data || data.length < 500) break;
    }
    tables[table] = rows;
  }
  const now = new Date().toISOString();
  const blob = new Blob([JSON.stringify({ format: "unimall-data-export-v1", exportedAt: now, tables }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `unimall-data-${now.slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return now;
}
