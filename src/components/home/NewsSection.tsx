import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/dbUtils";
import { ArrowRight, Calendar, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewsItem {
    id: string;
    title: string;
    excerpt: string;
    image_url: string;
    category: string;
    publish_date: string;
    author_name?: string;
}

const NewsSection = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            const data = await withRetry(async () => {
                const { data, error } = await (supabase as any)
                    .from("campus_news")
                    .select("*")
                    .eq("is_published", true)
                    .order("publish_date", { ascending: false })
                    .limit(3);
                if (error) throw error;
                return data;
            }, null, { retries: 2, baseDelay: 2000 });

            if (data) setNews(data as NewsItem[]);
            setIsLoading(false);
        };

        fetchNews();
    }, []);

    if (isLoading || news.length === 0) return null;

    return (
        <section className="py-16 md:py-32 bg-white relative overflow-hidden border-t border-border/40">
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-20 gap-6 md:gap-8">
                    <div className="max-w-none">
                        <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-none bg-foreground text-white text-xs md:text-sm font-black uppercase tracking-widest mb-4 md:mb-6">
                            <Sparkles className="w-3 md:w-3.5 h-3 md:h-3.5" />
                            Campus Pulse
                        </div>
                        <h2 className="text-2xl md:text-5xl lg:text-7xl font-black text-foreground tracking-tighter mb-4 leading-tight uppercase">
                            Connect & <span className="text-primary">Discover</span>
                        </h2>
                        <p className="text-base md:text-lg lg:text-xl text-muted-foreground font-semibold leading-relaxed max-w-md">
                            Success stories, marketplace trends, and the latest university updates.
                        </p>
                    </div>
                    <Link to="/news" className="group flex items-center gap-3 text-xs md:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all pb-2 border-b-2 border-transparent hover:border-primary w-fit">
                        All Stories
                        <ArrowRight className="w-4 md:w-5 h-4 md:h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border/40">
                    {news.map((item) => (
                        <Link key={item.id} to={`/news/${item.id}`} className="group relative flex flex-col bg-white rounded-none border border-border/20 overflow-hidden hover:bg-muted/30 transition-all duration-500">
                            <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
                                <img
                                    src={item.image_url || "https://images.unsplash.com/photo-1523240695612-9a054b0db644?w=800&q=80"}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                                <div className="absolute top-0 left-0">
                                    <span className="px-3 py-1.5 md:px-4 md:py-2 bg-foreground text-white text-xs md:text-sm font-black uppercase tracking-widest rounded-none shadow-2xl">
                                        {item.category}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 md:p-10 flex flex-col flex-1 space-y-4 md:space-y-6">
                                <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground/60">
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                        <Calendar className="w-3 md:w-3.5 h-3 md:h-3.5" />
                                        {new Date(item.publish_date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                        <User className="w-3 md:w-3.5 h-3 md:h-3.5" />
                                        {item.author_name || "Official"}
                                    </div>
                                </div>

                                <div className="space-y-3 md:space-y-4">
                                    <h3 className="text-xl md:text-2xl font-black group-hover:text-primary transition-colors line-clamp-2 leading-tight tracking-tight uppercase">
                                        {item.title}
                                    </h3>
                                    <div className="h-1 w-10 md:w-12 bg-primary/20 group-hover:w-24 transition-all duration-500" />
                                </div>

                                <p className="text-muted-foreground text-sm font-bold line-clamp-3 mb-6 md:mb-8 flex-1 leading-relaxed">
                                    {item.excerpt}
                                </p>

                                <div className="flex items-center text-xs md:text-sm font-black uppercase tracking-widest text-primary group-hover:translate-x-2 transition-transform duration-300">
                                    Read Article
                                    <ArrowRight className="ml-2 md:ml-3 w-3.5 md:w-4 h-3.5 md:h-4" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NewsSection;
