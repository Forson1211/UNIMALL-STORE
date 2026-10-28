import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  description?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'secondary' | 'warning';
}

const variantStyles = {
  default: "bg-card",
  primary: "bg-primary/5 border-primary/20",
  secondary: "bg-secondary/5 border-secondary/20",
  warning: "bg-gold/5 border-gold/20",
};

const iconStyles = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  warning: "bg-gold/10 text-gold",
};

export function StatsCard({ title, value, change, description, icon: Icon, variant = 'default' }: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className={cn("transition-all duration-300 hover:shadow-md", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground">{value}</h3>
            {change !== undefined ? (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-sm font-medium",
                isPositive && "text-primary",
                isNegative && "text-destructive"
              )}>
                {isPositive && <TrendingUp className="w-4 h-4" />}
                {isNegative && <TrendingDown className="w-4 h-4" />}
                <span>{isPositive ? '+' : ''}{change}%</span>
                <span className="text-muted-foreground font-normal">vs last month</span>
              </div>
            ) : description && (
              <p className="text-sm text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
