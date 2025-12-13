import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Color utilities for export
export const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
};

// Font size conversion for export
export const convertFontSize = (cssSize: string): string => {
  if (cssSize.includes('px')) {
    const px = parseInt(cssSize);
    return `${px * 0.75}pt`; // Convert px to pt for PDF
  }
  return cssSize;
};