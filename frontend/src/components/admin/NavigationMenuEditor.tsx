import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { isSafeMenuUrl, MenuLink } from "@/lib/navigation";

interface Menu { id: string; menu_name: string; menu_location: string; menu_items: MenuLink[]; is_active: boolean }
export default function NavigationMenuEditor() {
  const client = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("header");
  const [active, setActive] = useState(true);
  const [links, setLinks] = useState<MenuLink[]>([{ label: "", url: "/" }]);
  const [busy, setBusy] = useState(false);
  const { data: menus = [], isLoading, error } = useQuery({
    queryKey: ["navigation-menus", "admin"], queryFn: async (): Promise<Menu[]> => {
      const { data, error } = await (api as any).from("navigation_menus").select("*").order("created_at");
      if (error) throw error; return data || [];
    },
  });
  const edit = (menu?: Menu) => {
    setSelected(menu?.id || null); setName(menu?.menu_name || ""); setLocation(menu?.menu_location || "header");
    setActive(menu?.is_active ?? true); setLinks(menu?.menu_items || [{ label: "", url: "/" }]);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return;
    if (!name.trim() || !links.length || links.some(link => !link.label.trim() || !isSafeMenuUrl(link.url))) {
      toast.error("Give every link a label and a valid path or HTTPS URL."); return;
    }
    setBusy(true);
    try {
      const payload = { menu_name: name.trim(), menu_location: location, is_active: active, menu_items: links };
      const result = selected ? await (api as any).from("navigation_menus").update(payload).eq("id", selected)
        : await (api as any).from("navigation_menus").insert(payload);
      if (result.error) throw result.error;
      await client.invalidateQueries({ queryKey: ["navigation-menus"] }); toast.success("Navigation saved");
    } catch (error) { toast.error((error as Error).message); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!selected || busy) return; setBusy(true);
    try {
      const { error } = await (api as any).from("navigation_menus").delete().eq("id", selected);
      if (error) throw error;
      edit(); await client.invalidateQueries({ queryKey: ["navigation-menus"] }); toast.success("Menu deleted");
    } catch (error) { toast.error((error as Error).message); } finally { setBusy(false); }
  };
  return <div className="grid md:grid-cols-[200px_1fr] gap-6">
    <div className="space-y-2"><Button variant="outline" onClick={() => edit()} disabled={busy}>New menu</Button>{isLoading && <p>Loading menus...</p>}{error && <p role="alert">Unable to load menus.</p>}{menus.map(menu => <Button key={menu.id} variant={selected === menu.id ? "secondary" : "ghost"} className="w-full justify-start" disabled={busy} onClick={() => edit(menu)}>{menu.menu_name}</Button>)}</div>
    <form className="space-y-4" onSubmit={save}><div><Label htmlFor="menu-name">Menu name</Label><Input id="menu-name" required value={name} onChange={e => setName(e.target.value)} /></div>
      <div><Label htmlFor="menu-location">Location</Label><select id="menu-location" className="block w-full border rounded-md p-2 bg-background" value={location} onChange={e => setLocation(e.target.value)}><option value="header">Header</option><option value="footer">Footer</option></select></div>
      <label className="flex gap-3 items-center"><Switch checked={active} onCheckedChange={setActive} />Publish menu</label>
      {links.map((link, index) => <div key={index} className="flex gap-2 flex-wrap"><Input aria-label={`Link ${index + 1} label`} className="flex-1 min-w-32" placeholder="Label" value={link.label} onChange={e => setLinks(links.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} required /><Input aria-label={`Link ${index + 1} URL`} className="flex-1 min-w-32" placeholder="/products" value={link.url} onChange={e => setLinks(links.map((item, i) => i === index ? { ...item, url: e.target.value } : item))} required /><Button type="button" variant="ghost" onClick={() => setLinks(links.filter((_, i) => i !== index))}>Remove</Button></div>)}
      <div className="flex gap-3 flex-wrap"><Button type="button" variant="outline" onClick={() => setLinks([...links, { label: "", url: "/" }])}>Add link</Button><Button disabled={busy}>{busy ? "Saving..." : "Save menu"}</Button>{selected && <Button type="button" variant="destructive" disabled={busy} onClick={remove}>Delete menu</Button>}</div>
    </form></div>;
}
