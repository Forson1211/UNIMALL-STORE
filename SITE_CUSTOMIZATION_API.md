# Unimall Site Customization API Documentation

## Overview

The Site Customization API allows administrators to manage all visual and content aspects of the Unimall platform through a centralized interface. All settings are stored in the `site_settings` table and applied globally across the application in real-time.

## Database Schema

### site_settings Table

```sql
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  setting_category TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);
```

### Setting Categories

- `branding` - Logo, site name, tagline, favicon
- `theme` - Colors, dark mode, theme presets
- `media` - Background images, overlays
- `layout` - Container widths, spacing, animations
- `typography` - Fonts, sizes, weights
- `content` - Page content, footer, header
- `seo` - Meta tags, analytics
- `payment` - Payment settings, commission rates

## Available Settings

### Branding Settings

| Setting Key | Type | Default | Description |
|------------|------|---------|-------------|
| `site_name` | string | "Unimall" | Platform name displayed in navbar and title |
| `site_tagline` | string | "Your Campus Marketplace" | Tagline/slogan |
| `logo_url` | string | "" | URL to site logo (uploaded to storage) |
| `favicon_url` | string | "" | URL to favicon (uploaded to storage) |

### Theme Settings

| Setting Key | Type | Default | Description |
|------------|------|---------|-------------|
| `primary_color` | string | "#10b981" | Primary brand color (hex) |
| `secondary_color` | string | "#3b82f6" | Secondary brand color (hex) |
| `accent_color` | string | "#f59e0b" | Accent color for highlights (hex) |
| `background_color` | string | "#ffffff" | Page background color (hex) |
| `header_bg_color` | string | "#ffffff" | Header background color (hex) |
| `footer_bg_color` | string | "#1f2937" | Footer background color (hex) |
| `dark_mode_enabled` | boolean | false | Enable dark mode by default |
| `current_theme` | string | "default" | Active theme preset name |

### Media Settings

| Setting Key | Type | Default | Description |
|------------|------|---------|-------------|
| `hero_background_url` | string | "" | Hero section background image URL |
| `hero_overlay_opacity` | number | 0.5 | Overlay opacity (0-1) |
| `auth_background_url` | string | "" | Login/signup page background |
| `dashboard_background_url` | string | "" | Dashboard background pattern |

### Layout Settings

| Setting Key | Type | Default | Description |
|------------|------|---------|-------------|
| `container_max_width` | string | "1280px" | Maximum container width |
| `border_radius` | string | "0.5rem" | Default border radius |
| `animations_enabled` | boolean | true | Enable page animations |
| `card_shadow` | string | "sm" | Default card shadow size |

### Typography Settings

| Setting Key | Type | Default | Description |
|------------|------|---------|-------------|
| `font_family` | string | "Inter" | Primary font family |
| `font_size` | string | "16px" | Base font size |
| `heading_font` | string | "Inter" | Heading font family |
| `font_weight_normal` | number | 400 | Normal text weight |
| `font_weight_bold` | number | 700 | Bold text weight |

## API Usage

### Using the useSiteSettings Hook

```typescript
import { useSiteSettings } from "@/hooks/useSiteSettings";

function MyComponent() {
  const { settings, getSetting, updateSetting, updateSettings } = useSiteSettings();

  // Get a single setting
  const siteName = getSetting("site_name", "Unimall");

  // Update a single setting
  const handleUpdate = async () => {
    await updateSetting("site_name", "My Campus Mall", "branding");
  };

  // Update multiple settings
  const handleBulkUpdate = async () => {
    await updateSettings({
      site_name: { value: "Unimall", category: "branding" },
      primary_color: { value: "#10b981", category: "theme" },
      secondary_color: { value: "#3b82f6", category: "theme" }
    });
  };

  return <div>{siteName}</div>;
}
```

### Using the SiteSettingsContext

```typescript
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

function Navbar() {
  const { siteName, primaryColor, secondaryColor, isLoading } = useSiteSettingsContext();

  if (isLoading) return <div>Loading...</div>;

  return (
    <nav style={{ backgroundColor: primaryColor }}>
      <h1>{siteName}</h1>
    </nav>
  );
}
```

## Real-time Synchronization

The site settings system uses Supabase Realtime to automatically sync changes across all connected clients:

