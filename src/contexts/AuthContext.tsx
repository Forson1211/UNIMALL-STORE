import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/dbUtils";
import { useToast } from "@/hooks/use-toast";

type UserRole = "admin" | "moderator" | "vendor_manager" | "order_manager" | "content_manager" | "support_agent" | "vendor" | "buyer";
type VendorStatus = "pending" | "approved" | "suspended" | null;

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  store_name: string | null;
  store_description: string | null;
  campus?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  vendorStatus: VendorStatus;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole, storeName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [vendorStatus, setVendorStatus] = useState<VendorStatus>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for:", userId);

      const profileData = await withRetry(async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        if (error && error.code !== "PGRST116") throw error;
        return data;
      }, null, { retries: 2, baseDelay: 1500 });

      if (profileData) setProfile(profileData as any);

      const roleData = await withRetry(async () => {
        const { data, error } = await supabase.rpc("get_user_role", { _user_id: userId });
        if (error) throw error;
        return data;
      }, null, { retries: 2, baseDelay: 1500 });

      if (roleData) {
        setRole(roleData as UserRole);

        const vendorData = await withRetry(async () => {
          const { data } = await (supabase
            .from("user_roles")
            .select("vendor_status")
            .eq("user_id", userId)
            .eq("role", "vendor")
            .maybeSingle() as any);
          return data;
        }, null, { retries: 2, baseDelay: 1500 });

        setVendorStatus(vendorData ? (vendorData.vendor_status as VendorStatus) : null);
      }
    } catch (error) {
      console.error("Unexpected error in fetchProfile:", error);
    }
  };

  // 1. Auth State Listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          setTimeout(() => fetchProfile(currentSession.user.id), 0);
        } else {
          setProfile(null);
          setRole(null);
          setVendorStatus(null);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Real-time Subscription for Vendor Status + polling fallback
  useEffect(() => {
    if (!user) return;

    console.log("Setting up real-time status tracker for:", user.id);

    const roleSubscription = supabase
      .channel(`user-role-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_roles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Real-time vendor status change detected:", payload);
          const data = payload.new as any;
          if (data && data.role === "vendor") {
            const newStatus = data.vendor_status as VendorStatus;
            setVendorStatus(newStatus);

            if (newStatus === "approved") {
              toast({
                title: "Store Approved! 🎉",
                description: "Your vendor account has been approved. Your dashboard is now unlocked.",
              });
            } else if (newStatus === "suspended") {
              toast({
                title: "Account Suspended",
                description: "Your vendor account has been suspended. Contact support for details.",
                variant: "destructive",
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime channel status:", status);
      });

    // Polling fallback: re-fetch vendor status every 10s while pending
    // This handles cases where realtime is not yet enabled on user_roles
    const pollInterval = setInterval(async () => {
      const { data } = await (supabase
        .from("user_roles")
        .select("vendor_status, role")
        .eq("user_id", user.id)
        .eq("role", "vendor")
        .maybeSingle() as any);

      if (data) {
        const polledStatus = data.vendor_status as VendorStatus;
        setVendorStatus((prev) => {
          if (prev !== polledStatus) {
            if (polledStatus === "approved" && prev === "pending") {
              toast({
                title: "Store Approved! 🎉",
                description: "Your vendor account has been approved. Your dashboard is now unlocked.",
              });
            }
            return polledStatus;
          }
          return prev;
        });
      }
    }, 10000);

    return () => {
      supabase.removeChannel(roleSubscription);
      clearInterval(pollInterval);
    };
  }, [user]);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    userRole: UserRole,
    storeName?: string
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            role: userRole,
            store_name: storeName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setVendorStatus(null);
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error("No user logged in");

      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id: user.id, ...updates });

      if (error) throw error;

      setProfile((prev) => {
        if (prev) {
          return { ...prev, ...updates };
        }
        return {
          id: "",
          user_id: user.id,
          full_name: null,
          avatar_url: null,
          phone: null,
          address: null,
          store_name: null,
          store_description: null,
          campus: null,
          ...updates
        };
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      return { error: null };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { error: error as Error };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        vendorStatus,
        isLoading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
