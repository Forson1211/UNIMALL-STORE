import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Store, ShoppingBag, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LegonLogo = () => (
  <svg className="w-auto h-8 text-foreground/20 hover:text-blue-900 dark:hover:text-blue-400 transition-all duration-300 transform hover:scale-105 cursor-default shrink-0" viewBox="0 0 160 40">
    <g transform="translate(5, 5)">
      <path d="M 0,0 L 24,0 C 24,18 12,28 12,28 C 12,28 0,18 0,0" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M 6,10 Q 12,7 18,10 L 18,18 Q 12,15 6,18 Z" fill="currentColor" opacity="0.8" />
      <path d="M 12,10 L 12,18" stroke="currentColor" strokeWidth="1.5" />
    </g>
    <text x="40" y="24" fontFamily="sans-serif" fontSize="13" fontWeight="900" letterSpacing="2" fill="currentColor">LEGON</text>
    <text x="40" y="34" fontFamily="sans-serif" fontSize="8" fontWeight="600" letterSpacing="1" opacity="0.6" fill="currentColor">UNIV. OF GHANA</text>
  </svg>
);

const KnustLogo = () => (
  <svg className="w-auto h-8 text-foreground/20 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-300 transform hover:scale-105 cursor-default shrink-0" viewBox="0 0 160 40">
    <g transform="translate(5, 5)">
      <circle cx="15" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M 15,0 L 15,30 M 0,15 L 30,15 M 4,4 L 26,26 M 4,26 L 26,4" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="15" cy="15" r="4" fill="currentColor" />
    </g>
    <text x="45" y="24" fontFamily="sans-serif" fontSize="13" fontWeight="900" letterSpacing="2" fill="currentColor">KNUST</text>
    <text x="45" y="34" fontFamily="sans-serif" fontSize="8" fontWeight="600" letterSpacing="1" opacity="0.6" fill="currentColor">SCIENCE & TECH</text>
  </svg>
);

const AshesiLogo = () => (
  <svg className="w-auto h-8 text-foreground/20 hover:text-red-700 dark:hover:text-red-400 transition-all duration-300 transform hover:scale-105 cursor-default shrink-0" viewBox="0 0 160 40">
    <g transform="translate(5, 5)">
      <path d="M 0,0 L 24,0 C 24,18 12,28 12,28 C 12,28 0,18 0,0" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="12" cy="16" r="6" fill="currentColor" />
      <path d="M 12,6 L 12,9 M 6,10 L 8,11 M 18,10 L 16,11 M 5,16 L 8,16 M 19,16 L 16,16" stroke="currentColor" strokeWidth="1.5" />
    </g>
    <text x="40" y="24" fontFamily="serif" fontSize="14" fontWeight="800" letterSpacing="1" fill="currentColor">ASHESI</text>
    <text x="40" y="34" fontFamily="sans-serif" fontSize="8" fontWeight="600" letterSpacing="1.5" opacity="0.6" fill="currentColor">UNIVERSITY</text>
  </svg>
);

const UccLogo = () => (
  <svg className="w-auto h-8 text-foreground/20 hover:text-blue-700 dark:hover:text-blue-400 transition-all duration-300 transform hover:scale-105 cursor-default shrink-0" viewBox="0 0 160 40">
    <g transform="translate(5, 5)">
      <path d="M 0,0 L 24,0 L 24,20 C 24,26 12,28 12,28 C 12,28 0,26 0,20 Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M 5,20 Q 12,18 19,20 L 19,22 Q 12,20 5,22 Z M 12,5 L 12,18" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
      <path d="M 12,6 Q 16,10 12,15 Z" fill="currentColor" />
    </g>
    <text x="40" y="24" fontFamily="sans-serif" fontSize="13" fontWeight="900" letterSpacing="2" fill="currentColor">UCC</text>
    <text x="40" y="34" fontFamily="sans-serif" fontSize="8" fontWeight="600" letterSpacing="1" opacity="0.6" fill="currentColor">CAPE COAST</text>
  </svg>
);

const GimpaLogo = () => (
  <svg className="w-auto h-8 text-foreground/20 hover:text-emerald-800 dark:hover:text-emerald-400 transition-all duration-300 transform hover:scale-105 cursor-default shrink-0" viewBox="0 0 160 40">
    <g transform="translate(5, 5)">
      <rect x="2" y="22" width="22" height="3" fill="currentColor" />
      <rect x="4" y="5" width="18" height="3" fill="currentColor" />
      <rect x="6" y="8" width="2.5" height="14" fill="currentColor" />
      <rect x="11.5" y="8" width="2.5" height="14" fill="currentColor" />
      <rect x="17" y="8" width="2.5" height="14" fill="currentColor" />
    </g>
    <text x="40" y="24" fontFamily="sans-serif" fontSize="13" fontWeight="900" letterSpacing="2" fill="currentColor">GIMPA</text>
    <text x="40" y="34" fontFamily="sans-serif" fontSize="8" fontWeight="600" letterSpacing="0.5" opacity="0.6" fill="currentColor">MANAGEMENT INST.</text>
  </svg>
);

