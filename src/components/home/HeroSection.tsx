import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Phone, 
  Store, 
  Truck, 
  Smartphone, 
  Monitor, 
  Shirt, 
  Gamepad2, 
  Baby, 
  Dumbbell, 
  Laptop, 
  Home, 
  Utensils, 
  Camera, 
  ShoppingBag,
  ChevronRight,
  Headphones,
  Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  { name: "Supermarket", icon: Utensils },
  { name: "Phones & Tablets", icon: Smartphone },
  { name: "Health & Beauty", icon: Stethoscope },
  { name: "Home & Office", icon: Home },
  { name: "Appliances", icon: Headphones },
  { name: "Electronics", icon: Camera },
  { name: "Computing", icon: Laptop },
  { name: "Fashion", icon: Shirt },
  { name: "Sporting Goods", icon: Dumbbell },
  { name: "Baby Products", icon: Baby },
  { name: "Gaming", icon: Gamepad2 },
  { name: "Other categories", icon: ShoppingBag },
];

const HeroSection = () => {
  return (
    <section className="bg-[#f1f1f2] py-2 md:py-6">
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex flex-col lg:flex-row gap-2 md:gap-4 h-full lg:h-[420px]">
          
          {/* 1. Left Sidebar: Categories - Hidden on mobile, shown on large screens */}
          <div className="hidden lg:flex flex-col w-64 bg-white rounded-none shadow-sm border border-border/40 overflow-hidden">
            <div className="flex-1 py-2 overflow-y-auto custom-scrollbar">
              {categories.map((cat, i) => (
                <Link 
                  key={i} 
                  to={`/products?category=${cat.name}`}
                  className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <cat.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    <span className="text-[13px] text-foreground/80 group-hover:text-primary transition-colors">{cat.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* 2. Center: Main Banner Slider - Responsive height and text sizing */}
          <div className="flex-1 relative rounded-none overflow-hidden shadow-sm group min-h-[250px] md:min-h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 to-orange-400/40 z-10" />
            <img 
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop" 
              alt="Promotion" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
            />
            
            <div className="relative z-20 h-full flex flex-col justify-center px-6 md:px-16 py-8 md:py-0 space-y-4 md:space-y-6">
              <div className="space-y-1 md:space-y-2">
                 <h2 className="text-white text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-none md:leading-[0.9]">
                    UNIMALL <br /> BRAND DAY
                 </h2>
                 <p className="text-white/90 text-sm md:text-xl lg:text-2xl font-bold tracking-tight">
                    Up to <span className="text-yellow-300 font-black">40% OFF</span> on tech
                 </p>
              </div>
              <div className="pt-2 md:pt-4">
                 <Link to="/products">
                    <Button className="h-10 md:h-12 px-8 md:px-10 bg-white text-black font-black text-[10px] md:text-xs uppercase tracking-widest rounded-none hover:bg-gray-100 transition-all shadow-xl">
                       Shop Now
                    </Button>
                 </Link>
              </div>
            </div>

            {/* Pagination dots */}
            <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex justify-center gap-1.5 md:gap-2 z-20">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-none ${i === 1 ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          </div>

          {/* 3. Right Side: Quick Links - Shown on large screens, stacks on very wide screens */}
          <div className="hidden xl:flex flex-col w-64 gap-4">
            <div className="bg-white p-4 rounded-none shadow-sm border border-border/40 flex flex-col gap-5">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Phone className="w-5 h-5 text-primary group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase leading-none mb-1">Call / WhatsApp</p>
                  <p className="text-[13px] font-black">0302740642</p>
                </div>
              </div>

              <Link to="/vendor" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Store className="w-5 h-5 text-primary group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase leading-none mb-1">Sell on Unimall</p>
                  <p className="text-[13px] font-black">Make more money</p>
                </div>
              </Link>

              <Link to="/account/orders" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Truck className="w-5 h-5 text-primary group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase leading-none mb-1">Track your order</p>
                  <p className="text-[13px] font-black">Stay up to date</p>
                </div>
              </Link>
            </div>

            <div className="flex-1 bg-white rounded-none shadow-sm border border-border/40 overflow-hidden relative group">
                <img 
                  src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000&auto=format&fit=crop" 
                  alt="Home Makeover" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="text-center p-4">
                        <h3 className="text-white text-xl lg:text-3xl font-black leading-none tracking-tighter uppercase mb-2">Home <br /> Makeover</h3>
                        <div className="h-1 w-12 bg-white mx-auto" />
                    </div>
                </div>
            </div>
          </div>

          {/* Mobile Categories - Horizontal Scroll (Optional but good for UX) */}
          <div className="lg:hidden flex overflow-x-auto gap-2 py-2 no-scrollbar px-2">
              {categories.slice(0, 6).map((cat, i) => (
                  <Link 
                    key={i} 
                    to={`/products?category=${cat.name}`}
                    className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-white shadow-sm border border-border/20 rounded-none gap-2"
                  >
                      <cat.icon className="w-5 h-5 text-primary" />
                      <span className="text-[9px] font-bold text-center leading-none px-1">{cat.name.split(' ')[0]}</span>
                  </Link>
              ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
