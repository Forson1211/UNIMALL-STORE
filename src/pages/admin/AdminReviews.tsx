import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, MessageSquare, AlertCircle, Check, X, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const AdminReviews = () => {
    const queryClient = useQueryClient();
    const { data: reviews, isLoading } = useQuery({
        queryKey: ['admin-reviews'],
        queryFn: adminService.getReviews,
        refetchInterval: 20000,
    });

    const moderateMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
            adminService.moderateReview(id, status),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            toast.success(variables.status === 'approved' ? "Review approved" : "Review removed");
        },
        onError: (error: any) => toast.error(error.message || "Failed to update review"),
    });

    const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const filteredReviews = (status: string) => {
        if (!reviews) return [];
        if (status === 'all') return reviews;
        return reviews.filter(r => r.status === status);
    };

    return (
        <DashboardLayout type="admin" title="Reviews Management">
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Product Reviews</h1>
                        <p className="text-muted-foreground mt-1">Moderate and manage user feedback.</p>
                    </div>
                </div>

                <Tabs defaultValue="all" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="all">All Reviews</TabsTrigger>
                        <TabsTrigger value="pending" className="text-yellow-600">Pending</TabsTrigger>
                        <TabsTrigger value="flagged" className="text-red-600">Flagged</TabsTrigger>
                        <TabsTrigger value="approved" className="text-green-600">Approved</TabsTrigger>
                    </TabsList>

                    {['all', 'pending', 'flagged', 'approved'].map((tab) => (
                        <TabsContent key={tab} value={tab} className="space-y-4">
                            {isLoading ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                            ) : filteredReviews(tab).length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground">No reviews found.</div>
                            ) : (
                                filteredReviews(tab).map((review) => (
                                    <Card key={review.id} className="overflow-hidden">
                                        <CardContent className="p-6">
                                            <div className="flex gap-4">
                                                <Avatar>
                                                    <AvatarImage src={review.user?.avatar_url} />
                                                    <AvatarFallback>{getInitials(review.user?.full_name || 'Anonymous')}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-semibold">{review.user?.full_name || 'Anonymous'}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Reviewed <span className="font-medium text-foreground">{review.product?.name || 'Product'}</span> • {review.created_at ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true }) : 'Recently'}
                                                            </p>
                                                        </div>
                                                        {review.status === "pending" && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Approval</Badge>}
                                                        {review.status === "flagged" && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Flagged</Badge>}
                                                        {review.status === "approved" && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>}
                                                        {review.status === "rejected" && <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Removed</Badge>}
                                                    </div>

                                                    <div className="flex items-center gap-1 text-yellow-500">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-gray-300"}`} />
                                                        ))}
                                                    </div>

                                                    <p className="text-sm leading-relaxed">{review.comment}</p>

                                                    <div className="flex items-center gap-4 pt-2">
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            <ThumbsUp className="w-4 h-4" /> {review.likes_count || 0}
                                                        </div>
                                                        <div className="flex-1"></div>

                                                        <div className="flex gap-2">
                                                            {review.status !== "rejected" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                                    disabled={moderateMutation.isPending}
                                                                    onClick={() => moderateMutation.mutate({ id: review.id, status: "rejected" })}
                                                                >
                                                                    <X className="w-4 h-4 mr-1" /> Remove
                                                                </Button>
                                                            )}
                                                            {review.status !== "approved" && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                    disabled={moderateMutation.isPending}
                                                                    onClick={() => moderateMutation.mutate({ id: review.id, status: "approved" })}
                                                                >
                                                                    <Check className="w-4 h-4 mr-1" /> Approve
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default AdminReviews;
