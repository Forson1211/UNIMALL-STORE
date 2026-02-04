import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { hexToHSL } from '@/lib/theme-utils';

export const ThemeApplicator = () => {
    const { getSetting, settings, isLoading } = useSiteSettings();

    useEffect(() => {
        if (isLoading) return;

        const primary = getSetting('primary_color');
        const secondary = getSetting('secondary_color');

        const root = document.documentElement;

        if (primary && typeof primary === 'string') {
            const hsl = hexToHSL(primary);
            if (hsl) {
                root.style.setProperty('--primary', hsl);
                // Also update ring for focus states
                root.style.setProperty('--ring', hsl);
                // And custom vars if any
                root.style.setProperty('--emerald', hsl);
            }
        }

        if (secondary && typeof secondary === 'string') {
            const hsl = hexToHSL(secondary);
            if (hsl) {
                root.style.setProperty('--secondary', hsl);
                root.style.setProperty('--coral', hsl);
            }
        }
    }, [settings, isLoading, getSetting]);

    return null;
}
