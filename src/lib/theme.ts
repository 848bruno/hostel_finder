export const THEME_DEFAULT_OPTION = '__default__';

// Default primary color (blue-ish matching the original theme)
export const DEFAULT_PRIMARY_COLOR = '#3b82f6';
export const DEFAULT_SECONDARY_COLOR = '#f59e24';

export const THEME_COLOR_OPTIONS = [
  { label: 'Default Blue', value: DEFAULT_PRIMARY_COLOR },
  { label: 'Ariga Green', value: '#1f853f' },
  { label: 'Emerald', value: '#15803d' },
  { label: 'Forest', value: '#166534' },
  { label: 'Teal', value: '#0f766e' },
  { label: 'Ocean Blue', value: '#0369a1' },
  { label: 'Royal Blue', value: '#1d4ed8' },
  { label: 'Plum', value: '#7c3aed' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Ruby', value: '#dc2626' },
  { label: 'Sunset Orange', value: '#ea580c' },
  { label: 'Amber Gold', value: DEFAULT_SECONDARY_COLOR },
  { label: 'Copper', value: '#b45309' },
] as const;

type HslColor = {
  h: number;
  s: number;
  l: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').trim();
  const value = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return null;
  }

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): HslColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    switch (max) {
      case red:
        h = 60 * (((green - blue) / delta) % 6);
        break;
      case green:
        h = 60 * ((blue - red) / delta + 2);
        break;
      default:
        h = 60 * ((red - green) / delta + 4);
        break;
    }
  }

  return {
    h: Math.round((h + 360) % 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function formatHsl(color: HslColor) {
  return `${color.h} ${color.s}% ${color.l}%`;
}

function toHsl(hex: string, fallback: HslColor) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return fallback;
  }
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

function foregroundFor(color: HslColor) {
  return color.l >= 62 ? '220 25% 10%' : '0 0% 100%';
}

// Unused accent function helpers removed here to pass Vercel strict lint

function resolveColor(color: string | undefined | null, fallback: string) {
  return color && color.trim() ? color : fallback;
}

export function getThemeSelectValue(color: string | undefined | null) {
  return color && color.trim() ? color : THEME_DEFAULT_OPTION;
}

export function normalizeThemeSelectValue(color: string) {
  return color === THEME_DEFAULT_OPTION ? '' : color;
}

export function applyPortalTheme(primaryColorParam?: string | null) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Use localStorage values if not explicitly provided
  const savedPrimary = localStorage.getItem('shf_theme_primary');
  // const savedSecondary = localStorage.getItem('shf_theme_secondary');

  const primaryColor = primaryColorParam !== undefined ? primaryColorParam : savedPrimary;
  // const secondaryColor = secondaryColorParam !== undefined ? secondaryColorParam : savedSecondary;

  const primaryHex = resolveColor(primaryColor, DEFAULT_PRIMARY_COLOR);
  const primary = toHsl(primaryHex, { h: 220, s: 80, l: 50 });
  // const secondary = toHsl(secondaryHex, { h: 35, s: 90, l: 55 });
  // const accent = accentFor(primary);
  // const accentForeground = accentForegroundFor(primary);

  // Apply to primary variables
  root.style.setProperty('--primary', formatHsl(primary));
  root.style.setProperty('--primary-foreground', foregroundFor(primary));
  root.style.setProperty('--ring', formatHsl(primary));

  // Dynamic gradients based on the selected primary color
  const primaryDarker = { ...primary, l: clamp(primary.l - 10, 20, 40) };
  const primaryAccent = { h: (primary.h + 20) % 360, s: primary.s, l: primary.l };
  const primaryWarm = { h: (primary.h - 20 + 360) % 360, s: primary.s, l: primary.l };

  root.style.setProperty('--gradient-hero', `linear-gradient(135deg, hsl(${formatHsl(primary)}), hsl(${formatHsl(primaryDarker)}))`);
  root.style.setProperty('--gradient-accent', `linear-gradient(135deg, hsl(${formatHsl(primary)}), hsl(${formatHsl(primaryAccent)}))`);
  root.style.setProperty('--gradient-warm', `linear-gradient(135deg, hsl(${formatHsl(primaryWarm)}), hsl(${formatHsl(primary)}))`);

  // We are currently preserving the original secondary/accent/warning definitions as this is an MVP of themes, 
  // but we can map them fully if needed later.
}

export function saveThemeSelection(primaryColor: string) {
  localStorage.setItem('shf_theme_primary', primaryColor);
  applyPortalTheme(primaryColor);
}
