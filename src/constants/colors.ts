export interface ColorOption {
  name: string;
  hex: string;
  darkHex?: string;
  borderHex?: string;
}

export const PRESET_COLORS: ColorOption[] = [
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Warm Coral', hex: '#ea580c' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Pink Berry', hex: '#ec4899' },
  { name: 'Lime', hex: '#84cc16' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Slate Gray', hex: '#64748b' },
];

export const DEFAULT_EVENT_COLOR = '#6366f1';

// Convert hex to RGBA with specific opacity
export function hexToRgba(hex: string, alpha: number): string {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return `rgba(99, 102, 241, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Check luminance to choose appropriate high-contrast text color
export function getContrastTextColor(hex: string): string {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return '#ffffff';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  // Perceived luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0f172a' : '#ffffff';
}

