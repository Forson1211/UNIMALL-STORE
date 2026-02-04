import { ShoppingCart, Store, Shield, Truck, CreditCard, MessageSquare } from "lucide-react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

const FeaturesSection = () => {
  const { siteName } = useSiteSettingsContext();

  const features = [
    {
      icon: ShoppingCart,
      title: "Easy Shopping",
      description: "Browse products from verified campus vendors with just a few clicks.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Store,
      title: "Start Selling",
      description: "Set up your store in minutes and reach thousands of students on your campus.",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: Shield,
      title: "Secure Transactions",
      description: "All payments are protected and verified for your peace of mind.",
      color: "bg-accent text-accent-foreground",
    },
    {
      icon: Truck,
      title: "Campus Delivery",
      description: "Fast and convenient delivery right to your campus location.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: CreditCard,
      title: "Mobile Money",
      description: "Pay easily with MoMo, cards, or other payment methods you trust.",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: MessageSquare,
      title: "Direct Chat",
      description: "Message vendors directly to ask questions before you buy.",
      color: "bg-accent text-accent-foreground",
    },
  ];

  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 bg-accent text-accent-foreground text-sm font-medium rounded-full mb-4">
            Why {siteName}?
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need to
            <span className="text-gradient-primary"> Trade on Campus</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            We've built the perfect platform for student entrepreneurs and savvy shoppers alike.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 lg:p-8 bg-card rounded-2xl border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
