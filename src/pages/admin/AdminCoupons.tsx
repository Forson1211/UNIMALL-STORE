import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, Copy, Trash2, Edit, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";

const AdminCoupons = () => {
    const { data: coupons, isLoading } = useQuery({
        queryKey: ['admin-coupons'],
        queryFn: adminService.getCoupons,
        refetchInterval: 30000,
    });

    return (
        <DashboardLayout type="admin" title="Coupons & Promotions">
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
                        <p className="text-muted-foreground mt-1">Manage discounts and promotional codes.</p>
                    </div>
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" /> Create Coupon
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {coupons?.map((coupon) => (
                            <Card key={coupon.id} className="relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 p-3 ${coupon.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                    } rounded-bl-xl`}>
                                    <Ticket className="w-5 h-5" />
                                </div>

                                <CardHeader className="pb-2">
                                    <CardTitle className="text-2xl font-mono tracking-wider">{coupon.code}</CardTitle>
                                    <CardDescription className="font-medium text-primary">
                                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `$${coupon.discount_value} OFF`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Type:</span>
                                        <span className="font-medium capitalize">{coupon.discount_type.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Usage:</span>
                                        <span className="font-medium">{coupon.usage_count} / {coupon.usage_limit || '∞'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Starts:</span>
                                        <span className="font-medium">{new Date(coupon.start_date).toLocaleDateString()}</span>
                                    </div>

                                    <div className="pt-2">
                                        <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'} className="w-full justify-center py-1 uppercase">
                                            {coupon.status}
                                        </Badge>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/30 p-4 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" className="h-8 w-8 p-0">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminCoupons;
