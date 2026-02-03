import { UserPlus, Search, ShoppingBag, Truck, Store, Package, BarChart3, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HowItWorksSection = () => {
  const buyerSteps = [
    {
      icon: UserPlus,
      step: "01",
      title: "Create Account",
      description: "Sign up with your student email and join the Unimall community.",
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

  const StepCard = ({ step, index }: { step: typeof buyerSteps[0]; index: number }) => (
    <div className="relative">
      {/* Connector Line */}
      {index < 3 && (
        <div className="hidden lg:block absolute top-14 left-[calc(50%+3.5rem)] w-[calc(100%-3.5rem)] h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
      )}
      
      <div className="relative flex flex-col items-center text-center p-6">
        {/* Step Number */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-coral text-secondary-foreground text-sm font-bold rounded-full flex items-center justify-center">
          {step.step}
        </div>
        
        {/* Icon */}
        <div className="w-28 h-28 rounded-3xl bg-gradient-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
          <step.icon className="w-12 h-12 text-primary-foreground" />
        </div>
        
        {/* Content */}
        <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
        <p className="text-muted-foreground text-sm max-w-[250px]">{step.description}</p>
      </div>
    </div>
  );

  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-4 py-1.5 bg-accent text-accent-foreground text-sm font-medium rounded-full mb-4">
            Simple Steps
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
            How <span className="text-gradient-primary">Unimall</span> Works
          </h2>
          <p className="text-muted-foreground text-lg">
            Whether you're buying or selling, we've made the process incredibly simple.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="buyer" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-14 mb-12">
            <TabsTrigger value="buyer" className="text-base font-medium">
              For Buyers
            </TabsTrigger>
            <TabsTrigger value="vendor" className="text-base font-medium">
              For Vendors
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="buyer" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {buyerSteps.map((step, index) => (
                <StepCard key={step.step} step={step} index={index} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="vendor" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
