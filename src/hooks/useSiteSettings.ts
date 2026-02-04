/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define a flexible JSON type
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface SiteSetting {
    id: string;
    setting_key: string;
    setting_value: Json;
    setting_category: string;
    updated_at: string;
}

export function useSiteSettings() {
    const [settings, setSettings] = useState<Record<string, Json>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Fetch all settings
    const fetchSettings = useCallback(async () => {
        try {
            setIsLoading(true);
            const { data, error } = await (supabase as any)
                .from("site_settings")
                .select("*");

            if (error) throw error;

            console.log("Fetched settings from DB:", data);

            // Convert array to key-value object
            const settingsObj: Record<string, Json> = {};
            data?.forEach((setting: any) => {
                // We know setting_value is Json compatible from the DB
                settingsObj[setting.setting_key] = setting.setting_value as unknown as Json;
            });

            console.log("Mapped settings object:", settingsObj);

            setSettings(settingsObj);
            setError(null);
        } catch (err) {
            setError(err as Error);
            console.error("Error fetching site settings:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update a single setting
    const updateSetting = useCallback(async (key: string, value: Json, category: string) => {
        try {
            const { error } = await (supabase as any)
                .from("site_settings")
                .upsert({
                    setting_key: key,
                    setting_value: value,
                    setting_category: category,
                });

            if (error) throw error;

            // Update local state
            setSettings((prev) => ({ ...prev, [key]: value }));
            toast.success("Setting updated successfully");
            return { success: true };
        } catch (err) {
            console.error("Error updating setting:", err);
            toast.error("Failed to update setting");
            return { success: false, error: err };
        }
    }, []);

    // Update multiple settings at once
    const updateSettings = useCallback(async (updates: Record<string, { value: Json; category: string }>) => {
        try {
            console.log("Saving settings to DB:", updates);
            const upsertData = Object.entries(updates).map(([key, { value, category }]) => ({
                setting_key: key,
                setting_value: value,
                setting_category: category,
            }));

            const { data, error } = await (supabase as any)
                .from("site_settings")
                .upsert(upsertData, { onConflict: 'setting_key' });

            if (error) {
                console.error("Supabase upsert error:", error);
                throw error;
            }

            console.log("Supabase upsert success:", data);

            // Refetch all settings from DB to ensure local state is in sync
            await fetchSettings();

            toast.success("Settings updated successfully");
            return { success: true };
        } catch (err) {
            console.error("Error updating settings:", err);
            toast.error(`Failed to update settings: ${(err as Error).message || "Unknown error"}`);
            return { success: false, error: err };
        }
    }, [fetchSettings]);

    // Get a specific setting value
    const getSetting = useCallback((key: string, defaultValue: Json = null) => {
        return settings[key] ?? defaultValue;
    }, [settings]);

    useEffect(() => {
        fetchSettings();

        // Subscribe to real-time changes
        const subscription = (supabase as any)
            .channel("site_settings_changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "site_settings" },
                (payload: any) => {
                    console.log("Settings changed:", payload);
                    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
                        const newRecord = payload.new as SiteSetting;
                        setSettings((prev) => ({
                            ...prev,
                            [newRecord.setting_key]: newRecord.setting_value,
                        }));
                    } else if (payload.eventType === "DELETE") {
                        const oldRecord = payload.old as SiteSetting;
                        setSettings((prev) => {
                            const newSettings = { ...prev };
                            delete newSettings[oldRecord.setting_key];
                            return newSettings;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchSettings]);

    return {
        settings,
        isLoading,
        error,
        getSetting,
        updateSetting,
        updateSettings,
        refetch: fetchSettings,
    };
}
