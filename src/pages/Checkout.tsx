import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Lock,
  ShieldCheck,
  Truck,
  RotateCcw,
  Smartphone,
  CreditCard,
  Banknote,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { orderService } from "@/services/orderService";

const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Volta",
  "Northern", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo",
  "Savannah", "North East", "Oti", "Western North",
];

const PAYMENT_METHODS = [
  { key: "momo", label: "Mobile Money", description: "Pay with MTN MoMo, Vodafone Cash, or AirtelTigo Money", icon: Smartphone },
  { key: "card", label: "Card Payment", description: "Pay with Visa, Mastercard, or other cards", icon: CreditCard },
  { key: "cod", label: "Cash on Delivery", description: "Pay when you receive your order", icon: Banknote },
] as const;

const STEPS = [
  { number: 1, label: "Shipping" },
  { number: 2, label: "Payment" },
  { number: 3, label: "Review" },
] as const;

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const inputClass =
  "h-12 rounded-xl border-gray-200 bg-white text-sm px-5 focus-visible:ring-[#FF5500] focus-visible:border-[#FF5500]";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<typeof PAYMENT_METHODS[number]["key"]>("momo");
  const [saveInfo, setSaveInfo] = useState(true);

  const [formData, setFormData] = useState({
    email: user?.email || "",
    fullName: profile?.full_name || "",
    addressLine1: profile?.address || "",
    addressLine2: "",
    city: "",
    region: "",
    digitalAddress: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const shippingComplete =
    isValidEmail(formData.email) &&
    formData.fullName.trim().length > 1 &&
    formData.addressLine1.trim().length > 3 &&
    formData.city.trim().length > 1 &&
    formData.region.trim().length > 0;

  const handleContinueFromShipping = () => {
    if (!shippingComplete) {
      toast({
        title: "Missing information",
        description: "Please fill in your contact and shipping details to continue.",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
    } else {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to complete checkout.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const orderItems = items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        vendor_id: item.vendorId
      }));

      await orderService.placeOrder({
        buyerId: user.id,
        totalAmount: totalPrice,
        items: orderItems,
        paymentMethod: paymentMethod,
        shippingDetails: {
          fullName: formData.fullName,
          email: formData.email,
          address: `${formData.addressLine1}${formData.addressLine2 ? ", " + formData.addressLine2 : ""}, ${formData.city}, ${formData.region}`,
          digitalAddress: formData.digitalAddress,
        }
      });

      toast({
        title: "Order placed successfully!",
        description: "You will receive a confirmation email shortly.",
      });

      clearCart();
      navigate("/account/orders");
    } catch (error: any) {
      toast({
        title: "Error placing order",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-lg text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Add some products to your cart to proceed with checkout.
            </p>
            <Button asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 text-sm font-semibold text-[#FF5500] hover:text-[#e54a00] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 1 ? "Back to Cart" : `Back to ${STEPS[step - 2].label}`}
            </button>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <Lock className="w-3.5 h-3.5" />
              Secure Checkout
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Checkout</h1>

          {/* Stepper */}
          <div className="flex items-center mb-10">
            {STEPS.map((s, idx) => (
              <div key={s.number} className={`flex items-center ${idx < STEPS.length - 1 ? "flex-1" : ""}`}>
                <button
                  type="button"
                  disabled={s.number > step}
                  onClick={() => s.number < step && setStep(s.number)}
                  className="flex items-center gap-2 shrink-0 disabled:cursor-default"
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      s.number <= step
                        ? "bg-[#FF5500] text-white"
                        : "bg-white border-2 border-gray-200 text-gray-400"
                    }`}
                  >
                    {s.number < step ? <Check className="w-3.5 h-3.5" /> : s.number}
                  </span>
                  <span className={`text-sm font-semibold ${s.number <= step ? "text-gray-900" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${s.number < step ? "bg-[#FF5500]" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
            {/* Step content */}
            <div className="space-y-8">
              {step === 1 && (
                <>
                  <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
                    <Input
                      name="email"
                      type="email"
                      placeholder="youremail@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </section>

                  <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Shipping Address</h2>
                    <div className="space-y-4">
                      <Input
                        name="fullName"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={inputClass}
                      />
                      <Input
                        name="addressLine1"
                        placeholder="House number and street name"
                        value={formData.addressLine1}
                        onChange={handleInputChange}
                        className={inputClass}
                      />
                      <Input
                        name="addressLine2"
                        placeholder="Apartment, hostel, hall (optional)"
                        value={formData.addressLine2}
                        onChange={handleInputChange}
                        className={inputClass}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          name="city"
                          placeholder="City"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={inputClass}
                        />
                        <select
                          name="region"
                          value={formData.region}
                          onChange={(e) => setFormData((p) => ({ ...p, region: e.target.value }))}
                          className={`${inputClass} border w-full appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239ca3af%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-no-repeat bg-[right_1rem_center] ${!formData.region ? "text-gray-400" : "text-gray-900"}`}
                        >
                          <option value="" disabled>Region</option>
                          {GHANA_REGIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          name="digitalAddress"
                          placeholder="Digital Address (optional)"
                          value={formData.digitalAddress}
                          onChange={handleInputChange}
                          className={inputClass}
                        />
                        <div className={`${inputClass} flex items-center gap-2 border bg-gray-50 text-gray-500`}>
                          🇬🇭 Ghana
                        </div>
                      </div>
                    </div>
                  </section>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={saveInfo}
                      onCheckedChange={(v) => setSaveInfo(v === true)}
                      className="data-[state=checked]:bg-[#FF5500] data-[state=checked]:border-[#FF5500]"
                    />
                    <span className="text-sm text-gray-600">Save this information for next time</span>
                  </label>

                  <Button
                    type="button"
                    size="lg"
                    onClick={handleContinueFromShipping}
                    className="w-full sm:w-auto rounded-xl bg-[#FF5500] hover:bg-[#e54a00] h-12 px-8"
                  >
                    Continue to Payment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>
                    <div className="space-y-3">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        const isActive = paymentMethod === method.key;
                        return (
                          <label
                            key={method.key}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                              isActive ? "border-[#FF5500] bg-[#FF5500]/5" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              className="sr-only"
                              checked={isActive}
                              onChange={() => setPaymentMethod(method.key)}
                            />
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isActive ? "bg-[#FF5500] text-white" : "bg-gray-100 text-gray-500"}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-900">{method.label}</p>
                              <p className="text-xs text-gray-400">{method.description}</p>
                            </div>
                            <span className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${isActive ? "border-[#FF5500]" : "border-gray-300"}`}>
                              {isActive && <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500]" />}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>

                  <Button
                    type="button"
                    size="lg"
                    onClick={() => setStep(3)}
                    className="w-full sm:w-auto rounded-xl bg-[#FF5500] hover:bg-[#e54a00] h-12 px-8"
                  >
                    Continue to Review
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}

              {step === 3 && (
                <>
                  <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Review your order</h2>
                    <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Contact</p>
                          <p className="text-sm text-gray-900">{formData.email}</p>
                        </div>
                        <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-[#FF5500] hover:underline">Edit</button>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Ship to</p>
                          <p className="text-sm text-gray-900">{formData.fullName}</p>
                          <p className="text-sm text-gray-500">
                            {formData.addressLine1}{formData.addressLine2 ? `, ${formData.addressLine2}` : ""}, {formData.city}, {formData.region}
                          </p>
                        </div>
                        <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-[#FF5500] hover:underline">Edit</button>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Payment</p>
                          <p className="text-sm text-gray-900">
                            {PAYMENT_METHODS.find((m) => m.key === paymentMethod)?.label}
                          </p>
                        </div>
                        <button type="button" onClick={() => setStep(2)} className="text-xs font-semibold text-[#FF5500] hover:underline">Edit</button>
                      </div>
                    </div>
                  </section>

                  <Button
                    type="button"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="w-full sm:w-auto rounded-xl bg-[#FF5500] hover:bg-[#e54a00] h-12 px-8"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Place Order (GH₵{totalPrice.toFixed(2)})
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>

                <div className="space-y-4 mb-5 max-h-[260px] overflow-y-auto no-scrollbar">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        <p className="font-bold text-sm text-gray-900 mt-0.5">
                          GH₵{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-gray-100 my-5" />

                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900 font-medium">GH₵{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-gray-900 font-medium">GH₵0.00</span>
                  </div>
                </div>

                <div className="h-px bg-gray-100 my-5" />

                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-extrabold text-xl text-[#FF5500]">GH₵{totalPrice.toFixed(2)}</span>
                </div>

                <div className="h-px bg-gray-100 mb-5" />

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <ShieldCheck className="w-5 h-5 text-gray-400" />
                    <span className="text-[10px] font-medium text-gray-400 leading-tight">Secure<br />Checkout</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <Truck className="w-5 h-5 text-gray-400" />
                    <span className="text-[10px] font-medium text-gray-400 leading-tight">Free<br />Shipping</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <RotateCcw className="w-5 h-5 text-gray-400" />
                    <span className="text-[10px] font-medium text-gray-400 leading-tight">Easy<br />Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
