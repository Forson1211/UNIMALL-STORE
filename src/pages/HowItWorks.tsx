import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

const HowItWorks = () => {
  const { siteName } = useSiteSettingsContext();
  const buyerBenefits = [
    "Access products from verified campus vendors",
    "Compare prices and read genuine reviews",
    "Secure payment with buyer protection",
    "Fast campus delivery or pickup options",
    "Direct messaging with sellers",
    "Wishlist and order tracking",
  ];

  const vendorBenefits = [
    "Free store setup in minutes",
    "Reach thousands of campus customers",
    "Easy product listing and management",
    "Real-time sales analytics",
    "Multiple payment options including MoMo",
    "Dedicated vendor support",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20">
        {/* Steps Section - Now the primary entry point */}
        <HowItWorksSection />

        {/* Benefits Section - Modernized */}
        <section className="py-24 bg-background relative overflow-hidden">
          {/* Subtle Background Elements */}
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl translate-y-1/3 translate-x-1/3" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Why Choose <span className="text-primary">{siteName}</span>?
              </h2>
              <p className="text-muted-foreground text-lg">
                We've built a platform that puts students first, providing tools for both success and security.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
              {/* Buyer Benefits */}
              <div className="group bg-card rounded-[2.5rem] p-8 lg:p-12 border border-border hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] group-hover:bg-primary/10 transition-colors" />

                <span className="inline-flex items-center px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-8">
                  For Buyers
                </span>
                <h3 className="text-3xl font-bold text-foreground mb-8">
                  Shop with <span className="text-primary">Confidence</span>
                </h3>
                <ul className="space-y-5 mb-10">
                  {buyerBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-4 group/item">
                      <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-muted-foreground group-hover/item:text-foreground transition-colors">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button size="lg" className="rounded-full px-8 h-14 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 transition-all">
                    Start Shopping
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Vendor Benefits */}
              <div className="group bg-gradient-to-br from-primary to-secondary rounded-[2.5rem] p-8 lg:p-12 text-primary-foreground shadow-2xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-[5rem] group-hover:bg-white/20 transition-colors" />

                <span className="inline-flex items-center px-4 py-1.5 bg-white/20 text-white text-sm font-semibold rounded-full mb-8">
                  For Vendors
                </span>
                <h3 className="text-3xl font-bold text-white mb-8">
                  Grow Your <span className="opacity-90">Business</span>
                </h3>
                <ul className="space-y-5 mb-10">
                  {vendorBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-4 group/item">
                      <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover/item:bg-white group-hover/item:text-primary transition-colors">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-primary-foreground/90 group-hover/item:text-white transition-colors">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup?role=vendor">
                  <Button size="lg" className="bg-white text-primary hover:bg-neutral-50 rounded-full px-8 h-14 text-base font-bold shadow-xl">
                    Become a Vendor
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Teaser */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-8">
              Check out our FAQ or get in touch with our support team.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/faqs">
                <Button variant="outline" size="lg">View FAQs</Button>
              </Link>
              <Link to="/contact">
                <Button size="lg">Contact Support</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
