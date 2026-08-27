/**
 * Utility functions for calculating and enforcing vendor store profile completeness.
 * A 100% completed profile is required before vendors can publish or list products.
 */

export interface VendorProfileCompletion {
  score: number; // 0 to 100
  isComplete: boolean; // score === 100
  checklist: {
    storeName: boolean;
    phone: boolean;
    campus: boolean;
    description: boolean;
    avatarUrl: boolean;
    bannerUrl: boolean;
  };
  missingFields: {
    id: string;
    label: string;
    description: string;
  }[];
}

export function calculateVendorProfileCompleteness(profile: any, localCache?: any): VendorProfileCompletion {
  const merged = { ...(profile || {}), ...(localCache || {}) };

  const hasStoreName = Boolean((merged.store_name || merged.full_name)?.trim());
  const hasPhone = Boolean(merged.phone?.trim());
  const hasCampus = Boolean(merged.campus?.trim());
  const hasDescription = Boolean((merged.store_description || merged.description)?.trim());
  const hasAvatar = Boolean(merged.avatar_url?.trim());
  const hasBanner = Boolean(merged.banner_url?.trim());

  const checklist = {
    storeName: hasStoreName,
    phone: hasPhone,
    campus: hasCampus,
    description: hasDescription,
    avatarUrl: hasAvatar,
    bannerUrl: hasBanner,
  };

  const missingFields: { id: string; label: string; description: string }[] = [];

  if (!hasStoreName) {
    missingFields.push({
      id: "store_name",
      label: "Store Business Name",
      description: "Set your official campus brand name",
    });
  }

  if (!hasPhone) {
    missingFields.push({
      id: "phone",
      label: "WhatsApp / Phone Contact",
      description: "Allow student buyers to reach you for orders and inquiries",
    });
  }

  if (!hasCampus) {
    missingFields.push({
      id: "campus",
      label: "Campus Hub Location",
      description: "Specify your university campus for local pickups/deliveries",
    });
  }

  if (!hasDescription) {
    missingFields.push({
      id: "description",
      label: "Store Description / Bio",
      description: "Tell campus buyers about your products and delivery policies",
    });
  }

  if (!hasAvatar) {
    missingFields.push({
      id: "avatar_url",
      label: "Store Logo / Avatar",
      description: "Upload a clean logo or profile picture for your brand",
    });
  }

  if (!hasBanner) {
    missingFields.push({
      id: "banner_url",
      label: "Store Cover Banner",
      description: "Upload or choose a cover banner for your public storefront",
    });
  }

  // Calculate weighted percentage (Total = 100%)
  let score = 0;
  if (hasStoreName) score += 20;
  if (hasPhone) score += 20;
  if (hasCampus) score += 15;
  if (hasDescription) score += 15;
  if (hasAvatar) score += 15;
  if (hasBanner) score += 15;

  return {
    score: Math.min(score, 100),
    isComplete: score === 100,
    checklist,
    missingFields,
  };
}
