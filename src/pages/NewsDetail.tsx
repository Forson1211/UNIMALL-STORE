import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, User, ArrowLeft, Share2, MessageSquare } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const NewsDetail = () => {
    const { id } = useParams();
    const [item, setItem] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNewsDetail = async () => {
            const { data, error } = await (supabase as any)
                .from("campus_news")
                .select("*")
                .eq("id", id)
                .single();

            if (!error && data) {
                setItem(data);
            }
            setIsLoading(false);
        };

        fetchNewsDetail();
    }, [id]);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!item) return <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">News article not found</h1>
        <Button asChild><Link to="/news">Return to News</Link></Button>
    </div>;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 py-12 md:py-20 px-6">
                <div className="container mx-auto max-w-4xl">
                    <Link to="/news" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-12">
                        <ArrowLeft className="w-4 h-4" />
                        Back to all news
                    </Link>

                    <div className="mb-12">
                        <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
                            {item.category}
                        </Badge>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-8 leading-[1.1]">
                            {item.title}
                        </h1>

                        <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold">Campus Connect Admin</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(item.publish_date).toLocaleDateString("en-US", {
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric"
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" className="rounded-full">
                                    <Share2 className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="rounded-full">
                                    <MessageSquare className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="relative aspect-video rounded-3xl overflow-hidden mb-16 shadow-2xl shadow-black/20">
                        <img
                            src={item.image_url || "https://images.unsplash.com/photo-1523240695612-9a054b0db644?w=1200&q=80"}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="prose prose-invert max-w-none text-lg leading-relaxed text-muted-foreground">
                        <div dangerouslySetInnerHTML={{ __html: item.content }} />
                    </div>

                    <Separator className="my-16 bg-white/10" />

                    <div className="p-8 md:p-12 rounded-3xl bg-primary/5 border border-primary/10 text-center mb-20">
                        <h3 className="text-2xl font-bold mb-4">Want more campus updates?</h3>
                        <p className="text-muted-foreground mb-8">Subscribe to our newsletter to get the latest student stories and marketplace deals directly in your inbox.</p>
                        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <input type="email" placeholder="student@campus.edu" className="flex-1 h-12 px-6 rounded-full bg-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-black" />
                            <Button className="h-12 rounded-full px-8">Subscribe</Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NewsDetail;
