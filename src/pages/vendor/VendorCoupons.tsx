import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, Copy, Trash2, Edit, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    usage_limit: number | null;
    usage_count: number;
    status: 'active' | 'expired' | 'disabled';
    start_date: string;
    end_date: string | null;
    created_at: string;
    created_by: string;
}

const VendorCoupons = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        discount_type: "percentage" as "percentage" | "fixed_amount",
        discount_value: "",
        usage_limit: "",
    });

    const { data: coupons, isLoading } = useQuery({
        queryKey: ['vendor-coupons', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await (supabase as any)
                .from('coupons')
                .select('*')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data as Coupon[];
        },
        enabled: !!user,
    });

    const createMutation = useMutation({
        mutationFn: async (newCoupon: any) => {
            const { error } = await (supabase as any).from('coupons').insert([{
                ...newCoupon,
                created_by: user?.id
            }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor-coupons'] });
            toast.success("Coupon created successfully!");
            setIsAddOpen(false);
            setFormData({ code: "", discount_type: "percentage", discount_value: "", usage_limit: "" });
        },
        onError: (error: any) => {
            toast.error(`Error: ${error.message}`);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any).from('coupons').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor-coupons'] });
            toast.success("Coupon deleted");
        },
        onError: (error: any) => {
            toast.error(`Error: ${error.message}`);
        }
    });

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success("Coupon code copied!");
    };

    return (
        <DashboardLayout type="vendor" title="My Coupons">
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Store Coupons</h1>
                        <p className="text-muted-foreground mt-1">Create and manage discounts for your customers.</p>
                    </div>
                    <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
                        <Plus className="w-4 h-4" /> Create Coupon
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
                ) : coupons?.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <Ticket className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">No coupons yet</h3>
                                <p className="text-muted-foreground">Create your first discount code to boost sales!</p>
                            </div>
                            <Button onClick={() => setIsAddOpen(true)}>Create Coupon</Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {coupons?.map((coupon: Coupon) => (
                            <Card key={coupon.id} className="relative overflow-hidden group border-primary/20">
                                <div className={`absolute top-0 right-0 p-3 ${coupon.status === "active" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                                    } rounded-bl-xl`}>
                                    <Ticket className="w-5 h-5" />
                                </div>

                                <CardHeader className="pb-2">
                                    <CardTitle className="text-2xl font-mono tracking-wider">{coupon.code}</CardTitle>
                                    <CardDescription className="font-medium text-primary">
                                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `GH₵ ${coupon.discount_value} OFF`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'} className="h-5 uppercase text-[10px]">
                                            {coupon.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Usage:</span>
                                        <span className="font-medium">{coupon.usage_count} / {coupon.usage_limit || '∞'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Expires:</span>
                                        <span className="font-medium text-destructive">
                                            {coupon.end_date ? new Date(coupon.end_date).toLocaleDateString() : 'Never'}
                                        </span>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/30 p-3 flex gap-2 justify-end">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleCopyCode(coupon.code)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => deleteMutation.mutate(coupon.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Coupon Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Coupon</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Coupon Code (e.g. SUMMER20)</Label>
                            <Input 
                                id="code" 
                                value={formData.code} 
                                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                placeholder="SAVE10" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={formData.discount_type} onValueChange={(val: "percentage" | "fixed_amount") => setFormData({...formData, discount_type: val})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed_amount">Fixed Amount (GH₵)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Value</Label>
                                <Input 
                                    type="number" 
                                    value={formData.discount_value} 
                                    onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                                    placeholder="10" 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="limit">Usage Limit (Leave empty for unlimited)</Label>
                            <Input 
                                id="limit" 
                                type="number" 
                                value={formData.usage_limit} 
                                onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                                placeholder="100" 
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={() => createMutation.mutate({
                            code: formData.code,
                            discount_type: formData.discount_type,
                            discount_value: parseFloat(formData.discount_value),
                            usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
                        })}>
                            Create Coupon
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default VendorCoupons;
