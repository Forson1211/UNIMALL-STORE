import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Store, Upload, ExternalLink, MapPin, Phone, MessageCircle,
  CheckCircle2, Star, Eye, ShieldCheck, Camera,
  Image as ImageIcon, RefreshCw, Layers, Truck, Check, Clock,
  ArrowUpRight, AlertCircle, ShoppingBag
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { UnimallVerifiedBadge } from "@/components/common/UnimallVerifiedBadge";

const CAMPUS_OPTIONS = [
  "University of Ghana (Legon)",
  "KNUST (Kumasi)",
  "University of Cape Coast (UCC)",
  "UPSA (Accra)",
  "Accra Technical University (ATU)",
  "GIMPA (Greenhill)",
  "Ashesi University",
  "UMaT (Tarkwa)",
  "Central University",
  "Other Ghana campus",
];

const PRESET_BANNERS = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200&auto=format&fit=crop",
];

const VendorProfile = () => {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { getSetting } = useSiteSettingsContext();

  const [loading, setLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);

  const [formData, setFormData] = useState({
    storeName: "",
    description: "",
    phone: "",
    campus: "University of Ghana (Legon)",
    category: "General",
    landmark: "",
    sameDayDelivery: true,
    freeDelivery: false,
  });

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");

  const isPro = Boolean(
    (profile as any)?.is_pro ||
    profile?.verified ||
    (user?.id && localStorage.getItem(`unimall_vendor_pro_${user.id}`) === "true")
  );

  useEffect(() => {
    let localData: any = null;
    if (user?.id) {
      const raw = localStorage.getItem(`unimall_vendor_profile_${user.id}`);
      if (raw) {
        try {
          localData = JSON.parse(raw);
        } catch (e) {}
      }
    }

    const merged = { ...(profile || {}), ...(localData || {}) };

    if (merged.store_name || merged.full_name || merged.phone || merged.campus || merged.avatar_url || merged.banner_url) {
      setFormData({
        storeName: merged.store_name || merged.full_name || "",
        description: merged.store_description || "",
        phone: merged.phone || "",
        campus: merged.campus || "University of Ghana (Legon)",
        category: merged.category || merged.store_category || "General",
        landmark: merged.hostel_landmark || merged.landmark || "",
        sameDayDelivery: merged.same_day_delivery ?? true,
        freeDelivery: merged.free_delivery ?? false,
      });
      if (merged.avatar_url) setAvatarUrl(merged.avatar_url);
      if (merged.banner_url) setBannerUrl(merged.banner_url);
    }
  }, [profile, user?.id]);

  // Profile completeness calculation
  const getCompleteness = () => {
    let score = 0;
    if (formData.storeName) score += 20;
    if (avatarUrl) score += 20;
    if (bannerUrl) score += 20;
    if (formData.phone) score += 20;
    if (formData.description) score += 20;
    return score;
  };

  const completeness = getCompleteness();

  const uploadImageResiliently = async (file: File, prefix: string): Promise<string> => {
    const bucketsToTry = ['unimall', 'products', 'site-assets', 'avatars', 'banners', 'public', 'images'];
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${prefix}-${user?.id || 'vendor'}-${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    for (const bucketName of bucketsToTry) {
      try {
        const { error: uploadError } = await (supabase.storage as any)
          .from(bucketName)
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = (supabase.storage as any)
            .from(bucketName)
            .getPublicUrl(filePath);
          if (publicUrl) return publicUrl;
        }
      } catch (e) {
        // continue to fallback
      }
    }

    // High-performance Base64 fallback if storage buckets are not initialized
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to process image file"));
        }
      };
      reader.onerror = () => reject(new Error("Could not read image file"));
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Please select an image under 5MB.");
      return;
    }

    setLogoLoading(true);
    try {
      const finalUrl = await uploadImageResiliently(file, "logo");
      setAvatarUrl(finalUrl);

      const updates = { avatar_url: finalUrl };
      if (updateProfile) await updateProfile(updates as any);

      await supabase
        .from("profiles")
        .upsert({ user_id: user.id, avatar_url: finalUrl } as any);

      try {
        const existing = JSON.parse(localStorage.getItem(`unimall_vendor_profile_${user.id}`) || "{}");
        localStorage.setItem(`unimall_vendor_profile_${user.id}`, JSON.stringify({ ...existing, avatar_url: finalUrl }));
      } catch (e) {}

      toast.success("Store logo updated successfully!");
      if (refreshProfile) await refreshProfile();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload logo.");
    } finally {
      setLogoLoading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Banner image too large. Maximum size is 5MB.");
      return;
    }

    setBannerLoading(true);
    try {
      const finalUrl = await uploadImageResiliently(file, "banner");
      setBannerUrl(finalUrl);

      const updates = { banner_url: finalUrl };
      if (updateProfile) await updateProfile(updates as any);

      await supabase
        .from("profiles")
        .upsert({ user_id: user.id, banner_url: finalUrl } as any);

      try {
        const existing = JSON.parse(localStorage.getItem(`unimall_vendor_profile_${user.id}`) || "{}");
        localStorage.setItem(`unimall_vendor_profile_${user.id}`, JSON.stringify({ ...existing, banner_url: finalUrl }));
      } catch (e) {}

      toast.success("Store banner updated successfully!");
      if (refreshProfile) await refreshProfile();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload banner.");
    } finally {
      setBannerLoading(false);
    }
  };

  const handleSelectPresetBanner = async (url: string) => {
    if (!user) return;
    setBannerUrl(url);
    try {
      const updates = { banner_url: url };
      if (updateProfile) await updateProfile(updates as any);
      await supabase
        .from("profiles")
        .upsert({ user_id: user.id, banner_url: url } as any);
      try {
        const existing = JSON.parse(localStorage.getItem(`unimall_vendor_profile_${user.id}`) || "{}");
        localStorage.setItem(`unimall_vendor_profile_${user.id}`, JSON.stringify({ ...existing, banner_url: url }));
      } catch (e) {}
      toast.success("Cover banner updated!");
      if (refreshProfile) await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to set banner");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    if (!formData.storeName.trim()) {
      toast.error("Please enter your store business name.");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Please enter a WhatsApp or phone contact number.");
      return;
    }

    setLoading(true);
    try {
      const updates = {
        store_name: formData.storeName.trim(),
        store_description: formData.description.trim(),
        phone: formData.phone.trim(),
        campus: formData.campus,
        avatar_url: avatarUrl || profile?.avatar_url || null,
        banner_url: bannerUrl || profile?.banner_url || null,
        updated_at: new Date().toISOString(),
      };

      if (updateProfile) {
        await updateProfile(updates as any);
      }

      await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          ...updates,
        } as any);

      localStorage.setItem(`unimall_vendor_profile_${user.id}`, JSON.stringify(updates));

      toast.success("🌟 Store profile published successfully!", {
        description: "Your public storefront is active and product publishing is unlocked.",
        action: {
          label: "View Store",
          onClick: () => window.open(`/vendors/${user.id}`, "_blank"),
        },
      });

      if (refreshProfile) await refreshProfile();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save store profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      type="vendor"
      title="Store Profile"
      userName={formData.storeName || profile?.full_name || "Vendor"}
      userRole="Verified Seller"
    >
      <div className="w-full space-y-6 pb-20">
        
        {/* ── Top Hero Banner (Matches Dashboard theme & Full Width) ── */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#3A506B] p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#FF5500]/10 blur-3xl pointer-events-none" />
          <div className="absolute right-10 bottom-0 opacity-10 pointer-events-none hidden md:block">
            <Store className="w-48 h-48 text-white" />
          </div>

          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#FF5500]" /> Public Storefront Editor
                </span>
                {isPro ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Pro
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] font-bold">
                    Standard Seller
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                Store Profile & Campus Brand
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Customize the public storefront students see when browsing your campus listings. Update your visual banner, brand logo, bio, and direct WhatsApp contact.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to={`/vendors/${user?.id || "1"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all border border-white/20 shadow-sm hover:scale-[1.02] active:scale-95"
              >
                <Eye className="w-4 h-4 text-orange-400" />
                <span>Preview Store</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </Link>

              <Button
                onClick={() => handleSubmit()}
                disabled={loading}
                className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-black text-xs sm:text-sm px-6 py-2.5 h-auto rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-95"
              >
                {loading ? "Publishing..." : "Publish Changes"}
              </Button>
            </div>
          </div>

          {/* Quick Stats Bar inside Hero */}
          <div className="relative mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Profile Completeness</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden max-w-[100px]">
                  <div className="h-full bg-[#FF5500] rounded-full shadow-[0_0_8px_rgba(255,85,0,0.5)] transition-all duration-500" style={{ width: `${completeness}%` }} />
                </div>
                <span className="font-bold text-white text-xs">{completeness}%</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Campus Hub</span>
              <span className="font-bold text-white text-xs truncate block mt-0.5">{formData.campus || "Legon"}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">WhatsApp Chat</span>
              <span className="font-bold text-emerald-400 text-xs truncate block mt-0.5">{formData.phone || "Not configured"}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Storefront Status</span>
              <span className="font-bold text-orange-300 text-xs block mt-0.5">● Live on Campus</span>
            </div>
          </div>
        </section>

        {/* ── 2-Column Responsive Layout (Full Width) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* ══════════ LEFT COLUMN: Editor Form (8 cols) ══════════ */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* 1. Visual Identity Card */}
            <Card className="rounded-2xl border-gray-200/80 dark:border-slate-800 bg-white dark:bg-card shadow-xs overflow-hidden">
              <CardHeader className="bg-slate-50/60 dark:bg-muted/20 border-b border-gray-100 dark:border-slate-800/80 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#FF5500] flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                        Visual Brand & Store Cover
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500">
                        Upload your storefront banner and high-res store icon.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    Branding
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                
                {/* Store Cover Banner */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-gray-700 dark:text-gray-200">
                      Store Cover Banner (Recommended: 1200 × 360 px)
                    </Label>
                    <span className="text-[11px] text-gray-400">JPG, PNG, WebP (Max 4MB)</span>
                  </div>

                  <div className="relative h-44 sm:h-52 w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-gray-300 dark:border-slate-700 group transition-all">
                    {bannerUrl ? (
                      <img
                        src={bannerUrl}
                        alt="Store Banner"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center bg-gradient-to-br from-slate-800 to-slate-900">
                        <ImageIcon className="w-8 h-8 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-300">No custom cover banner uploaded</span>
                        <span className="text-[11px] text-slate-400">Click upload or choose a preset campus cover below</span>
                      </div>
                    )}

                    {/* Banner Overlay Controls */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                      <label className="cursor-pointer bg-[#FF5500] hover:bg-[#e54a00] text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
                        <Camera className="w-4 h-4" />
                        <span>{bannerLoading ? "Uploading..." : "Upload New Banner"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBannerUpload}
                          disabled={bannerLoading}
                        />
                      </label>
                      {bannerUrl && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleSelectPresetBanner("")}
                          className="text-xs font-bold bg-white/90 text-gray-900 hover:bg-white rounded-xl h-auto py-2.5"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Preset Banner Quick Selection */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Or choose a curated campus theme:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_BANNERS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPresetBanner(preset)}
                          className={`h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer relative group ${
                            bannerUrl === preset ? "border-[#FF5500] ring-2 ring-orange-500/20" : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img src={preset} alt="preset" className="w-full h-full object-cover" />
                          {bannerUrl === preset && (
                            <div className="absolute inset-0 bg-[#FF5500]/30 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white stroke-[3]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Store Avatar Logo */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <div className="relative shrink-0 self-start sm:self-auto">
                    <Avatar className="w-20 h-20 rounded-full border-4 border-white dark:border-card shadow-lg bg-orange-100 dark:bg-orange-950/60 text-[#FF5500]">
                      <AvatarImage src={avatarUrl} alt={formData.storeName} className="object-cover rounded-full" />
                      <AvatarFallback className="font-black text-2xl bg-orange-100 dark:bg-orange-950/60 text-[#FF5500] rounded-full">
                        {(formData.storeName || "V").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#FF5500] hover:bg-[#e54a00] text-white flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-110 active:scale-95 border-2 border-white dark:border-card">
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={logoLoading}
                      />
                    </label>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Store Logo / Icon</h4>
                      {avatarUrl ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                          Avatar Initial
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Square ratio works best (500 × 500 px). Displayed next to your store name in search results and products.
                    </p>
                    <label className="inline-flex items-center gap-1.5 text-xs font-black text-[#FF5500] hover:underline cursor-pointer pt-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{logoLoading ? "Uploading logo..." : "Upload store logo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={logoLoading}
                      />
                    </label>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* 2. Store Details & Campus Logistics */}
            <Card className="rounded-2xl border-gray-200/80 dark:border-slate-800 bg-white dark:bg-card shadow-xs overflow-hidden">
              <CardHeader className="bg-slate-50/60 dark:bg-muted/20 border-b border-gray-100 dark:border-slate-800/80 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#FF5500] flex items-center justify-center">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                        Store Details & Campus Contact
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500">
                        Information buyers need to find, trust, and purchase from your storefront.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    Logistics
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                
                {/* Store Name & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Store Business Name <span className="text-[#FF5500]">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        value={formData.storeName}
                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        placeholder="e.g. Legon TechHub"
                        className="h-10 text-xs font-semibold rounded-xl"
                      />
                      {isPro && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2" title="Verified Pro Merchant">
                          <UnimallVerifiedBadge size={16} color="#FF5500" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Primary Catalog Category
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => setFormData({ ...formData, category: val })}
                    >
                      <SelectTrigger className="h-10 text-xs rounded-xl">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General Campus Merchandise</SelectItem>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.label} value={cat.label}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Campus Hub & Hostel Landmark */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Primary Campus Hub <span className="text-[#FF5500]">*</span>
                    </Label>
                    <Select
                      value={formData.campus}
                      onValueChange={(val) => setFormData({ ...formData, campus: val })}
                    >
                      <SelectTrigger className="h-10 text-xs rounded-xl">
                        <SelectValue placeholder="Select Campus" />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMPUS_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Hostel / Hall / Dropoff Landmark
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={formData.landmark}
                        onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                        placeholder="e.g. TF Hostel Block C / Sarbah Park"
                        className="h-10 pl-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp & Call Hotline */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Customer Inquiry Phone / WhatsApp Hotline <span className="text-[#FF5500]">*</span>
                    </Label>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> Direct 1-Click Chat
                    </span>
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 024 123 4567"
                      className="h-10 pl-9 text-xs font-semibold rounded-xl"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Buyers can click the WhatsApp button on your storefront to send pre-filled product order messages directly to your phone.
                  </p>
                </div>

                {/* Store Bio / Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Store Bio / Description
                    </Label>
                    <span className="text-[10px] text-gray-400">{formData.description.length} / 500 chars</span>
                  </div>

                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 500) })}
                    placeholder="Welcome to our campus storefront! We offer premium quality tech gadgets, snacks, and student essentials with 24h hostel dropoff guarantee..."
                    rows={4}
                    className="text-xs resize-none rounded-xl"
                  />
                </div>

                {/* Delivery Settings Toggles */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-muted/30">
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">Same-Day Campus Delivery</p>
                        <p className="text-[11px] text-gray-500">Highlight instant hostel dropoff badge on your store</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.sameDayDelivery}
                      onCheckedChange={(val) => setFormData({ ...formData, sameDayDelivery: val })}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-3 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={loading}
                    className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-black text-xs sm:text-sm px-8 h-11 rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    {loading ? "Saving Profile..." : "Save Store Details"}
                  </Button>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* ══════════ RIGHT COLUMN: Live Mobile/Card Preview (4 cols) ══════════ */}
          <div className="xl:col-span-4 sticky top-6 space-y-6">
            
            {/* Live Storefront Mock Preview */}
            <Card className="rounded-2xl border-gray-200/90 dark:border-slate-800 bg-white dark:bg-card shadow-xl overflow-hidden">
              
              {/* Preview Top Header Bar */}
              <div className="bg-[#0F172A] text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Live Storefront Preview
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-white/10 px-2.5 py-0.5 rounded-full text-slate-300 border border-white/10">
                  What Buyers See
                </span>
              </div>

              {/* Cover Banner Mock */}
              <div className="relative h-36 bg-slate-900 overflow-hidden">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-slate-950 via-slate-900 to-[#FF5500] opacity-90 flex items-center justify-center">
                    <Store className="w-12 h-12 text-white/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Category Pill on Banner */}
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg border border-white/20 shadow-xs">
                    {formData.category || "General"}
                  </span>
                </div>
              </div>

              {/* Store Identity Content */}
              <CardContent className="p-5 pt-0 relative space-y-4">
                
                {/* Avatar Overlap Row - Avatar is elevated and fully round, Info sits neatly below with zero overlap */}
                <div className="flex items-end justify-between -mt-10 mb-2">
                  <div className="relative">
                    <Avatar className="w-20 h-20 rounded-full border-4 border-white dark:border-card shadow-2xl bg-[#FF5500] text-white shrink-0">
                      <AvatarImage src={avatarUrl} alt={formData.storeName} className="object-cover rounded-full" />
                      <AvatarFallback className="font-black text-2xl bg-[#FF5500] text-white rounded-full">
                        {(formData.storeName || "V").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-card shadow-xs" title="Online now" />
                  </div>

                  {isPro && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 via-orange-500 to-[#FF5500] text-white shadow-xs tracking-tight mb-1">
                      <ShieldCheck className="w-3 h-3 fill-white/20 stroke-[2.5]" /> PRO SELLER
                    </span>
                  )}
                </div>

                {/* Store Name & Campus Location */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-gray-950 dark:text-white leading-tight">
                      {formData.storeName || "Your Store Name"}
                    </h3>
                    {isPro && (
                      <UnimallVerifiedBadge size={18} color="#FF5500" title="Verified Pro Merchant" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {formData.campus || "University of Ghana (Legon)"}
                    </span>
                    {formData.landmark && (
                      <span className="text-[11px] text-gray-400 truncate">· {formData.landmark}</span>
                    )}
                  </div>
                </div>

                {/* Store Description / Bio */}
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed bg-slate-50 dark:bg-muted/30 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  {formData.description || "Welcome to our campus storefront! Order online for instant hostel dropoff and verified student quality guarantee."}
                </p>

                {/* Badges / Highlights Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="truncate">4.9 · 45+ Reviews</span>
                  </div>

                  {formData.sameDayDelivery ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Same-Day Dropoff</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                      <span className="truncate">Active Catalog</span>
                    </div>
                  )}
                </div>

                {/* Interactive Action Buttons Mock */}
                <div className="pt-2 space-y-2">
                  <a
                    href={`https://wa.me/${(formData.phone || "0241234567").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${formData.storeName || "Vendor"}, I saw your store on Unimall and want to place an order.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>WhatsApp Merchant</span>
                  </a>

                  <Link
                    to={`/vendors/${user?.id || "1"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-[#FF5500] text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Public Store Page</span>
                  </Link>
                </div>

              </CardContent>
            </Card>

            {/* Pro Seller Benefit Card */}
            {!isPro ? (
              <Card className="rounded-2xl border-orange-200 dark:border-orange-950/60 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-orange-900 dark:text-orange-200">
                  <ShieldCheck className="w-4 h-4 text-[#FF5500]" />
                  <span>Get the Golden Verified Badge</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Subscribed vendors get the official Unimall Verified Badge, top placement on campus search, and 5x more WhatsApp leads.
                </p>
                <Link to="/vendor/settings" className="inline-block text-xs font-black text-[#FF5500] hover:underline pt-1">
                  Activate Pro via MoMo →
                </Link>
              </Card>
            ) : (
              <Card className="rounded-2xl border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Pro Seller Active</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Your store has the verified badge active across all student searches and campus categories.
                </p>
              </Card>
            )}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default VendorProfile;
