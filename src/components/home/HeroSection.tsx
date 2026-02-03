import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Users, Shield, Sparkles } from "lucide-react";

const HeroSection = () => {
  const stats = [
    { value: "5,000+", label: "Active Students" },
    { value: "1,200+", label: "Products Listed" },
    { value: "50+", label: "Campus Vendors" },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse-soft" />
      
      {/* Floating Icons */}
      <div className="absolute top-1/4 right-[15%] hidden lg:block animate-float">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-white" />
        </div>
      </div>
      <div className="absolute bottom-1/3 left-[10%] hidden lg:block animate-float-delayed">
        <div className="w-14 h-14 bg-coral/30 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
      </div>
      <div className="absolute top-1/2 right-[8%] hidden lg:block animate-float">
        <div className="w-12 h-12 bg-gold/30 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-8 animate-fade-in">
            <Shield className="w-4 h-4" />
            Trusted by students across 20+ campuses
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6 animate-fade-in-up">
            Your Campus
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-coral">
              Marketplace
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Buy and sell products within your campus community. Safe, easy, and made for students like you.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/products">
              <Button variant="glass" size="xl" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                Start Shopping
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/signup?role=vendor">
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                Become a Vendor
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
