import { ShoppingCart, Store, Shield, Truck, CreditCard, MessageSquare, Sparkles } from "lucide-react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

const FeaturesSection = () => {
  const { siteName } = useSiteSettingsContext();

  const features = [
    {
      icon: ShoppingCart,
      title: "Easy Shopping",
      description: "Browse products from verified campus vendors with just a few clicks.",
      color: "bg-blue-500",
    },
    {
      icon: Store,
      title: "Start Selling",
      description: "Set up your store in minutes and reach thousands of students on your campus.",
      color: "bg-violet-500",
    },
    {
      icon: Shield,
      title: "Secure Trades",
      description: "All payments are protected and verified for your peace of mind.",
      color: "bg-emerald-500",
    },
    {
      icon: Truck,
      title: "Campus Delivery",
      description: "Fast and convenient delivery right to your campus location.",
      color: "bg-rose-500",
    },
    {
      icon: CreditCard,
      title: "Mobile Money",
      description: "Pay easily with MoMo, cards, or other payment methods you trust.",
      color: "bg-amber-500",
    },
    {
      icon: MessageSquare,
      title: "Direct Chat",
      description: "Message vendors directly to ask questions before you buy.",
      color: "bg-cyan-500",
    },
  ];

  return (
    <section className="py-8 md:py-32 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-12 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-none bg-primary text-white text-xs md:text-sm font-black uppercase tracking-widest mb-6 md:mb-8">
            <Sparkles className="w-3 md:w-3.5 h-3 md:h-3.5" />
            Reliable & Student-focused
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-foreground mb-6 md:mb-8 tracking-tighter leading-tight uppercase">
            Trade with <span className="text-primary">Confidence</span>
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground font-semibold leading-relaxed max-w-2xl mx-auto">
            The ultimate ecosystem for student entrepreneurs and savvy shoppers. 
            Everything is simple, secure, and university-ready.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-0 border border-border/40">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-4 md:p-12 bg-white rounded-none border border-border/20 hover:bg-muted/30 transition-all duration-300 relative overflow-hidden"
            >
              {/* Decorative Corner Element */}
              <div className="absolute top-0 right-0 w-10 h-10 md:w-12 md:h-12 bg-muted/20 -translate-y-1/2 translate-x-1/2 rotate-45 group-hover:bg-primary/10 transition-colors" />
              
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-none ${feature.color} flex items-center justify-center mb-4 md:mb-8 shadow-xl shadow-black/10 group-hover:scale-110 transition-transform duration-500`}>
                <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-2xl font-black text-foreground tracking-tight uppercase leading-tight">{feature.title}</h3>
                <div className="h-1 w-10 md:w-12 bg-primary/20 group-hover:w-24 transition-all duration-500" />
                <p className="text-muted-foreground font-bold text-xs md:text-sm leading-relaxed max-w-xs">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
