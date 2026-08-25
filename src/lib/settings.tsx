/* ================================================================== */
/*  Live theme + content runtime.                                      */
/*  Reads settings from the db, applies them as CSS variables on       */
/*  :root (Tailwind v4 utilities resolve to these vars), and notifies  */
/*  React subscribers on any db change — including across tabs.        */
/* ================================================================== */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getDb, type ContentSettings, type ThemeSettings } from "./db";

/* ------------------------- colour utilities ----------------------- */

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h || "0ea5e9", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: [number, number, number], b: [number, number, number], t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const WHITE: [number, number, number] = [255, 255, 255];
const DARK: [number, number, number] = [7, 25, 41];

/** Generate a full sky-style scale from one accent hex. */
function accentScale(hex: string): Record<string, string> {
  const base = hexToRgb(hex);
  const steps: [string, number, "w" | "d"][] = [
    ["50", 0.94, "w"],
    ["100", 0.87, "w"],
    ["200", 0.72, "w"],
    ["300", 0.5, "w"],
    ["400", 0.22, "w"],
    ["500", 0, "w"],
    ["600", 0.14, "d"],
    ["700", 0.28, "d"],
    ["800", 0.45, "d"],
    ["900", 0.62, "d"],
    ["950", 0.78, "d"],
  ];
  const out: Record<string, string> = {};
  for (const [step, t, dir] of steps) {
    out[step] = dir === "w" ? mix(base, WHITE, t) : mix(base, DARK, t);
  }
  return out;
}

export const FONTS: Record<ThemeSettings["font"], { label: string; stack: string }> = {
  bricolage: {
    label: "Bricolage Grotesque",
    stack: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif",
  },
  sora: { label: "Sora", stack: "'Sora', ui-sans-serif, system-ui, sans-serif" },
  space: { label: "Space Grotesk", stack: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
};

export function applyTheme(theme: ThemeSettings) {
  const root = document.documentElement;
  const scale = accentScale(theme.accent);
  for (const [step, value] of Object.entries(scale)) {
    root.style.setProperty(`--color-sky-${step}`, value);
  }
  root.style.setProperty("--font-display", FONTS[theme.font]?.stack ?? FONTS.bricolage.stack);
  const r = Math.max(0, theme.radius);
  root.style.setProperty("--radius-lg", `${Math.max(4, r - 6)}px`);
  root.style.setProperty("--radius-xl", `${Math.max(6, r - 3)}px`);
  root.style.setProperty("--radius-2xl", `${r}px`);
  root.style.setProperty("--radius-3xl", `${r + 8}px`);
}

/* apply immediately on module load — no flash of un-themed content */
if (typeof window !== "undefined") {
  try {
    applyTheme(getDb().settings.theme);
  } catch {
    /* db unavailable — defaults in CSS remain */
  }
}

/* ---------------------------- context ----------------------------- */

interface SettingsCtx {
  version: number;
  theme: ThemeSettings;
  content: ContentSettings;
  /** re-read everything from the db */
  refresh: () => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => {
      try {
        applyTheme(getDb().settings.theme);
      } catch {
        /* noop */
      }
      setVersion((v) => v + 1);
    };
    window.addEventListener("apc:db", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("apc:db", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const value = useMemo<SettingsCtx>(() => {
    let theme: ThemeSettings = { accent: "#0EA5E9", font: "bricolage", radius: 16 };
    let content: ContentSettings = {
      tagline: "Punjab's Trusted Cab Service Since 2019",
      phoneDisplay: "99142 91112",
      phoneRaw: "+919914291112",
      instagramHandle: "@apnapunjabcabs",
      instagram: "https://www.instagram.com/apnapunjabcabs",
      address: "GT Road, Near Bus Stand, Ludhiana, Punjab 141001",
      waGreeting: "Hi Apna Punjab Cab Service! I'd like to book a cab. 🚖",
    };
    try {
      const s = api.getSettingsSync();
      theme = s.theme;
      content = s.content;
    } catch {
      /* keep defaults */
    }
    return { version, theme, content, refresh: () => setVersion((v) => v + 1) };
  }, [version]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Re-render on any db change and get the current settings. */
export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}

/* ------- sync accessors used by data.ts live getters -------------- */

export function contentNow(): ContentSettings {
  try {
    return api.getSettingsSync().content;
  } catch {
    return {
      tagline: "Punjab's Trusted Cab Service Since 2019",
      phoneDisplay: "99142 91112",
      phoneRaw: "+919914291112",
      instagramHandle: "@apnapunjabcabs",
      instagram: "https://www.instagram.com/apnapunjabcabs",
      address: "GT Road, Near Bus Stand, Ludhiana, Punjab 141001",
      waGreeting: "Hi Apna Punjab Cab Service! I'd like to book a cab. 🚖",
    };
  }
}
