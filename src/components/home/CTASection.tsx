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
    <section className="py-32 relative overflow-hidden bg-mesh">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">

            {/* Buyer CTA */}
            <div className="group relative bg-white rounded-none p-12 border border-border/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-700 hover:-translate-y-2 flex flex-col items-start overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-none blur-[80px] translate-x-1/2 -translate-y-1/2" />

              <div className="w-16 h-16 rounded-none bg-secondary/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <ShoppingBag className="w-8 h-8 text-primary" />
              </div>

              <h3 className="text-4xl font-black text-foreground mb-6 tracking-tighter">
                Join the student <br /> shopping revolution.
              </h3>
              <p className="text-muted-foreground text-lg font-medium leading-relaxed mb-10 max-w-sm">
                Discover verified vendors, exclusive campus deals, and secure payment options.
              </p>

              <div className="mt-auto">
                <Link to="/products">
                  <Button size="lg" className="h-14 px-8 rounded-none bg-foreground text-white font-black text-xs uppercase tracking-widest hover:bg-primary shadow-xl transition-all hover:scale-105">
                    Start Shopping
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Vendor CTA */}
            <div className="group relative bg-foreground rounded-none p-12 hover:shadow-2xl hover:shadow-black/20 transition-all duration-700 hover:-translate-y-2 flex flex-col items-start overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-none blur-[80px] translate-x-1/2 -translate-y-1/2" />

              <div className="w-16 h-16 rounded-none bg-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <Store className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-4xl font-black text-white mb-6 tracking-tighter">
                Turn your hustle <br /> into a campus business.
              </h3>
              <p className="text-white/60 text-lg font-medium leading-relaxed mb-10 max-w-sm">
                Set up your store in minutes and reach thousands of students across Ghana.
              </p>

              <div className="mt-auto">
                <Link to={showDashboard ? dashboardLink : "/signup?role=vendor"}>
                  <Button size="lg" className="h-14 px-8 rounded-none bg-white text-foreground font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white shadow-xl transition-all hover:scale-105">
                    {showDashboard ? "Go to Dashboard" : "Become a Vendor"}
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

          </div>

          {/* Trust strip */}
          <div className="mt-20 flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40">
            {["University of Ghana", "KNUST", "Ashesi", "UCC", "GIMPA"].map(uni => (
              <span key={uni} className="text-sm font-black uppercase tracking-widest text-foreground">{uni}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
