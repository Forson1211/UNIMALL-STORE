import { describe, expect, it, vi } from "vitest";
import {
  buildPlatformSettingsUpdates,
  persistPlatformSettings,
  validatePlatformSettings,
  type PlatformSettingsInput,
} from "@/lib/platformSettings";

const validInput: PlatformSettingsInput = {
  allowVendorRegistration: false,
  requireVendorVerification: true,
  reviewModerationEnabled: true,
  commissionRate: "12.5",
  minimumOrderValue: "25",
};

describe("platform settings synchronization", () => {
  it("validates and normalizes commission and minimum order values", () => {
    expect(validatePlatformSettings(validInput)).toEqual({
      valid: true,
      commissionRate: 12.5,
      minimumOrderValue: 25,
    });
  });

  it("rejects commission rates outside the supported range", () => {
    expect(validatePlatformSettings({ ...validInput, commissionRate: 100.1 })).toEqual({
      valid: false,
      error: "Commission rate must be between 0 and 100",
    });
  });

  it("rejects negative minimum order values", () => {
    expect(validatePlatformSettings({ ...validInput, minimumOrderValue: -1 })).toEqual({
      valid: false,
      error: "Minimum order value must be zero or greater",
    });
  });

  it("builds the exact platform site_settings upsert payload", () => {
    expect(buildPlatformSettingsUpdates(validInput)).toEqual({
      allow_vendor_registration: { value: false, category: "platform" },
      require_vendor_verification: { value: true, category: "platform" },
      review_moderation_enabled: { value: true, category: "platform" },
      commission_rate: { value: 12.5, category: "platform" },
      minimum_order_value: { value: 25, category: "platform" },
    });
  });

  it("persists all toggles and numeric values through the site settings updater", async () => {
    const storedSettings: Record<string, boolean | number> = {};
    const updateSettings = vi.fn(async (updates: ReturnType<typeof buildPlatformSettingsUpdates>) => {
      Object.entries(updates).forEach(([key, setting]) => {
        storedSettings[key] = setting.value;
      });
      return { success: true };
    });

    await persistPlatformSettings(validInput, updateSettings);

    expect(updateSettings).toHaveBeenCalledOnce();
    expect(storedSettings).toEqual({
      allow_vendor_registration: false,
      require_vendor_verification: true,
      review_moderation_enabled: true,
      commission_rate: 12.5,
      minimum_order_value: 25,
    });
  });
});
