import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import type { User, Session } from "@/integrations/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";

export type UserRole = "admin" | "moderator" | "vendor_manager" | "order_manager" | "content_manager" | "support_agent" | "vendor" | "buyer";
type VendorStatus = "pending" | "approved" | "suspended" | null;
interface Profile {
  id: string; user_id: string; full_name: string | null; avatar_url: string | null;
  phone: string | null; address: string | null; store_name: string | null;
  store_description: string | null; campus?: string | null; banner_url?: string | null;
  hostel_landmark?: string | null; same_day_delivery?: boolean | null; free_delivery?: boolean | null;
  store_category?: string | null; verified?: boolean | null; rating?: number | null;
  notification_preferences?: {
    new_order?: boolean; low_stock?: boolean; customer_messages?: boolean;
    weekly_report?: boolean; product_reviews?: boolean; two_factor?: boolean;
    login_notifications?: boolean;
  } | null;
}
interface AuthContextType {
  user: User | null; session: Session | null; profile: Profile | null;
  role: UserRole | null; vendorStatus: VendorStatus; isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole, storeName?: string) => Promise<{ error: Error | null; verificationRequired?: boolean; verificationEmailSent?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const roles: UserRole[] = ["admin", "moderator", "vendor_manager", "order_manager", "content_manager", "support_agent", "vendor", "buyer"];
type AuthRpc = (name: "get_user_role_text" | "get_vendor_status", params: { _user_id: string }) => Promise<{ data: string | null; error: Error | null }>;
const authRpc = api.rpc.bind(api) as unknown as AuthRpc;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [vendorStatus, setVendorStatus] = useState<VendorStatus>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeUserId = useRef<string | null>(null);
  const requestVersion = useRef(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fetchProfile = useCallback(async (userId: string) => {
    const version = ++requestVersion.current;
    try {
      const [profileResult, roleResult, statusResult] = await Promise.all([
        api.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        (async () => {
          const result = await authRpc("get_user_role_text", { _user_id: userId });
          if (!result.error) return result;
          return api.rpc("get_user_role", { _user_id: userId });
        })(),
        authRpc("get_vendor_status", { _user_id: userId }),
      ]);
      if (activeUserId.current !== userId || version !== requestVersion.current) return;
      if (profileResult.error) throw profileResult.error;
      if (roleResult.error) throw roleResult.error;
      const nextRole = roles.includes(roleResult.data as UserRole) ? roleResult.data as UserRole : null;
      setProfile(profileResult.data as Profile | null);
      setRole(nextRole);
      setVendorStatus(nextRole === "vendor"
        ? ["approved", "suspended", "pending"].includes(statusResult.data) ? statusResult.data as VendorStatus : "pending"
        : null);
    } catch (error) {
      if (activeUserId.current === userId && version === requestVersion.current) {
        setRole(null);
        setVendorStatus(null);
        console.error("Unable to load account permissions", error);
      }
    } finally {
      if (activeUserId.current === userId && version === requestVersion.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    let authEventReceived = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const applySession = (next: Session | null) => {
      if (!alive) return;
      const nextId = next?.user.id ?? null;
      const changed = activeUserId.current !== nextId;
      activeUserId.current = nextId;
      setSession(next);
      setUser(next?.user ?? null);
      if (changed || !nextId) {
        ++requestVersion.current;
        setProfile(null); setRole(null); setVendorStatus(null);
        queryClient.clear();
      }
      if (nextId) {
        if (changed) setIsLoading(true);
        // Defer permission loading until the session state has been applied.
        const timer = setTimeout(() => {
          timers.delete(timer);
          if (alive && activeUserId.current === nextId) void fetchProfile(nextId);
        }, 0);
        timers.add(timer);
      } else setIsLoading(false);
    };
    const { data: { subscription } } = api.auth.onAuthStateChange((_event, next) => {
      authEventReceived = true;
      applySession(next);
    });
    api.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) throw error;
      if (data.emailVerified) toast({ title: 'Email verified', description: 'You can now sign in.' });
      if (!authEventReceived) applySession(data.session);
    }).catch(error => {
      if (!alive) return;
      if (error?.code === 'EMAIL_VERIFICATION_FAILED') toast({ title: 'Verification link could not be used', description: error.message, variant: 'destructive' });
      if (!authEventReceived) applySession(null);
    });
    return () => {
      alive = false;
      ++requestVersion.current;
      timers.forEach(clearTimeout);
      subscription.unsubscribe();
    };
  }, [queryClient, fetchProfile, toast]);

  useEffect(() => {
    if (!user) return;
    const refresh = () => { void fetchProfile(user.id); };
    const channel = api.channel("account-permissions-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles", filter: "user_id=eq." + user.id }, refresh)
      .on("broadcast", { event: "vendor_approved" }, refresh)
      .on("broadcast", { event: "vendor_suspended" }, refresh)
      .on("broadcast", { event: "vendor_status_change" }, refresh)
      .subscribe();
    window.addEventListener("focus", refresh);
    window.addEventListener("unimall_vendor_status_updated", refresh);
    return () => {
      void api.removeChannel(channel);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("unimall_vendor_status_updated", refresh);
    };
  }, [user?.id, fetchProfile]);

  const signUp: AuthContextType["signUp"] = async (email, password, fullName, userRole, storeName) => {
    if (userRole !== "buyer" && userRole !== "vendor") return { error: new Error("Choose a buyer or vendor account.") };
    const { data, error } = await api.auth.signUp({
      email: email.trim(), password,
      options: { emailRedirectTo: window.location.origin + "/login", data: {
        full_name: fullName.trim(), role: userRole,
        store_name: userRole === "vendor" ? (storeName || fullName).trim() : null,
      } },
    });
    if (!error) toast({ title: "Account created", description: data?.verificationRequired ? "Check your email to verify your account." : "Sign in to start using your account." });
    return { error, verificationRequired: data?.verificationRequired, verificationEmailSent: data?.verificationEmailSent };
  };
  const signIn: AuthContextType["signIn"] = async (email, password) => {
    const { error } = await api.auth.signInWithPassword({ email: email.trim(), password });
    if (!error) toast({ title: "Welcome back!", description: "You have successfully signed in." });
    return { error };
  };
  const signOut = async () => {
    const { error } = await api.auth.signOut();
    if (error) { toast({ title: "Unable to sign out", description: error.message, variant: "destructive" }); return; }
    queryClient.clear();
    toast({ title: "Signed out" });
  };
  const updateProfile: AuthContextType["updateProfile"] = async (updates) => {
    try {
      if (!user) throw new Error("Sign in to update your profile.");
      const { id: _id, user_id: _userId, verified: _verified, rating: _rating, ...editable } = updates;
      const { data, error } = await api.from("profiles")
        .update(editable).eq("user_id", user.id).select("*").single();
      if (error) throw error;
      if (activeUserId.current === user.id) {
        setProfile(data as Profile);
        try { localStorage.setItem("unimall_vendor_profile_" + user.id, JSON.stringify(data)); } catch { /* Storage may be unavailable. */ }
      }
      toast({ title: "Profile updated" });
      return { error: null };
    } catch (error) { return { error: error as Error }; }
  };
  return <AuthContext.Provider value={{ user, session, profile, role, vendorStatus, isLoading, signUp, signIn, signOut, updateProfile, refreshProfile: async () => { if (user) await fetchProfile(user.id); } }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
