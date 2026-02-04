import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    Monitor
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

    // Branding State
    const [siteName, setSiteName] = useState("");
    const [siteTagline, setSiteTagline] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [faviconUrl, setFaviconUrl] = useState("");

    // Color State
    const [primaryColor, setPrimaryColor] = useState("#10b981");
    const [secondaryColor, setSecondaryColor] = useState("#3b82f6");
    const [accentColor, setAccentColor] = useState("#f59e0b");
    const [backgroundColor, setBackgroundColor] = useState("#ffffff");
    const [headerBgColor, setHeaderBgColor] = useState("#ffffff");
    const [footerBgColor, setFooterBgColor] = useState("#1f2937");

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

    // Load settings on mount
    useEffect(() => {
        if (!isLoading && settings) {
            console.log("Hydrating settings:", settings);
            const loadedName = getSetting("site_name", "Unimall") as string;
            console.log("Loaded site name:", loadedName);

            setSiteName(loadedName);
            setSiteTagline(getSetting("site_tagline", "Your Campus Marketplace") as string);
            setLogoUrl(getSetting("logo_url", "") as string);
            setFaviconUrl(getSetting("favicon_url", "") as string);

            setPrimaryColor(getSetting("primary_color", "#10b981") as string);
            setSecondaryColor(getSetting("secondary_color", "#3b82f6") as string);
            setAccentColor(getSetting("accent_color", "#f59e0b") as string);
            setBackgroundColor(getSetting("background_color", "#ffffff") as string);
            setHeaderBgColor(getSetting("header_bg_color", "#ffffff") as string);
            setFooterBgColor(getSetting("footer_bg_color", "#1f2937") as string);

            setDarkModeEnabled(getSetting("dark_mode_enabled", false) as boolean);
            setCurrentTheme(getSetting("current_theme", "default") as string);

            setHeroBackgroundUrl(getSetting("hero_background_url", "") as string);
            setHeroOverlayOpacity(getSetting("hero_overlay_opacity", 0.5) as number);

            setContainerMaxWidth(getSetting("container_max_width", "1280px") as string);
            setBorderRadius(getSetting("border_radius", "0.5rem") as string);
            setAnimationsEnabled(getSetting("animations_enabled", true) as boolean);

            setFontFamily(getSetting("font_family", "'Plus Jakarta Sans', sans-serif") as string);
            setFontSize(getSetting("font_size", "16px") as string);
        }
    }, [isLoading, settings, getSetting]);

    // Handle dark mode toggle with immediate effect
    const handleDarkModeToggle = (enabled: boolean) => {
        setDarkModeEnabled(enabled);
        setTheme(enabled ? "dark" : "light");
        toast.success(enabled ? "Dark mode enabled" : "Light mode enabled");
    };

    // Handle file upload
    const handleFileUpload = async (file: File, type: "logo" | "favicon" | "hero") => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${type}_${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Supabase upload error:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            toast.success(`${type} uploaded successfully`);
            return data.publicUrl;
        } catch (error: any) {
            console.error('Upload error details:', error);
            const errorMessage = error.message || error.error_description || "Unknown error";
            toast.error(`Failed to upload ${type}: ${errorMessage}`);
            return null;
        }
    };

    // Sync local state to global preview settings instantly
    useEffect(() => {
        updatePreviewSettings({
            primaryColor,
            secondaryColor,
            accentColor,
            backgroundColor,
            headerBgColor,
            footerBgColor,
            borderRadius,
            fontFamily,
            fontSize,
            containerMaxWidth,
            darkModeEnabled,
            siteName,
            siteTagline,
            logoUrl,
            faviconUrl,
            heroBackgroundUrl,
            heroOverlayOpacity
        });
    }, [
        primaryColor, secondaryColor, accentColor, backgroundColor, headerBgColor, footerBgColor,
        borderRadius, fontFamily, fontSize, containerMaxWidth, darkModeEnabled,
        siteName, siteTagline, logoUrl, faviconUrl, heroBackgroundUrl, heroOverlayOpacity, updatePreviewSettings
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
        try {
            const updates = {
                site_name: { value: siteName, category: "branding" },
                site_tagline: { value: siteTagline, category: "branding" },
                logo_url: { value: logoUrl, category: "branding" },
                favicon_url: { value: faviconUrl, category: "branding" },

                primary_color: { value: primaryColor, category: "theme" },
                secondary_color: { value: secondaryColor, category: "theme" },
                accent_color: { value: accentColor, category: "theme" },
                background_color: { value: backgroundColor, category: "theme" },
                header_bg_color: { value: headerBgColor, category: "theme" },
                footer_bg_color: { value: footerBgColor, category: "theme" },

                dark_mode_enabled: { value: darkModeEnabled, category: "theme" },
                current_theme: { value: currentTheme, category: "theme" },

                hero_background_url: { value: heroBackgroundUrl, category: "media" },
                hero_overlay_opacity: { value: heroOverlayOpacity, category: "media" },

                container_max_width: { value: containerMaxWidth, category: "layout" },
                border_radius: { value: borderRadius, category: "layout" },
                animations_enabled: { value: animationsEnabled, category: "layout" },

                font_family: { value: fontFamily, category: "typography" },
                font_size: { value: fontSize, category: "typography" },
            };

            await updateSettings(updates);
            toast.success("Site customization saved successfully!");
            setPreviewMode(false); // Exit preview after save
        } catch (error) {
            console.error("Error saving settings:", error);
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
        setBorderRadius("0.75rem");
        setFontFamily("'Plus Jakarta Sans', sans-serif");
        setFontSize("16px");
        setContainerMaxWidth("1280px");
        setAnimationsEnabled(true);
        toast.info("Settings reset to defaults");
    };

    return (
        <DashboardLayout type="admin" title="Site Customization">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Site Customization</h1>
                        <p className="text-muted-foreground mt-1">
                            Customize your Unimall platform appearance and branding
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPreviewMode(!previewMode)}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            {previewMode ? "Exit Preview" : "Preview"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleReset}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                        <Button
                            onClick={handleSaveSettings}
                            disabled={isSaving}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="branding" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="branding">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Branding
                        </TabsTrigger>
                        <TabsTrigger value="colors">
                            <Palette className="mr-2 h-4 w-4" />
                            Colors
                        </TabsTrigger>
                        <TabsTrigger value="media">
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Media
                        </TabsTrigger>
                        <TabsTrigger value="typography">
                            <Type className="mr-2 h-4 w-4" />
                            Typography
                        </TabsTrigger>
                        <TabsTrigger value="layout">
                            <Layout className="mr-2 h-4 w-4" />
                            Layout
                        </TabsTrigger>
                        <TabsTrigger value="pages">
                            <FileText className="mr-2 h-4 w-4" />
                            Pages
                        </TabsTrigger>
                    </TabsList>

                    {/* Branding Tab */}
                    <TabsContent value="branding" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Brand Identity</CardTitle>
                                <CardDescription>
                                    Manage your site's core branding elements
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="siteName">Site Name</Label>
                                        <Input
                                            id="siteName"
                                            value={siteName}
                                            onChange={(e) => setSiteName(e.target.value)}
                                            placeholder="Unimall"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="siteTagline">Site Tagline</Label>
                                        <Input
                                            id="siteTagline"
                                            value={siteTagline}
                                            onChange={(e) => setSiteTagline(e.target.value)}
                                            placeholder="Your Campus Marketplace"
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="logo">Logo</Label>
                                        <div className="flex items-center gap-4">
                                            {logoUrl && (
                                                <img
                                                    src={logoUrl}
                                                    alt="Logo preview"
                                                    className="h-16 w-16 object-contain rounded border"
                                                />
                                            )}
                                            <Input
                                                id="logo"
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = await handleFileUpload(file, "logo");
                                                        if (url) setLogoUrl(url);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Recommended: PNG or SVG, max 200x200px
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="favicon">Favicon</Label>
                                        <div className="flex items-center gap-4">
                                            {faviconUrl && (
                                                <img
                                                    src={faviconUrl}
                                                    alt="Favicon preview"
                                                    className="h-8 w-8 object-contain rounded border"
                                                />
                                            )}
                                            <Input
                                                id="favicon"
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = await handleFileUpload(file, "favicon");
                                                        if (url) setFaviconUrl(url);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Recommended: ICO or PNG, 32x32px
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Colors Tab */}
                    <TabsContent value="colors" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Color Scheme</CardTitle>
                                <CardDescription>
                                    Customize your site's color palette
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="primaryColor">Primary Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="primaryColor"
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="h-10 w-20"
                                            />
                                            <Input
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                placeholder="#10b981"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="secondaryColor"
                                                type="color"
                                                value={secondaryColor}
                                                onChange={(e) => setSecondaryColor(e.target.value)}
                                                className="h-10 w-20"
                                            />
                                            <Input
                                                value={secondaryColor}
                                                onChange={(e) => setSecondaryColor(e.target.value)}
                                                placeholder="#3b82f6"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="accentColor">Accent Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="accentColor"
                                                type="color"
                                                value={accentColor}
                                                onChange={(e) => setAccentColor(e.target.value)}
                                                className="h-10 w-20"
                                            />
                                            <Input
                                                value={accentColor}
                                                onChange={(e) => setAccentColor(e.target.value)}
                                                placeholder="#f59e0b"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="headerBgColor">Header Background</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="headerBgColor"
                                                type="color"
                                                value={headerBgColor}
                                                onChange={(e) => setHeaderBgColor(e.target.value)}
                                                className="h-10 w-20"
                                            />
                                            <Input
                                                value={headerBgColor}
                                                onChange={(e) => setHeaderBgColor(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="footerBgColor">Footer Background</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="footerBgColor"
                                                type="color"
                                                value={footerBgColor}
                                                onChange={(e) => setFooterBgColor(e.target.value)}
                                                className="h-10 w-20"
                                            />
                                            <Input
                                                value={footerBgColor}
                                                onChange={(e) => setFooterBgColor(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="backgroundColor">Page Background</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="backgroundColor"
                                                type="color"
                                                value={backgroundColor}
                                                onChange={(e) => setBackgroundColor(e.target.value)}
                                                className="h-10 w-20"
                                            />
                                            <Input
                                                value={backgroundColor}
                                                onChange={(e) => setBackgroundColor(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <Label>Theme Mode</Label>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant={!darkModeEnabled ? "default" : "outline"}
                                            onClick={() => handleDarkModeToggle(false)}
                                        >
                                            <Sun className="mr-2 h-4 w-4" />
                                            Light Mode
                                        </Button>
                                        <Button
                                            variant={darkModeEnabled ? "default" : "outline"}
                                            onClick={() => handleDarkModeToggle(true)}
                                        >
                                            <Moon className="mr-2 h-4 w-4" />
                                            Dark Mode
                                        </Button>
                                    </div>
                                </div>

                                {/* Color Preview */}
                                <div className="space-y-2">
                                    <Label>Color Preview</Label>
                                    <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                                        <div className="space-y-2">
                                            <div
                                                className="h-20 rounded-lg"
                                                style={{ backgroundColor: primaryColor }}
                                            />
                                            <p className="text-xs text-center">Primary</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div
                                                className="h-20 rounded-lg"
                                                style={{ backgroundColor: secondaryColor }}
                                            />
                                            <p className="text-xs text-center">Secondary</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div
                                                className="h-20 rounded-lg"
                                                style={{ backgroundColor: accentColor }}
                                            />
                                            <p className="text-xs text-center">Accent</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Media Tab */}
                    <TabsContent value="media" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Background & Media</CardTitle>
                                <CardDescription>
                                    Manage background images and media assets
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="heroBackground">Hero Section Background</Label>
                                        <Input
                                            id="heroBackground"
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const url = await handleFileUpload(file, "hero");
                                                    if (url) setHeroBackgroundUrl(url);
                                                }
                                            }}
                                        />
                                        {heroBackgroundUrl && (
                                            <div className="mt-2">
                                                <img
                                                    src={heroBackgroundUrl}
                                                    alt="Hero background preview"
                                                    className="w-full h-48 object-cover rounded-lg border"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="overlayOpacity">
                                            Overlay Opacity: {Math.round(heroOverlayOpacity * 100)}%
                                        </Label>
                                        <Input
                                            id="overlayOpacity"
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={heroOverlayOpacity}
                                            onChange={(e) => setHeroOverlayOpacity(parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Typography Tab */}
                    <TabsContent value="typography" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Typography Settings</CardTitle>
                                <CardDescription>
                                    Customize fonts and text styles
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="fontFamily">Font Family</Label>
                                        <Select
                                            value={fontFamily}
                                            onValueChange={setFontFamily}
                                        >
                                            <SelectTrigger id="fontFamily" className="w-full" style={{ fontFamily }}>
                                                <SelectValue placeholder="Select font" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="'Inter', sans-serif">
                                                    <span style={{ fontFamily: "'Inter', sans-serif" }} className="font-inter">Inter</span>
                                                </SelectItem>
                                                <SelectItem value="'Roboto', sans-serif">
                                                    <span style={{ fontFamily: "'Roboto', sans-serif" }} className="font-roboto">Roboto</span>
                                                </SelectItem>
                                                <SelectItem value="'Open Sans', sans-serif">
                                                    <span style={{ fontFamily: "'Open Sans', sans-serif" }} className="font-open-sans">Open Sans</span>
                                                </SelectItem>
                                                <SelectItem value="'Poppins', sans-serif">
                                                    <span style={{ fontFamily: "'Poppins', sans-serif" }} className="font-poppins">Poppins</span>
                                                </SelectItem>
                                                <SelectItem value="'Montserrat', sans-serif">
                                                    <span style={{ fontFamily: "'Montserrat', sans-serif" }} className="font-montserrat">Montserrat</span>
                                                </SelectItem>
                                                <SelectItem value="'Plus Jakarta Sans', sans-serif">
                                                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="font-jakarta">Plus Jakarta Sans</span>
                                                </SelectItem>
                                                <SelectItem value="'Outfit', sans-serif">
                                                    <span style={{ fontFamily: "'Outfit', sans-serif" }} className="font-outfit">Outfit</span>
                                                </SelectItem>
                                                <SelectItem value="'Lexend', sans-serif">
                                                    <span style={{ fontFamily: "'Lexend', sans-serif" }} className="font-lexend">Lexend</span>
                                                </SelectItem>
                                                <SelectItem value="'Space Grotesk', sans-serif">
                                                    <span style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="font-space">Space Grotesk</span>
                                                </SelectItem>
                                                <SelectItem value="'Bebas Neue', cursive">
                                                    <span style={{ fontFamily: "'Bebas Neue', cursive" }} className="font-bebas">Bebas Neue</span>
                                                </SelectItem>
                                                <SelectItem value="'Raleway', sans-serif">
                                                    <span style={{ fontFamily: "'Raleway', sans-serif" }} className="font-raleway">Raleway</span>
                                                </SelectItem>
                                                <SelectItem value="'Playfair Display', serif">
                                                    <span style={{ fontFamily: "'Playfair Display', serif" }} className="font-playfair">Playfair Display</span>
                                                </SelectItem>
                                                <SelectItem value="'Lato', sans-serif">
                                                    <span style={{ fontFamily: "'Lato', sans-serif" }} className="font-lato">Lato</span>
                                                </SelectItem>
                                                <SelectItem value="'Ubuntu', sans-serif">
                                                    <span style={{ fontFamily: "'Ubuntu', sans-serif" }} className="font-ubuntu">Ubuntu</span>
                                                </SelectItem>
                                                <SelectItem value="'Merriweather', serif">
                                                    <span style={{ fontFamily: "'Merriweather', serif" }} className="font-merriweather">Merriweather</span>
                                                </SelectItem>
                                                <SelectItem value="'Oswald', sans-serif">
                                                    <span style={{ fontFamily: "'Oswald', sans-serif" }} className="font-oswald">Oswald</span>
                                                </SelectItem>
                                                <SelectItem value="'Nunito', sans-serif">
                                                    <span style={{ fontFamily: "'Nunito', sans-serif" }} className="font-nunito">Nunito</span>
                                                </SelectItem>
                                                <SelectItem value="'Sora', sans-serif">
                                                    <span style={{ fontFamily: "'Sora', sans-serif" }} className="font-sora">Sora</span>
                                                </SelectItem>
                                                <SelectItem value="'Kanit', sans-serif">
                                                    <span style={{ fontFamily: "'Kanit', sans-serif" }} className="font-kanit">Kanit</span>
                                                </SelectItem>
                                                <SelectItem value="'Syne', sans-serif">
                                                    <span style={{ fontFamily: "'Syne', sans-serif" }} className="font-syne">Syne</span>
                                                </SelectItem>
                                                <SelectItem value="'DM Sans', sans-serif">
                                                    <span style={{ fontFamily: "'DM Sans', sans-serif" }} className="font-dmsans">DM Sans</span>
                                                </SelectItem>
                                                <SelectItem value="'Cormorant Garamond', serif">
                                                    <span style={{ fontFamily: "'Cormorant Garamond', serif" }} className="font-cormorant">Cormorant Garamond</span>
                                                </SelectItem>
                                                <SelectItem value="'Manrope', sans-serif">
                                                    <span style={{ fontFamily: "'Manrope', sans-serif" }} className="font-manrope">Manrope</span>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fontSize">Base Font Size</Label>
                                        <Input
                                            id="fontSize"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(e.target.value)}
                                            placeholder="16px"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <p style={{ fontFamily, fontSize }}>
                                        The quick brown fox jumps over the lazy dog
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Layout Tab */}
                    <TabsContent value="layout" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Layout Settings</CardTitle>
                                <CardDescription>
                                    Control global layout and spacing
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="containerMaxWidth">Container Max Width</Label>
                                        <Input
                                            id="containerMaxWidth"
                                            value={containerMaxWidth}
                                            onChange={(e) => setContainerMaxWidth(e.target.value)}
                                            placeholder="1280px"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="borderRadius">Border Radius</Label>
                                        <Input
                                            id="borderRadius"
                                            value={borderRadius}
                                            onChange={(e) => setBorderRadius(e.target.value)}
                                            placeholder="0.5rem"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Enable Animations</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Turn on/off page transitions and animations
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
                    <TabsContent value="pages" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Page Management</CardTitle>
                                <CardDescription>
                                    Manage site pages and content (Coming Soon)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Advanced page editor with drag-and-drop functionality will be available soon.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
