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
  banner_url?: string | null;
  store_category?: string | null;
  verified?: boolean | null;
  rating?: number | null;
  notification_preferences?: {
    new_order?: boolean;
    low_stock?: boolean;
    customer_messages?: boolean;
    weekly_report?: boolean;
    product_reviews?: boolean;
    two_factor?: boolean;
    login_notifications?: boolean;
  } | null;
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
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const raw = localStorage.getItem("unimall_last_profile_cache");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState<UserRole | null>(() => {
    try {
      return (localStorage.getItem("unimall_last_auth_role") as UserRole) || null;
    } catch {
      return null;
    }
  });
  const [vendorStatus, setVendorStatus] = useState<VendorStatus>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      // 1. Check local cache first for instant zero-latency restoration on refresh
      let localCache: any = null;
      try {
        const rawLocal = localStorage.getItem(`unimall_vendor_profile_${userId}`);
        if (rawLocal) {
          localCache = JSON.parse(rawLocal);
          setProfile((prev) => ({
            ...(prev || {}),
            ...localCache,
            user_id: userId,
            id: userId,
          } as any));
        }
      } catch (e) {}

      const profileData = await withRetry(async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, store_name, phone, store_description, avatar_url, address")
          .or(`user_id.eq.${userId},id.eq.${userId}`)
          .maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        return data;
      }, null, { retries: 2, baseDelay: 1500 });

      let userMetaStoreName = "";
      try {
        const { data: authUser } = await supabase.auth.getUser();
        userMetaStoreName = authUser?.user?.user_metadata?.store_name || "";
      } catch (e) {}

      if (profileData || localCache || userMetaStoreName) {
        const resolvedStoreName = profileData?.store_name || localCache?.store_name || userMetaStoreName || profileData?.full_name || "";
        const merged = {
          ...(profileData || {}),
          ...(localCache || {}),
          store_name: resolvedStoreName,
          user_id: userId,
          id: profileData?.id || userId,
        };
        setProfile(merged as any);
        try {
          localStorage.setItem("unimall_last_profile_cache", JSON.stringify(merged));
        } catch (e) {}
      }

      let authEmail = "";
      try {
        const { data: authUser } = await supabase.auth.getUser();
        authEmail = (authUser?.user?.email || "").toLowerCase().trim();
      } catch (e) {}

      const isSuperAdmin = authEmail === "forsonodonkor1211@gmail.com" || authEmail === "admin@unimall.com";

      // Use TEXT-returning RPC so ALL roles (including staff) are returned correctly
      const roleData = await withRetry(async () => {
        if (isSuperAdmin) return "admin";
        const { data, error } = await (supabase.rpc as any)("get_user_role_text", { _user_id: userId });
        if (error) {
          const { data: d2, error: e2 } = await supabase.rpc("get_user_role", { _user_id: userId });
          if (e2) throw e2;
          return d2;
        }
        return data;
      }, null, { retries: 2, baseDelay: 1500 });

      // 1. Query get_vendor_status RPC (SECURITY DEFINER)
      let dbVendorStatus: VendorStatus = null;
      try {
        const { data: vsData } = await (supabase.rpc as any)("get_vendor_status", { _user_id: userId });
        if (vsData) {
          dbVendorStatus = vsData as VendorStatus;
        }
      } catch (e) {}

      // 2. Query user_roles table directly
      if (!dbVendorStatus) {
        try {
          const { data: urData } = await supabase
            .from("user_roles")
            .select("vendor_status")
            .eq("user_id", userId)
            .maybeSingle();
          if (urData?.vendor_status) {
            dbVendorStatus = urData.vendor_status as VendorStatus;
          }
        } catch (e) {}
      }

      // 3. Query profiles table directly
      if (!dbVendorStatus) {
        try {
          const { data: prData } = await supabase
            .from("profiles")
            .select("vendor_status")
            .or(`id.eq.${userId},user_id.eq.${userId}`)
            .maybeSingle();
          if ((prData as any)?.vendor_status) {
            dbVendorStatus = (prData as any).vendor_status as VendorStatus;
          }
        } catch (e) {}
      }

      const localStatus = localStorage.getItem(`unimall_vendor_status_${userId}`) as VendorStatus;

      const finalRole = (isSuperAdmin ? "admin" : (roleData as UserRole)) || null;

      if (finalRole) {
        setRole(finalRole);
        try {
          localStorage.setItem("unimall_last_auth_role", finalRole);
        } catch (e) {}

        let resolvedStatus: VendorStatus = null;

        if (finalRole === "admin") {
          resolvedStatus = "approved";
        } else if (dbVendorStatus === "suspended" || localStatus === "suspended") {
          // Explicit suspension in DB or locally -> always suspended
          resolvedStatus = "suspended";
        } else if (dbVendorStatus === "approved") {
          resolvedStatus = "approved";
        } else if (dbVendorStatus === "pending") {
          resolvedStatus = "pending";
        } else if (localStatus === "approved") {
          resolvedStatus = "approved";
        } else if (localStatus === "pending") {
          resolvedStatus = "pending";
        } else if (finalRole === "vendor") {
          resolvedStatus = "pending";
        } else {
          resolvedStatus = null;
        }

        if (resolvedStatus) {
          try {
            localStorage.setItem(`unimall_vendor_status_${userId}`, resolvedStatus);
            localStorage.setItem("unimall_last_vendor_status", resolvedStatus);
          } catch (e) {}
        }
        setVendorStatus(resolvedStatus);
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
          try {
            localStorage.removeItem("unimall_last_profile_cache");
            localStorage.removeItem("unimall_last_auth_role");
            localStorage.removeItem("unimall_last_vendor_status");
          } catch (e) {}
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          fetchProfile(initialSession.user.id);
        }
      })
      .catch((err) => {
        console.warn("Session check fallback:", err?.message || err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Real-time Subscription + Persistent Status Monitor
  useEffect(() => {
    if (!user) return;

    // Primary realtime channel: watch user_roles changes via Supabase Realtime
    const channel = supabase
      .channel(`vendor-approval-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_roles",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload: any) => {
          console.log("user_roles updated:", payload);
          const newRole = payload?.new?.role;
          const newVendorStatus = payload?.new?.vendor_status as VendorStatus;
          if (newVendorStatus === "suspended" || (newRole === "buyer" && user?.user_metadata?.role === "vendor")) {
            setVendorStatus("suspended");
            try { localStorage.setItem(`unimall_vendor_status_${user.id}`, "suspended"); } catch (e) {}
          } else if (newRole === "vendor" || newRole === "admin" || newVendorStatus === "approved") {
            setVendorStatus("approved");
            try { localStorage.setItem(`unimall_vendor_status_${user.id}`, "approved"); } catch (e) {}
          } else if (newVendorStatus) {
            setVendorStatus(newVendorStatus);
            try { localStorage.setItem(`unimall_vendor_status_${user.id}`, newVendorStatus); } catch (e) {}
          }
          await fetchProfile(user.id);
        }
      )
      // Listen on broadcast events for instant zero-lag approval and suspension
      .on("broadcast", { event: "vendor_approved" }, async (payload: any) => {
        if (payload?.payload?.vendorId === user.id) {
          setVendorStatus("approved");
          try { localStorage.setItem(`unimall_vendor_status_${user.id}`, "approved"); } catch (e) {}
          await fetchProfile(user.id);
        }
      })
      .on("broadcast", { event: "vendor_suspended" }, async (payload: any) => {
        if (payload?.payload?.vendorId === user.id) {
          setVendorStatus("suspended");
          try { localStorage.setItem(`unimall_vendor_status_${user.id}`, "suspended"); } catch (e) {}
          await fetchProfile(user.id);
        }
      })
      .on("broadcast", { event: "vendor_status_change" }, async (payload: any) => {
        if (payload?.payload?.vendorId === user.id && payload?.payload?.status) {
          const status = payload.payload.status as VendorStatus;
          setVendorStatus(status);
          try { localStorage.setItem(`unimall_vendor_status_${user.id}`, status); } catch (e) {}
          await fetchProfile(user.id);
        }
      })
      .subscribe((status) => {
        console.log("vendor-approval channel status:", status);
      });

    // Instant local custom event listener (same browser)
    const handleStatusUpdate = (e: any) => {
      if (e?.detail?.vendorId === user.id || !e?.detail?.vendorId) {
        const status = (e?.detail?.status || "approved") as VendorStatus;
        try { localStorage.setItem(`unimall_vendor_status_${user.id}`, status); } catch (e) {}
        setVendorStatus(status);
        fetchProfile(user.id);
      }
    };

    // Tab storage sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `unimall_vendor_status_${user.id}` && e.newValue) {
        setVendorStatus(e.newValue as VendorStatus);
        fetchProfile(user.id);
      }
    };

    // Gentle window focus refresh (only if tab was inactive for > 60s)
    let lastFocusCheck = Date.now();
    const handleWindowFocus = () => {
      const now = Date.now();
      if (now - lastFocusCheck > 60_000) {
        lastFocusCheck = now;
        fetchProfile(user.id);
      }
    };

    window.addEventListener("unimall_vendor_status_updated", handleStatusUpdate);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("unimall_vendor_status_updated", handleStatusUpdate);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleWindowFocus);
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
      
      // Save pending profile locally before signup
      try {
        localStorage.setItem("unimall_pending_signup_profile", JSON.stringify({
          email: email.toLowerCase().trim(),
          fullName,
          storeName: storeName || fullName,
          role: userRole,
        }));
      } catch (e) {}

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            role: userRole,
            store_name: storeName || fullName,
          },
        },
      });

      if (error) {
        console.error("signUp error:", error);
        throw error;
      }

      console.log("signUp success:", data);

      if (data?.user?.id) {
        const initialStoreName = userRole === "vendor" ? (storeName || fullName) : null;
        const vendorCache = {
          store_name: initialStoreName,
          full_name: fullName,
          banner_url: null,
          avatar_url: null,
          phone: "",
          store_description: "",
          campus: "",
        };
        try {
          localStorage.setItem(`unimall_vendor_profile_${data.user.id}`, JSON.stringify(vendorCache));
        } catch (e) {}

        // Upsert initial profile to profiles table in Supabase
        try {
          await supabase.from("profiles").upsert({
            user_id: data.user.id,
            full_name: fullName,
            store_name: initialStoreName,
            banner_url: null,
            avatar_url: null,
            phone: null,
            store_description: null,
            campus: null,
          });
        } catch (e) {}
      }

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account or sign in.",
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

      if (data?.user?.id) {
        const metadata = data.user.user_metadata || {};
        let pendingObj: any = null;
        try {
          const pending = localStorage.getItem("unimall_pending_signup_profile");
          if (pending) pendingObj = JSON.parse(pending);
        } catch (e) {}

        const resolvedStore = metadata.store_name || (pendingObj?.email === email.toLowerCase().trim() ? pendingObj.storeName : null);
        const resolvedName = metadata.full_name || (pendingObj?.email === email.toLowerCase().trim() ? pendingObj.fullName : null);

        if (resolvedStore) {
          const raw = localStorage.getItem(`unimall_vendor_profile_${data.user.id}`) || "{}";
          try {
            const existing = JSON.parse(raw);
            localStorage.setItem(`unimall_vendor_profile_${data.user.id}`, JSON.stringify({
              ...existing,
              store_name: resolvedStore,
              full_name: resolvedName || existing.full_name,
            }));
          } catch (e) {}

          supabase.from("profiles").upsert({
            user_id: data.user.id,
            store_name: resolvedStore,
            full_name: resolvedName,
          }).then(() => {});
        }

        fetchProfile(data.user.id);
      }

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

      try {
        const raw = localStorage.getItem(`unimall_vendor_profile_${user.id}`) || "{}";
        const existing = JSON.parse(raw);
        localStorage.setItem(`unimall_vendor_profile_${user.id}`, JSON.stringify({ ...existing, ...updates }));
      } catch (e) {}

      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id: user.id, ...updates });

      if (error) {
        console.warn("Supabase upsert warning:", error);
      }

      setProfile((prev) => {
        if (prev) {
          return { ...prev, ...updates };
        }
        return {
          id: user.id,
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
