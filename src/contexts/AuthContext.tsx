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

      // Use TEXT-returning RPC so ALL roles (including staff) are returned correctly
      const roleData = await withRetry(async () => {
        // First try the text-based RPC that supports all roles
        const { data, error } = await (supabase.rpc as any)("get_user_role_text", { _user_id: userId });
        if (error) {
          // Fallback to original RPC (only returns admin/vendor/buyer)
          const { data: d2, error: e2 } = await supabase.rpc("get_user_role", { _user_id: userId });
          if (e2) throw e2;
          return d2;
        }
        return data;
      }, null, { retries: 2, baseDelay: 1500 });

      if (roleData) {
        setRole(roleData as UserRole);

        // Use SECURITY DEFINER RPC to bypass RLS on user_roles
        const vendorStatus = await withRetry(async () => {
          const { data, error } = await (supabase.rpc as any)("get_vendor_status", { _user_id: userId });
          if (error) throw error;
          return data;
        }, null, { retries: 2, baseDelay: 1500 });

        setVendorStatus((vendorStatus as VendorStatus) ?? null);
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

    // Health Check
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('site_settings').select('count', { count: 'estimated', head: true });
        if (error) {
          console.error("Supabase Connection Check Failed:", error);
        } else {
          console.log("Supabase Connection: OK");
        }
      } catch (err) {
        console.error("Supabase Connection Check Exception:", err);
      }
    };
    checkConnection();

    return () => subscription.unsubscribe();
  }, []);

  // 2. Real-time Subscription for User Roles
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-role-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("User roles updated, refreshing profile:", payload);
          await fetchProfile(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      console.log("Attempting signUp for:", email, "with role:", userRole);
      const { data, error } = await supabase.auth.signUp({
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

      if (error) {
        console.error("signUp error:", error);
        throw error;
      }

      console.log("signUp success:", data);

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
      console.log("Attempting signIn for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("signIn error:", error);
        throw error;
      }

      console.log("signIn success:", data);

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
