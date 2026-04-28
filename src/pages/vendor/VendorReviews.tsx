import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Star, MessageSquare, Loader2, User, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

const VendorReviews = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [replyText, setReplyText] = useState("");

    const { data: reviews, isLoading } = useQuery({
        queryKey: ['vendor-reviews', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await (supabase as any)
                .from('reviews')
                .select(`
                    *,
                    product:products!inner(name, image_url, vendor_id),
                    user:profiles(full_name, avatar_url)
                `)
                .eq('product.vendor_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data as any[];
        },
        enabled: !!user,
    });

    const replyMutation = useMutation({
        mutationFn: async ({ reviewId, reply }: { reviewId: string, reply: string }) => {
            const { error } = await (supabase as any)
                .from('reviews')
                .update({ 
                    vendor_reply: reply,
                    vendor_reply_at: new Date().toISOString()
                })
                .eq('id', reviewId);
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor-reviews'] });
            toast.success("Reply sent successfully");
            setReplyingTo(null);
            setReplyText("");
        },
        onError: (error: any) => {
            toast.error(`Failed to send reply: ${error.message}`);
        }
    });

    const averageRating = reviews?.length 
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
        : 0;

    if (isLoading) {
        return (
            <DashboardLayout type="vendor" title="Product Reviews">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="vendor" title="Product Reviews">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Average Rating</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-bold">{averageRating}</span>
                                <div className="flex text-yellow-400">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className={`w-5 h-5 ${star <= Math.round(Number(averageRating)) ? 'fill-current' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Based on {reviews?.length || 0} reviews</p>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Review Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between gap-6">
                                <div className="space-y-2 flex-1">
                                    {[5, 4, 3, 2, 1].map((rating) => {
                                        const count = reviews?.filter(r => r.rating === rating).length || 0;
                                        const percentage = reviews?.length ? (count / reviews.length) * 100 : 0;
                                        return (
                                            <div key={rating} className="flex items-center gap-2">
                                                <span className="text-xs w-4">{rating}</span>
                                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                                                </div>
                                                <span className="text-xs text-muted-foreground w-8">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="hidden sm:block text-center px-6 border-l">
                                    <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-2xl font-bold">{reviews?.length || 0}</p>
                                    <p className="text-xs text-muted-foreground">Total Feedback</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">All Customer Reviews</h3>
                    {reviews?.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                <p>No reviews received yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        reviews?.map((review) => (
                            <Card key={review.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                                                        {review.user?.avatar_url ? (
                                                            <img src={review.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-5 h-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm">{review.user?.full_name || "Anonymous Buyer"}</p>
                                                        <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5 text-yellow-400">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-current' : 'text-gray-200'}`} />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-sm leading-relaxed">{review.comment}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[10px] font-normal uppercase bg-muted/50">
                                                        Product: {review.product?.name}
                                                    </Badge>
                                                    {review.status === 'pending' && <Badge variant="outline" className="text-[10px] font-normal uppercase border-yellow-200 text-yellow-700 bg-yellow-50">Pending Approval</Badge>}
                                                </div>
                                            </div>

                                            {review.vendor_reply && (
                                                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10 ml-4 relative">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 rounded-full" />
                                                    <div className="flex justify-between items-start mb-2">
                                                        <p className="text-xs font-bold text-primary flex items-center gap-2">
                                                            <MessageSquare className="w-3 h-3" />
                                                            Your Store's Reply
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {new Date(review.vendor_reply_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm italic text-muted-foreground">"{review.vendor_reply}"</p>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-6 px-2 text-[10px] mt-2"
                                                        onClick={() => {
                                                            setReplyingTo(review);
                                                            setReplyText(review.vendor_reply);
                                                        }}
                                                    >
                                                        Edit Reply
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="md:w-48 flex-shrink-0">
                                            {!review.vendor_reply && (
                                                <Button 
                                                    className="w-full" 
                                                    variant="outline"
                                                    onClick={() => {
                                                        setReplyingTo(review);
                                                        setReplyText("");
                                                    }}
                                                >
                                                    Reply to Review
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <Dialog open={!!replyingTo} onOpenChange={(open) => !open && setReplyingTo(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reply to {replyingTo?.user?.full_name || "Customer"}</DialogTitle>
                        <DialogDescription>
                            Your reply will be visible to all customers on the product page.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-muted rounded-md text-sm italic">
                            "{replyingTo?.comment}"
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Your Response</label>
                            <Textarea 
                                placeholder="Type your reply here..." 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReplyingTo(null)}>Cancel</Button>
                        <Button 
                            disabled={!replyText.trim() || replyMutation.isPending}
                            onClick={() => replyMutation.mutate({ 
                                reviewId: replyingTo.id, 
                                reply: replyText 
                            })}
                        >
                            {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Send Reply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default VendorReviews;
