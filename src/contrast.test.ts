import { describe, expect, it } from "vitest";

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) => {
    const raw = ((value >> shift) & 255) / 255;
    return raw <= 0.04045 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
}

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

const pairs: Array<[string, string, string]> = [
  ["#0e1512", "#ffffff", "light body"],
  ["#0e1512", "#f4f7f5", "light body on page"],
  ["#5f6e66", "#ffffff", "light muted"],
  ["#5f6e66", "#f4f7f5", "light muted on page"],
  ["#12603a", "#f4f7f5", "light brand"],
  ["#ffffff", "#00361c", "light button"],
  ["#9a4406", "#fdebd8", "light act"],
  ["#9b1c1c", "#fdecec", "light urgent"],
  ["#6b4f00", "#fbf3d0", "light watch"],
  ["#1e4d8c", "#e7f0fa", "light informational"],
  ["#12603a", "#e3f0e8", "light connected"],
  ["#9b2c2c", "#fdecec", "light consent"],
  ["#8a5200", "#fff3e0", "light not refreshed"],
  ["#e4eee8", "#0b1510", "dark body"],
  ["#e4eee8", "#122019", "dark body on table"],
  ["#93a89c", "#122019", "dark muted"],
  ["#93a89c", "#0e1a14", "dark placeholder"],
  ["#7fc7a3", "#0b1510", "dark brand"],
  ["#ffffff", "#12603a", "dark button"],
  ["#f7b37a", "#3a2410", "dark act"],
  ["#f59e9e", "#3a1717", "dark urgent"],
  ["#f3d48a", "#2c2610", "dark watch"],
  ["#a9cff5", "#142433", "dark informational"],
  ["#7fc7a3", "#16301f", "dark connected"],
  ["#f2a0a0", "#3a1717", "dark consent"],
  ["#f0c27a", "#2e2413", "dark not refreshed"],
];

describe("contrast", () => {
  it("keeps text at or above the WCAG AA minimum in both themes", () => {
    for (const [foreground, background, label] of pairs) {
      expect(contrast(foreground, background), label).toBeGreaterThanOrEqual(4.5);
    }
  });

});
