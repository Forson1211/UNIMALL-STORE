import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Store, ShoppingBag, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Dynamic Background with Mesh Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-rose-500">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-soft-light"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-yellow-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-600/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Buyer CTA Card */}
          <div className="group relative rounded-[2rem] p-1 transition-all duration-300 hover:scale-[1.01]">
            {/* Card Border Gradient */}
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/30 to-white/5 opacity-50 group-hover:opacity-100 transition-opacity" />

            {/* Card Content */}
            <div className="relative h-full bg-white/10 backdrop-blur-xl rounded-[1.9rem] p-8 lg:p-12 border border-white/10 overflow-hidden">
              {/* Hover Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 flex flex-col h-full items-start">
                <div className="w-16 h-16 rounded-2xl bg-white text-orange-600 flex items-center justify-center mb-8 shadow-lg shadow-orange-900/10 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>

                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
                  Ready to Shop?
                </h3>
                <p className="text-orange-50 mb-8 text-lg leading-relaxed max-w-md">
                  Join thousands of students finding exclusive deals. Compare prices, chat with vendors, and get campus delivery.
                </p>

                <div className="mt-auto pt-4">
                  <Link to="/products">
                    <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 border-0 font-semibold px-8 h-12 text-base shadow-xl shadow-orange-900/10">
                      Start Shopping
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor CTA Card */}
          <div className="group relative rounded-[2rem] p-1 transition-all duration-300 hover:scale-[1.01]">
            {/* Card Border Gradient */}
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/30 to-white/5 opacity-50 group-hover:opacity-100 transition-opacity" />

            {/* Card Content */}
            <div className="relative h-full bg-gradient-to-br from-gray-900/60 to-gray-900/40 backdrop-blur-xl rounded-[1.9rem] p-8 lg:p-12 border border-white/10 overflow-hidden">
              {/* Hover Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 flex flex-col h-full items-start">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Store className="w-8 h-8" />
                </div>

                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
                  Want to Sell?
                </h3>
                <p className="text-gray-200 mb-8 text-lg leading-relaxed max-w-md">
                  Turn your side hustle into a business. Set up your store in minutes, reach peers, and manage orders effortlessly.
                </p>

                <div className="mt-auto pt-4">
                  <Link to="/signup?role=vendor">
                    <Button size="lg" className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-0 font-semibold px-8 h-12 text-base shadow-xl">
                      Become a Vendor
                      <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Improved Trust Section */}
        <div className="mt-20 text-center">
          <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-6">Trusted by students at</p>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-white/90 text-lg font-semibold opacity-90">
            <span className="hover:opacity-100 transition-opacity cursor-default">University of Ghana</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="hover:opacity-100 transition-opacity cursor-default">KNUST</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="hover:opacity-100 transition-opacity cursor-default">Ashesi</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="hover:opacity-100 transition-opacity cursor-default">UCC</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">15+ more campuses</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
