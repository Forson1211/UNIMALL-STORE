import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingBag,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Store,
  ShoppingCart,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "vendor" ? "vendor" : "buyer";

  const [selectedRole, setSelectedRole] = useState<"buyer" | "vendor">(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { signUp, user, role, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { siteName } = useSiteSettingsContext();

  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === "admin") navigate("/admin", { replace: true });
      else if (role === "vendor") navigate("/vendor", { replace: true });
      else navigate("/account", { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast({ title: "Terms Required", description: "Please agree to the Terms of Service.", variant: "destructive" });
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Submitting signup form:", { email, fullName, selectedRole, storeName });
      const { error } = await signUp(email, password, fullName, selectedRole, selectedRole === "vendor" ? storeName : undefined);
      if (error) {
        console.error("Signup submission error:", error);
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Account created!", description: "Please check your email to verify your account." });
        navigate("/login");
      }
    } catch (err: any) {
      console.error("Unexpected signup error:", err);
      toast({ title: "Unexpected Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh font-jakarta p-4 py-20">
      <div className="w-full max-w-[540px]">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#FF5500] transition-colors group mb-6 ml-4"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Simplified Premium Card */}
        <div className="bg-white rounded-none p-10 lg:p-14 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-gray-100">
          {/* Header */}
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center justify-center mb-8">
              <img src="/AUTH LOGO.png" alt={siteName || "Unimall"} className="h-16 md:h-20 w-auto object-contain drop-shadow-xl" />
            </Link>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Join {siteName || "Unimall"}</h1>
            <p className="text-gray-500 font-medium text-sm">Create your campus account today</p>
          </div>

          {/* Role Selector */}
          <div className="flex p-1 bg-gray-100 rounded-none mb-8">
            <button
              onClick={() => setSelectedRole("buyer")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-none text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedRole === "buyer" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Buyer
            </button>
            <button
              onClick={() => setSelectedRole("vendor")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-none text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedRole === "vendor" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Vendor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                <div className="relative group">
                   <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                   <Input
                    placeholder="John Doe"
                    className="pl-14 h-14 rounded-none border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#FF5500]/5 transition-all font-medium"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Campus Email</label>
                <div className="relative group">
                   <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                   <Input
                    type="email"
                    placeholder="you@uni.edu"
                    className="pl-14 h-14 rounded-none border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#FF5500]/5 transition-all font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  className="pl-14 pr-14 h-14 rounded-none border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#FF5500]/5 transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {selectedRole === "vendor" && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Store Name</label>
                <div className="relative group">
                  <Store className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                  <Input
                    placeholder="Your campus shop name"
                    className="pl-14 h-14 rounded-none border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#FF5500]/5 transition-all font-medium"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 px-1">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#FF5500] focus:ring-[#FF5500]"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="text-[11px] text-gray-500 font-medium leading-relaxed">
                I agree to the <Link to="/terms" className="text-[#FF5500] font-black hover:underline">Terms</Link> and <Link to="/privacy" className="text-[#FF5500] font-black hover:underline">Privacy Policy</Link>.
              </label>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 rounded-none bg-[#FF5500] text-white font-black text-xs uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl shadow-orange-500/10"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-dashed border-gray-100 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Already have an account?{" "}
              <Link to="/login" className="text-[#FF5500] font-black hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
