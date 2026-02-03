import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";

const HowItWorks = () => {
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
      
      <main className="pt-24">
        {/* Hero */}
        <section className="py-16 lg:py-24 bg-accent">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
              Getting Started
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              How <span className="text-gradient-primary">Unimall</span> Works
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you're looking to shop or sell, we've made the process simple and secure.
            </p>
          </div>
        </section>

        {/* Steps Section */}
        <HowItWorksSection />

        {/* Benefits */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Buyer Benefits */}
              <div className="bg-card rounded-3xl p-8 lg:p-10 border border-border">
                <span className="inline-block px-4 py-1.5 bg-accent text-accent-foreground text-sm font-medium rounded-full mb-6">
                  For Buyers
                </span>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-6">
                  Shop with Confidence
                </h2>
                <ul className="space-y-4 mb-8">
                  {buyerBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button size="lg">
                    Start Shopping
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>

              {/* Vendor Benefits */}
              <div className="bg-gradient-primary rounded-3xl p-8 lg:p-10 text-primary-foreground">
                <span className="inline-block px-4 py-1.5 bg-white/20 text-primary-foreground text-sm font-medium rounded-full mb-6">
                  For Vendors
                </span>
                <h2 className="text-2xl lg:text-3xl font-bold mb-6">
                  Grow Your Business
                </h2>
                <ul className="space-y-4 mb-8">
                  {vendorBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span className="text-primary-foreground/90">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup?role=vendor">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                    Become a Vendor
                    <ArrowRight className="w-5 h-5" />
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
