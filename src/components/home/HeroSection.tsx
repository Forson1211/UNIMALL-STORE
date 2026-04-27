import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section
      className="relative overflow-hidden bg-white"
      style={{ minHeight: "65vh" }}
    >
      {/* Full-width Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=2400&auto=format&fit=crop"
          alt="Campus Marketplace"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay — strong on left, fades to transparent */}
        {/* Desktop Gradient Overlay (Left to Right) */}
        <div
          className="absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(105deg, rgba(255, 85, 0, 0.98) 0%, rgba(255, 89, 0, 0.86) 30%, rgba(252, 134, 0, 0.82) 50%, rgba(255,120,40,0.0) 75%)",
          }}
        />
        {/* Mobile Gradient Overlay (Top to Bottom) */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,120,40,0.0) 0%, rgba(252, 134, 0, 0.82) 40%, rgba(255, 89, 0, 0.86) 70%, rgba(255, 85, 0, 0.98) 100%)",
          }}
        />

      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex items-center min-h-[65vh]">
        <div className="container mx-auto px-4 relative">

          <div className="max-w-3xl py-16 lg:py-20 mx-auto lg:mx-0 text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-none mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-none bg-yellow-400 animate-pulse" />
              Ghana's #1 Campus Marketplace
            </div>

            {/* Headline */}
            <h1
              className="font-black text-white tracking-tighter leading-[0.95] mb-8 uppercase drop-shadow-xl"
              style={{ fontSize: "clamp(2.5rem, 15vw, 5.5rem)" }}
            >
              Shop<br />
              Campus<br />
              <span className="relative inline-block text-[#FFFF00]">
                Better
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 10C50 3 150 3 298 10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base lg:text-lg text-white/95 leading-relaxed font-bold mb-10 max-w-lg mx-auto lg:mx-0 drop-shadow-md">
              Discover exclusive student deals, trade with verified campus vendors, and get everything you need for university life.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-row items-center justify-center lg:justify-start gap-4 mb-16 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-4 sm:pb-0">
              <Link to="/products" className="shrink-0 sm:shrink">
                <Button size="lg" className="h-14 px-8 sm:px-10 rounded-none bg-white text-gray-900 hover:bg-gray-100 font-black text-xs uppercase tracking-widest shadow-2xl shadow-black/20 transition-all hover:scale-105 active:scale-95 group border-none">
                  Shop Now
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/vendor" className="shrink-0 sm:shrink">
                <Button size="lg" className="h-14 px-8 sm:px-10 rounded-none bg-[#030617] text-white hover:bg-black font-black text-xs uppercase tracking-widest shadow-2xl shadow-black/40 transition-all hover:scale-105 active:scale-95 group border-none">
                  Start Selling
                </Button>
              </Link>
            </div>

            {/* Trust Bar */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-6">
              <div className="flex flex-col gap-1 pr-0 lg:pr-8 border-none lg:border-r border-white/10 items-center lg:items-start">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 text-[11px] font-bold">
                  Trusted by <span className="text-white font-black">5,000+</span> students
                </p>
              </div>
              <div className="hidden sm:block w-px h-10 bg-white/20" />
              <div className="flex flex-col gap-1 text-white items-center lg:items-start">
                <span className="text-xl font-black leading-none">200+</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Vendors</span>
              </div>
              <div className="hidden sm:block w-px h-10 bg-white/20" />
              <div className="flex flex-col gap-1 text-white items-center lg:items-start">
                <span className="text-xl font-black leading-none">20+</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/70">Universities</span>
              </div>
            </div>
          </div>

          {/* Floating elements inside container (Right Side) */}
          <div className="hidden xl:flex absolute top-0 bottom-0 right-0 items-center pointer-events-none">
            <div className="relative w-80 h-full flex flex-col justify-center gap-8">
              {/* Top card */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-none p-5 text-white shadow-2xl animate-float-delayed">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/10">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Community</p>
                    <p className="text-sm font-black">+120 joined today</p>
                  </div>
                </div>
                <div className="flex -space-x-3 mb-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-orange-500 bg-gray-200" />
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-orange-500 bg-orange-500 flex items-center justify-center text-[10px] font-bold">+</div>
                </div>
              </div>

              {/* Bottom card */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-none p-5 text-white shadow-2xl animate-float">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/10">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Now</p>
                    <p className="text-sm font-black">Flash Sale</p>
                  </div>
                </div>
                <div className="w-full bg-white/20 rounded-sm h-1.5 mb-2">
                  <div className="bg-yellow-400 h-1.5 rounded-sm" style={{ width: "68%" }} />
                </div>
                <p className="text-[10px] text-white/70 font-bold">68% of items claimed</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

// Simple floating animation classes
const Users = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

export default HeroSection;
