/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/dbUtils";
import { toast } from "sonner";

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface SiteSetting {
    id: string;
    setting_key: string;
    setting_value: Json;
    setting_category: string;
    updated_at: string;
}

const DEFAULT_SETTINGS: Record<string, Json> = {
    site_name: "Unimall",
    site_tagline: "Your Campus Marketplace",
    primary_color: "#f97316",
    secondary_color: "#ea580c",
    accent_color: "#f59e0b",
    font_family: "Plus Jakarta Sans",
    dark_mode_enabled: false,
    maintenance_mode: false,
    allow_vendor_registration: true,
    commission_rate: 10,
};

export function useSiteSettings() {
    const [settings, setSettings] = useState<Record<string, Json>>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        const data = await withRetry(async () => {
            const { data, error } = await (supabase as any)
                .from("site_settings")
                .select("*");
            if (error) throw error;
            return data;
        }, null, { retries: 2, baseDelay: 2000 });

        if (data) {
            const settingsObj: Record<string, Json> = { ...DEFAULT_SETTINGS };
            data.forEach((setting: any) => {
                settingsObj[setting.setting_key] = setting.setting_value;
            });
            setSettings(settingsObj);
            setError(null);
        } else {
            // DB unavailable — keep defaults, don't crash
            console.warn("⚠️ site_settings unavailable, using defaults");
        }
        setIsLoading(false);
    }, []);

    const updateSetting = useCallback(async (key: string, value: Json, category: string) => {
        try {
            const { error } = await (supabase as any)
                .from("site_settings")
                .upsert({ setting_key: key, setting_value: value, setting_category: category });
            if (error) throw error;
            setSettings((prev) => ({ ...prev, [key]: value }));
            toast.success("Setting updated successfully");
            return { success: true };
        } catch (err) {
            console.error("Error updating setting:", err);
            toast.error("Failed to update setting");
            return { success: false, error: err };
        }
    }, []);

    const updateSettings = useCallback(async (updates: Record<string, { value: Json; category: string }>) => {
        try {
            const upsertData = Object.entries(updates).map(([key, { value, category }]) => ({
                setting_key: key,
                setting_value: value,
                setting_category: category,
            }));

            const { error } = await (supabase as any)
                .from("site_settings")
                .upsert(upsertData, { onConflict: "setting_key", ignoreDuplicates: false });

            if (error) throw error;

            await fetchSettings();
            return { success: true };
        } catch (err) {
            console.error("❌ Update failed:", err);
            toast.error(`Failed to update settings: ${(err as Error).message || "Unknown error"}`);
            return { success: false, error: err };
        }
    }, [fetchSettings]);

    const getSetting = useCallback((key: string, defaultValue: Json = null) => {
        return settings[key] ?? defaultValue;
    }, [settings]);

    useEffect(() => {
        fetchSettings();

        const subscription = (supabase as any)
            .channel("site_settings_changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, (payload: any) => {
                if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
                    const rec = payload.new as SiteSetting;
                    setSettings((prev) => ({ ...prev, [rec.setting_key]: rec.setting_value }));
                } else if (payload.eventType === "DELETE") {
                    const rec = payload.old as SiteSetting;
                    setSettings((prev) => {
                        const next = { ...prev };
                        delete next[rec.setting_key];
                        return next;
                    });
                }
            })
            .subscribe();

        return () => { subscription.unsubscribe(); };
    }, [fetchSettings]);

    return { settings, isLoading, error, getSetting, updateSetting, updateSettings, refetch: fetchSettings };
}
