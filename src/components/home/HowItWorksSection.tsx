import { UserPlus, Search, ShoppingBag, Truck, Store, Package, BarChart3, Wallet, Sparkles } from "lucide-react";
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

  const StepCard = ({ step }: { step: any }) => (
    <div className="group relative p-10 bg-white rounded-none border border-border/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-700 hover:-translate-y-2">
      <div className="absolute top-8 right-8 text-4xl font-black text-primary/10 group-hover:text-primary/20 transition-colors">
        {step.step}
      </div>
      <div className="w-16 h-16 rounded-full bg-secondary/5 border border-border/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
        <step.icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight">{step.title}</h3>
      <p className="text-muted-foreground font-medium leading-relaxed">{step.description}</p>
    </div>
  );

  return (
    <section className="py-20 lg:py-32 bg-secondary/5 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
            <Sparkles className="w-3 h-3" />
            Process
          </div>
          <h2 className="text-4xl lg:text-6xl font-black text-foreground mb-6 tracking-tighter">
            How it <span className="text-primary">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground font-medium leading-relaxed">
            We've simplified the campus trading experience for everyone.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="buyer" className="w-full">
          <div className="flex justify-center mb-16">
            <TabsList className="h-14 lg:h-16 p-1.5 bg-white rounded-none border border-border/40 shadow-sm w-full sm:w-auto">
              <TabsTrigger
                value="buyer"
                className="flex-1 sm:px-10 h-full rounded-none text-[10px] sm:text-sm font-black uppercase tracking-widest data-[state=active]:bg-foreground data-[state=active]:text-white transition-all duration-500"
              >
                Buying
              </TabsTrigger>
              <TabsTrigger
                value="vendor"
                className="flex-1 sm:px-10 h-full rounded-none text-[10px] sm:text-sm font-black uppercase tracking-widest data-[state=active]:bg-foreground data-[state=active]:text-white transition-all duration-500"
              >
                Selling
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="buyer" className="mt-0 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {buyerSteps.map((step) => (
                <StepCard key={step.step} step={step} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vendor" className="mt-0 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {vendorSteps.map((step) => (
                <StepCard key={step.step} step={step} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default HowItWorksSection;
