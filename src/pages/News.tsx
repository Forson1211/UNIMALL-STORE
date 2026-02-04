import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, User, ArrowRight, Search } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { GlassCard } from "../components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const News = () => {
    const [news, setNews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchNews = async () => {
            const { data, error } = await (supabase as any)
                .from("campus_news")
                .select("*")
                .eq("is_published", true)
                .order("publish_date", { ascending: false });

            if (error) {
                console.error("Error fetching news:", error);
            } else if (data) {
                setNews(data);
            }
            setIsLoading(false);
        };

        fetchNews();
    }, []);

    const filteredNews = news.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 py-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                            The Campus Feed
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                            Campus <span className="text-primary">News</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Your daily source for campus updates, student spotlight, and the latest marketplace trends.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto mb-20 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search articles, categories, or tags..."
                            className="h-14 pl-14 pr-6 rounded-full border-white/10 bg-white/5 focus-visible:ring-primary backdrop-blur-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {isLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-pulse space-y-4">
                                    <div className="aspect-[16/10] bg-muted rounded-2xl" />
                                    <div className="h-4 bg-muted rounded w-1/4" />
                                    <div className="h-6 bg-muted rounded w-3/4" />
                                    <div className="h-4 bg-muted rounded w-full" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {filteredNews.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredNews.map((item) => (
                                        <Link key={item.id} to={`/news/${item.id}`}>
                                            <GlassCard className="h-full group hover:border-primary/30 transition-all duration-300 p-0 overflow-hidden">
                                                <div className="relative aspect-[16/10]">
                                                    <img
                                                        src={item.image_url || "https://images.unsplash.com/photo-1523240695612-9a054b0db644?w=800&q=80"}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute top-4 left-4">
                                                        <Badge className="bg-primary/90 text-white backdrop-blur-md border-none px-3 py-1">
                                                            {item.category}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="p-8">
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {new Date(item.publish_date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-muted-foreground text-sm line-clamp-3 mb-6">
                                                        {item.excerpt}
                                                    </p>
                                                    <div className="flex items-center text-sm font-bold text-primary group">
                                                        Read More
                                                        <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                                    <h3 className="text-2xl font-bold mb-2">No news articles found</h3>
                                    <p className="text-muted-foreground">Try searching for something else or check back later.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default News;
