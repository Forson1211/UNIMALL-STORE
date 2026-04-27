import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, role, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { siteName } = useSiteSettingsContext();

  useEffect(() => {
    if (!authLoading && user && role) {
      const state = location.state as { from?: { pathname: string } };
      const from = state?.from?.pathname;
      
      if (from) {
        navigate(from, { replace: true });
      } else {
        // Role-based default redirect
        if (role === "admin") navigate("/admin", { replace: true });
        else if (role === "vendor") navigate("/vendor", { replace: true });
        else navigate("/account", { replace: true });
      }
    }
  }, [user, role, authLoading, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      console.log("Submitting login form for:", email);
      const { error } = await signIn(email, password);
      if (error) {
        console.error("Login submission error:", error);
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      } else {
        console.log("Login submission successful");
      }
    } catch (err: any) {
      console.error("Unexpected login error:", err);
      toast({ title: "Unexpected Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh font-jakarta p-4">
      <div className="w-full max-w-[480px]">
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
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center justify-center mb-8">
              <img src="/AUTH LOGO.png" alt={siteName || "Unimall"} className="h-16 md:h-20 w-auto object-contain drop-shadow-xl" />
            </Link>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Welcome Back</h1>
            <p className="text-gray-500 font-medium text-sm">Sign in to your {siteName || "Unimall"} account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Campus Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                <Input
                  type="email"
                  placeholder="name@university.edu"
                  className="pl-14 h-14 rounded-none border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#FF5500]/5 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
                <Link to="/forgot-password" title="Forgot Password" className="text-[10px] font-black text-[#FF5500] uppercase tracking-widest hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
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

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 rounded-none bg-[#FF5500] text-white font-black text-xs uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl shadow-orange-500/10"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-dashed border-gray-100 text-center">
            <p className="text-sm text-gray-500 font-medium">
              New here?{" "}
              <Link to="/signup" className="text-[#FF5500] font-black hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
