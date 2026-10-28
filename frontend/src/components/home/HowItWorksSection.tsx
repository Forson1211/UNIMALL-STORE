import { UserPlus, Search, ShoppingBag, Truck, Store, Package, BarChart3, Wallet, Sparkles, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

const HowItWorksSection = () => {
  const { siteName } = useSiteSettingsContext();

  const buyerSteps = [
    {
      icon: UserPlus,
      step: "01",
      title: "Create Account",
      description: `Join the ${siteName} community with your student ID.`,
    },
    {
      icon: Search,
      step: "02",
      title: "Find Products",
      description: "Explore items from verified student vendors on your campus.",
    },
    {
      icon: ShoppingBag,
      step: "03",
      title: "Add to Cart",
      description: "Select items and checkout securely using Mobile Money.",
    },
    {
      icon: Truck,
      step: "04",
      title: "Receive Items",
      description: "Get your items delivered right to your campus doorstep.",
    },
  ];

  const vendorSteps = [
    {
      icon: Store,
      step: "01",
      title: "Open Shop",
      description: "Register as a vendor and set up your campus storefront.",
    },
    {
      icon: Package,
      step: "02",
      title: "List Items",
      description: "Upload photos and details of the products you want to sell.",
    },
    {
      icon: BarChart3,
      step: "03",
      title: "Track Sales",
      description: "Manage your inventory and orders through your dashboard.",
    },
    {
      icon: Wallet,
      step: "04",
      title: "Get Paid",
      description: "Receive instant payouts to your MoMo or bank account.",
    },
  ];

  const StepCard = ({ step, isLast }: { step: any, isLast: boolean }) => (
    <div className="group relative p-6 md:p-12 bg-white rounded-none border border-border/40 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 hover:-translate-y-1">
      <div className="absolute top-6 right-6 text-6xl font-black text-foreground/5 group-hover:text-primary/10 transition-colors">
        {step.step}
      </div>
      
      <div className="w-12 h-12 rounded-none bg-primary text-white flex items-center justify-center mb-6 md:mb-10">
        <step.icon className="w-6 h-6" />
      </div>
      
      <div className="space-y-4 relative z-10">
        <h3 className="text-xl font-black text-foreground tracking-tight uppercase leading-tight">{step.title}</h3>
        <p className="text-muted-foreground font-bold text-sm leading-relaxed max-w-[200px]">{step.description}</p>
      </div>

      {!isLast && (
        <div className="hidden lg:flex absolute top-1/2 -right-4 z-20 w-8 h-8 items-center justify-center translate-y-[-50%]">
            <ArrowRight className="w-5 h-5 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );

  return (
    <section className="py-8 md:py-32 bg-[#fafafa] overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-none bg-primary text-white text-xs md:text-sm font-black uppercase tracking-widest mb-6 md:mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Streamlined Experience
          </div>
          <h2 className="text-5xl lg:text-7xl font-black text-foreground mb-8 tracking-tighter leading-tight uppercase">
            How it <span className="text-primary">Works</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground font-semibold leading-relaxed max-w-xl mx-auto">
            We've stripped away the complexity of campus trading. Simple steps to buy or sell.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="buyer" className="w-full">
          <div className="flex justify-center mb-16">
            <TabsList className="h-16 p-0 bg-transparent rounded-none flex gap-0 border border-border/40 overflow-hidden">
              <TabsTrigger
                value="buyer"
                className="w-48 lg:w-64 h-full rounded-none text-xs md:text-sm font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 border-r border-border/40"
              >
                Buying Experience
              </TabsTrigger>
              <TabsTrigger
                value="vendor"
                className="w-48 lg:w-64 h-full rounded-none text-xs md:text-sm font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
              >
                Selling Journey
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="buyer" className="mt-0 animate-fade-in focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-border/20">
              {buyerSteps.map((step, i) => (
                <StepCard key={step.step} step={step} isLast={i === buyerSteps.length - 1} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vendor" className="mt-0 animate-fade-in focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-border/20">
              {vendorSteps.map((step, i) => (
                <StepCard key={step.step} step={step} isLast={i === vendorSteps.length - 1} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default HowItWorksSection;
