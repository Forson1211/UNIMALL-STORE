import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import { isSafeMenuUrl, MenuLink } from "@/lib/navigation";

export default function ManagedNavigation({ location }: { location: "header" | "footer" }) {
  const { data: menus = [] } = useQuery({
    queryKey: ["navigation-menus", location],
    queryFn: async () => {
      const { data, error } = await (api as any).from("navigation_menus")
        .select("id, menu_name, menu_items").eq("menu_location", location).eq("is_active", true).order("created_at");
      if (error) throw error; return data || [];
    },
  });
  if (!menus.length) return null;
  return <nav aria-label={`${location} navigation`} className="border-y border-border/30 py-3">
    <div className="container mx-auto px-4 flex gap-5 flex-wrap text-sm font-medium">
      {menus.flatMap((menu: { id: string; menu_items: MenuLink[] }) => Array.isArray(menu.menu_items)
        ? menu.menu_items.filter(link => typeof link.url === "string" && isSafeMenuUrl(link.url)).map((link, index) =>
          link.url.startsWith("/") ? <Link key={`${menu.id}-${index}`} to={link.url} className="hover:text-primary">{link.label}</Link>
            : <a key={`${menu.id}-${index}`} href={link.url} rel="noopener noreferrer" className="hover:text-primary">{link.label}</a>) : [])}
    </div>
  </nav>;
}
