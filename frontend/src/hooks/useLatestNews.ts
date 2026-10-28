import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";

// Homepage and footer previews share a small response instead of full articles.
export function useLatestNews() {
  return useQuery({
    queryKey: ["latest-news-previews"],
    queryFn: async ({ signal }) => {
      const { data, error } = await api.from("campus_news")
        .select("id, title, excerpt, image_url, category, publish_date")
        .eq("is_published", true)
        .order("publish_date", { ascending: false })
        .limit(3)
        .abortSignal(signal);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
