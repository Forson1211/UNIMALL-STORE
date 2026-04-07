import { createContext, useContext, useEffect, useState, type ReactNode, useCallback, useMemo } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTheme } from "@/components/ThemeProvider";

interface SiteSettingsContextValue {
    siteName: string;
    siteTagline: string;
    logoUrl: string;
    faviconUrl: string;
    heroBackgroundUrl: string;
    heroOverlayOpacity: number;
    accentColor: string;
    backgroundColor: string;
    headerBgColor: string;
    footerBgColor: string;
    footerTextColor: string;
    borderRadius: string;
    fontFamily: string;
    fontSize: string;
    containerMaxWidth: string;
    animationsEnabled: boolean;
    darkModeEnabled: boolean;
    primaryColor: string;
    secondaryColor: string;
    isLoading: boolean;
    updatePreviewSettings: (settings: Partial<SiteSettingsContextValue>) => void;
    // Expose database methods
    settings: any;
    updateSettings: (updates: any) => Promise<any>;
    resetSettings: () => Promise<boolean>;
    getSetting: (key: string, defaultValue?: any) => any;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
    siteName: "Unimall",
    siteTagline: "Your Campus Marketplace",
    logoUrl: "",
    faviconUrl: "",
    heroBackgroundUrl: "",
    heroOverlayOpacity: 0.5,
    accentColor: "#f59e0b",
    backgroundColor: "#ffffff",
    headerBgColor: "#ffffff",
    footerBgColor: "#1f2937",
    footerTextColor: "#ffffff",
    borderRadius: "0.75rem",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "16px",
    containerMaxWidth: "1280px",
    animationsEnabled: true,
    darkModeEnabled: false,
    primaryColor: "#f97316",
    secondaryColor: "#ea580c",
    isLoading: true,
    updatePreviewSettings: () => { },
    settings: null,
    updateSettings: async () => ({ success: false }),
    resetSettings: async () => false,
    getSetting: () => null,
});

