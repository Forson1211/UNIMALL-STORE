import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/dbUtils";
import { ArrowRight, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "../ui/glass-card";

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

    // Don't render the section at all if no news or still loading
    if (isLoading || news.length === 0) return null;

    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl text-center md:text-left">
                        <Badge variant="outline" className="mb-4 px-4 py-1 border-primary/20 text-primary bg-primary/5 animate-fade-in">
                            Campus News
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                            Latest from <span className="text-primary">Campus Connect</span>
                        </h2>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Stay updated with the latest happenings, trends, and success stories from your campus community.
                        </p>
                    </div>
                    <Button variant="ghost" className="group text-primary hover:text-primary hover:bg-primary/5" asChild>
                        <Link to="/news">
                            View All News
                            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {news.map((item) => (
                        <Link key={item.id} to={`/news/${item.id}`} className="group">
                            <GlassCard className="h-full flex flex-col p-0 overflow-hidden border-white/10 hover:border-primary/20 transition-all duration-500 hover:-translate-y-1 shadow-xl shadow-black/5">
                                <div className="relative h-56 overflow-hidden">
                                    <img
                                        src={item.image_url || "https://images.unsplash.com/photo-1523240695612-9a054b0db644?w=800&q=80"}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-primary/90 text-white backdrop-blur-md border-none px-3 py-1">
                                            {item.category}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-1">
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(item.publish_date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            {item.author_name || "Admin"}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                        {item.title}
                                    </h3>

                                    <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                                        {item.excerpt}
                                    </p>

                                    <div className="flex items-center text-sm font-bold text-primary">
                                        Read Story
                                        <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NewsSection;