```typescript
// Automatic subscription in useSiteSettings hook
const subscription = supabase
  .channel("site_settings_changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "site_settings" },
    (payload) => {
      // Settings automatically update in state
      console.log("Settings changed:", payload);
    }
  )
  .subscribe();
```

## File Upload for Media Assets

### Upload Logo/Favicon/Backgrounds

```typescript
const handleFileUpload = async (file: File, type: "logo" | "favicon" | "hero") => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${type}_${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('site-assets')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('site-assets')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
```

## CSS Variable Integration

Colors are automatically converted to HSL format and applied as CSS variables:

```typescript
// Automatic color application in SiteSettingsContext
useEffect(() => {
  const root = document.documentElement;
  const primary = hexToHSL(primaryColor);
  
  root.style.setProperty("--primary", `${primary.h} ${primary.s}% ${primary.l}%`);
  root.style.setProperty("--primary-foreground", "0 0% 100%");
}, [primaryColor]);
```

## Security & Permissions

### Row Level Security (RLS) Policies

```sql
-- Public can read site settings
CREATE POLICY "Public can read site settings" 
ON public.site_settings FOR SELECT USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage site settings" 
ON public.site_settings FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));
```

### Admin Activity Logging

All site customization changes are automatically logged:

```sql
CREATE TRIGGER log_settings_changes 
AFTER INSERT OR UPDATE OR DELETE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION log_admin_activity();
```

## Example: Complete Customization Flow

```typescript
import { useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";

function SiteCustomization() {
  const { updateSettings } = useSiteSettings();
  const [siteName, setSiteName] = useState("Unimall");
  const [primaryColor, setPrimaryColor] = useState("#10b981");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleSave = async () => {
    let logoUrl = "";

    // Upload logo if changed
    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('site-assets')
        .upload(fileName, logoFile);

      if (!error) {
        const { data } = supabase.storage
          .from('site-assets')
          .getPublicUrl(fileName);
        logoUrl = data.publicUrl;
      }
    }

    // Save all settings
    const updates = {
      site_name: { value: siteName, category: "branding" },
      primary_color: { value: primaryColor, category: "theme" },
    };

    if (logoUrl) {
      updates.logo_url = { value: logoUrl, category: "branding" };
    }

    await updateSettings(updates);
  };

  return (
    <div>
      <input 
        value={siteName} 
        onChange={(e) => setSiteName(e.target.value)} 
      />
      <input 
        type="color" 
        value={primaryColor} 
        onChange={(e) => setPrimaryColor(e.target.value)} 
      />
      <input 
        type="file" 
        onChange={(e) => setLogoFile(e.target.files?.[0] || null)} 
      />
      <button onClick={handleSave}>Save Changes</button>
    </div>
  );
}
```

## Best Practices

### 1. **Use Defaults**
Always provide default values when getting settings:
```typescript
const siteName = getSetting("site_name", "Unimall");
```

### 2. **Batch Updates**
Update multiple settings at once for better performance:
```typescript
await updateSettings({
  setting1: { value: "value1", category: "category1" },
  setting2: { value: "value2", category: "category2" }
});
```

### 3. **Validate Colors**
Ensure color values are valid hex codes:
```typescript
const isValidHex = (color: string) => /^#[0-9A-F]{6}$/i.test(color);
```

### 4. **Optimize Images**
Compress and optimize images before upload:
- Logos: PNG or SVG, max 200x200px
- Favicons: ICO or PNG, 32x32px
- Backgrounds: WebP format, max 1920x1080px

### 5. **Cache Settings**
The hook automatically caches settings in state and subscribes to real-time updates.

## Troubleshooting

### Settings Not Updating
1. Check if user has admin role
2. Verify RLS policies are enabled
3. Check browser console for errors
4. Ensure Supabase connection is active

### Colors Not Applying
1. Verify hex color format (#RRGGBB)
2. Check CSS variable names match
3. Clear browser cache
4. Inspect element to verify CSS variables

### File Upload Failures
1. Check storage bucket exists (`site-assets`)
2. Verify storage policies allow admin uploads
3. Check file size limits
4. Ensure file type is allowed

## Support

For issues or questions about the Site Customization API:
- Email: dev@unimall.com
- Documentation: https://docs.unimall.com
- GitHub Issues: https://github.com/unimall/issues
