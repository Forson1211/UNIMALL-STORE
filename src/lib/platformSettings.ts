export interface PlatformSettingsInput {
  allowVendorRegistration: boolean;
  requireVendorVerification: boolean;
  reviewModerationEnabled: boolean;
  commissionRate: string | number;
  minimumOrderValue: string | number;
}

export type PlatformSettingsUpdates = Record<string, {
  value: boolean | number;
  category: "platform";
}>;

export interface PlatformSettingsValidation {
  valid: boolean;
  error?: string;
  commissionRate?: number;
  minimumOrderValue?: number;
}

export function validatePlatformSettings(input: PlatformSettingsInput): PlatformSettingsValidation {
  const commissionRate = Number(input.commissionRate);
  const minimumOrderValue = Number(input.minimumOrderValue);

  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    return { valid: false, error: "Commission rate must be between 0 and 100" };
  }

  if (!Number.isFinite(minimumOrderValue) || minimumOrderValue < 0) {
    return { valid: false, error: "Minimum order value must be zero or greater" };
  }

  return { valid: true, commissionRate, minimumOrderValue };
}

export function buildPlatformSettingsUpdates(input: PlatformSettingsInput): PlatformSettingsUpdates {
  const validation = validatePlatformSettings(input);
  if (!validation.valid || validation.commissionRate === undefined || validation.minimumOrderValue === undefined) {
    throw new Error(validation.error || "Invalid platform settings");
  }

  return {
    allow_vendor_registration: { value: input.allowVendorRegistration, category: "platform" },
    require_vendor_verification: { value: input.requireVendorVerification, category: "platform" },
    review_moderation_enabled: { value: input.reviewModerationEnabled, category: "platform" },
    commission_rate: { value: validation.commissionRate, category: "platform" },
    minimum_order_value: { value: validation.minimumOrderValue, category: "platform" },
  };
}

export async function persistPlatformSettings(
  input: PlatformSettingsInput,
  updateSettings: (updates: PlatformSettingsUpdates) => Promise<{ success?: boolean } | void>,
) {
  const updates = buildPlatformSettingsUpdates(input);
  return updateSettings(updates);
}
