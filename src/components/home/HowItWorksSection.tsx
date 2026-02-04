import { UserPlus, Search, ShoppingBag, Truck, Store, Package, BarChart3, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

const HowItWorksSection = () => {
  const { siteName } = useSiteSettingsContext();

  const buyerSteps = [
    {
      icon: UserPlus,
      step: "01",
      title: "Create Account",
      description: `Sign up with your student email and join the ${siteName} community.`,
    },
    {
      icon: Search,
      step: "02",
      title: "Browse Products",
      description: "Explore products from vendors across your campus or filter by category.",
    },
    {
      icon: ShoppingBag,
      step: "03",
      title: "Add to Cart",
      description: "Select your items, choose quantities, and add them to your cart.",
    },
    {
      icon: Truck,
      step: "04",
      title: "Receive Order",
      description: "Pay securely and get your items delivered right to your campus location.",
    },
  ];

  const vendorSteps = [
    {
      icon: Store,
      step: "01",
      title: "Register as Vendor",
      description: "Apply to become a vendor with your student credentials.",
    },
    {
      icon: Package,
      step: "02",
      title: "List Products",
      description: "Upload photos, set prices, and describe your products.",
    },
    {
      icon: BarChart3,
      step: "03",
      title: "Manage Orders",
      description: "Track incoming orders and update delivery status in real-time.",
    },
    {
      icon: Wallet,
      step: "04",
      title: "Get Paid",
      description: "Receive payments directly to your mobile money or bank account.",
    },
  ];

  const StepCard = ({ step, index }: { step: any; index: number }) => (
    <div className="relative group">
      {/* Connector Line (Desktop Only) */}
      {index < 3 && (
        <div className="hidden lg:block absolute top-16 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/20 to-transparent z-0 group-hover:from-primary/40 transition-colors duration-500" />
      )}

      <div className="relative flex flex-col items-center text-center p-6 h-full z-10 transition-transform duration-300 hover:-translate-y-2">
        {/* Step Number Badge */}
        <div className="absolute top-0 right-10 w-8 h-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold rounded-full flex items-center justify-center shadow-lg ring-4 ring-background z-20">
          {step.step}
        </div>

        {/* Icon Container */}
        <div className="w-32 h-32 rounded-[2rem] bg-white border border-border/50 flex items-center justify-center mb-8 shadow-xl shadow-primary/5 group-hover:shadow-primary/20 transition-all duration-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <step.icon className="w-12 h-12 text-primary relative z-10 group-hover:scale-110 transition-transform duration-300" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px]">
          {step.description}
        </p>
      </div>
    </div>
  );

  return (
    <section className="py-24 lg:py-32 bg-secondary/5 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide uppercase mb-6 border border-primary/10">
            Simple Steps
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">
            How <span className="text-primary relative inline-block">
              {siteName}
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5 L 100 0 Q 50 5 0 0 Z" fill="currentColor" />
              </svg>
            </span> Works
          </h2>
          <p className="text-muted-foreground text-lg lg:text-xl max-w-2xl mx-auto">
            Whether you're buying or selling, we've streamlined the experience to be intuitive and fast.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="buyer" className="w-full">
          <div className="flex justify-center mb-16">
            <TabsList className="bg-white/50 backdrop-blur-sm border p-1.5 h-auto rounded-full shadow-sm">
              <TabsTrigger
                value="buyer"
                className="rounded-full px-8 py-3 text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300"
              >
                For Buyers
              </TabsTrigger>
              <TabsTrigger
                value="vendor"
                className="rounded-full px-8 py-3 text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300"
              >
                For Vendors
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="buyer" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
              {buyerSteps.map((step, index) => (
                <StepCard key={step.step} step={step} index={index} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vendor" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
              {vendorSteps.map((step, index) => (
                <StepCard key={step.step} step={step} index={index} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default HowItWorksSection;
