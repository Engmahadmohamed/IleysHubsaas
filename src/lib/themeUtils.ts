/**
 * Generates CSS variable shades from a single hex primary color.
 * Returns an object suitable for use as React inline `style` prop.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function mixWhite(rgb: [number, number, number], ratio: number): string {
  const r = Math.round(rgb[0] + (255 - rgb[0]) * ratio);
  const g = Math.round(rgb[1] + (255 - rgb[1]) * ratio);
  const b = Math.round(rgb[2] + (255 - rgb[2]) * ratio);
  return `rgb(${r},${g},${b})`;
}

function mixBlack(rgb: [number, number, number], ratio: number): string {
  return `rgb(${Math.round(rgb[0] * (1 - ratio))},${Math.round(rgb[1] * (1 - ratio))},${Math.round(rgb[2] * (1 - ratio))})`;
}

export function generateThemeVars(hexColor?: string): React.CSSProperties {
  const hex = hexColor && /^#[0-9a-fA-F]{3,6}$/.test(hexColor) ? hexColor : '#4f46e5';
  const rgb = hexToRgb(hex);
  return {
    '--theme-50':  mixWhite(rgb, 0.95),
    '--theme-100': mixWhite(rgb, 0.88),
    '--theme-200': mixWhite(rgb, 0.76),
    '--theme-300': mixWhite(rgb, 0.58),
    '--theme-400': mixWhite(rgb, 0.35),
    '--theme-500': mixWhite(rgb, 0.12),
    '--theme-600': hex,
    '--theme-700': mixBlack(rgb, 0.15),
    '--theme-800': mixBlack(rgb, 0.30),
    '--theme-900': mixBlack(rgb, 0.50),
    '--theme-950': mixBlack(rgb, 0.68),
  } as React.CSSProperties;
}

export function hexToRgbStr(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

/** Parses hex to jsPDF-compatible [r, g, b] array */
export function hexToJsPdfRgb(hex: string): [number, number, number] {
  return hexToRgb(hex);
}
