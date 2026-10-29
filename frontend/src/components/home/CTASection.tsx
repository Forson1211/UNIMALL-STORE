import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Store, ShoppingBag, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const universities = [
  { name: "University of Ghana", label: "University of Ghana", logo: "ug.svg", size: [3408, 1058], crest: "25 35 805 980" },
  { name: "Kwame Nkrumah University of Science and Technology", label: "KNUST", logo: "knust.png", size: [433, 100], crest: "18 10 65 90" },
  { name: "Ashesi University", label: "Ashesi University", logo: "ashesi.webp", size: [550, 128], crest: "6 4 140 121" },
  { name: "University of Cape Coast", label: "University of Cape Coast", logo: "ucc.png", size: [180, 180], crest: "13 3 154 175" },
  { name: "Ghana Institute of Management and Public Administration", label: "GIMPA", logo: "gimpa.png", size: [420, 79], crest: "0 0 82 79" },
  { name: "University of Professional Studies, Accra", label: "UPSA", logo: "upsa.png", size: [300, 99], crest: "15 8 62 83" },
  { name: "Pentecost University", label: "Pentecost University", logo: "pentecost.png", size: [501, 222], crest: "0 0 209 222" },
];

const UniversityLogos = () => (
  <div className="flex shrink-0 items-center gap-6 px-3 sm:gap-8 sm:px-4">
    {universities.map(university => (
      <div key={university.logo} className="flex w-[140px] shrink-0 flex-col items-center justify-center gap-3 bg-white p-2 sm:w-[160px]">
        <svg
          viewBox={university.crest}
          role="img"
          aria-label={`${university.name} logo`}
          className="h-14 w-14 shrink-0 overflow-hidden sm:h-16 sm:w-16"
        >
          <image
            href={`/assets/universities/${university.logo}`}
            width={university.size[0]}
            height={university.size[1]}
          />
        </svg>
        <span className="flex h-8 items-center text-center text-[10px] font-bold uppercase tracking-wide text-gray-700 sm:text-[11px]">
          {university.label}
        </span>
      </div>
    ))}
  </div>
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
            <p className="text-center text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-foreground/60 mb-6">Trusted by students across</p>
            
            {/* Infinite Marquee Wrapper */}
            <div className="w-full overflow-hidden relative select-none">
              {/* Fade masks for visual polish */}
              <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-10 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-6 sm:w-10 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
              
              <div className="animate-marquee-ltr motion-reduce:animate-none flex items-center py-2">
                <UniversityLogos />
                <div aria-hidden="true" className="shrink-0">
                  <UniversityLogos />
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
