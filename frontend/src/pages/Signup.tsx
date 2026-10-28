import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Store,
  ShoppingCart
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { AuthIllustration } from "@/components/auth/AuthIllustration";

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
  const { siteName, logoUrl, authLogoUrl } = useSiteSettingsContext();

  useEffect(() => {
    if (!authLoading && user && role) {
      if (["admin", "moderator", "vendor_manager", "order_manager", "content_manager", "support_agent"].includes(role)) {
        navigate("/admin", { replace: true });
      } else if (role === "vendor") {
        navigate("/vendor", { replace: true });
      } else {
        navigate("/account", { replace: true });
      }
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    const rootEl = document.getElementById("root");
    if (rootEl) {
      rootEl.classList.add("full-screen-auth");
    }
    return () => {
      if (rootEl) {
        rootEl.classList.remove("full-screen-auth");
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the Terms of Service to create an account.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error, verificationRequired, verificationEmailSent } = await signUp(
        email,
        password,
        fullName,
        selectedRole,
        selectedRole === "vendor" ? storeName : undefined
      );

      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "Account created!",
          description: verificationRequired
            ? verificationEmailSent
              ? "Please check your email to verify your account."
              : "Your account is saved. Request another verification email from the sign-in page."
            : "You can now sign in to your account."
        });
        navigate("/login", {
          state: verificationRequired ? { verificationEmail: email.trim() } : undefined
        });
      }
    } catch (err: any) {
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0F172A] flex flex-col justify-between overflow-x-hidden font-sans">
      {/* Geometric Angled Background Elements (Deep Slate / Charcoal) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-[20%] right-0 w-[55%] h-[140%] bg-[#1E293B] opacity-80 transform -skew-x-12 origin-top"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 15% 100%)" }}
        />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#090D16] blur-3xl opacity-50" />
      </div>

      {/* Main Container - Stretched Horizontally & Vertically Compact */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 my-auto">
        <div className="w-full max-w-[940px] xl:max-w-[980px] bg-white rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.45)] border-0 overflow-hidden grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">

          {/* Left Column */}
          <div className="hidden md:flex flex-col items-center justify-between bg-[#F8FAFC] p-6 lg:p-8 relative border-0">
            {/* Top Logo */}
            <div className="w-full flex items-center justify-start gap-2">
              <Link to="/" className="flex items-center gap-2 group">
                <img
                  src={authLogoUrl || logoUrl || "/AUTH LOGO.png"}
                  alt={siteName || "Unimall"}
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="font-extrabold text-base tracking-tight text-gray-900">
                  {siteName || "Unimall"}
                </span>
              </Link>
            </div>

            {/* Center Vector Illustration */}
            <div className="my-auto py-2 w-full flex items-center justify-center">
              <AuthIllustration accentColor="#FF5500" />
            </div>

            {/* Bottom Accent Dash indicator */}
            <div className="w-12 h-1 bg-[#FF5500] rounded-none" />
          </div>

          {/* Right Column: No Strokes on Inputs & Role Tabs */}
          <div className="p-6 sm:p-7 lg:p-8 flex flex-col justify-between bg-white">
            <div>
              {/* Header */}
              <div className="mb-3.5">
                <div className="md:hidden flex items-center justify-between mb-2">
                  <Link to="/" className="flex items-center gap-2">
                    <img
                      src={authLogoUrl || logoUrl || "/AUTH LOGO.png"}
                      alt={siteName || "Unimall"}
                      className="h-7 w-auto object-contain"
                    />
                    <span className="font-bold text-sm text-gray-900">{siteName || "Unimall"}</span>
                  </Link>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-1">
                  Create an account
                </h1>
                <p className="text-xs text-gray-500 font-normal">
                  Join {siteName || "Unimall"} to buy and sell on campus.
                </p>
              </div>

              {/* Role Toggle Selector - No Strokes / Borders */}
              <div className="flex p-1 bg-[#F1F3F5] rounded-none mb-3 border-0">
                <button
                  type="button"
                  onClick={() => setSelectedRole("buyer")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-none text-xs font-bold transition-all border-0 ${
                    selectedRole === "buyer"
                      ? "bg-white text-[#FF5500] shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Buyer Account
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("vendor")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-none text-xs font-bold transition-all border-0 ${
                    selectedRole === "vendor"
                      ? "bg-white text-[#FF5500] shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  Vendor Store
                </button>
              </div>

              {/* Form - No Strokes / Borders on Inputs */}
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {/* Full Name Field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    Full name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                    <Input
                      placeholder="e.g. Ama Mensah"
                      className="pl-10 h-10 bg-[#F1F3F5] border-0 rounded-none text-xs text-gray-800 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#FF5500] focus:bg-[#E9ECEF] transition-all font-medium shadow-none"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    Campus email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 h-10 bg-[#F1F3F5] border-0 rounded-none text-xs text-gray-800 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#FF5500] focus:bg-[#E9ECEF] transition-all font-medium shadow-none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Store Name (Vendor only) */}
                {selectedRole === "vendor" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Store name
                    </label>
                    <div className="relative group">
                      <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                      <Input
                        placeholder="e.g. Apex Tech Hub"
                        className="pl-10 h-10 bg-[#F1F3F5] border-0 rounded-none text-xs text-gray-800 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#FF5500] focus:bg-[#E9ECEF] transition-all font-medium shadow-none"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        required={selectedRole === "vendor"}
                      />
                    </div>
                  </div>
                )}

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      maxLength={128}
                      className="pl-10 pr-10 h-10 bg-[#F1F3F5] border-0 rounded-none text-xs text-gray-800 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#FF5500] focus:bg-[#E9ECEF] transition-all font-medium shadow-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Terms agreement */}
                <div className="flex items-start gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-0.5 h-3.5 w-3.5 rounded-none border-0 bg-gray-200 text-[#FF5500] focus:ring-[#FF5500]"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <label htmlFor="terms" className="text-[11px] text-gray-500 leading-tight">
                    I agree to the <Link to="/terms" className="text-[#FF5500] font-bold hover:underline">Terms</Link> and <Link to="/privacy" className="text-[#FF5500] font-bold hover:underline">Privacy</Link>.
                  </label>
                </div>

                {/* Orange Create Account Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-none border-0 bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-none flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{isLoading ? "Creating..." : "Create Account"}</span>
                </Button>
              </form>

              {/* Return to Public Platform */}
              <div className="mt-3 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-[#FF5500] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to public platform
                </Link>
              </div>

              {/* Already have an account */}
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-[#FF5500] font-bold hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer Copyright */}
            <div className="mt-3.5 pt-2 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400 font-medium">
                {siteName || "Unimall"} • Ghana's Campus Marketplace
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;
