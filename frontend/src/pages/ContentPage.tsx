import { ReactNode, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { sanitizeContent } from "@/lib/sanitizeContent";

export default function ContentPage({ slug, fallback }: { slug?: string; fallback?: ReactNode }) {
  const params = useParams();
  const pageSlug = slug || params.slug;
  const { data: page, isLoading, error, refetch } = useQuery({
    queryKey: ["published-page", pageSlug], enabled: !!pageSlug,
    queryFn: async () => {
      const { data, error } = await (api as any).from("site_pages").select("title, content, meta_title")
        .eq("slug", pageSlug).eq("is_published", true).maybeSingle();
      if (error) throw error; return data;
    },
  });
  const html = useMemo(() => sanitizeContent(page?.content?.html || ""), [page?.content?.html]);
  useEffect(() => { if (page) document.title = `${page.meta_title || page.title} | Unimall`; }, [page]);
  if (!page && fallback && !isLoading) return <>{fallback}</>;
  return <div className="min-h-screen bg-background"><Navbar /><main className="container max-w-4xl mx-auto px-4 pt-28 pb-24">
    {isLoading ? <p role="status">Loading page...</p> : error ? <div role="alert"><p className="mb-4">Unable to load this page.</p><Button onClick={() => refetch()}>Try again</Button></div>
      : page ? <><h1 className="text-3xl font-bold mb-8">{page.title}</h1><article className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} /></>
      : <div className="text-center"><h1 className="text-2xl font-bold mb-4">Page unavailable</h1><p className="text-muted-foreground mb-6">This page has not been published.</p><Button asChild><Link to="/">Go home</Link></Button></div>}
  </main><Footer /></div>;
}
