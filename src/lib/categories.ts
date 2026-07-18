import {
  Monitor, Smartphone, Laptop, Shirt, Home, Utensils, BookOpen,
  Stethoscope, Dumbbell, Gamepad2, Gift, ShoppingBag, type LucideIcon,
} from "lucide-react";

export interface ProductCategory {
  label: string;
  icon: LucideIcon;
}

// Single source of truth for product categories — used by the vendor product
// form (what gets stored) and every category link/filter across the site
// (nav dropdown, hero sidebar, shop filters, search) so they stay in sync.
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { label: "Electronics", icon: Monitor },
  { label: "Phones & Accessories", icon: Smartphone },
  { label: "Computers", icon: Laptop },
  { label: "Fashion", icon: Shirt },
  { label: "Home & Office", icon: Home },
  { label: "Food & Snacks", icon: Utensils },
  { label: "Books & Notes", icon: BookOpen },
  { label: "Health & Beauty", icon: Stethoscope },
  { label: "Sports", icon: Dumbbell },
  { label: "Gaming", icon: Gamepad2 },
  { label: "Gifts", icon: Gift },
  { label: "Others", icon: ShoppingBag },
];
