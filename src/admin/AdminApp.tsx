/* ================================================================== */
/*  Admin console: auth gate, shell, theme studio, security, activity  */
/* ================================================================== */

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  api,
  DEFAULT_PASSWORD,
  type Activity,
  type ContentSettings,
  type ThemeSettings,
} from "../lib/db";
import { applyTheme, FONTS, useSettings } from "../lib/settings";
import {
  DashboardPanel,
  BookingsPanel,
  CustomersPanel,
  DriversPanel,
  FleetPanel,
} from "./crm";
import { Field, ToastStack, inputCls, timeAgo, type Toast } from "./ui";
import {
  CarGlyph,
  IconArrow,
  IconBolt,
  IconClock,
  IconPhone,
  IconRoute,
  IconShield,
  IconSparkle,
  IconUsers,
  IconWhatsApp,
  LogoMark,
} from "../icons";
import { waHref } from "../data";

/* ------------------------------ gate ------------------------------ */

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(api.checkSession());
  }, []);

  if (authed === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-950">
        <div className="flex items-center gap-3 text-sm font-bold text-ink-300">
          <span className="size-2 animate-ping rounded-full bg-sky-400" /> Checking session…
        </div>
      </div>
    );
  }
  if (!authed) return <Login onOk={() => setAuthed(true)} />;
  return <Shell onLogout={() => setAuthed(false)} />;
}

/* ------------------------------ login ----------------------------- */

