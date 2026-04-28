import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Store, ShoppingBag, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const CTASection = () => {
  const { user, role } = useAuth();

  const isVendor = role === "vendor";
  const isAdmin = role === "admin";
  const showDashboard = user && (isVendor || isAdmin);
  const dashboardLink = isAdmin ? "/admin" : "/vendor";

  return (
    <section className="py-32 relative bg-white border-t border-border/40">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-0 border border-border/40 overflow-hidden shadow-2xl">

            {/* Buyer CTA */}
            <div className="group relative bg-white p-16 flex flex-col items-start border-r border-border/40 hover:bg-muted/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-none bg-foreground text-white flex items-center justify-center mb-10 group-hover:bg-primary transition-colors duration-500">
                <ShoppingBag className="w-7 h-7" />
              </div>

              <h3 className="text-4xl lg:text-5xl font-black text-foreground mb-6 tracking-tighter leading-tight uppercase">
                Join the <br /> Revolution.
              </h3>
              <p className="text-muted-foreground text-base font-bold leading-relaxed mb-12 max-w-sm">
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
            <div className="group relative bg-foreground p-16 flex flex-col items-start hover:bg-black transition-all duration-500">
              <div className="w-14 h-14 rounded-none bg-primary text-white flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500">
                <Store className="w-7 h-7" />
              </div>

              <h3 className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tighter leading-tight uppercase">
                Sell your <br /> Hustle.
              </h3>
              <p className="text-white/40 text-base font-bold leading-relaxed mb-12 max-w-sm">
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
          <div className="mt-24 pt-12 border-t border-border/20 flex flex-wrap justify-center items-center gap-x-16 gap-y-8">
            {["Legon", "KNUST", "Ashesi", "UCC", "GIMPA", "UPSA"].map(uni => (
              <span key={uni} className="text-sm font-black uppercase tracking-[0.3em] text-foreground/20 hover:text-primary transition-colors cursor-default">
                {uni}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
