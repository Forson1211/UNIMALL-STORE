import { ShoppingCart, Store, Shield, Truck, CreditCard, MessageSquare, Sparkles } from "lucide-react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

const FeaturesSection = () => {
  const { siteName } = useSiteSettingsContext();

  const features = [
    {
      icon: ShoppingCart,
      title: "Easy Shopping",
      description: "Browse products from verified campus vendors with just a few clicks.",
      color: "text-blue-500",
    },
    {
      icon: Store,
      title: "Start Selling",
      description: "Set up your store in minutes and reach thousands of students on your campus.",
      color: "text-violet-500",
    },
    {
      icon: Shield,
      title: "Secure Trades",
      description: "All payments are protected and verified for your peace of mind.",
      color: "text-emerald-500",
    },
    {
      icon: Truck,
      title: "Campus Delivery",
      description: "Fast and convenient delivery right to your campus location.",
      color: "text-rose-500",
    },
    {
      icon: CreditCard,
      title: "Mobile Money",
      description: "Pay easily with MoMo, cards, or other payment methods you trust.",
      color: "text-amber-500",
    },
    {
      icon: MessageSquare,
      title: "Direct Chat",
      description: "Message vendors directly to ask questions before you buy.",
      color: "text-cyan-500",
    },
  ];

  return (
    <section className="py-32 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
            <Sparkles className="w-3 h-3" />
            Built for Students
          </div>
          <h2 className="text-4xl lg:text-6xl font-black text-foreground mb-6 tracking-tighter">
            Trade with <span className="text-primary">Confidence</span>
          </h2>
          <p className="text-xl text-muted-foreground font-medium leading-relaxed">
            The perfect platform for student entrepreneurs and savvy shoppers. 
            Simple, secure, and university-ready.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-10 bg-white rounded-none border border-border/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2"
            >
              <div className={`w-16 h-16 rounded-full bg-white border border-border/40 shadow-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                <feature.icon className={`w-8 h-8 ${feature.color}`} />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
