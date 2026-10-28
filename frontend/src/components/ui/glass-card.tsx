import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
}

export const GlassCard = ({ children, className }: GlassCardProps) => {
    return (
        <div
            className={cn(
                "bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl",
                className
            )}
        >
            {children}
        </div>
    );
};

export default GlassCard;
