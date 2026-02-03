import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Store, ShoppingBag } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Decorative Circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Buyer CTA */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 lg:p-10 border border-white/20">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Ready to Shop?
            </h3>
            <p className="text-white/80 mb-8 text-lg">
              Join thousands of students finding great deals on campus. Browse products, compare prices, and get items delivered to you.
            </p>
            <Link to="/products">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Start Shopping
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Vendor CTA */}
          <div className="bg-coral/20 backdrop-blur-lg rounded-3xl p-8 lg:p-10 border border-coral/30">
            <div className="w-16 h-16 rounded-2xl bg-coral/30 flex items-center justify-center mb-6">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Want to Sell?
            </h3>
            <p className="text-white/80 mb-8 text-lg">
              Turn your skills and products into income. Set up your store for free and start reaching customers on your campus today.
            </p>
            <Link to="/signup?role=vendor">
              <Button variant="coral" size="lg">
                Become a Vendor
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 text-center">
          <p className="text-white/60 text-lg mb-2">Trusted by students at</p>
          <p className="text-white text-xl font-semibold">
            University of Ghana • KNUST • UCC • UEW • Ashesi & 15+ more
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
