import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { api } from '@/integrations/api/client';
import { AuthIllustration } from "@/components/auth/AuthIllustration";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, role, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const verificationEmail = (location.state as { verificationEmail?: string } | null)?.verificationEmail;
  const [needsVerification, setNeedsVerification] = useState(!!verificationEmail);
  const [resending, setResending] = useState(false);

  const resendVerification = async () => {
    const target = email.trim() || verificationEmail;
    if (!target || resending) return;
    setResending(true);
    try {
      const { data, error } = await api.auth.resendVerificationEmail(target);
      if (error) throw error;
      toast({ title: 'Verification email requested', description: data.message });
    } catch (error) {
      toast({ title: 'Unable to request email', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setResending(false);
    }
  };

  const { siteName, logoUrl, authLogoUrl } = useSiteSettingsContext();

  useEffect(() => {
    if (!authLoading && user && role) {
      const state = location.state as { from?: { pathname: string; search?: string; hash?: string } };
      const from = state?.from?.pathname?.startsWith("/") && !state.from.pathname.startsWith("//")
        ? state.from.pathname + (state.from.search || "") + (state.from.hash || "") : null;
      
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (["admin", "moderator", "vendor_manager", "order_manager", "content_manager", "support_agent"].includes(role)) {
          navigate("/admin", { replace: true });
        } else if (role === "vendor") {
          navigate("/vendor", { replace: true });
        } else {
          navigate("/account", { replace: true });
        }
      }
    }
  }, [user, role, authLoading, navigate, location]);

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
    try {
      setIsLoading(true);
      const { error } = await signIn(email, password);
      if (error) {
        if (/verify your email/i.test(error.message)) setNeedsVerification(true);
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Unexpected Error", description: "Something went wrong. Please try again.", variant: "destructive" });
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

          {/* Right Column: No Strokes on Inputs */}
          <div className="p-6 sm:p-7 lg:p-8 flex flex-col justify-between bg-white">
            <div>
              {/* Header */}
              <div className="mb-4">
                <div className="md:hidden flex items-center justify-between mb-3">
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
                  Account login
                </h1>
                <p className="text-xs text-gray-500 font-normal">
                  Welcome back! Access your {siteName || "Unimall"} store & account.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {needsVerification && (
                  <div role="status" className="rounded-none border-0 bg-amber-50 p-2.5 text-xs text-amber-900">
                    <p className="font-medium">Verify your email before signing in.</p>
                    <Button 
                      type="button" 
                      variant="link" 
                      className="p-0 h-auto text-xs text-[#FF5500] font-bold underline mt-1" 
                      disabled={resending} 
                      onClick={resendVerification}
                    >
                      {resending ? 'Requesting...' : 'Resend verification email'}
                    </Button>
                  </div>
                )}

                {/* Email Field - No Stroke */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    Email address
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 h-10 bg-[#F1F3F5] border-0 rounded-none text-xs text-gray-800 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#FF5500] focus:bg-[#E9ECEF] transition-all font-medium shadow-none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Your 2FA verification code and receipts will be sent here.
                  </p>
                </div>

                {/* Password Field - No Stroke */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Your password
                    </label>
                    <Link 
                      to="/forgot-password" 
                      className="text-xs font-bold text-[#FF5500] hover:underline"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
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

                {/* Orange Sign In Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-none border-0 bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-none flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{isLoading ? "Signing In..." : "Sign In"}</span>
                </Button>
              </form>

              {/* Return to Public Platform */}
              <div className="mt-3.5 text-center">
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-[#FF5500] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to public platform
                </Link>
              </div>

              {/* Sign up toggle link */}
              <div className="mt-2.5 text-center">
                <p className="text-xs text-gray-500">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-[#FF5500] font-bold hover:underline">
                    Create an account
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer Copyright */}
            <div className="mt-4 pt-2.5 border-t border-gray-100 text-center">
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

export default Login;
