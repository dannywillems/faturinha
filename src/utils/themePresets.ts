export interface ThemePreset {
  id: string;
  name: string;
  color: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'blue', name: 'Blue', color: '#2563eb' },
  { id: 'green', name: 'Green', color: '#059669' },
  { id: 'purple', name: 'Purple', color: '#7c3aed' },
  { id: 'red', name: 'Red', color: '#dc2626' },
  { id: 'orange', name: 'Orange', color: '#ea580c' },
  { id: 'teal', name: 'Teal', color: '#0d9488' },
];

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return [37, 99, 235]; // Default blue
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

export function generateHoverColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  // Darken by 15%
  const darken = (value: number): number =>
    Math.max(0, Math.floor(value * 0.85));
  const toHex = (value: number): string => value.toString(16).padStart(2, '0');
  return `#${toHex(darken(r))}${toHex(darken(g))}${toHex(darken(b))}`;
}

export function generateLightColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, 0.1)`;
}
