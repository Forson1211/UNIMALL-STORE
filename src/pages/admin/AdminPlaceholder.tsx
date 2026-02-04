import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface AdminPlaceholderProps {
    title: string;
    description: string;
}

const AdminPlaceholder = ({ title, description }: AdminPlaceholderProps) => {
    return (
        <DashboardLayout type="admin" title={title}>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
                <div className="p-4 bg-muted rounded-full">
                    <Construction className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                    <p className="text-muted-foreground max-w-md">
                        {description}
                    </p>
                    <p className="text-sm text-muted-foreground/80">
                        This feature is currently under development.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminPlaceholder;
