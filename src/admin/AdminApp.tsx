/* ================================================================== */
/*  Admin console — router-driven:                                     */
/*  /admin/login · /admin (dashboard) · /admin/bookings(/:id) ·        */
/*  /admin/customers · /admin/drivers · /admin/fleet(/add,/:id/edit) · */
/*  /admin/website · /admin/settings                                   */
/* ================================================================== */

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  backend,
  useRealtime,
  useBackendRealtime,
  DEFAULT_PASSWORD,
  type BackendConfig,
  type BookingStatus,
  type HeroSection,
  type ThemeSettings,
  type WebsiteSettings,
} from "../lib/backend";
import { applyTheme, FONTS } from "../lib/settings";
import { DashboardPanel, BookingsPanel, CustomersPanel, DriversPanel, PanelSkeleton } from "./crm";
import { FleetListPage, VehicleFormPage } from "./fleet";
import ImageCropper, { ASPECTS } from "./ImageCropper";
import {
  Field,
  Modal,
  NEXT_STEP,
  Pill,
  STATUS_META,
  Toast,
  Toggle,
  fmtDateTime,
  inr,
  inputCls,
  timeAgo,
  waCustomer,
} from "./ui";
import {
  IconArrow,
  IconBolt,
  IconCheck,
  IconClock,
  IconInstagram,
  IconPhone,
  IconPin,
  IconRoute,
  IconShield,
  IconSparkle,
  IconStar,
  IconUsers,
  IconWhatsApp,
  IconX,
  LogoMark,
  CarGlyph,
} from "../icons";

type Notify = (msg: string, tone?: "ok" | "err") => void;

/* ------------------------------ toasts ---------------------------- */

function useToasts() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; tone: "ok" | "err" }[]>([]);
  const idRef = useRef(0);
  const notify: Notify = (msg, tone = "ok") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  };
  return { toasts, notify };
}

/* ------------------------------- gate ----------------------------- */