function Login({ onOk }: { onOk: () => void }) {
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [shakeKey, setShakeKey] = useState(0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    const res = await api.login(pass);
    setBusy(false);
    if (res.ok) onOk();
    else {
      setErr(res.error ?? "Login failed");
      setShakeKey((k) => k + 1);
    }
  };

  return (
    <div className="grid min-h-screen bg-ink-950 lg:grid-cols-2">
      {/* brand panel */}
      <div className="dotgrid-light relative hidden overflow-hidden border-r border-ink-800 lg:block">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 size-96 rounded-full bg-sun-500/10 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <LogoMark className="size-12" />
            <div className="leading-tight">
              <p className="font-display text-lg font-extrabold text-white">Apna Punjab</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-400">Cab Service · Ludhiana</p>
            </div>
          </div>
          <div>
            <p className="font-display text-5xl font-extrabold leading-[1.05] text-white">
              Run the business
              <br />
              <span className="text-sky-400">from one desk.</span>
            </p>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-300">
              Bookings, customers, drivers, fleet pricing and the website's look — everything the
              office handles daily, in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {["Booking pipeline", "Customer CRM", "Driver roster", "Live theme editor", "Fare control"].map((t) => (
                <span key={t} className="rounded-full border border-ink-700 bg-ink-900/80 px-3.5 py-1.5 text-xs font-bold text-ink-200">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs font-semibold text-ink-500">Since 2019 · 4.6★ on Google · 162 reviews</p>
        </div>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center p-6">
        <form key={shakeKey} onSubmit={submit} className={`w-full max-w-sm ${err ? "shake" : ""}`}>
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <LogoMark className="size-11" />
              <p className="font-display text-lg font-extrabold text-white">Apna Punjab Admin</p>
            </div>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white">Staff sign in</h1>
          <p className="mt-2 text-sm font-semibold text-ink-400">
            Enter the admin passcode to open the control room.
          </p>

          <label className="mt-7 block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Passcode</span>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3.5 pr-16 text-base font-bold tracking-widest text-white placeholder:text-ink-600 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-sky-400 hover:text-sky-300"
              >
                {show ? "HIDE" : "SHOW"}
              </button>
            </div>
          </label>

          {err && (
            <p className="tick-in mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-400">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !pass}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3.5 font-display text-base font-extrabold text-white shadow-xl shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-400 disabled:opacity-50"
          >
            {busy ? "Verifying…" : "Unlock control room"}
            {!busy && <IconArrow size={17} />}
          </button>

          <div className="mt-6 rounded-xl border border-ink-800 bg-ink-900/70 p-4 text-xs font-semibold leading-relaxed text-ink-400">
            First time here? The default passcode is{" "}
            <button
              type="button"
              onClick={() => setPass(DEFAULT_PASSWORD)}
              className="rounded-md bg-ink-800 px-2 py-0.5 font-mono font-bold text-sky-300 transition-colors hover:bg-ink-700"
            >
              {DEFAULT_PASSWORD}
            </button>{" "}
            — you'll be able to change it under <span className="text-ink-200">Security</span> after signing in.
          </div>

          <a href="#/" onClick={() => (window.location.hash = "")} className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-ink-400 transition-colors hover:text-white">
            ← Back to website
          </a>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------ shell ----------------------------- */

const TABS: { id: string; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <IconBolt size={17} /> },
  { id: "bookings", label: "Bookings", icon: <IconRoute size={17} /> },
  { id: "customers", label: "Customers", icon: <IconUsers size={17} /> },
  { id: "drivers", label: "Drivers", icon: <IconClock size={17} /> },
  { id: "fleet", label: "Fleet & Pricing", icon: <CarGlyph className="w-5" /> },
  { id: "theme", label: "Theme & Website", icon: <IconSparkle size={17} /> },
  { id: "activity", label: "Activity Log", icon: <IconClock size={17} /> },
  { id: "security", label: "Security", icon: <IconShield size={17} /> },
];

function Shell({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState("dashboard");
  const [statusParam, setStatusParam] = useState<string | undefined>();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dataKey, setDataKey] = useState(0);

  const notify = (msg: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  };

  const go = (t: string) => {
    if (t.includes(":")) {
      const [a, b] = t.split(":");
      setTab(a);
      setStatusParam(b);
    } else {
      setTab(t);
      setStatusParam(undefined);
    }
    window.scrollTo({ top: 0 });
  };

  const active = TABS.find((t) => t.id === tab);

  const goSite = () => {
    if (window.location.pathname.replace(/\/+$/, "").startsWith("/admin")) {
      window.location.href = "/";
    } else {
      window.location.hash = "";
    }
  };

  const logout = async () => {
    await api.logout();
    window.location.hash = "";
    onLogout();
  };

  return (
    <div className="min-h-screen bg-ink-50/70">
      {/* sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-ink-800 bg-ink-950 md:flex">
        <div className="flex items-center gap-2.5 border-b border-ink-800/70 px-5 py-5">
          <LogoMark className="size-10" />
          <div className="leading-tight">
            <p className="font-display text-[15px] font-extrabold text-white">Apna Punjab</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-sky-400">Control Room</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                tab === t.id ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25" : "text-ink-300 hover:bg-ink-900 hover:text-white"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        <div className="space-y-1 border-t border-ink-800/70 p-3">
          <button onClick={goSite} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-ink-300 transition-colors hover:bg-ink-900 hover:text-white">
            <IconArrow size={17} className="rotate-180" /> View website
          </button>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-rose-400 transition-colors hover:bg-rose-500/10">
            <IconShield size={17} /> Sign out
          </button>
        </div>
      </aside>

      {/* main */}
      <div className="md:pl-60">
        {/* top bar */}
        <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 md:px-8">
            <LogoMark className="size-9 md:hidden" />
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-extrabold tracking-tight text-ink-900">{active?.label}</h1>
              <p className="hidden text-[11px] font-bold uppercase tracking-wider text-ink-400 sm:block">
                Apna Punjab Cab Service · Ludhiana
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <a href="tel:+919914291112" className="hidden items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-xs font-bold text-ink-700 transition-colors hover:border-sky-300 hover:text-sky-700 sm:inline-flex">
                <IconPhone size={13} /> 99142 91112
              </a>
              <button onClick={goSite} className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:-translate-y-0.5">
                View site <IconArrow size={13} />
              </button>
            </div>
          </div>
          {/* mobile nav */}
          <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3 md:hidden">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                  tab === t.id ? "bg-sky-500 text-white" : "bg-ink-100 text-ink-600"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </header>

        <main key={dataKey} className="px-4 py-6 md:px-8 md:py-8">
          {tab === "dashboard" && <DashboardPanel notify={notify} go={go} />}
          {tab === "bookings" && <BookingsPanel notify={notify} initialStatus={statusParam} />}
          {tab === "customers" && <CustomersPanel notify={notify} />}
          {tab === "drivers" && <DriversPanel notify={notify} />}
          {tab === "fleet" && <FleetPanel notify={notify} />}
          {tab === "theme" && <ThemePanel notify={notify} />}
          {tab === "activity" && <ActivityPanel />}
          {tab === "security" && (
            <SecurityPanel
              notify={notify}
              onLogout={logout}
              onResetDemo={() => {
                setDataKey((k) => k + 1);
                notify("Demo data restored to a fresh seed");
              }}
            />
          )}
        </main>
      </div>

      <ToastStack toasts={toasts} />
    </div>
  );
}

/* --------------------------- theme studio ------------------------- */

const ACCENTS = [
  { name: "Sky", hex: "#0EA5E9" },
  { name: "Royal", hex: "#2563EB" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Sunset", hex: "#F97316" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Saffron", hex: "#F59E0B" },
  { name: "Violet", hex: "#8B5CF6" },
];

function ThemePanel({ notify }: { notify: (m: string, t?: "ok" | "err") => void }) {
  const { theme, content } = useSettings();
  const [t, setT] = useState<ThemeSettings>({ ...theme });
  const [c, setC] = useState<ContentSettings>({ ...content });
  const [busy, setBusy] = useState(false);

  /* live preview — the whole site re-themes as you pick */
  useEffect(() => {
    applyTheme(t);
  }, [t]);

  const dirty = useMemo(
    () => JSON.stringify(t) !== JSON.stringify(theme) || JSON.stringify(c) !== JSON.stringify(content),
    [t, c, theme, content]
  );

  const save = async () => {
    setBusy(true);
    await api.saveSettings({ theme: t, content: c });
    setBusy(false);
    notify("Website updated — changes are live");
  };

  const reset = async () => {
    if (!window.confirm("Reset theme & site content to the original defaults?")) return;
    setBusy(true);
    await api.resetSettings();
    setBusy(false);
    notify("Restored original theme & content");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      {/* theme controls */}
      <div className="space-y-6 xl:col-span-3">
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg font-extrabold text-ink-900">Brand accent</h3>
          <p className="text-xs font-semibold text-ink-400">Every button, badge and highlight on the website follows this colour.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {ACCENTS.map((a) => (
              <button
                key={a.hex}
                onClick={() => setT({ ...t, accent: a.hex })}
                className={`group flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 transition-all hover:-translate-y-0.5 ${
                  t.accent.toLowerCase() === a.hex.toLowerCase() ? "border-ink-900 bg-ink-50" : "border-transparent bg-ink-50/60 hover:border-ink-200"
                }`}
              >
                <span className="size-9 rounded-full shadow-inner transition-transform group-hover:scale-110" style={{ background: a.hex }} />
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-500">{a.name}</span>
              </button>
            ))}
            <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-ink-200 p-2.5 transition-all hover:-translate-y-0.5 hover:border-sky-400">
              <span
                className="relative grid size-9 place-items-center overflow-hidden rounded-full shadow-inner"
                style={{ background: "conic-gradient(#f43f5e,#f59e0b,#10b981,#0ea5e9,#8b5cf6,#f43f5e)" }}
              >
                <input
                  type="color"
                  value={t.accent}
                  onChange={(e) => setT({ ...t, accent: e.target.value.toUpperCase() })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Custom accent colour"
                />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-ink-500">Custom</span>
            </label>
          </div>
          <p className="mt-3 font-mono text-xs font-bold text-ink-400">
            {t.accent} <span className="text-ink-300">— a full light-to-dark scale is generated automatically</span>
          </p>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg font-extrabold text-ink-900">Headline typeface</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(Object.keys(FONTS) as (keyof typeof FONTS)[]).map((f) => (
              <button
                key={f}
                onClick={() => setT({ ...t, font: f })}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 ${
                  t.font === f ? "border-ink-900 bg-ink-50" : "border-ink-100 hover:border-ink-300"
                }`}
              >
                <span className="block text-3xl font-extrabold text-ink-900" style={{ fontFamily: FONTS[f].stack }}>
                  Aa
                </span>
                <span className="mt-1 block text-xs font-bold text-ink-500">{FONTS[f].label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg font-extrabold text-ink-900">Corner roundness</h3>
          <div className="mt-4 flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={28}
              value={t.radius}
              onChange={(e) => setT({ ...t, radius: Number(e.target.value) })}
              className="flex-1 accent-sky-500"
            />
            <span className="w-14 text-right font-mono text-sm font-bold text-ink-700">{t.radius}px</span>
            <span
              className="grid h-12 w-20 place-items-center border-2 border-sky-500 bg-sky-50 text-[10px] font-bold text-sky-700"
              style={{ borderRadius: t.radius }}
            >
              card
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg font-extrabold text-ink-900">Website content</h3>
          <p className="text-xs font-semibold text-ink-400">These fields feed the live website — phone links, WhatsApp messages and the footer.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Tagline (hero)">
                <input value={c.tagline} onChange={(e) => setC({ ...c, tagline: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <Field label="Phone (display)">
              <input value={c.phoneDisplay} onChange={(e) => setC({ ...c, phoneDisplay: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Phone (dial link)" hint="With country code, e.g. +919914291112">
              <input value={c.phoneRaw} onChange={(e) => setC({ ...c, phoneRaw: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Instagram handle">
              <input value={c.instagramHandle} onChange={(e) => setC({ ...c, instagramHandle: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Instagram URL">
              <input value={c.instagram} onChange={(e) => setC({ ...c, instagram: e.target.value })} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Office address">
                <input value={c.address} onChange={(e) => setC({ ...c, address: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="WhatsApp greeting (prefilled message)">
                <textarea value={c.waGreeting} onChange={(e) => setC({ ...c, waGreeting: e.target.value })} rows={2} className={inputCls} />
              </Field>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={busy || !dirty}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-display text-sm font-extrabold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-50"
          >
            {busy ? "Publishing…" : "Save & publish website"}
          </button>
          <button onClick={reset} className="rounded-xl border border-ink-200 px-4 py-3 text-sm font-bold text-ink-600 hover:bg-ink-100">
            Reset to defaults
          </button>
          {!dirty && <span className="text-xs font-bold text-emerald-600">✓ All changes published</span>}
        </div>
      </div>

      {/* live preview */}
      <div className="space-y-4 xl:col-span-2">
        <div className="sticky top-24">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-400">Live preview</p>
          <div className="dotgrid mt-2 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
            <div className="border-b border-ink-100 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <LogoMark className="size-8" />
                <span className="font-display text-sm font-extrabold text-ink-900">Apna Punjab</span>
                <span className="ml-auto rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ background: t.accent }}>
                  <IconPhone size={12} className="mr-1 inline" />
                  {c.phoneDisplay}
                </span>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: t.accent }}>
                {c.tagline}
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold leading-tight text-ink-900" style={{ fontFamily: FONTS[t.font].stack }}>
                Ludhiana to anywhere, anytime.
              </p>
              <div className="mt-4 flex gap-2.5">
                <span className="px-4 py-2.5 text-sm font-bold text-white shadow-lg" style={{ background: t.accent, borderRadius: t.radius }}>
                  Book now
                </span>
                <span className="border-2 border-ink-100 px-4 py-2.5 text-sm font-bold text-ink-700" style={{ borderRadius: t.radius }}>
                  WhatsApp us
                </span>
              </div>
              <div className="mt-5 space-y-2">
                {[92, 74, 85].map((w, i) => (
                  <div key={i} className="h-2 rounded-full bg-ink-100" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs font-semibold leading-relaxed text-sky-800">
            <strong className="font-extrabold">Publishing is instant.</strong> The website reads these settings live — other open
            tabs update the moment you hit save, no redeploy needed.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- activity ---------------------------- */

function ActivityPanel() {
  const [rows, setRows] = useState<Activity[] | null>(null);
  useEffect(() => {
    api.listActivity().then(setRows);
  }, []);
  if (!rows) return <div className="py-24 text-center text-sm font-bold text-ink-400">Loading activity…</div>;
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
      <div className="divide-y divide-ink-50">
        {rows.length === 0 && <p className="p-6 text-sm font-semibold text-ink-400">No activity yet.</p>}
        {rows.map((a) => (
          <div key={a.id} className="flex items-start gap-3.5 px-5 py-3.5 transition-colors hover:bg-sky-50/50">
            <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-700">
              <IconBolt size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-ink-900">
                {a.action} <span className="font-semibold text-ink-400">· {a.actor}</span>
              </p>
              <p className="truncate text-[13px] font-semibold text-ink-500">{a.detail}</p>
            </div>
            <span className="shrink-0 text-xs font-bold text-ink-300">{timeAgo(a.at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- security ---------------------------- */

function SecurityPanel({
  notify,
  onLogout,
  onResetDemo,
}: {
  notify: (m: string, t?: "ok" | "err") => void;
  onLogout: () => void;
  onResetDemo: () => void;
}) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [isDefault, setIsDefault] = useState<boolean | null>(null);
  const { content } = useSettings();

  useEffect(() => {
    api.isDefaultPassword().then(setIsDefault);
  }, []);

  const strength = Math.min(4, Math.floor(next.length / 3));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (next !== confirm) {
      notify("New passwords don't match", "err");
      return;
    }
    setBusy(true);
    const res = await api.changePassword(cur, next);
    setBusy(false);
    if (res.ok) {
      notify("Password changed — use it next sign-in");
      setCur("");
      setNext("");
      setConfirm("");
      setIsDefault(false);
    } else {
      notify(res.error ?? "Could not change password", "err");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <form onSubmit={submit} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-extrabold text-ink-900">Change admin passcode</h3>
        <p className="text-xs font-semibold text-ink-400">Already signed in? Reset the passcode right here — no email needed.</p>

        {isDefault && (
          <div className="mt-4 rounded-xl border border-sun-400/50 bg-sun-50 p-3.5 text-xs font-bold leading-relaxed text-sun-600">
            ⚠ You're still using the default passcode <span className="font-mono">{DEFAULT_PASSWORD}</span>. Anyone with this demo
            link knows it — set your own below.
          </div>
        )}

        <div className="mt-5 space-y-4">
          <Field label="Current passcode">
            <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} autoComplete="current-password" />
          </Field>
          <Field label="New passcode" hint="Minimum 8 characters">
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} autoComplete="new-password" />
          </Field>
          {next && (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= strength ? (strength <= 1 ? "bg-rose-400" : strength === 2 ? "bg-sun-400" : "bg-emerald-400") : "bg-ink-100"
                  }`}
                />
              ))}
              <span className="w-16 text-right text-[11px] font-bold text-ink-400">
                {strength <= 1 ? "Weak" : strength === 2 ? "Okay" : "Strong"}
              </span>
            </div>
          )}
          <Field label="Repeat new passcode">
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} autoComplete="new-password" />
          </Field>
        </div>

        <button
          type="submit"
          disabled={busy || !cur || next.length < 8 || next !== confirm}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-ink-800 disabled:opacity-50"
        >
          <IconShield size={16} /> {busy ? "Updating…" : "Update passcode"}
        </button>
      </form>

      <div className="space-y-6">
        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg font-extrabold text-ink-900">Session</h3>
          <div className="mt-3 space-y-2 text-sm font-semibold text-ink-600">
            <p className="flex justify-between"><span>Status</span><span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-600"><span className="blink-dot size-2 rounded-full bg-emerald-500" /> Active · 12-hour session</span></p>
            <p className="flex justify-between"><span>Business line</span><span className="font-extrabold text-ink-900">{content.phoneDisplay}</span></p>
            <p className="flex justify-between"><span>Data storage</span><span className="font-extrabold text-ink-900">On-device database (versioned)</span></p>
          </div>
          <button onClick={onLogout} className="mt-4 w-full rounded-xl border border-rose-200 py-3 text-sm font-extrabold text-rose-600 transition-colors hover:bg-rose-50">
            Sign out of this device
          </button>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg font-extrabold text-rose-600">Danger zone</h3>
          <p className="mt-1 text-xs font-semibold text-ink-400">
            Wipe every booking, customer, driver and setting — and restore the fresh demo seed. Useful before showing the site to
            someone new.
          </p>
          <button
            onClick={async () => {
              if (!window.confirm("Reset ALL demo data? Bookings, customers, drivers and theme will be reseeded.")) return;
              await api.resetDemo();
              onResetDemo();
            }}
            className="mt-4 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-rose-600"
          >
            Reset demo data
          </button>
        </div>

        <a
          href={waHref("Hi! I'm reviewing the Apna Punjab Cab Service admin console.")}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-wa-500/50 hover:shadow-md"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-wa-500 text-white"><IconWhatsApp size={20} /></span>
          <span>
            <span className="block font-display text-sm font-extrabold text-ink-900">Need help with the console?</span>
            <span className="text-xs font-semibold text-ink-400">Message the web team on WhatsApp — replies within minutes.</span>
          </span>
        </a>
      </div>
    </div>
  );
}
