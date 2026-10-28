import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { AuthIllustration } from "@/components/auth/AuthIllustration";
import { Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";

export default function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [recoveryToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token"));
  const { toast } = useToast();
  const navigate = useNavigate();
  const { siteName, logoUrl, authLogoUrl } = useSiteSettingsContext();

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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (reset && (password.length < 8 || password !== confirmation)) {
      toast({
        title: "Check your password",
        description: "Use at least 8 characters and matching passwords.",
        variant: "destructive"
      });
      return;
    }
    setBusy(true);
    try {
      if (reset) {
        if (!recoveryToken) throw new Error("Open a valid password reset link from your email.");
        const { error } = await api.auth.resetPassword(recoveryToken, password);
        if (error) throw error;
        history.replaceState(null, "", window.location.pathname + window.location.search);
        toast({ title: "Password updated", description: "Your new password is ready to use." });
        navigate("/login", { replace: true });
      } else {
        const { error } = await api.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
        setSent(true);
      }
    } catch (error) {
      toast({
        title: "Unable to continue",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setBusy(false);
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

          {/* Left Column: Big Illustration Pane */}
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

          {/* Right Column: Recovery Form */}
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
                  {reset ? "Set a new password" : "Reset your password"}
                </h1>
                <p className="text-xs text-gray-500 font-normal">
                  {reset
                    ? "Choose a password with at least 8 characters."
                    : "We'll email you a link to recover your account."}
                </p>
              </div>

              {/* Status / Alert states */}
              {sent ? (
                <div role="status" className="p-3 bg-green-50 rounded-none border-0 text-xs text-green-800 font-medium my-4">
                  If an account exists for this email, a reset link is on its way. Check your inbox and spam folder.
                </div>
              ) : reset && !recoveryToken ? (
                <div role="alert" className="p-3 bg-red-50 rounded-none border-0 text-xs text-red-800 font-medium my-4">
                  This link has expired or is invalid.{" "}
                  <Link to="/forgot-password" className="text-[#FF5500] font-bold underline">
                    Request a new link
                  </Link>
                  .
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-3.5">
                  {reset ? (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                          New password
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                          <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Minimum 8 characters"
                            minLength={8}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 h-10 bg-[#F1F3F5] border-0 rounded-none text-xs text-gray-800 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#FF5500] focus:bg-[#E9ECEF] transition-all font-medium shadow-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="confirmation" className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                          Confirm password
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                          <Input
                            id="confirmation"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Re-enter your new password"
                            minLength={8}
                            required
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                            className="pl-10 h-10 bg-[#F1F3F5] border-0 rounded-none text-xs text-gray-800 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#FF5500] focus:bg-[#E9ECEF] transition-all font-medium shadow-none"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                        Email address
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="Enter your email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-10 bg-[#F1F3F5] border-0 rounded-none text-xs text-gray-800 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#FF5500] focus:bg-[#E9ECEF] transition-all font-medium shadow-none"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight">
                        We'll send recovery instructions to this address.
                      </p>
                    </div>
                  )}

                  {/* Orange Action Button */}
                  <Button
                    type="submit"
                    disabled={busy}
                    className="w-full h-10 rounded-none border-0 bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-none flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>{busy ? "Please wait..." : reset ? "Save password" : "Send reset link"}</span>
                  </Button>
                </form>
              )}

              {/* Navigation Links */}
              <div className="mt-4 text-center space-y-2">
                <Link
                  to="/login"
                  className="block text-xs font-bold text-[#FF5500] hover:underline"
                >
                  Back to sign in
                </Link>

                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-[#FF5500] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to public platform
                </Link>
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
}