export default function AdminApp() {
  const [authed, setAuthed] = useState(() => backend.checkSession());
  const { toasts, notify } = useToasts();

  useBackendRealtime();

  if (!authed) return <LoginPage onAuthed={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-ink-50/70 font-body text-ink-900">
      <Console onLogout={() => setAuthed(false)} notify={notify} />
      <div className="pointer-events-none fixed bottom-5 right-5 z-[120] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} msg={t.msg} tone={t.tone} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- login ---------------------------- */

function LoginPage({ onAuthed }: { onAuthed: () => void }) {
  const navigate = useNavigate();
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    const res = await backend.login(pass);
    setBusy(false);
    if (res.ok) {
      onAuthed();
      navigate("/admin", { replace: true });
    } else {
      setErr(res.error ?? "Login failed");
      const card = document.getElementById("login-card");
      if (card) {
        card.classList.remove("shake");
        void card.offsetWidth;
        card.classList.add("shake");
      }
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-950 px-4">
      <div className="dotgrid-light absolute inset-0" aria-hidden />
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" aria-hidden />
      <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-sun-500/10 blur-3xl" aria-hidden />

      <div id="login-card" className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <LogoMark className="size-12" />
          <div>
            <p className="font-display text-lg font-extrabold leading-tight text-ink-900">Apna Punjab</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-600">Owner console</p>
          </div>
        </div>

        <h1 className="mt-7 font-display text-3xl font-extrabold tracking-tight text-ink-900">Sign in to the CRM</h1>
        <p className="mt-1.5 text-sm font-semibold text-ink-400">Bookings, fleet, customers and website — one desk.</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <Field label="Admin password">
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className={inputCls}
                placeholder="••••••••"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wide text-sky-600"
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </Field>
          {err && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-bold text-rose-600">{err}</p>}
          <button
            type="submit"
            disabled={busy || !pass}
            className="w-full rounded-xl bg-sky-500 py-3.5 font-bold text-white shadow-lg shadow-sky-500/30 transition-all hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-50"
          >
            {busy ? "Checking…" : "Unlock console"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-dashed border-sky-300 bg-sky-50/60 px-3.5 py-2.5">
          <p className="text-xs font-semibold text-sky-800">
            First time? Default password <strong className="font-mono">{DEFAULT_PASSWORD}</strong>
          </p>
          <button type="button" onClick={() => setPass(DEFAULT_PASSWORD)} className="text-xs font-bold text-sky-600 hover:underline">
            Fill
          </button>
        </div>

        <Link to="/" className="mt-6 block text-center text-xs font-bold text-ink-400 transition-colors hover:text-sky-600">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------ console --------------------------- */

const NAV = [
  { to: "/admin", label: "Dashboard", icon: IconBolt, end: true },
  { to: "/admin/bookings", label: "Bookings", icon: IconRoute },
  { to: "/admin/customers", label: "Customers", icon: IconUsers },
  { to: "/admin/drivers", label: "Drivers", icon: IconClock },
  { to: "/admin/fleet", label: "Fleet", icon: CarGlyph },
  { to: "/admin/website", label: "Website", icon: IconSparkle },
  { to: "/admin/settings", label: "Settings", icon: IconShield },
];

function Console({ onLogout, notify }: { onLogout: () => void; notify: Notify }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMobileNav(false), [pathname]);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px]">
      {/* sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-ink-100 bg-white lg:flex">
        <SidebarContent onLogout={onLogout} />
      </aside>

      {/* mobile drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button aria-label="Close menu" onClick={() => setMobileNav(false)} className="absolute inset-0 bg-ink-950/50" />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-2xl">
            <SidebarContent onLogout={onLogout} />
          </aside>
        </div>
      )}

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-ink-100 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setMobileNav(true)} aria-label="Open menu" className="grid size-10 place-items-center rounded-xl border border-ink-100 text-ink-700 lg:hidden">
            <span className="space-y-1.5">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-3.5 bg-current" />
            </span>
          </button>
          <span className="hidden items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:inline-flex">
            <span className="blink-dot size-1.5 rounded-full bg-emerald-500" /> Live sync on
          </span>
          <div className="ml-auto flex items-center gap-2.5">
            <NotificationBell onOpen={() => setBellOpen(true)} />
            <Link
              to="/"
              className="hidden rounded-xl border border-ink-200 px-3.5 py-2 text-sm font-bold text-ink-600 transition-colors hover:border-sky-300 hover:text-sky-600 sm:block"
            >
              View site
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <AdminRoutes notify={notify} />
        </main>

        <footer className="border-t border-ink-100 px-6 py-4 text-center text-[11px] font-semibold text-ink-300">
          Apna Punjab Cab Service · Owner console · One database, website + CRM in sync
        </footer>
      </div>

      {bellOpen && <NotificationDrawer onClose={() => setBellOpen(false)} />}
    </div>
  );
}

function SidebarContent({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/admin" className="flex items-center gap-2.5 border-b border-ink-100 px-5 py-5">
        <LogoMark className="size-10" />
        <span className="leading-tight">
          <span className="block font-display text-base font-extrabold text-ink-900">Apna Punjab</span>
          <span className="block text-[9px] font-bold uppercase tracking-[0.28em] text-sky-600">Owner console</span>
        </span>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                isActive ? "bg-ink-900 text-white shadow-md" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
              }`
            }
          >
            <n.icon size={18} />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-ink-100 p-3">
        <button
          onClick={async () => {
            await backend.logout();
            onLogout();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-rose-500 transition-colors hover:bg-rose-50"
        >
          <IconX size={18} /> Sign out
        </button>
      </div>
    </div>
  );
}

function AdminRoutes({ notify }: { notify: Notify }) {
  return (
    <Routes>
      <Route index element={<DashboardPanel notify={notify} go={(tab) => (window.location.hash = "#/admin/" + tab)} />} />
      <Route path="bookings" element={<BookingsPanel notify={notify} />} />
      <Route path="bookings/:id" element={<BookingDetailPage notify={notify} />} />
      <Route path="customers" element={<CustomersPanel notify={notify} />} />
      <Route path="drivers" element={<DriversPanel notify={notify} />} />
      <Route path="fleet" element={<FleetListPage notify={notify} />} />
      <Route path="fleet/add" element={<VehicleFormPage notify={notify} />} />
      <Route path="fleet/:id/edit" element={<VehicleFormPage notify={notify} />} />
      <Route path="website" element={<WebsitePage notify={notify} />} />
      <Route path="settings" element={<SettingsPage notify={notify} />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

/* --------------------------- notifications ------------------------ */

function NotificationBell({ onOpen }: { onOpen: () => void }) {
  useRealtime();
  const unread = backend.listNotices().filter((n) => !n.read).length;
  return (
    <button
      onClick={onOpen}
      aria-label={`Notifications (${unread} unread)`}
      className="relative grid size-10 place-items-center rounded-xl border border-ink-100 text-ink-700 transition-colors hover:border-sky-300 hover:text-sky-600"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" />
        <path d="M10 19a2.2 2.2 0 0 0 4 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white">
          {unread}
        </span>
      )}
    </button>
  );
}

function NotificationDrawer({ onClose }: { onClose: () => void }) {
  useRealtime();
  const notices = backend.listNotices();
  return (
    <Modal open onClose={onClose} title="Notifications">
      <div className="mb-3 flex justify-end">
        <button onClick={() => backend.markAllRead()} className="text-xs font-bold text-sky-600 hover:underline">
          Mark all read
        </button>
      </div>
      <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
        {notices.length === 0 && <p className="py-8 text-center text-sm font-semibold text-ink-400">No notifications yet.</p>}
        {notices.map((n) => (
          <a
            key={n.id}
            href={n.link}
            onClick={() => {
              backend.markNoticeRead(n.id);
              onClose();
            }}
            className={`block rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
              n.read ? "border-ink-100 bg-white" : "border-sky-200 bg-sky-50/70"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-extrabold text-ink-900">{n.title}</p>
              {!n.read && <span className="size-2 shrink-0 rounded-full bg-sky-500" />}
            </div>
            <p className="mt-0.5 text-xs font-semibold leading-relaxed text-ink-500">{n.body}</p>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-300">{timeAgo(n.at)}</p>
          </a>
        ))}
      </div>
    </Modal>
  );
}

/* ------------------------- booking detail ------------------------- */

function BookingDetailPage({ notify }: { notify: Notify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  useRealtime();

  const booking = id ? backend.getBooking(id) : null;
  if (!booking) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-24 text-center">
        <p className="font-display text-lg font-extrabold text-ink-900">Booking not found</p>
        <p className="mt-1 text-sm font-semibold text-ink-400">It may have been deleted.</p>
        <Link to="/admin/bookings" className="mt-4 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white">
          ← Back to bookings
        </Link>
      </div>
    );
  }

  const customer = backend.listCustomers().find((c) => c.id === booking.customerId);
  const vehicle = backend.listVehicles({ includeUnavailable: true }).find((v) => v.id === booking.vehicleId);
  const drivers = backend.listDrivers();
  const history = backend.statusHistoryOf(booking.id);
  const advance = NEXT_STEP[booking.status];

  const update = (patch: Partial<typeof booking>, msg?: string) => {
    backend.saveBooking({ ...booking, ...patch });
    if (msg) notify(msg);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/bookings" className="text-xs font-bold uppercase tracking-wider text-sky-600 hover:text-sky-700">
            ← All bookings
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">{booking.id}</h2>
            <Pill status={booking.status} />
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${booking.source === "website" ? "bg-emerald-100 text-emerald-700" : "bg-ink-100 text-ink-600"}`}>
              {booking.source === "website" ? "Online booking" : booking.source}
            </span>
          </div>
        </div>
        <div className="flex gap-2.5">
          {advance && (
            <button
              onClick={() => {
                if (advance.to === "enroute" && !booking.driverId) {
                  notify("Assign a driver before starting the trip", "err");
                  return;
                }
                update({ status: advance.to }, `${booking.id} → ${STATUS_META[advance.to].label}`);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600"
            >
              <IconArrow size={15} /> {advance.label}
            </button>
          )}
          {["pending", "confirmed", "enroute"].includes(booking.status) && (
            <button
              onClick={() => update({ status: "cancelled" }, `${booking.id} cancelled`)}
              className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50"
            >
              Cancel
            </button>
          )}
          {(booking.status === "cancelled" || booking.status === "rejected") && (
            <button
              onClick={() => update({ status: "confirmed" }, `${booking.id} reopened`)}
              className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* journey */}
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="font-display text-base font-extrabold text-ink-900">Journey</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-ink-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Pickup</p>
              <p className="mt-1 font-display text-lg font-extrabold text-ink-900">{booking.pickup}</p>
              <p className="text-sm font-semibold text-ink-500">{fmtDateTime(booking.pickupAt)} · {booking.passengers} pax</p>
            </div>
            <div className="rounded-xl bg-ink-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Drop-off</p>
              <p className="mt-1 font-display text-lg font-extrabold text-ink-900">{booking.dropoff}</p>
              <p className="text-sm font-semibold text-ink-500">
                {booking.tripType === "round"
                  ? booking.returnAt
                    ? "Return " + fmtDateTime(booking.returnAt)
                    : "Round trip · return TBD"
                  : "One-way"}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Vehicle</p>
              <p className="font-bold text-ink-800">{vehicle?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Distance</p>
              <p className="font-bold text-ink-800">{booking.km} km</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Fare</p>
              <p className="font-display text-lg font-extrabold text-ink-900">{inr(booking.fare)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Payment</p>
              <button
                onClick={() => update({ pay: booking.pay === "paid" ? "pending" : "paid" }, booking.pay === "paid" ? "Marked unpaid" : "Payment collected")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${booking.pay === "paid" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-sun-100 text-sun-600 hover:bg-sun-100/70"}`}
              >
                {booking.pay === "paid" ? "Paid" : "Pending"}
              </button>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Assign driver</p>
            <select
              value={booking.driverId ?? ""}
              onChange={(e) => update({ driverId: e.target.value || null }, e.target.value ? "Driver assigned" : "Driver unassigned")}
              className={`${inputCls} mt-1.5`}
            >
              <option value="">Unassigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.onDuty ? "· on duty" : "· off duty"}
                </option>
              ))}
            </select>
          </div>
          {booking.notes && (
            <p className="mt-4 rounded-xl border border-sun-400/30 bg-sun-50 p-3.5 text-sm font-semibold text-ink-700">{booking.notes}</p>
          )}
        </section>

        {/* customer + timeline */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <h3 className="font-display text-base font-extrabold text-ink-900">Customer</h3>
            {customer ? (
              <>
                <div className="mt-3 flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-full bg-sky-100 font-display text-base font-extrabold text-sky-700">
                    {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <p className="font-display text-base font-extrabold text-ink-900">{customer.name}</p>
                    <p className="text-xs font-semibold text-ink-400">{customer.phone}{customer.email ? " · " + customer.email : ""}</p>
                  </div>
                </div>
                <div className="mt-3.5 grid grid-cols-2 gap-2">
                  <a href={`tel:${customer.phone.replace(/\s/g, "")}`} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-white hover:bg-sky-600">
                    <IconPhone size={14} /> Call
                  </a>
                  <a
                    href={waCustomer(customer.phone, `Hi ${customer.name.split(" ")[0]} ji! This is Apna Punjab Cab Service regarding your booking ${booking.id}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-wa-500 py-2.5 text-sm font-bold text-white hover:bg-wa-600"
                  >
                    <IconWhatsApp size={14} /> WhatsApp
                  </a>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm font-semibold text-ink-400">Customer record not found.</p>
            )}
          </section>

          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <h3 className="font-display text-base font-extrabold text-ink-900">Status timeline</h3>
            <ol className="mt-4 space-y-0">
              {history.map((h, i) => (
                <li key={h.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < history.length - 1 && <span className="absolute left-[7px] top-5 h-full w-px bg-ink-100" />}
                  <span className={`relative z-10 mt-1 size-[15px] shrink-0 rounded-full border-2 border-white shadow ${STATUS_META[h.to].dot}`} />
                  <div>
                    <p className="text-sm font-extrabold text-ink-900">
                      {h.from === "created" ? "Booking created" : STATUS_META[h.to].label}
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-ink-300">{h.by}</span>
                    </p>
                    <p className="text-xs font-semibold text-ink-400">{fmtDateTime(h.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- website CMS ------------------------- */

function WebsitePage({ notify }: { notify: Notify }) {
  useRealtime();
  const saved = backend.getHero();
  const settings = backend.getSettingsSync();

  const [h, setH] = useState<HeroSection>({ ...saved });
  const [c, setC] = useState<WebsiteSettings>({ ...settings.content });
  const [t, setT] = useState<ThemeSettings>({ ...settings.theme });
  const [themeOpen, setThemeOpen] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [busy, setBusy] = useState(false);

  /* live theme preview while theme panel is open */
  useEffect(() => {
    if (themeOpen) applyTheme(t);
  }, [t, themeOpen]);

  const dirty =
    JSON.stringify(h) !== JSON.stringify(saved) ||
    JSON.stringify(c) !== JSON.stringify(settings.content) ||
    JSON.stringify(t) !== JSON.stringify(settings.theme);

  const save = () => {
    setBusy(true);
    setTimeout(() => {
      backend.saveHero(h);
      backend.saveSettings({ content: c, theme: t });
      setBusy(false);
      notify("Website updated — changes are live");
    }, 350);
  };

  const ACCENTS = [
    { name: "Sky", hex: "#0EA5E9" },
    { name: "Royal", hex: "#2563EB" },
    { name: "Teal", hex: "#14B8A6" },
    { name: "Emerald", hex: "#10B981" },
    { name: "Sunset", hex: "#F97316" },
    { name: "Rose", hex: "#F43F5E" },
    { name: "Saffron", hex: "#F59E0B" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">Website</h2>
          <p className="text-sm font-semibold text-ink-400">Hero section, branding and contact details — published straight to the live site.</p>
        </div>
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-50"
        >
          <IconCheck size={15} /> {busy ? "Publishing…" : dirty ? "Publish changes" : "All published"}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        {/* hero editor */}
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-extrabold text-ink-900">Homepage hero</h3>
            <Toggle on={h.active} onChange={(on) => setH({ ...h, active: on })} label={h.active ? "Visible" : "Hidden"} />
          </div>
          <div className="mt-4 space-y-4">
            <Field label="Badge line">
              <input value={h.badge} onChange={(e) => setH({ ...h, badge: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Headline">
              <input value={h.title} onChange={(e) => setH({ ...h, title: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Subtitle">
              <textarea value={h.subtitle} onChange={(e) => setH({ ...h, subtitle: e.target.value })} rows={3} className={inputCls} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Primary CTA text">
                <input value={h.ctaText} onChange={(e) => setH({ ...h, ctaText: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Primary CTA link" hint="tel:, https: or #/booking">
                <input value={h.ctaLink} onChange={(e) => setH({ ...h, ctaLink: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Secondary CTA text">
                <input value={h.cta2Text} onChange={(e) => setH({ ...h, cta2Text: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Secondary CTA link">
                <input value={h.cta2Link} onChange={(e) => setH({ ...h, cta2Link: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <Field label="Promo strip text">
              <input value={h.promo} onChange={(e) => setH({ ...h, promo: e.target.value })} className={inputCls} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Background image">
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
                    {h.imageUrl && <img src={h.imageUrl} alt="" className="h-full w-full object-cover" style={{ objectPosition: h.imagePos }} />}
                  </div>
                  <button onClick={() => setCropping(true)} className="rounded-xl border border-ink-200 px-3.5 py-2 text-sm font-bold text-ink-700 hover:border-sky-300 hover:text-sky-600">
                    Upload & crop
                  </button>
                </div>
              </Field>
              <Field label="Image focus" hint="Where the camera points — left/right, up/down">
                <div className="space-y-2 pt-1">
                  {(["0%", "50%", "100%"] as const).map(() => null)}
                  <input
                    type="range" min={0} max={100}
                    value={parseInt(h.imagePos.split("%")[0]) || 50}
                    onChange={(e) => setH({ ...h, imagePos: `${e.target.value}% ${h.imagePos.split(" ")[1] ?? "38%"}` })}
                    className="w-full accent-sky-500" aria-label="Horizontal focus"
                  />
                  <input
                    type="range" min={0} max={100}
                    value={parseInt((h.imagePos.split(" ")[1] ?? "38%").replace("%", "")) || 38}
                    onChange={(e) => setH({ ...h, imagePos: `${h.imagePos.split("%")[0]}% ${e.target.value}%` })}
                    className="w-full accent-sky-500" aria-label="Vertical focus"
                  />
                </div>
              </Field>
            </div>
          </div>
        </section>

        {/* branding + contact */}
        <div className="space-y-5 xl:col-span-2">
          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold text-ink-900">Brand & theme</h3>
              <button onClick={() => setThemeOpen((v) => !v)} className="text-xs font-bold text-sky-600 hover:underline">
                {themeOpen ? "Close" : "Customise"}
              </button>
            </div>
            {themeOpen && (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2.5">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.hex}
                      onClick={() => setT({ ...t, accent: a.hex })}
                      title={a.name}
                      className={`size-9 rounded-full shadow-inner transition-transform hover:scale-110 ${t.accent.toLowerCase() === a.hex.toLowerCase() ? "ring-2 ring-ink-900 ring-offset-2" : ""}`}
                      style={{ background: a.hex }}
                      aria-label={`Accent ${a.name}`}
                    />
                  ))}
                  <label className="relative grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full shadow-inner" style={{ background: "conic-gradient(#f43f5e,#f59e0b,#10b981,#0ea5e9,#8b5cf6,#f43f5e)" }}>
                    <input type="color" value={t.accent} onChange={(e) => setT({ ...t, accent: e.target.value.toUpperCase() })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Custom accent" />
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(FONTS) as (keyof typeof FONTS)[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setT({ ...t, font: f })}
                      className={`rounded-xl border-2 p-2.5 text-left transition-all ${t.font === f ? "border-ink-900 bg-ink-50" : "border-ink-100 hover:border-ink-300"}`}
                    >
                      <span className="block text-2xl font-extrabold text-ink-900" style={{ fontFamily: FONTS[f].stack }}>Aa</span>
                      <span className="mt-0.5 block truncate text-[10px] font-bold text-ink-500">{FONTS[f].label}</span>
                    </button>
                  ))}
                </div>
                <Field label={`Corner radius · ${t.radius}px`}>
                  <input type="range" min={4} max={28} value={t.radius} onChange={(e) => setT({ ...t, radius: Number(e.target.value) })} className="w-full accent-sky-500" />
                </Field>
                <button onClick={() => applyTheme()} className="text-xs font-bold text-ink-400 hover:text-ink-700">
                  Reset preview to saved theme
                </button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <h3 className="font-display text-base font-extrabold text-ink-900">Contact details</h3>
            <p className="text-xs font-semibold text-ink-400">Used in the header, footer, CTAs and WhatsApp links site-wide.</p>
            <div className="mt-4 space-y-3.5">
              <Field label="Tagline">
                <input value={c.tagline} onChange={(e) => setC({ ...c, tagline: e.target.value })} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone (display)">
                  <input value={c.phoneDisplay} onChange={(e) => setC({ ...c, phoneDisplay: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Phone (dial)">
                  <input value={c.phoneRaw} onChange={(e) => setC({ ...c, phoneRaw: e.target.value })} className={inputCls} placeholder="+91…" />
                </Field>
              </div>
              <Field label="Email">
                <input value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Instagram handle">
                <input value={c.instagramHandle} onChange={(e) => setC({ ...c, instagramHandle: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Address">
                <input value={c.address} onChange={(e) => setC({ ...c, address: e.target.value })} className={inputCls} />
              </Field>
              <Field label="WhatsApp greeting">
                <input value={c.waGreeting} onChange={(e) => setC({ ...c, waGreeting: e.target.value })} className={inputCls} />
              </Field>
            </div>
          </section>
        </div>
      </div>

      {cropping && (
        <ImageCropper
          aspect={ASPECTS.hero}
          title="Crop hero background"
          onConfirm={(url) => {
            setH({ ...h, imageUrl: url });
            setCropping(false);
          }}
          onClose={() => setCropping(false)}
        />
      )}
    </div>
  );
}

/* ----------------------------- settings --------------------------- */

function SettingsPage({ notify }: { notify: Notify }) {
  useRealtime();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [pwErr, setPwErr] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [perm, setPerm] = useState<string>(() => (typeof Notification !== "undefined" ? Notification.permission : "unsupported"));
  const [cfg, setCfg] = useState<BackendConfig>({ ...backend.getSettingsSync().backend });

  useEffect(() => {
    backend.isDefaultPassword().then(setIsDefault);
  }, []);

  const changePw = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (next !== confirm) {
      setPwErr("New passwords do not match.");
      return;
    }
    setBusy(true);
    setPwErr("");
    const res = await backend.changePassword(cur, next);
    setBusy(false);
    if (res.ok) {
      setCur("");
      setNext("");
      setConfirm("");
      setIsDefault(false);
      notify("Password updated");
    } else {
      setPwErr(res.error ?? "Could not change password");
    }
  };

  const strength = next.length === 0 ? 0 : next.length < 8 ? 1 : next.length < 12 ? 2 : 3;

  const enablePush = async () => {
    if (typeof Notification === "undefined") {
      notify("This browser does not support notifications", "err");
      return;
    }
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") {
      const device = await backend.registerDevice(navigator.userAgent.includes("Mobile") ? "Admin phone" : "Admin browser");
      if (device) {
        notify("Push enabled on this device");
        backend.testNotification();
      } else {
        notify("Push subscription failed — try again", "err");
      }
    } else {
      notify("Permission not granted", "err");
    }
  };

  const devices = backend.listDevices();
  const s = backend.getSettingsSync();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">Settings</h2>
        <p className="text-sm font-semibold text-ink-400">Security, push notifications and the data source.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* security */}
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <h3 className="font-display text-base font-extrabold text-ink-900">Security</h3>
          {isDefault && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-sun-400/40 bg-sun-50 p-3.5">
              <IconShield size={17} className="mt-0.5 shrink-0 text-sun-600" />
              <p className="text-xs font-semibold leading-relaxed text-ink-700">
                You are still using the default password <strong className="font-mono">{DEFAULT_PASSWORD}</strong>. Change it below — it takes ten seconds.
              </p>
            </div>
          )}
          <form onSubmit={changePw} className="mt-4 space-y-3.5">
            <Field label="Current password">
              <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} />
            </Field>
            <Field label="New password" hint="Minimum 8 characters">
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
            </Field>
            {next && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={`h-full rounded-full transition-all ${strength === 1 ? "w-1/3 bg-rose-400" : strength === 2 ? "w-2/3 bg-sun-500" : "w-full bg-emerald-500"}`}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                  {strength === 1 ? "Weak" : strength === 2 ? "Good" : "Strong"}
                </span>
              </div>
            )}
            <Field label="Confirm new password">
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
            </Field>
            {pwErr && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-bold text-rose-600">{pwErr}</p>}
            <button type="submit" disabled={busy || !cur || !next || !confirm} className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50">
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
          <div className="mt-5 border-t border-ink-100 pt-4 text-xs font-semibold text-ink-400">
            <p>Sessions last 12 hours · last password change: {s.security.changedAt ? fmtDateTime(s.security.changedAt) : "never (default)"}</p>
          </div>
        </section>

        <div className="space-y-5">
          {/* push notifications */}
          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <h3 className="font-display text-base font-extrabold text-ink-900">Push notifications</h3>
            <p className="text-xs font-semibold text-ink-400">
              Every new website booking pings all registered admin devices instantly. In production this flows through the Firebase Cloud Messaging edge function.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button onClick={enablePush} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-lg ${perm === "granted" ? "bg-emerald-500 text-white shadow-emerald-500/25 hover:bg-emerald-600" : "bg-sky-500 text-white shadow-sky-500/25 hover:bg-sky-600"}`}>
                {perm === "granted" ? <><IconCheck size={15} /> Re-register this device</> : <><IconBolt size={15} /> Enable push on this device</>}
              </button>
              <button onClick={() => backend.testNotification()} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">
                Send test
              </button>
            </div>
            {devices.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Registered devices</p>
                {devices.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-3.5 py-2.5">
                    <div>
                      <p className="text-sm font-bold text-ink-800">{d.label}</p>
                      <p className="font-mono text-[10px] text-ink-400">{d.token.slice(0, 18)}… · {timeAgo(d.createdAt)}</p>
                    </div>
                    <button onClick={() => backend.removeDevice(d.id)} className="text-xs font-bold text-rose-500 hover:text-rose-600">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* backend / data source */}
          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <h3 className="font-display text-base font-extrabold text-ink-900">Data source</h3>
            <p className="text-xs font-semibold text-ink-400">
              Local demo database ships with this build. Point the console at your Supabase project to go live — schema in <code className="rounded bg-ink-100 px-1 font-mono">/supabase/schema.sql</code>.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["local", "supabase"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setCfg({ ...cfg, mode: m })}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${cfg.mode === m ? "border-sky-500 bg-sky-50/60" : "border-ink-100 hover:border-ink-300"}`}
                >
                  <p className="text-sm font-extrabold text-ink-900">{m === "local" ? "Local demo DB" : "Supabase"}</p>
                  <p className="text-[11px] font-semibold text-ink-400">{m === "local" ? "Browser storage + realtime tabs" : "PostgreSQL + Realtime + Storage"}</p>
                </button>
              ))}
            </div>
            {cfg.mode === "supabase" && (
              <div className="mt-3 space-y-3">
                <Field label="Project URL">
                  <input value={cfg.url} onChange={(e) => setCfg({ ...cfg, url: e.target.value })} className={inputCls} placeholder="https://xxxx.supabase.co" />
                </Field>
                <Field label="Anon / public key">
                  <input value={cfg.anonKey} onChange={(e) => setCfg({ ...cfg, anonKey: e.target.value })} className={inputCls} placeholder="eyJhbGciOi…" />
                </Field>
              </div>
            )}
            <button
              onClick={() => {
                backend.saveSettings({ backend: cfg });
                if (cfg.mode === "supabase" && !cfg.url) {
                  notify("Supabase selected — add credentials to connect", "err");
                } else {
                  notify(cfg.mode === "supabase" ? "Supabase connected — realtime channels active" : "Using local demo database");
                }
              }}
              className="mt-4 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-white hover:-translate-y-0.5"
            >
              Save data source
            </button>
          </section>

          {/* danger zone */}
          <section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
            <h3 className="font-display text-base font-extrabold text-rose-600">Danger zone</h3>
            <p className="mt-1 text-xs font-semibold text-ink-400">Reseed the demo database — bookings, customers and settings return to factory state.</p>
            <button
              onClick={async () => {
                if (!window.confirm("Reset ALL demo data? This cannot be undone.")) return;
                await backend.resetAll();
                notify("Demo data reseeded", "err");
              }}
              className="mt-3 rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50"
            >
              Reset demo data
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
