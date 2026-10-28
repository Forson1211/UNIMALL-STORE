import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function MediaLibrary() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: files = [], isLoading, error } = useQuery({
    queryKey: ["media-library"], queryFn: async () => {
      const { data, error } = await (api as any).from("media_library").select("*").order("uploaded_at", { ascending: false });
      if (error) throw error; return data || [];
    },
  });
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; const input = event.target;
    if (!file || !user || busy) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error("Choose a PNG, JPEG, WebP or GIF image under 5 MB."); input.value = ""; return;
    }
    setBusy(true);
    const extension = ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" } as Record<string, string>)[file.type];
    const path = `library/${user.id}/${crypto.randomUUID()}.${extension}`;
    try {
      const { error } = await api.storage.from("site-assets").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = api.storage.from("site-assets").getPublicUrl(path);
      const result = await (api as any).from("media_library").insert({ file_name: file.name,
        file_url: data.publicUrl, file_type: "image", file_size: file.size, uploaded_by: user.id, alt_text: file.name });
      if (result.error) { await api.storage.from("site-assets").remove([path]); throw result.error; }
      await client.invalidateQueries({ queryKey: ["media-library"] }); toast.success("Image uploaded");
    } catch (error) { toast.error((error as Error).message); }
    finally { setBusy(false); input.value = ""; }
  };
  return <div className="space-y-6">
    <label className="block border-2 border-dashed rounded-xl p-6"><span className="block font-medium mb-2">Upload an image</span><span className="block text-sm text-muted-foreground mb-3">PNG, JPEG, WebP or GIF, up to 5 MB</span><Input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} disabled={busy} aria-label="Upload library image" />{busy && <p role="status" className="mt-2">Uploading...</p>}</label>
    {isLoading && <p role="status">Loading media...</p>}{error && <p role="alert">Unable to load your media library.</p>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{files.map((file: { id: string; file_url: string; alt_text: string; file_name: string }) => <article key={file.id} className="border rounded-xl overflow-hidden"><img src={file.file_url} alt={file.alt_text || file.file_name} className="aspect-video object-cover w-full" /><div className="p-3"><p className="text-sm truncate mb-2">{file.file_name}</p><Button variant="outline" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(file.file_url); toast.success("Image URL copied"); } catch { toast.error("Unable to copy. Open the image and copy its URL."); } }}>Copy image URL</Button><a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary ml-3">Open</a></div></article>)}</div>
    {!isLoading && !error && !files.length && <p className="text-muted-foreground">Your media library is empty.</p>}
  </div>;
}