export const useSiteSettingsContext = () => useContext(SiteSettingsContext);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
    const { settings, isLoading, getSetting, updateSettings } = useSiteSettings();
    const { setTheme, resolvedTheme } = useTheme();
    const [previewSettings, setPreviewSettings] = useState<Partial<SiteSettingsContextValue>>({});

    const resetSettings = async () => false;

    // Helper to get value from preview or DB
    const getValue = <T,>(key: string, defaultValue: T, previewKey: keyof SiteSettingsContextValue): T => {
        if (previewSettings[previewKey] !== undefined) {
            return previewSettings[previewKey] as T;
        }
        const val = getSetting(key, defaultValue as any);
        return (val as T) ?? defaultValue;
    };

    const siteName = getValue("site_name", "Unimall", "siteName");
    const siteTagline = getValue("site_tagline", "Your Campus Marketplace", "siteTagline");
    const logoUrl = getValue("logo_url", "", "logoUrl");
    const faviconUrl = getValue("favicon_url", "", "faviconUrl");
    const heroBackgroundUrl = getValue("hero_background_url", "", "heroBackgroundUrl");
    const heroOverlayOpacity = getValue("hero_overlay_opacity", 0.5, "heroOverlayOpacity");

    const primaryColor = getValue("primary_color", "#f97316", "primaryColor");
    const secondaryColor = getValue("secondary_color", "#ea580c", "secondaryColor");
    const accentColor = getValue("accent_color", "#f59e0b", "accentColor");

    const backgroundColor = getValue("background_color", "#ffffff", "backgroundColor");
    const headerBgColor = getValue("header_bg_color", "#ffffff", "headerBgColor");
    const footerBgColor = getValue("footer_bg_color", "#1f2937", "footerBgColor");
    const footerTextColor = getValue("footer_text_color", "#ffffff", "footerTextColor");

    const borderRadius = getValue("border_radius", "0.75rem", "borderRadius");
    const fontFamily = getValue("font_family", "'Plus Jakarta Sans', sans-serif", "fontFamily");
    const fontSize = getValue("font_size", "16px", "fontSize");
    const containerMaxWidth = getValue("container_max_width", "1280px", "containerMaxWidth");

    const animationsEnabled = getValue("animations_enabled", true, "animationsEnabled");
    const darkModeEnabled = getValue("dark_mode_enabled", false, "darkModeEnabled");

    // Log whenever key values change
    useEffect(() => {
        console.log("📋 Context values updated:", {
            siteName,
            fontFamily,
            primaryColor,
            secondaryColor,
            accentColor
        });
    }, [siteName, fontFamily, primaryColor, secondaryColor, accentColor]);

    const updatePreviewSettings = useCallback((newSettings: Partial<SiteSettingsContextValue>) => {
        setPreviewSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    // Sync dark mode with ThemeProvider
    useEffect(() => {
        if (!isLoading) {
            setTheme(darkModeEnabled ? "dark" : "light");
        }
    }, [darkModeEnabled, isLoading, setTheme]);

    // Apply colors to CSS variables whenever they change
    useEffect(() => {
        if (!isLoading) {
            const root = document.documentElement;

            // Convert hex to HSL for Tailwind compatibility
            const hexToHSL = (hex: string) => {
                let sanitizedHex = hex.replace("#", "");

                // Handle 3-digit hex
                if (sanitizedHex.length === 3) {
                    sanitizedHex = sanitizedHex.split("").map(char => char + char).join("");
                }

                // Convert to RGB
                const r = parseInt(sanitizedHex.substring(0, 2), 16) / 255;
                const g = parseInt(sanitizedHex.substring(2, 4), 16) / 255;
                const b = parseInt(sanitizedHex.substring(4, 6), 16) / 255;
                // ... same HSL logic as before but shortened here for target matching
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                let h = 0, s = 0;
                const l = (max + min) / 2;
                if (max !== min) {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                        case g: h = ((b - r) / d + 2) / 6; break;
                        case b: h = ((r - g) / d + 4) / 6; break;
                    }
                }
                return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
            };

            const applyHSL = (varName: string, hex: string) => {
                try {
                    const hsl = hexToHSL(hex);
                    root.style.setProperty(varName, `${hsl.h} ${hsl.s}% ${hsl.l}%`);
                } catch (e) {
                    console.error(`Invalid hex color for ${varName}:`, hex);
                }
            };

            applyHSL("--primary", primaryColor);
            applyHSL("--secondary", secondaryColor);
            applyHSL("--accent", accentColor);

            const isDark = resolvedTheme === 'dark';

            if (isDark) {
                // In dark mode, remove inline overrides for general background so CSS .dark classes take effect
                root.style.removeProperty("--background");
                root.style.removeProperty("--header-background");
            } else {
                // In light mode, apply the custom colors
                applyHSL("--background", backgroundColor);
                applyHSL("--header-background", headerBgColor);
            }

            // Apply footer background consistently in both modes if requested
            applyHSL("--footer-background", footerBgColor);
            applyHSL("--footer-foreground", footerTextColor);

            root.style.setProperty("--radius", borderRadius);

            // AGGRESSIVE FONT APPLICATION - Balanced option
            console.log("🔤 FORCING font family:", fontFamily);

            // Method 1: CSS variable - The safest way for Tailwind
            root.style.setProperty("--font-family", fontFamily);

            // Method 2: Direct on root - Ensures default fallback
            root.style.setProperty("font-family", fontFamily, "important");

            // Method 3 (Nuclear/Global) removed. Using important on the root property is sufficient 
            // and avoids 'shaking' caused by overwriting body style attributes (conflicts with Radix UI).

            root.style.setProperty("--font-size", fontSize);
            root.style.setProperty("--container-max-width", containerMaxWidth);

            if (!animationsEnabled) {
                root.classList.add("no-animations");
            } else {
                root.classList.remove("no-animations");
            }

            console.log("🎨 Site customization applied", {
                darkModeEnabled,
                resolvedTheme,
                fontFamily,
                fontSize
            });
        }
    }, [settings, isLoading, primaryColor, secondaryColor, accentColor, backgroundColor, headerBgColor, footerBgColor, borderRadius, fontFamily, fontSize, containerMaxWidth, animationsEnabled, darkModeEnabled, resolvedTheme]);

    // Update document title and favicon
    useEffect(() => {
        if (!isLoading) {
            if (siteName) {
                document.title = siteName;
            }

            // Update favicon - use logo as fallback if no favicon is set
            const favicon = faviconUrl || logoUrl;
            if (favicon) {
                console.log("🎨 Setting favicon to:", favicon);
                const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                if (!link) {
                    const newLink = document.createElement('link');
                    newLink.rel = 'icon';
                    newLink.href = favicon;
                    document.head.appendChild(newLink);
                } else {
                    link.href = favicon;
                }
            }
        }
    }, [siteName, faviconUrl, logoUrl, isLoading]);

    const value: SiteSettingsContextValue = useMemo(() => ({
        siteName,
        siteTagline,
        logoUrl,
        faviconUrl,
        heroBackgroundUrl,
        heroOverlayOpacity,
        accentColor,
        backgroundColor,
        headerBgColor,
        footerBgColor,
        footerTextColor,
        borderRadius,
        fontFamily,
        fontSize,
        containerMaxWidth,
        animationsEnabled,
        darkModeEnabled,
        primaryColor,
        secondaryColor,
        isLoading,
        updatePreviewSettings,
        settings,
        updateSettings,
        resetSettings,
        getSetting,
    }), [
        siteName, siteTagline, logoUrl, faviconUrl, heroBackgroundUrl, heroOverlayOpacity,
        accentColor, backgroundColor, headerBgColor, footerBgColor, footerTextColor,
        borderRadius, fontFamily, fontSize, containerMaxWidth,
        animationsEnabled, darkModeEnabled, primaryColor, secondaryColor,
        isLoading, updatePreviewSettings, settings, updateSettings, getSetting // resetSettings is constant/dummy so technically optional but good practice
    ]);

    return (
        <SiteSettingsContext.Provider value={value}>
            {children}
        </SiteSettingsContext.Provider>
    );
}
