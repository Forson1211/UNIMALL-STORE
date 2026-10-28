import {
  Apple, Smartphone, Sparkles, Home, Coffee, Tv, Monitor,
  Shirt, Dumbbell, Baby, Gamepad2, MoreHorizontal, type LucideIcon,
} from "lucide-react";

export interface ProductCategory {
  label: string;
  icon: LucideIcon;
}

// Single source of truth for product categories — Jumia category taxonomy
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { label: "Supermarket", icon: Apple },
  { label: "Phones & Tablets", icon: Smartphone },
  { label: "Health & Beauty", icon: Sparkles },
  { label: "Home & Office", icon: Home },
  { label: "Appliances", icon: Coffee },
  { label: "Electronics", icon: Tv },
  { label: "Computing", icon: Monitor },
  { label: "Fashion", icon: Shirt },
  { label: "Sporting Goods", icon: Dumbbell },
  { label: "Baby Products", icon: Baby },
  { label: "Gaming", icon: Gamepad2 },
  { label: "Other categories", icon: MoreHorizontal },
];
