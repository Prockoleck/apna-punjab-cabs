/* ================================================================== */
/*  Theme runtime — applies admin-configured accent palette, display   */
/*  font and corner radius as CSS variables. Tailwind v4 utilities     */
/*  like bg-sky-500 compile to var(--color-sky-500), so re-theming     */
/*  the whole public site + admin console is just rewriting a dozen    */
/*  variables on :root.                                                */
/* ================================================================== */

import { useEffect, type ReactNode } from "react";
import { backend, useRealtime, type ThemeSettings } from "./backend";

export const FONTS: Record<"bricolage" | "sora" | "space", { label: string; stack: string }> = {
  bricolage: { label: "Bricolage Grotesque", stack: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif' },
  sora: { label: "Sora", stack: '"Sora", ui-sans-serif, system-ui, sans-serif' },
  space: { label: "Space Grotesk", stack: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif' },
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (isNaN(n)) return [14, 165, 233];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(hex: string, target: [number, number, number], t: number): string {
  const [r, g, b] = hexToRgb(hex);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return "#" + c(r + (target[0] - r) * t) + c(g + (target[1] - g) * t) + c(b + (target[2] - b) * t);
}

/** Full light-to-dark scale generated from a single accent hex. */
export function buildScale(accent: string): Record<string, string> {
  const W: [number, number, number] = [255, 255, 255];
  const K: [number, number, number] = [8, 40, 66];
  return {
    "50": mix(accent, W, 0.93),
    "100": mix(accent, W, 0.86),
    "200": mix(accent, W, 0.66),
    "300": mix(accent, W, 0.4),
    "400": mix(accent, W, 0.15),
    "500": accent,
    "600": mix(accent, K, 0.22),
    "700": mix(accent, K, 0.4),
    "800": mix(accent, K, 0.6),
    "900": mix(accent, K, 0.78),
    "950": mix(accent, K, 0.88),
  };
}

export function applyTheme(themeOverride?: ThemeSettings) {
  const theme = themeOverride ?? backend.getSettingsSync().theme;
  const root = document.documentElement;
  const scale = buildScale(theme.accent);
  for (const [k, v] of Object.entries(scale)) {
    root.style.setProperty("--color-sky-" + k, v);
  }
  root.style.setProperty("--font-display", (FONTS[theme.font] ?? FONTS.bricolage).stack);
  const r = theme.radius ?? 16;
  root.style.setProperty("--radius-card", r + "px");
  root.style.setProperty("--radius-btn", Math.max(6, r - 4) + "px");
}

/** Live settings state — updates whenever the database changes. */
export function useSettings(): { theme: ThemeSettings; content: ReturnType<typeof contentNow> } {
  const tick = useRealtime();
  useEffect(() => {
    applyTheme();
  }, [tick]);
  useEffect(() => {
    applyTheme();
  }, []);
  const s = backend.getSettingsSync();
  return { theme: s.theme, content: s.content };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  useSettings();
  return <>{children}</>;
}

/* --------------------------- content ------------------------------ */

export function contentNow() {
  return backend.getSettingsSync().content;
}

export const telHrefNow = () => "tel:" + contentNow().phoneRaw;
export const waHrefNow = (text: string) =>
  "https://wa.me/" + contentNow().phoneRaw.replace("+", "") + "?text=" + encodeURIComponent(text);
