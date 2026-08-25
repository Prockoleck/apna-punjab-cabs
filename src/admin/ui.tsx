/* Shared admin UI primitives */
import { useEffect, type ReactNode } from "react";
import type { BookingStatus } from "../lib/db";
import { IconX, IconCheck } from "../icons";

/* ----------------------------- format ----------------------------- */

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export const fmtDateTime = (isoStr: string) =>
  new Date(isoStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

export const fmtDate = (isoStr: string) =>
  new Date(isoStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function timeAgo(isoStr: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export const waCustomer = (phone: string, text: string) =>
  `https://wa.me/91${phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(text)}`;

/* ------------------------- status metadata ------------------------ */

export const STATUS_META: Record<BookingStatus, { label: string; cls: string; dot: string }> = {
  new: { label: "New", cls: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  confirmed: { label: "Confirmed", cls: "bg-sun-100 text-sun-600", dot: "bg-sun-500" },
  assigned: { label: "Driver assigned", cls: "bg-ink-100 text-ink-700", dot: "bg-ink-500" },
  enroute: { label: "En route", cls: "bg-wa-500/15 text-wa-700", dot: "bg-wa-500" },
  completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", cls: "bg-rose-100 text-rose-700", dot: "bg-rose-400" },
};

export const NEXT_STEP: Partial<Record<BookingStatus, { to: BookingStatus; label: string }>> = {
  new: { to: "confirmed", label: "Confirm booking" },
  confirmed: { to: "assigned", label: "Assign driver" },
  assigned: { to: "enroute", label: "Start trip" },
  enroute: { to: "completed", label: "Mark completed" },
};

export function Pill({ status }: { status: BookingStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${m.cls}`}>
      <span className={`size-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/* ------------------------------ inputs ---------------------------- */

export const inputCls =
  "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink-900 placeholder:font-medium placeholder:text-ink-300 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] font-medium text-ink-400">{hint}</span>}
    </label>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className="inline-flex items-center gap-2.5"
    >
      <span
        className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${on ? "bg-sky-500" : "bg-ink-200"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all duration-200 ${on ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
      {label && <span className="text-sm font-semibold text-ink-700">{label}</span>}
    </button>
  );
}

/* ------------------------------ modal ----------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-ink-950/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={`tick-in relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white/95 px-5 py-4 backdrop-blur">
          <h3 className="font-display text-lg font-extrabold text-ink-900">{title}</h3>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-800"
          >
            <IconX size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------ toasts ---------------------------- */

export interface Toast {
  id: number;
  msg: string;
  tone: "ok" | "err";
}

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[120] flex w-[min(92vw,340px)] flex-col gap-2 md:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`tick-in flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${
            t.tone === "ok"
              ? "border-emerald-200 bg-white text-emerald-700"
              : "border-rose-200 bg-white text-rose-700"
          }`}
        >
          <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-white ${t.tone === "ok" ? "bg-emerald-500" : "bg-rose-500"}`}>
            {t.tone === "ok" ? <IconCheck size={12} /> : <IconX size={12} />}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* --------------------------- empty state -------------------------- */

export function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
      <p className="font-display text-lg font-extrabold text-ink-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm font-medium text-ink-400">{sub}</p>
    </div>
  );
}
