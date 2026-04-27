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
        <section className="py-20 lg:py-32 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                            <Sparkles className="w-3 h-3" />
                            Community
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-foreground tracking-tighter mb-4">
                            Campus <span className="text-primary">Connect</span>
                        </h2>
                        <p className="text-xl text-gray-500 font-medium leading-relaxed">
                            Latest trends, success stories, and updates from your university.
                        </p>
                    </div>
                    <Link to="/news" className="group flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
                        View All Stories
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {news.map((item) => (
                        <Link key={item.id} to={`/news/${item.id}`} className="group relative flex flex-col bg-white rounded-none border border-border/40 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-700 hover:-translate-y-2">
                            <div className="relative aspect-video overflow-hidden bg-muted/30">
                                <img
                                    src={item.image_url || "https://images.unsplash.com/photo-1523240695612-9a054b0db644?w=800&q=80"}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-white/80 backdrop-blur-md text-[10px] font-black uppercase tracking-widest rounded-none shadow-lg">
                                        {item.category}
                                    </span>
                                </div>
                            </div>

                            <div className="p-8 flex flex-col flex-1">
                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(item.publish_date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" />
                                        {item.author_name || "Admin"}
                                    </div>
                                </div>

                                <h3 className="text-xl font-black mb-4 group-hover:text-primary transition-colors line-clamp-2 leading-tight tracking-tight">
                                    {item.title}
                                </h3>

                                <p className="text-gray-500 text-sm font-medium line-clamp-3 mb-10 flex-1 leading-relaxed">
                                    {item.excerpt}
                                </p>

                                <div className="flex items-center text-xs font-black uppercase tracking-widest text-primary">
                                    Read Story
                                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
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
