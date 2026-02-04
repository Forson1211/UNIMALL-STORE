import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, User, ArrowRight, Search } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { GlassCard } from "../components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const News = () => {
    const [news, setNews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const categories = ["All", "Campus Life", "Marketplace", "Events", "Technology", "Sports", "Well-being", "Career"];

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

    const filteredNews = news.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

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
                    <div className="max-w-2xl mx-auto mb-10 relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-orange-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition duration-1000 group-focus-within:opacity-100"></div>
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)] z-10" />
                            <Input
                                placeholder="Search articles, categories, or tags..."
                                className="h-16 pl-14 pr-32 rounded-full border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus-visible:ring-primary/50 focus-visible:ring-offset-0 focus-visible:ring-2 backdrop-blur-xl transition-all duration-300 text-lg text-foreground placeholder:opacity-50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-6 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm shadow-lg hover:bg-primary/90 transition-colors cursor-pointer select-none">
                                Search
                            </div>
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-wrap justify-center gap-3 mb-16">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${selectedCategory === cat
                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
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
                                <div className="text-center py-24 bg-white/[0.03] rounded-[2.5rem] border border-white/10 backdrop-blur-md">
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Search className="w-10 h-10 text-primary opacity-50" />
                                    </div>
                                    <h3 className="text-3xl font-black mb-3">No articles found</h3>
                                    <p className="text-muted-foreground text-lg">We couldn't find any articles matching your search or category.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Subscribe Section */}
                    <div className="mt-32 p-10 md:p-16 rounded-[3rem] bg-[#2a2a35] border border-white/5 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48 transition-all duration-700 group-hover:bg-primary/20" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-400/5 rounded-full blur-[120px] -ml-48 -mb-48" />

                        <div className="relative z-10">
                            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 uppercase tracking-widest text-[10px] font-bold">Newsletter</Badge>
                            <h3 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white">Stay ahead of the <span className="text-primary">Campus Curve</span></h3>
                            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">Join thousands of students who receive weekly updates on the best marketplace deals, upcoming events, and campus success stories.</p>

                            <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto" onSubmit={(e) => e.preventDefault()}>
                                <input
                                    type="email"
                                    placeholder="your-email@university.edu"
                                    className="flex-1 h-16 px-8 rounded-full bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg text-white placeholder:text-white/20"
                                />
                                <Button className="h-16 rounded-full px-12 font-black text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    Subscribe Now
                                </Button>
                            </form>
                            <p className="mt-6 text-xs text-white/40">We respect your privacy. Unsubscribe at any time.</p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default News;