const UpsaLogo = () => (
  <svg className="w-auto h-8 text-foreground/20 hover:text-indigo-800 dark:hover:text-indigo-400 transition-all duration-300 transform hover:scale-105 cursor-default shrink-0" viewBox="0 0 160 40">
    <g transform="translate(5, 5)">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M 12,5 L 14,10 L 19,10 L 15,13 L 17,18 L 12,15 L 7,18 L 9,13 L 5,10 L 10,10 Z" fill="currentColor" />
    </g>
    <text x="40" y="24" fontFamily="sans-serif" fontSize="13" fontWeight="900" letterSpacing="2" fill="currentColor">UPSA</text>
    <text x="40" y="34" fontFamily="sans-serif" fontSize="8" fontWeight="600" letterSpacing="1" opacity="0.6" fill="currentColor">PROF. STUDIES</text>
  </svg>
);

const CTASection = () => {
  const { user, role } = useAuth();

  const isVendor = role === "vendor";
  const isAdmin = role === "admin";
  const showDashboard = user && (isVendor || isAdmin);
  const dashboardLink = isAdmin ? "/admin" : "/vendor";

  return (
    <section className="py-12 md:py-32 relative bg-white border-t border-border/40">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-0 border border-border/40 overflow-hidden shadow-2xl">

            {/* Buyer CTA */}
            <div className="group relative bg-white p-8 md:p-16 flex flex-col items-start border-r border-border/40 hover:bg-muted/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-none bg-foreground text-white flex items-center justify-center mb-6 md:mb-10 group-hover:bg-primary transition-colors duration-500">
                <ShoppingBag className="w-7 h-7" />
              </div>

              <h3 className="text-2xl md:text-4xl lg:text-5xl font-black text-foreground mb-6 tracking-tighter leading-tight uppercase">
                Join the Revolution.
              </h3>
              <p className="text-muted-foreground text-base font-bold leading-relaxed mb-8 md:mb-12 max-w-sm">
                Discover verified campus vendors and exclusive student deals with secure mobile payments.
              </p>

              <div className="mt-auto w-full">
                <Link to="/products">
                  <Button size="lg" className="h-16 w-full lg:w-auto px-12 rounded-none bg-foreground text-white font-black text-xs uppercase tracking-widest hover:bg-primary shadow-2xl transition-all">
                    Start Shopping
                    <ArrowRight className="w-5 h-5 ml-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Vendor CTA */}
            <div className="group relative bg-foreground p-8 md:p-16 flex flex-col items-start hover:bg-black transition-all duration-500">
              <div className="w-14 h-14 rounded-none bg-primary text-white flex items-center justify-center mb-6 md:mb-10 group-hover:scale-110 transition-transform duration-500">
                <Store className="w-7 h-7" />
              </div>

              <h3 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-6 tracking-tighter leading-tight uppercase">
                Sell your Hustle.
              </h3>
              <p className="text-white/40 text-base font-bold leading-relaxed mb-8 md:mb-12 max-w-sm">
                Set up your digital storefront in minutes and reach thousands of students across the nation.
              </p>

              <div className="mt-auto w-full">
                <Link to={showDashboard ? dashboardLink : "/signup?role=vendor"}>
                  <Button size="lg" className="h-16 w-full lg:w-auto px-12 rounded-none bg-white text-foreground font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white shadow-2xl transition-all">
                    {showDashboard ? "Go to Dashboard" : "Become a Vendor"}
                    <Sparkles className="w-5 h-5 ml-4" />
                  </Button>
                </Link>
              </div>
            </div>

          </div>

          {/* Trust strip */}
          <div className="mt-8 md:mt-16 pt-8 border-t border-border/20 overflow-hidden relative">
            <p className="text-center text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-foreground/30 mb-8">Trusted by students across</p>
            
            {/* Infinite Marquee Wrapper */}
            <div className="w-full overflow-hidden relative select-none">
              {/* Fade masks for visual polish */}
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
              
              <div className="animate-marquee-ltr flex items-center gap-16 py-2">
                {/* Loop 1 */}
                <div className="flex items-center gap-16 shrink-0">
                  <LegonLogo />
                  <KnustLogo />
                  <AshesiLogo />
                  <UccLogo />
                  <GimpaLogo />
                  <UpsaLogo />
                </div>
                {/* Loop 2 (Duplicate for infinite seamless scroll) */}
                <div className="flex items-center gap-16 shrink-0" aria-hidden="true">
                  <LegonLogo />
                  <KnustLogo />
                  <AshesiLogo />
                  <UccLogo />
                  <GimpaLogo />
                  <UpsaLogo />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
