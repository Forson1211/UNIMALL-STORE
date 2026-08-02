import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import {
    Palette,
    Image as ImageIcon,
    Type,
    Layout,
    FileText,
    Menu,
    Eye,
    Save,
    RotateCcw,
    Upload,
    Sparkles,
    Moon,
    Sun,
    Monitor,
    ChevronDown,
    Check,
    Megaphone,
    Globe,
    Share2,
    Phone,
    Mail,
    Link2,
    Smartphone,
    Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FONT_OPTIONS = [
    { value: "'Barlow Condensed', sans-serif", label: "Barlow Condensed (MCB)" },
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "'Arial Narrow', Arial, sans-serif", label: "Arial Narrow" },
    { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
    { value: "'Inter', sans-serif", label: "Inter" },
    { value: "'Roboto', sans-serif", label: "Roboto" },
    { value: "'Open Sans', sans-serif", label: "Open Sans" },
    { value: "'Lato', sans-serif", label: "Lato" },
    { value: "'Poppins', sans-serif", label: "Poppins" },
    { value: "'Montserrat', sans-serif", label: "Montserrat" },
    { value: "'Plus Jakarta Sans', sans-serif", label: "Plus Jakarta Sans" },
    { value: "'Outfit', sans-serif", label: "Outfit" },
    { value: "'Lexend', sans-serif", label: "Lexend" },
    { value: "'Space Grotesk', sans-serif", label: "Space Grotesk" },
    { value: "'Bebas Neue', cursive", label: "Bebas Neue" },
    { value: "'Raleway', sans-serif", label: "Raleway" },
    { value: "'Playfair Display', serif", label: "Playfair Display" },
    { value: "'Ubuntu', sans-serif", label: "Ubuntu" },
    { value: "'Merriweather', serif", label: "Merriweather" },
    { value: "'Oswald', sans-serif", label: "Oswald" },
    { value: "'Nunito', sans-serif", label: "Nunito" },
    { value: "'Sora', sans-serif", label: "Sora" },
    { value: "'Kanit', sans-serif", label: "Kanit" },
    { value: "'Syne', sans-serif", label: "Syne" },
    { value: "'DM Sans', sans-serif", label: "DM Sans" },
    { value: "'Cormorant Garamond', serif", label: "Cormorant Garamond" },
    { value: "'Manrope', sans-serif", label: "Manrope" },
];

export default function SiteCustomization() {
    const {
        settings,
        isLoading,
        updateSettings,
        resetSettings,
        getSetting,
        updatePreviewSettings
    } = useSiteSettingsContext();

    const { setTheme } = useTheme();
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
    const fontDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
                setIsFontDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Branding State
    const [siteName, setSiteName] = useState("");
    const [siteTagline, setSiteTagline] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [authLogoUrl, setAuthLogoUrl] = useState("");
    const [sidebarLogoUrl, setSidebarLogoUrl] = useState("");
    const [footerLogoUrl, setFooterLogoUrl] = useState("");
    const [faviconUrl, setFaviconUrl] = useState("");

    // Color State
    const [primaryColor, setPrimaryColor] = useState("#10b981");
    const [secondaryColor, setSecondaryColor] = useState("#3b82f6");
    const [accentColor, setAccentColor] = useState("#f59e0b");
    const [backgroundColor, setBackgroundColor] = useState("#ffffff");
    const [headerBgColor, setHeaderBgColor] = useState("#ffffff");
    const [footerBgColor, setFooterBgColor] = useState("#1f2937");
    const [footerTextColor, setFooterTextColor] = useState("#ffffff");

    // Theme State
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [currentTheme, setCurrentTheme] = useState("default");

    // Background State
    const [heroBackgroundUrl, setHeroBackgroundUrl] = useState("");
    const [heroOverlayOpacity, setHeroOverlayOpacity] = useState(0.5);

    // Layout State
    const [containerMaxWidth, setContainerMaxWidth] = useState("1280px");
    const [borderRadius, setBorderRadius] = useState("0.5rem");
    const [animationsEnabled, setAnimationsEnabled] = useState(true);

    // Typography State
    const [fontFamily, setFontFamily] = useState("Inter");
    const [fontSize, setFontSize] = useState("16px");

    // Announcement & Header State
    const [announcementEnabled, setAnnouncementEnabled] = useState(true);
    const [announcementText, setAnnouncementText] = useState("⚡ Free campus delivery on student orders over GH₵ 100!");
    const [announcementLink, setAnnouncementLink] = useState("/products");
    const [supportPhone, setSupportPhone] = useState("+233 24 123 4567");
    const [supportEmail, setSupportEmail] = useState("support@unimall.edu.gh");

    // Hero & Storefront State
    const [heroTitle, setHeroTitle] = useState("Ghana's #1 Campus Marketplace");
    const [heroSubtitle, setHeroSubtitle] = useState("Buy and sell safely across university campuses with instant mobile money checkout");
    const [heroCtaText, setHeroCtaText] = useState("Explore Campus Deals");
    const [heroCtaLink, setHeroCtaLink] = useState("/products");

    // Social & Footer State
    const [facebookUrl, setFacebookUrl] = useState("");
    const [instagramUrl, setInstagramUrl] = useState("");
    const [twitterUrl, setTwitterUrl] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("+233241234567");
    const [copyrightText, setCopyrightText] = useState("© 2026 Unimall Shop Ghana. All rights reserved.");

    // SEO & Social Share State
    const [seoMetaTitle, setSeoMetaTitle] = useState("Unimall — Ghana University Campus Store");
    const [seoMetaDescription, setSeoMetaDescription] = useState("Buy and sell electronics, books, fashion & dorm gear across Ghana campuses.");
    const [ogImageUrl, setOgImageUrl] = useState("");

    // Mobile & Layout Toggles
    const [stickyNavbarEnabled, setStickyNavbarEnabled] = useState(true);
    const [mobileBottomBarEnabled, setMobileBottomBarEnabled] = useState(true);
    const [showSearchInHeader, setShowSearchInHeader] = useState(true);

    // Load settings on mount
    useEffect(() => {
        if (!isLoading && settings) {
            console.log("=== LOADING SETTINGS FROM DB ===");
            console.log("Raw settings object:", settings);

            const loadedName = getSetting("site_name", "Unimall") as string;
            const loadedTagline = getSetting("site_tagline", "Your Campus Marketplace") as string;
            const loadedFont = getSetting("font_family", "'Plus Jakarta Sans', sans-serif") as string;
            const loadedPrimary = getSetting("primary_color", "#10b981") as string;

            console.log("Decoded values:", {
                siteName: loadedName,
                siteTagline: loadedTagline,
                fontFamily: loadedFont,
                primaryColor: loadedPrimary
            });

            setSiteName(loadedName);
            setSiteTagline(loadedTagline);
            setLogoUrl(getSetting("logo_url", "") as string);
            setAuthLogoUrl(getSetting("auth_logo_url", "") as string);
            setSidebarLogoUrl(getSetting("sidebar_logo_url", "") as string);
            setFooterLogoUrl(getSetting("footer_logo_url", "") as string);
            setFaviconUrl(getSetting("favicon_url", "") as string);

            setPrimaryColor(loadedPrimary);
            setSecondaryColor(getSetting("secondary_color", "#3b82f6") as string);
            setAccentColor(getSetting("accent_color", "#f59e0b") as string);
            setBackgroundColor(getSetting("background_color", "#ffffff") as string);
            setHeaderBgColor(getSetting("header_bg_color", "#ffffff") as string);
            setFooterBgColor(getSetting("footer_bg_color", "#1f2937") as string);
            setFooterTextColor(getSetting("footer_text_color", "#ffffff") as string);

            setDarkModeEnabled(getSetting("dark_mode_enabled", false) as boolean);
            setCurrentTheme(getSetting("current_theme", "default") as string);

            setHeroBackgroundUrl(getSetting("hero_background_url", "") as string);
            setHeroOverlayOpacity(getSetting("hero_overlay_opacity", 0.5) as number);

            setContainerMaxWidth(getSetting("container_max_width", "1280px") as string);
            setBorderRadius(getSetting("border_radius", "0.5rem") as string);
            setAnimationsEnabled(getSetting("animations_enabled", true) as boolean);

            setFontFamily(loadedFont);
            setFontSize(getSetting("font_size", "16px") as string);

            setAnnouncementEnabled(getSetting("announcement_enabled", true) as boolean);
            setAnnouncementText(getSetting("announcement_text", "⚡ Free campus delivery on student orders over GH₵ 100!") as string);
            setAnnouncementLink(getSetting("announcement_link", "/products") as string);
            setSupportPhone(getSetting("support_phone", "+233 24 123 4567") as string);
            setSupportEmail(getSetting("support_email", "support@unimall.edu.gh") as string);

            setHeroTitle(getSetting("hero_title", "Ghana's #1 Campus Marketplace") as string);
            setHeroSubtitle(getSetting("hero_subtitle", "Buy and sell safely across university campuses with instant mobile money checkout") as string);
            setHeroCtaText(getSetting("hero_cta_text", "Explore Campus Deals") as string);
            setHeroCtaLink(getSetting("hero_cta_link", "/products") as string);

            setFacebookUrl(getSetting("facebook_url", "") as string);
            setInstagramUrl(getSetting("instagram_url", "") as string);
            setTwitterUrl(getSetting("twitter_url", "") as string);
            setWhatsappNumber(getSetting("whatsapp_number", "+233241234567") as string);
            setCopyrightText(getSetting("copyright_text", "© 2026 Unimall Shop Ghana. All rights reserved.") as string);

            setSeoMetaTitle(getSetting("seo_meta_title", "Unimall — Ghana University Campus Store") as string);
            setSeoMetaDescription(getSetting("seo_meta_description", "Buy and sell electronics, books, fashion & dorm gear across Ghana campuses.") as string);
            setOgImageUrl(getSetting("og_image_url", "") as string);

            setStickyNavbarEnabled(getSetting("sticky_navbar_enabled", true) as boolean);
            setMobileBottomBarEnabled(getSetting("mobile_bottom_bar_enabled", true) as boolean);
            setShowSearchInHeader(getSetting("show_search_in_header", true) as boolean);

            console.log("=== SETTINGS LOADED SUCCESSFULLY ===");
        }
    }, [isLoading, settings, getSetting]);

    // Handle dark mode toggle with immediate effect
    const handleDarkModeToggle = (enabled: boolean) => {
        setDarkModeEnabled(enabled);
        setTheme(enabled ? "dark" : "light");
        toast.success(enabled ? "Dark mode enabled" : "Light mode enabled");
    };

    // Handle file upload
    const handleFileUpload = async (file: File, type: "logo" | "auth_logo" | "sidebar_logo" | "footer_logo" | "favicon" | "hero" | "og_image") => {
        try {
            console.log(`📤 Starting ${type} upload:`, {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            });

            // Validate file
            if (!file) {
                throw new Error("No file selected");
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                throw new Error("File size must be less than 5MB");
            }

            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const timestamp = Date.now();
            const fileName = `${type}_${timestamp}.${fileExt}`;
            const filePath = `${fileName}`;

            console.log(`📁 Uploading to site-assets/${filePath}`);

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true // Replace if exists
                });

            if (uploadError) {
                console.error('❌ Supabase upload error:', uploadError);
                throw new Error(uploadError.message);
            }

            // Get public URL
            const { data } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            console.log(`✅ Upload successful! URL:`, data.publicUrl);
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);

            return data.publicUrl;
        } catch (error: any) {
            console.error(`❌ Upload error for ${type}:`, error);
            const errorMessage = error.message || error.error_description || "Unknown error";

            // Provide more helpful error messages
            if (errorMessage.includes('not found')) {
                toast.error(`Storage bucket not configured. Please contact administrator.`);
            } else if (errorMessage.includes('JWT')) {
                toast.error(`Authentication error. Please try logging in again.`);
            } else {
                toast.error(`Failed to upload ${type}: ${errorMessage}`);
            }

            return null;
        }
    };

    // Sync local state to global preview settings with debounce to prevent jitter
    useEffect(() => {
        const timer = setTimeout(() => {
            updatePreviewSettings({
                primaryColor,
                secondaryColor,
                accentColor,
                backgroundColor,
                headerBgColor,
                footerBgColor,
                footerTextColor,
                borderRadius,
                fontFamily,
                fontSize,
                containerMaxWidth,
                darkModeEnabled,
                siteName,
                siteTagline,
                logoUrl,
                authLogoUrl,
                sidebarLogoUrl,
                footerLogoUrl,
                faviconUrl,
                heroBackgroundUrl,
                heroOverlayOpacity,
                announcementEnabled,
                announcementText,
                announcementLink,
                supportPhone,
                supportEmail,
                heroTitle,
                heroSubtitle,
                heroCtaText,
                heroCtaLink,
                facebookUrl,
                instagramUrl,
                twitterUrl,
                whatsappNumber,
                copyrightText,
                seoMetaTitle,
                seoMetaDescription,
                ogImageUrl,
                stickyNavbarEnabled,
                mobileBottomBarEnabled,
                showSearchInHeader
            });
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [
        primaryColor, secondaryColor, accentColor, backgroundColor, headerBgColor, footerBgColor,
        borderRadius, fontFamily, fontSize, containerMaxWidth, darkModeEnabled,
        siteName, siteTagline, logoUrl, authLogoUrl, sidebarLogoUrl, footerLogoUrl, faviconUrl, heroBackgroundUrl, heroOverlayOpacity,
        announcementEnabled, announcementText, announcementLink, supportPhone, supportEmail,
        heroTitle, heroSubtitle, heroCtaText, heroCtaLink,
        facebookUrl, instagramUrl, twitterUrl, whatsappNumber, copyrightText,
        seoMetaTitle, seoMetaDescription, ogImageUrl,
        stickyNavbarEnabled, mobileBottomBarEnabled, showSearchInHeader,
        updatePreviewSettings
    ]);

    // Cleanup preview on unmount
    useEffect(() => {
        return () => {
            updatePreviewSettings({});
        };
    }, [updatePreviewSettings]);

    // Save all settings
    const handleSaveSettings = async () => {
        setIsSaving(true);
        console.log("=== SAVE SETTINGS STARTED ===");

        try {
            const updates = {
                site_name: { value: siteName, category: "branding" },
                site_tagline: { value: siteTagline, category: "branding" },
                logo_url: { value: logoUrl, category: "branding" },
                auth_logo_url: { value: authLogoUrl, category: "branding" },
                sidebar_logo_url: { value: sidebarLogoUrl, category: "branding" },
                footer_logo_url: { value: footerLogoUrl, category: "branding" },
                favicon_url: { value: faviconUrl, category: "branding" },

                primary_color: { value: primaryColor, category: "theme" },
                secondary_color: { value: secondaryColor, category: "theme" },
                accent_color: { value: accentColor, category: "theme" },
                background_color: { value: backgroundColor, category: "theme" },
                header_bg_color: { value: headerBgColor, category: "theme" },
                footer_bg_color: { value: footerBgColor, category: "theme" },
                footer_text_color: { value: footerTextColor, category: "theme" },

                dark_mode_enabled: { value: darkModeEnabled, category: "theme" },
                current_theme: { value: currentTheme, category: "theme" },

                hero_background_url: { value: heroBackgroundUrl, category: "media" },
                hero_overlay_opacity: { value: heroOverlayOpacity, category: "media" },

                container_max_width: { value: containerMaxWidth, category: "layout" },
                border_radius: { value: borderRadius, category: "layout" },
                animations_enabled: { value: animationsEnabled, category: "layout" },

                font_family: { value: fontFamily, category: "typography" },
                font_size: { value: fontSize, category: "typography" },

                // Announcement & Support
                announcement_enabled: { value: announcementEnabled, category: "announcement" },
                announcement_text: { value: announcementText, category: "announcement" },
                announcement_link: { value: announcementLink, category: "announcement" },
                support_phone: { value: supportPhone, category: "announcement" },
                support_email: { value: supportEmail, category: "announcement" },

                // Hero Content
                hero_title: { value: heroTitle, category: "hero" },
                hero_subtitle: { value: heroSubtitle, category: "hero" },
                hero_cta_text: { value: heroCtaText, category: "hero" },
                hero_cta_link: { value: heroCtaLink, category: "hero" },

                // Social & Footer
                facebook_url: { value: facebookUrl, category: "social" },
                instagram_url: { value: instagramUrl, category: "social" },
                twitter_url: { value: twitterUrl, category: "social" },
                whatsapp_number: { value: whatsappNumber, category: "social" },
                copyright_text: { value: copyrightText, category: "social" },

                // SEO & OG Image
                seo_meta_title: { value: seoMetaTitle, category: "seo" },
                seo_meta_description: { value: seoMetaDescription, category: "seo" },
                og_image_url: { value: ogImageUrl, category: "seo" },

                // Toggles
                sticky_navbar_enabled: { value: stickyNavbarEnabled, category: "layout" },
                mobile_bottom_bar_enabled: { value: mobileBottomBarEnabled, category: "layout" },
                show_search_in_header: { value: showSearchInHeader, category: "layout" },
            };

            console.log("Updates object prepared:", updates);

            const result = await updateSettings(updates);
            console.log("Update result:", result);

            if (result.success !== false) {
                toast.success("Site customization saved successfully!");
                setPreviewMode(false); // Exit preview after save
                console.log("=== SAVE COMPLETED SUCCESSFULLY ===");
            } else {
                throw new Error("Update returned failure");
            }
        } catch (error) {
            console.error("=== SAVE FAILED ===", error);
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    // Reset to defaults
    const handleReset = () => {
        setSiteName("Unimall");
        setSiteTagline("Your Campus Marketplace");
        setPrimaryColor("#f97316");
        setSecondaryColor("#ea580c");
        setAccentColor("#f59e0b");
        setBackgroundColor("#ffffff");
        setHeaderBgColor("#ffffff");
        setFooterBgColor("#1f2937");
        setFooterTextColor("#ffffff");
        setBorderRadius("0.75rem");
        setFontFamily("'Plus Jakarta Sans', sans-serif");
        setFontSize("16px");
        setContainerMaxWidth("1280px");
        setAnimationsEnabled(true);
        toast.info("Settings reset to defaults");
    };

    if (isLoading) {
        return (
            <DashboardLayout type="admin" title="Site Customization">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout type="admin" title="Site Customization">
            <div className="space-y-6 animate-fade-in min-h-[800px] pb-12">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-card p-6 rounded-2xl border border-gray-100 dark:border-border shadow-xs">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                            Site Customization <Sparkles className="w-5 h-5 text-[#FF5500]" />
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                            Customize your Unimall platform appearance, colors, media, and branding in real-time.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewMode(!previewMode)}
                            className="gap-2 h-9 rounded-xl border-gray-200 dark:border-border font-bold text-xs shadow-2xs"
                        >
                            <Eye className="h-3.5 w-3.5 text-gray-600" />
                            {previewMode ? "Exit Preview" : "Live Preview"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="gap-2 h-9 rounded-xl border-gray-200 dark:border-border font-bold text-xs text-gray-600 shadow-2xs"
                        >
                            <RotateCcw className="h-3.5 w-3.5 text-gray-500" />
                            Reset Defaults
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSaveSettings}
                            disabled={isSaving}
                            className="gap-2 h-9 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FF2D55] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-orange-500/20 border-0"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {isSaving ? "Saving Changes..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {/* Main Modern Tabs */}
                <Tabs defaultValue="branding" className="space-y-6">
                    <TabsList className="flex flex-wrap items-center justify-start h-auto p-1.5 bg-gray-100/80 dark:bg-muted/80 rounded-2xl border border-gray-200/50 dark:border-border gap-1">
                        <TabsTrigger
                            value="branding"
                            className="px-4 py-2 text-xs font-bold rounded-xl transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-[#FF5500] data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200/60 dark:data-[state=active]:border-border flex items-center gap-2"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Branding
                        </TabsTrigger>
                        <TabsTrigger
                            value="colors"
                            className="px-4 py-2 text-xs font-bold rounded-xl transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-[#FF5500] data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200/60 dark:data-[state=active]:border-border flex items-center gap-2"
                        >
                            <Palette className="h-3.5 w-3.5" />
                            Color Palette
                        </TabsTrigger>
                        <TabsTrigger
                            value="media"
                            className="px-4 py-2 text-xs font-bold rounded-xl transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-[#FF5500] data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200/60 dark:data-[state=active]:border-border flex items-center gap-2"
                        >
                            <ImageIcon className="h-3.5 w-3.5" />
                            Media Assets
                        </TabsTrigger>
                        <TabsTrigger
                            value="typography"
                            className="px-4 py-2 text-xs font-bold rounded-xl transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-[#FF5500] data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200/60 dark:data-[state=active]:border-border flex items-center gap-2"
                        >
                            <Type className="h-3.5 w-3.5" />
                            Typography
                        </TabsTrigger>
                        <TabsTrigger
                            value="layout"
                            className="px-4 py-2 text-xs font-bold rounded-xl transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-[#FF5500] data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200/60 dark:data-[state=active]:border-border flex items-center gap-2"
                        >
                            <Layout className="h-3.5 w-3.5" />
                            Layout Settings
                        </TabsTrigger>
                        <TabsTrigger
                            value="pages"
                            className="px-4 py-2 text-xs font-bold rounded-xl transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-[#FF5500] data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200/60 dark:data-[state=active]:border-border flex items-center gap-2"
                        >
                            <FileText className="h-3.5 w-3.5" />
                            Pages & Content
                        </TabsTrigger>
                    </TabsList>

                    {/* Branding Tab */}
                    <TabsContent value="branding" className="space-y-4 animate-in fade-in duration-300">
                        <Card className="rounded-2xl border-gray-100 dark:border-border shadow-xs bg-white dark:bg-card">
                            <CardHeader className="border-b border-gray-100 dark:border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF5500]">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-extrabold text-gray-900 dark:text-white">Brand Identity</CardTitle>
                                        <CardDescription className="text-xs text-gray-400">
                                            Manage your store name, tagline, logo, and browser favicon
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="siteName" className="text-xs font-bold text-gray-700 dark:text-gray-300">Site Name</Label>
                                        <Input
                                            id="siteName"
                                            value={siteName}
                                            onChange={(e) => {
                                                setSiteName(e.target.value);
                                                updatePreviewSettings({ siteName: e.target.value });
                                            }}
                                            placeholder="Unimall Shop"
                                            className="h-10 text-xs rounded-xl bg-gray-50 dark:bg-muted border-gray-200 dark:border-border focus-visible:ring-[#FF5500]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="siteTagline" className="text-xs font-bold text-gray-700 dark:text-gray-300">Site Tagline</Label>
                                        <Input
                                            id="siteTagline"
                                            value={siteTagline}
                                            onChange={(e) => {
                                                setSiteTagline(e.target.value);
                                                updatePreviewSettings({ siteTagline: e.target.value });
                                            }}
                                            placeholder="Your Campus Marketplace"
                                            className="h-10 text-xs rounded-xl bg-gray-50 dark:bg-muted border-gray-200 dark:border-border focus-visible:ring-[#FF5500]"
                                        />
                                    </div>
                                </div>

                                <Separator className="bg-gray-100 dark:bg-border" />

                                {/* Dedicated Logo & Asset Upload Cards Grid */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Brand Logo Assets</h3>

                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {/* 1. Main Navbar Logo */}
                                        <div className="space-y-3 p-5 rounded-2xl bg-gray-50/70 dark:bg-muted/40 border border-gray-200/80 dark:border-border">
                                            <Label className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                                                <span>Navbar Store Logo</span>
                                                <span className="text-[10px] font-semibold text-gray-400">PNG/SVG</span>
                                            </Label>

                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border flex items-center justify-center p-2 shadow-2xs shrink-0">
                                                    {logoUrl ? (
                                                        <img src={logoUrl} alt="Main Logo" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <ImageIcon className="w-6 h-6 text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <Label htmlFor="logo" className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 shadow-2xs transition-colors w-full">
                                                        <Upload className="w-3.5 h-3.5 text-[#FF5500]" />
                                                        Upload Logo
                                                    </Label>
                                                    <Input
                                                        id="logo"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const url = await handleFileUpload(file, "logo");
                                                                if (url) setLogoUrl(url);
                                                            }
                                                        }}
                                                    />
                                                    <p className="text-[10px] text-gray-400 leading-tight">Appears on top store navigation bar</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Authentication Pages Logo */}
                                        <div className="space-y-3 p-5 rounded-2xl bg-gray-50/70 dark:bg-muted/40 border border-gray-200/80 dark:border-border">
                                            <Label className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                                                <span>Auth Pages Logo</span>
                                                <span className="text-[10px] font-semibold text-gray-400">PNG/SVG</span>
                                            </Label>

                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border flex items-center justify-center p-2 shadow-2xs shrink-0">
                                                    {authLogoUrl ? (
                                                        <img src={authLogoUrl} alt="Auth Logo" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <ImageIcon className="w-6 h-6 text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <Label htmlFor="authLogo" className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 shadow-2xs transition-colors w-full">
                                                        <Upload className="w-3.5 h-3.5 text-[#FF5500]" />
                                                        Upload Auth Logo
                                                    </Label>
                                                    <Input
                                                        id="authLogo"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const url = await handleFileUpload(file, "auth_logo");
                                                                if (url) setAuthLogoUrl(url);
                                                            }
                                                        }}
                                                    />
                                                    <p className="text-[10px] text-gray-400 leading-tight">Displayed on Login, Signup & Reset screens</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. Dashboard Side Panel Logo */}
                                        <div className="space-y-3 p-5 rounded-2xl bg-gray-50/70 dark:bg-muted/40 border border-gray-200/80 dark:border-border">
                                            <Label className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                                                <span>Admin/Vendor Side Panel Logo</span>
                                                <span className="text-[10px] font-semibold text-gray-400">PNG/SVG</span>
                                            </Label>

                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-[#0B132B] border border-gray-800 flex items-center justify-center p-2 shadow-2xs shrink-0">
                                                    {sidebarLogoUrl ? (
                                                        <img src={sidebarLogoUrl} alt="Sidebar Logo" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <ImageIcon className="w-6 h-6 text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <Label htmlFor="sidebarLogo" className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 shadow-2xs transition-colors w-full">
                                                        <Upload className="w-3.5 h-3.5 text-[#FF5500]" />
                                                        Upload Sidebar Logo
                                                    </Label>
                                                    <Input
                                                        id="sidebarLogo"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const url = await handleFileUpload(file, "sidebar_logo");
                                                                if (url) setSidebarLogoUrl(url);
                                                            }
                                                        }}
                                                    />
                                                    <p className="text-[10px] text-gray-400 leading-tight">Shown at top of Admin & Vendor dashboards</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4. Footer Logo */}
                                        <div className="space-y-3 p-5 rounded-2xl bg-gray-50/70 dark:bg-muted/40 border border-gray-200/80 dark:border-border">
                                            <Label className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                                                <span>Footer Logo</span>
                                                <span className="text-[10px] font-semibold text-gray-400">PNG/SVG</span>
                                            </Label>

                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-[#1f2937] border border-gray-700 flex items-center justify-center p-2 shadow-2xs shrink-0">
                                                    {footerLogoUrl ? (
                                                        <img src={footerLogoUrl} alt="Footer Logo" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <Label htmlFor="footerLogo" className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 shadow-2xs transition-colors w-full">
                                                        <Upload className="w-3.5 h-3.5 text-[#FF5500]" />
                                                        Upload Footer Logo
                                                    </Label>
                                                    <Input
                                                        id="footerLogo"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const url = await handleFileUpload(file, "footer_logo");
                                                                if (url) setFooterLogoUrl(url);
                                                            }
                                                        }}
                                                    />
                                                    <p className="text-[10px] text-gray-400 leading-tight">Displayed in store footer section</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 5. Browser Favicon */}
                                        <div className="space-y-3 p-5 rounded-2xl bg-gray-50/70 dark:bg-muted/40 border border-gray-200/80 dark:border-border">
                                            <Label className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                                                <span>Browser Favicon</span>
                                                <span className="text-[10px] font-semibold text-gray-400">32x32px</span>
                                            </Label>

                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border flex items-center justify-center p-2 shadow-2xs shrink-0">
                                                    {faviconUrl ? (
                                                        <img src={faviconUrl} alt="Favicon" className="w-7 h-7 object-contain" />
                                                    ) : (
                                                        <Sparkles className="w-6 h-6 text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <Label htmlFor="favicon" className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 shadow-2xs transition-colors w-full">
                                                        <Upload className="w-3.5 h-3.5 text-[#FF5500]" />
                                                        Upload Favicon
                                                    </Label>
                                                    <Input
                                                        id="favicon"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const url = await handleFileUpload(file, "favicon");
                                                                if (url) setFaviconUrl(url);
                                                            }
                                                        }}
                                                    />
                                                    <p className="text-[10px] text-gray-400 leading-tight">Displayed on browser tab icon</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Color Palette Tab */}
                    <TabsContent value="colors" className="space-y-4 animate-in fade-in duration-300">
                        <Card className="rounded-2xl border-gray-100 dark:border-border shadow-xs bg-white dark:bg-card">
                            <CardHeader className="border-b border-gray-100 dark:border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                                        <Palette className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-extrabold text-gray-900 dark:text-white">Color Scheme</CardTitle>
                                        <CardDescription className="text-xs text-gray-400">
                                            Configure primary brand, accent, and layout background colors
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid gap-6 md:grid-cols-3">
                                    {/* Primary Color Card */}
                                    <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-muted/40 border border-gray-200/80 dark:border-border space-y-3">
                                        <Label className="text-xs font-bold text-gray-800 dark:text-gray-200">Primary Brand Color</Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                id="primaryColor"
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="h-10 w-12 p-1 rounded-lg cursor-pointer shrink-0"
                                            />
                                            <Input
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="h-10 text-xs font-mono rounded-xl bg-white dark:bg-card border-gray-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Secondary Color Card */}
                                    <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-muted/40 border border-gray-200/80 dark:border-border space-y-3">
                                        <Label className="text-xs font-bold text-gray-800 dark:text-gray-200">Secondary Color</Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                id="secondaryColor"
                                                type="color"
                                                value={secondaryColor}
                                                onChange={(e) => setSecondaryColor(e.target.value)}
                                                className="h-10 w-12 p-1 rounded-lg cursor-pointer shrink-0"
                                            />
                                            <Input
                                                value={secondaryColor}
                                                onChange={(e) => setSecondaryColor(e.target.value)}
                                                className="h-10 text-xs font-mono rounded-xl bg-white dark:bg-card border-gray-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Accent Color Card */}
                                    <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-muted/40 border border-gray-200/80 dark:border-border space-y-3">
                                        <Label className="text-xs font-bold text-gray-800 dark:text-gray-200">Accent Color</Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                id="accentColor"
                                                type="color"
                                                value={accentColor}
                                                onChange={(e) => setAccentColor(e.target.value)}
                                                className="h-10 w-12 p-1 rounded-lg cursor-pointer shrink-0"
                                            />
                                            <Input
                                                value={accentColor}
                                                onChange={(e) => setAccentColor(e.target.value)}
                                                className="h-10 text-xs font-mono rounded-xl bg-white dark:bg-card border-gray-200"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-gray-100 dark:bg-border" />

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Header Background</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="color"
                                                value={headerBgColor}
                                                onChange={(e) => setHeaderBgColor(e.target.value)}
                                                className="h-9 w-10 p-1 rounded-lg cursor-pointer shrink-0"
                                            />
                                            <Input
                                                value={headerBgColor}
                                                onChange={(e) => setHeaderBgColor(e.target.value)}
                                                className="h-9 text-xs font-mono rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Footer Background</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="color"
                                                value={footerBgColor}
                                                onChange={(e) => setFooterBgColor(e.target.value)}
                                                className="h-9 w-10 p-1 rounded-lg cursor-pointer shrink-0"
                                            />
                                            <Input
                                                value={footerBgColor}
                                                onChange={(e) => setFooterBgColor(e.target.value)}
                                                className="h-9 text-xs font-mono rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Footer Text Color</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="color"
                                                value={footerTextColor}
                                                onChange={(e) => setFooterTextColor(e.target.value)}
                                                className="h-9 w-10 p-1 rounded-lg cursor-pointer shrink-0"
                                            />
                                            <Input
                                                value={footerTextColor}
                                                onChange={(e) => setFooterTextColor(e.target.value)}
                                                className="h-9 text-xs font-mono rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Page Background</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="color"
                                                value={backgroundColor}
                                                onChange={(e) => setBackgroundColor(e.target.value)}
                                                className="h-9 w-10 p-1 rounded-lg cursor-pointer shrink-0"
                                            />
                                            <Input
                                                value={backgroundColor}
                                                onChange={(e) => setBackgroundColor(e.target.value)}
                                                className="h-9 text-xs font-mono rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-gray-100 dark:bg-border" />

                                {/* Dark Mode Switch Cards */}
                                <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-muted/40 border border-gray-200/80 dark:border-border flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-900 dark:text-white">Dark Theme Toggle</Label>
                                        <p className="text-[11px] text-gray-400">Switch platform display mode between Light and Dark theme</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant={!darkModeEnabled ? "default" : "outline"}
                                            onClick={() => handleDarkModeToggle(false)}
                                            className="h-8 text-xs font-bold rounded-xl"
                                        >
                                            <Sun className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Light
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={darkModeEnabled ? "default" : "outline"}
                                            onClick={() => handleDarkModeToggle(true)}
                                            className="h-8 text-xs font-bold rounded-xl"
                                        >
                                            <Moon className="mr-1.5 h-3.5 w-3.5 text-purple-400" /> Dark
                                        </Button>
                                    </div>
                                </div>

                                {/* Live Color Swatch Cards Preview */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Live Swatches Preview</Label>
                                    <div className="grid grid-cols-3 gap-4 p-4 border border-gray-200/80 dark:border-border rounded-xl bg-white dark:bg-card">
                                        <div className="space-y-2 text-center">
                                            <div className="h-16 rounded-xl shadow-xs transition-transform hover:scale-105" style={{ backgroundColor: primaryColor }} />
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Primary</span>
                                        </div>
                                        <div className="space-y-2 text-center">
                                            <div className="h-16 rounded-xl shadow-xs transition-transform hover:scale-105" style={{ backgroundColor: secondaryColor }} />
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Secondary</span>
                                        </div>
                                        <div className="space-y-2 text-center">
                                            <div className="h-16 rounded-xl shadow-xs transition-transform hover:scale-105" style={{ backgroundColor: accentColor }} />
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Accent</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Media Tab */}
                    <TabsContent value="media" className="space-y-4 animate-in fade-in duration-300">
                        <Card className="rounded-2xl border-gray-100 dark:border-border shadow-xs bg-white dark:bg-card">
                            <CardHeader className="border-b border-gray-100 dark:border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                                        <ImageIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-extrabold text-gray-900 dark:text-white">Background & Banners</CardTitle>
                                        <CardDescription className="text-xs text-gray-400">
                                            Upload hero banners and customize background overlay opacity
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-4">
                                    <div className="space-y-3 p-5 rounded-2xl bg-gray-50/70 dark:bg-muted/40 border border-gray-200/80 dark:border-border">
                                        <Label className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                                            <span>Hero Section Background Image</span>
                                            <span className="text-[10px] text-gray-400 font-semibold">HD Image, max 1920x1080px</span>
                                        </Label>

                                        <div className="space-y-3">
                                            {heroBackgroundUrl ? (
                                                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-border h-48">
                                                    <img src={heroBackgroundUrl} alt="Hero Background" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-border flex flex-col items-center justify-center p-4 bg-white dark:bg-card text-center">
                                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300">Upload Hero Background Image</p>
                                                </div>
                                            )}

                                            <Label htmlFor="heroBackground" className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 shadow-2xs transition-colors w-full">
                                                <Upload className="w-3.5 h-3.5 text-[#FF5500]" />
                                                Select Banner Image
                                            </Label>
                                            <Input
                                                id="heroBackground"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = await handleFileUpload(file, "hero");
                                                        if (url) setHeroBackgroundUrl(url);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-muted/40 border border-gray-200/80 dark:border-border space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="overlayOpacity" className="text-xs font-bold text-gray-900 dark:text-white">
                                                Overlay Darkening Opacity
                                            </Label>
                                            <span className="text-xs font-black text-[#FF5500] bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full">
                                                {Math.round(heroOverlayOpacity * 100)}%
                                            </span>
                                        </div>
                                        <Input
                                            id="overlayOpacity"
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={heroOverlayOpacity}
                                            onChange={(e) => setHeroOverlayOpacity(parseFloat(e.target.value))}
                                            className="accent-[#FF5500] h-2 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Typography Tab */}
                    <TabsContent value="typography" className="space-y-4 animate-in fade-in duration-300">
                        <Card className="rounded-2xl border-gray-100 dark:border-border shadow-xs bg-white dark:bg-card">
                            <CardHeader className="border-b border-gray-100 dark:border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                                        <Type className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-extrabold text-gray-900 dark:text-white">Typography & Fonts</CardTitle>
                                        <CardDescription className="text-xs text-gray-400">
                                            Configure font family and base typography scaling
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2 relative" ref={fontDropdownRef}>
                                        <Label htmlFor="fontFamily" className="text-xs font-bold text-gray-700 dark:text-gray-300">Font Family</Label>
                                        <button
                                            id="fontFamily"
                                            type="button"
                                            onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                                            className="flex h-10 w-full items-center justify-between rounded-xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-muted px-3.5 py-2 text-xs font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#FF5500]"
                                            style={{ fontFamily }}
                                        >
                                            <span>
                                                {FONT_OPTIONS.find(f => f.value === fontFamily)?.label || fontFamily || "Select font"}
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
                                        </button>

                                        {isFontDropdownOpen && (
                                            <div className="absolute top-full left-0 mt-1.5 z-50 w-full max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card text-gray-900 dark:text-white shadow-xl p-1.5 space-y-0.5">
                                                {FONT_OPTIONS.map((font) => (
                                                    <button
                                                        key={font.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setFontFamily(font.value);
                                                            updatePreviewSettings({ fontFamily: font.value });
                                                            setIsFontDropdownOpen(false);
                                                        }}
                                                        className={`flex w-full items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-orange-50 hover:text-[#FF5500] cursor-pointer transition-colors text-left ${fontFamily === font.value ? "bg-orange-50 text-[#FF5500] font-black" : "font-medium"
                                                            }`}
                                                        style={{ fontFamily: font.value }}
                                                    >
                                                        <span>{font.label}</span>
                                                        {fontFamily === font.value && (
                                                            <Check className="h-4 w-4 text-[#FF5500] ml-2 shrink-0" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fontSize" className="text-xs font-bold text-gray-700 dark:text-gray-300">Base Font Size</Label>
                                        <Input
                                            id="fontSize"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(e.target.value)}
                                            placeholder="16px"
                                            className="h-10 text-xs rounded-xl bg-gray-50 dark:bg-muted border-gray-200 dark:border-border"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 border border-gray-200/80 dark:border-border rounded-xl bg-white dark:bg-card shadow-2xs space-y-2">
                                    <Label className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Live Typography Preview</Label>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed" style={{ fontFamily, fontSize }}>
                                        The quick brown fox jumps over the lazy dog
                                    </p>
                                    <p className="text-xs text-gray-500" style={{ fontFamily }}>
                                        Unimall Campus Marketplace — Buy and sell across Ghana universities easily.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Layout Tab */}
                    <TabsContent value="layout" className="space-y-4 animate-in fade-in duration-300">
                        <Card className="rounded-2xl border-gray-100 dark:border-border shadow-xs bg-white dark:bg-card">
                            <CardHeader className="border-b border-gray-100 dark:border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                                        <Layout className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-extrabold text-gray-900 dark:text-white">Layout & Spacing</CardTitle>
                                        <CardDescription className="text-xs text-gray-400">
                                            Global layout container width, rounded corners, and animations
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="containerMaxWidth" className="text-xs font-bold text-gray-700 dark:text-gray-300">Container Max Width</Label>
                                        <Input
                                            id="containerMaxWidth"
                                            value={containerMaxWidth}
                                            onChange={(e) => setContainerMaxWidth(e.target.value)}
                                            placeholder="1280px"
                                            className="h-10 text-xs rounded-xl bg-gray-50 dark:bg-muted border-gray-200 dark:border-border"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="borderRadius" className="text-xs font-bold text-gray-700 dark:text-gray-300">Border Radius</Label>
                                        <Input
                                            id="borderRadius"
                                            value={borderRadius}
                                            onChange={(e) => setBorderRadius(e.target.value)}
                                            placeholder="0.5rem"
                                            className="h-10 text-xs rounded-xl bg-gray-50 dark:bg-muted border-gray-200 dark:border-border"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-muted/40 border border-gray-200/80 dark:border-border flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-bold text-gray-900 dark:text-white">Enable UI Animations</Label>
                                        <p className="text-[11px] text-gray-400">
                                            Turn on smooth micro-interactions and component transitions
                                        </p>
                                    </div>
                                    <Switch
                                        checked={animationsEnabled}
                                        onCheckedChange={setAnimationsEnabled}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Pages Tab */}
                    <TabsContent value="pages" className="space-y-4 animate-in fade-in duration-300">
                        <Card className="rounded-2xl border-gray-100 dark:border-border shadow-xs bg-white dark:bg-card">
                            <CardHeader className="border-b border-gray-100 dark:border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-extrabold text-gray-900 dark:text-white">Page Builder</CardTitle>
                                        <CardDescription className="text-xs text-gray-400">
                                            Visual drag-and-drop page customization engine
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="py-12 text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF5500] flex items-center justify-center mx-auto">
                                    <Sparkles className="w-6 h-6 animate-pulse" />
                                </div>
                                <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">Advanced Drag-and-Drop Page Builder</h4>
                                <p className="text-xs text-gray-400 max-w-md mx-auto">
                                    Full drag-and-drop landing page layout management, custom landing sections, and campus promo widgets are ready for configuration.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
