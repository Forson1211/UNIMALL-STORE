import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Users, Shield, Sparkles, Store } from "lucide-react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

const HeroSection = () => {
  const { heroBackgroundUrl, heroOverlayOpacity } = useSiteSettingsContext();

  const stats = [
    { value: "5,000+", label: "Active Students", icon: Users },
    { value: "1,200+", label: "Products Listed", icon: ShoppingBag },
    { value: "50+", label: "Campus Vendors", icon: Store },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Campus Photo Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: heroBackgroundUrl ? `url(${heroBackgroundUrl})` : 'url(https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2000&auto=format&fit=crop)',
        }}
      />

      {/* Primary Color Gradient Overlay - removed dark overrides to keep consistent */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-primary to-secondary"
        style={{ opacity: heroOverlayOpacity }}
      />

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl animate-pulse-soft" />

      {/* Floating Icons */}
      <div className="absolute top-1/4 right-[15%] hidden lg:block animate-float">
        <div className="w-16 h-16 bg-primary-foreground/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-primary-foreground" />
        </div>
      </div>
      <div className="absolute bottom-1/3 left-[10%] hidden lg:block animate-float-delayed">
        <div className="w-14 h-14 bg-primary/30 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-primary-foreground" />
        </div>
      </div>
      <div className="absolute top-1/2 right-[8%] hidden lg:block animate-float">
        <div className="w-12 h-12 bg-secondary/30 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <Users className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pt-20 pb-10 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full text-primary-foreground/90 text-sm font-medium mb-2 animate-fade-in">
            <Shield className="w-4 h-4" />
            Trusted by students across 20+ campuses
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-primary-foreground leading-[1] mb-2 animate-fade-in-up">
            Your Campus
            <br />
            <span className="text-primary-foreground">
              Marketplace
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-4 leading-tight animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Buy and sell products within your campus community. Safe, easy, and made for students like you.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/products">
              <Button variant="glass" size="xl" className="w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Start Shopping
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/signup?role=vendor">
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10">
                Become a Vendor
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl max-w-3xl mx-auto animate-fade-in-up hover:bg-white/15 transition-colors duration-300" style={{ animationDelay: "0.3s" }}>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-8 md:gap-0 divide-x divide-white/10">
              {stats.map((stat, index) => (
                <div key={index} className="flex flex-col items-center justify-center px-1 sm:px-4 group select-none">
                  <div className="w-8 h-8 sm:w-14 sm:h-14 mb-2 sm:mb-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center backdrop-blur-sm shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-white/10">
                    <stat.icon className="w-4 h-4 sm:w-7 sm:h-7 text-white drop-shadow-md" />
                  </div>
                  <div className="text-sm sm:text-3xl md:text-4xl font-black text-white mb-0.5 sm:mb-1 tracking-tight drop-shadow-sm whitespace-nowrap">{stat.value}</div>
                  <div className="text-[10px] sm:text-sm font-bold text-white/90 uppercase tracking-wider text-center leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
