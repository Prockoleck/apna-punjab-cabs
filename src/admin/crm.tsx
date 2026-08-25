/* ================================================================== */
/*  CRM panels: Dashboard · Bookings · Customers · Drivers · Fleet     */
/* ================================================================== */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  backend as api,
  calcFare,
  type Booking,
  type Customer,
  type Driver,
  type PayStatus,
  type Source,
  type Stats,
  type TripType,
  type Vehicle,
} from "../lib/backend";
import { ROUTES } from "../data";
import {
  Empty,
  Field,
  Modal,
  NEXT_STEP,
  Pill,
  STATUS_META,
  Toggle,
  fmtDate,
  fmtDateTime,
  inr,
  inputCls,
  waCustomer,
} from "./ui";
import {
  IconArrow,
  IconBolt,
  IconPhone,
  IconUsers,
  IconWhatsApp,
  IconClock,
  IconRupee,
} from "../icons";
import { SmartImg } from "../motion";

type Notify = (msg: string, tone?: "ok" | "err") => void;

/* ------------------------------ hooks ----------------------------- */

function useAsync<T>(fn: () => T | Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    Promise.resolve(fn()).then((d) => live && setData(d));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  /* realtime: refresh whenever the database changes (any tab) */
  useEffect(() => {
    const sync = () => setTick((t) => t + 1);
    window.addEventListener("apc:db", sync);
    return () => window.removeEventListener("apc:db", sync);
  }, []);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, setData, reload };
}

const toLocalInput = (isoStr: string) => {
  const d = new Date(isoStr);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */

export function DashboardPanel({ go }: { notify: Notify; go: (tab: string) => void }) {
  const { data: stats } = useAsync<Stats>(() => api.stats());

  if (!stats) return <PanelSkeleton label="Crunching today's numbers…" />;

  const max = Math.max(...stats.days.map((d) => d.total), 1);
  const kpis = [
    { label: "Bookings today", value: String(stats.todayCount), icon: <IconBolt size={18} />, tone: "bg-sky-500" },
    { label: "Pending action", value: String(stats.pendingCount), icon: <IconClock size={18} />, tone: "bg-sun-500" },
    { label: "Revenue this month", value: inr(stats.monthRevenue), icon: <IconRupee size={18} />, tone: "bg-emerald-500" },
    { label: "Drivers on duty", value: `${stats.driversOnDuty}/${stats.driversTotal}`, icon: <IconUsers size={18} />, tone: "bg-ink-800" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className={`grid size-9 place-items-center rounded-xl text-white ${k.tone}`}>{k.icon}</span>
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink-900">{k.value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-400">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* revenue chart */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-extrabold text-ink-900">Revenue — last 14 days</h3>
              <p className="text-xs font-semibold text-ink-400">All trips except cancelled</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              {inr(stats.days.reduce((s, d) => s + d.total, 0))}
            </span>
          </div>
          <svg viewBox="0 0 560 190" className="mt-4 w-full" role="img" aria-label="Daily revenue bar chart">
            {stats.days.map((d, i) => {
              const bw = 26;
              const gap = (560 - 14 * bw) / 15;
              const x = gap + i * (bw + gap);
              const h = Math.max(4, (d.total / max) * 130);
              const today = i === stats.days.length - 1;
              return (
                <g key={d.label}>
                  <rect
                    x={x}
                    y={150 - h}
                    width={bw}
                    height={h}
                    rx={6}
                    className={`transition-opacity hover:opacity-70 ${today ? "fill-sun-400" : "fill-sky-400"}`}
                  >
                    <title>{`${d.label} · ${d.count} trips · ${inr(d.total)}`}</title>
                  </rect>
                  {i % 2 === 0 && (
                    <text x={x + bw / 2} y={172} textAnchor="middle" className="fill-ink-300" fontSize="10" fontWeight="700">
                      {d.label}
                    </text>
                  )}
                </g>
              );
            })}
            <line x1="0" y1="150.5" x2="560" y2="150.5" className="stroke-ink-100" strokeWidth="1.5" />
          </svg>
        </div>

        {/* pipeline */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="font-display text-lg font-extrabold text-ink-900">Booking pipeline</h3>
          <p className="text-xs font-semibold text-ink-400">Click a stage to filter the bookings list</p>
          <div className="mt-4 space-y-2">
            {stats.pipeline.map((p) => (
              <button
                key={p.status}
                onClick={() => go(`bookings:${p.status}`)}
                className="flex w-full items-center justify-between rounded-xl border border-ink-100 bg-ink-50/60 px-3.5 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-sm"
              >
                <span className="flex items-center gap-2.5">
                  <span className={`size-2 rounded-full ${STATUS_META[p.status].dot}`} />
                  <span className="text-sm font-bold text-ink-700">{STATUS_META[p.status].label}</span>
                </span>
                <span className="font-display text-base font-extrabold text-ink-900">{p.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* recent bookings */}
      <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-ink-900">Latest bookings</h3>
          <button onClick={() => go("bookings")} className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 hover:text-sky-700">
            View all <IconArrow size={15} />
          </button>
        </div>
        <div className="mt-3 divide-y divide-ink-50">
          {stats.recent.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
              <span className="font-mono text-xs font-bold text-ink-400">{b.id}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink-800">{b.route}</span>
              <span className="text-sm font-semibold text-ink-500">{fmtDateTime(b.pickupAt)}</span>
              <span className="text-sm font-extrabold text-ink-900">{inr(b.fare)}</span>
              <Pill status={b.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  BOOKINGS                                                           */
/* ================================================================== */

const blankBooking = (): Booking => ({
  id: "",
  customerId: "",
  driverId: null,
  vehicleId: "dzire",
  route: "Ludhiana → " + ROUTES[0].name,
  pickup: "Ludhiana",
  dropoff: ROUTES[0].name.split(" ·")[0],
  km: ROUTES[0].km,
  tripType: "one-way",
  pickupAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  returnAt: null,
  passengers: 2,
  status: "pending",
  fare: 0,
  pay: "pending",
  source: "admin",
  notes: "",
  createdAt: new Date().toISOString(),
});

export function BookingsPanel({ notify, initialStatus }: { notify: Notify; initialStatus?: string }) {
  const { data: bookings, reload } = useAsync(() => api.listBookings());
  const { data: customers } = useAsync(() => api.listCustomers());
  const { data: drivers } = useAsync(() => api.listDrivers());
  const { data: vehicles } = useAsync(() => api.listVehicles());

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>(initialStatus ?? "all");
  const [trip, setTrip] = useState("all");
  const [editing, setEditing] = useState<Booking | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (initialStatus) setStatus(initialStatus);
  }, [initialStatus]);

  const custName = (id: string) => customers?.find((c) => c.id === id)?.name ?? "—";
  const driverName = (id: string | null) => (id ? drivers?.find((d) => d.id === id)?.name ?? "—" : "—");
  const vehicleName = (id: string) => vehicles?.find((v) => v.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    if (!bookings) return [];
    const needle = q.trim().toLowerCase();
    return bookings.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (trip !== "all" && b.tripType !== trip) return false;
      if (!needle) return true;
      return [b.id, b.route, custName(b.customerId), driverName(b.driverId)]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, customers, drivers, q, status, trip]);

  if (!bookings || !customers || !drivers || !vehicles)
    return <PanelSkeleton label="Loading bookings ledger…" />;

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search booking, customer, route…"
          className={`${inputCls} w-full sm:w-72`}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS_META).map(([k, m]) => (
            <option key={k} value={k}>{m.label}</option>
          ))}
        </select>
        <select value={trip} onChange={(e) => setTrip(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="all">One-way & round</option>
          <option value="one-way">One-way</option>
          <option value="round">Round trip</option>
        </select>
        <button
          onClick={() => {
            setEditing(blankBooking());
            setIsNew(true);
          }}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600"
        >
          <IconBolt size={16} /> New booking
        </button>
      </div>

      {/* table */}
      {rows.length === 0 ? (
        <Empty title="No bookings match" sub="Try a different search or status filter — or create a new booking." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/70 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Cab</th>
                  <th className="px-4 py-3">Fare</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {rows.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => {
                      setEditing({ ...b });
                      setIsNew(false);
                    }}
                    className="cursor-pointer transition-colors hover:bg-sky-50/60"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-bold text-ink-400">
                      {b.id}
                      <span className="block font-sans text-[11px] font-semibold normal-case text-ink-300">{b.source}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-ink-800">{custName(b.customerId)}</td>
                    <td className="max-w-[220px] px-4 py-3">
                      <span className="block truncate font-semibold text-ink-700">{b.route}</span>
                      <span className="text-[11px] font-semibold text-ink-400">
                        {b.km} km · {b.tripType === "round" ? "round trip" : "one-way"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink-600">{fmtDateTime(b.pickupAt)}</td>
                    <td className="px-4 py-3 font-semibold text-ink-600">{vehicleName(b.vehicleId)}</td>
                    <td className="px-4 py-3 font-extrabold text-ink-900">{inr(b.fare)}</td>
                    <td className="px-4 py-3"><Pill status={b.status} /></td>
                    <td className="px-4 py-3 text-sky-600"><IconArrow size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <BookingForm
          booking={editing}
          isNew={isNew}
          customers={customers}
          drivers={drivers}
          vehicles={vehicles}
          notify={notify}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            notify(msg);
            setEditing(null);
            reload();
          }}
          onDeleted={() => {
            notify("Booking deleted", "err");
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------- booking form --------------------------- */

function BookingForm({
  booking,
  isNew,
  customers,
  drivers,
  vehicles,
  notify,
  onClose,
  onSaved,
  onDeleted,
}: {
  booking: Booking;
  isNew: boolean;
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  notify: Notify;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onDeleted: () => void;
}) {
  const [b, setB] = useState<Booking>({ ...booking });
  const [fareTouched, setFareTouched] = useState(!isNew);
  const [addCustomer, setAddCustomer] = useState(false);
  const [ncName, setNcName] = useState("");
  const [ncPhone, setNcPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [customRoute, setCustomRoute] = useState(!ROUTES.some((r) => booking.route.includes(r.name.split(" ·")[0])));

  const set = <K extends keyof Booking>(k: K, v: Booking[K]) => setB((p) => ({ ...p, [k]: v }));

  const vehicle = vehicles.find((v) => v.id === b.vehicleId) ?? vehicles[0];
  const autoFare = calcFare(b.km || 0, vehicle?.perKm ?? 11, vehicle?.base ?? 300, b.tripType);
  const shownFare = fareTouched ? b.fare : autoFare;

  const pickRoute = (name: string) => {
    const r = ROUTES.find((x) => `Ludhiana → ${x.name}` === name);
    if (r) {
      setCustomRoute(false);
      setB((p) => ({ ...p, route: `Ludhiana → ${r.name}`, km: r.km }));
    } else {
      setCustomRoute(true);
    }
  };

  const save = async () => {
    if (!b.customerId && !(addCustomer && ncName.trim() && ncPhone.trim())) {
      return;
    }
    setBusy(true);
    try {
      let customerId = b.customerId;
      if (addCustomer && ncName.trim()) {
        const c = await api.saveCustomer({
          id: "",
          name: ncName.trim(),
          phone: ncPhone.trim(),
          area: "Ludhiana",
          notes: "",
          createdAt: new Date().toISOString(),
        });
        customerId = c.id;
      }
      await api.saveBooking({ ...b, customerId, fare: shownFare });
      onSaved(isNew ? `Booking saved · ${inr(shownFare)}` : `${b.id} updated`);
    } finally {
      setBusy(false);
    }
  };

  const advance = NEXT_STEP[b.status];

  return (
    <Modal open onClose={onClose} title={isNew ? "New booking" : `Manage ${b.id}`} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* customer */}
        <div className="sm:col-span-2">
          {!addCustomer ? (
            <Field label="Customer">
              <div className="flex gap-2">
                <select value={b.customerId} onChange={(e) => set("customerId", e.target.value)} className={inputCls}>
                  <option value="">Select customer…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setAddCustomer(true)}
                  className="shrink-0 rounded-xl border-2 border-dashed border-sky-300 px-3 text-sm font-bold text-sky-600 transition-colors hover:bg-sky-50"
                >
                  + New
                </button>
              </div>
            </Field>
          ) : (
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-sky-600">Quick-add customer</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input value={ncName} onChange={(e) => setNcName(e.target.value)} placeholder="Full name" className={inputCls} />
                <input value={ncPhone} onChange={(e) => setNcPhone(e.target.value)} placeholder="Phone" className={inputCls} />
                <button type="button" onClick={() => setAddCustomer(false)} className="rounded-xl px-3 text-sm font-bold text-ink-400 hover:text-ink-700">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* route */}
        <Field label="Popular route">
          <select
            value={customRoute ? "custom" : b.route}
            onChange={(e) => pickRoute(e.target.value)}
            className={inputCls}
          >
            {ROUTES.map((r) => (
              <option key={r.id} value={`Ludhiana → ${r.name}`}>Ludhiana → {r.name} ({r.km} km)</option>
            ))}
            <option value="custom">Custom route…</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Distance (km)">
            <input
              type="number"
              min={1}
              value={b.km}
              onChange={(e) => set("km", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Trip type">
            <select value={b.tripType} onChange={(e) => set("tripType", e.target.value as TripType)} className={inputCls}>
              <option value="one-way">One-way</option>
              <option value="round">Round trip</option>
            </select>
          </Field>
        </div>

        {customRoute && (
          <div className="sm:col-span-2">
            <Field label="Custom route">
              <input value={b.route} onChange={(e) => set("route", e.target.value)} placeholder="e.g. Ludhiana → Haridwar" className={inputCls} />
            </Field>
          </div>
        )}

        <Field label="Vehicle">
          <select value={b.vehicleId} onChange={(e) => set("vehicleId", e.target.value)} className={inputCls}>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name} · {v.seats} · ₹{v.perKm}/km</option>
            ))}
          </select>
        </Field>
        <Field label="Pickup date & time">
          <input
            type="datetime-local"
            value={toLocalInput(b.pickupAt)}
            onChange={(e) => e.target.value && set("pickupAt", new Date(e.target.value).toISOString())}
            className={inputCls}
          />
        </Field>

        <Field label="Driver">
          <select
            value={b.driverId ?? ""}
            onChange={(e) => set("driverId", e.target.value || null)}
            className={inputCls}
          >
            <option value="">Unassigned</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name} {d.onDuty ? "· on duty" : "· off duty"}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Source">
            <select value={b.source} onChange={(e) => set("source", e.target.value as Source)} className={inputCls}>
              <option value="phone">Phone</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="walk-in">Walk-in</option>
              <option value="website">Website</option>
            </select>
          </Field>
          <Field label="Payment">
            <select value={b.pay} onChange={(e) => set("pay", e.target.value as PayStatus)} className={inputCls}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
        </div>

        {/* fare */}
        <div className="sm:col-span-2 flex flex-wrap items-end justify-between gap-3 rounded-xl bg-ink-900 p-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-300">Fare ({vehicle?.name})</p>
            <p className="font-display text-3xl font-extrabold text-white">{inr(shownFare)}</p>
            <p className="text-[11px] font-semibold text-ink-300">
              {b.km} km × ₹{vehicle?.perKm}/km + ₹{vehicle?.base} base {b.tripType === "round" ? "× 1.75 round trip" : ""}
            </p>
          </div>
          <div className="w-40">
            <Field label="Override ₹">
              <input
                type="number"
                value={shownFare}
                onChange={(e) => {
                  setFareTouched(true);
                  set("fare", Number(e.target.value));
                }}
                className={`${inputCls} !border-ink-600 !bg-ink-800 !text-white`}
              />
            </Field>
          </div>
        </div>

        <div className="sm:col-span-2">
          <Field label="Notes">
            <textarea
              value={b.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Pickup landmark, luggage, flight number…"
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      {/* status workflow */}
      {!isNew && (
        <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Pill status={b.status} />
            {advance && (
              <button
                onClick={async () => {
                  const nb = { ...b, fare: shownFare, status: advance.to };
                  if (advance.to === "enroute" && !b.driverId) {
                    notify("Assign a driver first", "err");
                    return;
                  }
                  setBusy(true);
                  await api.saveBooking(nb);
                  setBusy(false);
                  onSaved(`${b.id} → ${STATUS_META[advance.to].label}`);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-3.5 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              >
                <IconArrow size={15} /> {advance.label}
              </button>
            )}
            {["pending", "confirmed", "enroute"].includes(b.status) && (
              <button
                onClick={async () => {
                  setBusy(true);
                  await api.saveBooking({ ...b, fare: shownFare, status: "cancelled" });
                  setBusy(false);
                  onSaved(`${b.id} cancelled`);
                }}
                className="rounded-xl border border-rose-200 px-3.5 py-2 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50"
              >
                Cancel trip
              </button>
            )}
            {b.status === "cancelled" && (
              <button
                onClick={async () => {
                  setBusy(true);
                  await api.saveBooking({ ...b, fare: shownFare, status: "confirmed" });
                  setBusy(false);
                  onSaved(`${b.id} reopened`);
                }}
                className="rounded-xl border border-ink-200 px-3.5 py-2 text-sm font-bold text-ink-600 hover:bg-ink-100"
              >
                Reopen as confirmed
              </button>
            )}
          </div>
        </div>
      )}

      {/* actions */}
      <div className="mt-5 flex items-center justify-between gap-3">
        {!isNew ? (
          <button
            onClick={async () => {
              if (!window.confirm(`Delete ${b.id}? This cannot be undone.`)) return;
              setBusy(true);
              await api.deleteBooking(b.id);
              setBusy(false);
              onDeleted();
            }}
            className="text-sm font-bold text-rose-500 hover:text-rose-600"
          >
            Delete booking
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2.5">
          <button onClick={onClose} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">
            Close
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-60"
          >
            {busy ? "Saving…" : isNew ? "Create booking" : "Save changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/*  CUSTOMERS                                                          */
/* ================================================================== */

export function CustomersPanel({ notify }: { notify: Notify }) {
  const { data: customers, reload } = useAsync(() => api.listCustomers());
  const { data: bookings } = useAsync(() => api.listBookings());
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [viewing, setViewing] = useState<Customer | null>(null);

  if (!customers || !bookings) return <PanelSkeleton label="Loading customer directory…" />;

  const rows = customers.filter((c) =>
    [c.name, c.phone, c.area, c.id].join(" ").toLowerCase().includes(q.trim().toLowerCase())
  );

  const historyOf = (id: string) => bookings.filter((b) => b.customerId === id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, area…" className={`${inputCls} w-full sm:w-72`} />
        <button
          onClick={() => {
            setEditing({ id: "", name: "", phone: "", area: "Ludhiana", notes: "", createdAt: new Date().toISOString() });
            setIsNew(true);
          }}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600"
        >
          <IconUsers size={16} /> Add customer
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((c) => {
          const hist = historyOf(c.id);
          const spent = hist.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.fare, 0);
          return (
            <button
              key={c.id}
              onClick={() => setViewing(c)}
              className="group rounded-2xl border border-ink-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sky-100 font-display text-base font-extrabold text-sky-700">
                  {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-base font-extrabold text-ink-900">{c.name}</span>
                  <span className="block text-xs font-semibold text-ink-400">{c.area}</span>
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-ink-50 pt-3 text-xs font-bold">
                <span className="text-ink-500">{hist.length} trips</span>
                <span className="text-ink-900">{inr(spent)} lifetime</span>
              </div>
            </button>
          );
        })}
      </div>
      {rows.length === 0 && <Empty title="No customers found" sub="Add your first customer to start building the directory." />}

      {editing && (
        <CustomerForm
          customer={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            notify(msg);
            setEditing(null);
            reload();
          }}
        />
      )}

      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={viewing.name} wide>
          <div className="flex flex-wrap items-center gap-2">
            <a href={`tel:${viewing.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-2 text-sm font-bold text-white hover:bg-sky-600">
              <IconPhone size={15} /> Call
            </a>
            <a
              href={waCustomer(viewing.phone, `Hi ${viewing.name.split(" ")[0]} ji! This is Apna Punjab Cab Service.`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-wa-500 px-3.5 py-2 text-sm font-bold text-white hover:bg-wa-600"
            >
              <IconWhatsApp size={15} /> WhatsApp
            </a>
            <button
              onClick={() => {
                setEditing({ ...viewing });
                setIsNew(false);
                setViewing(null);
              }}
              className="ml-auto rounded-xl border border-ink-200 px-3.5 py-2 text-sm font-bold text-ink-600 hover:bg-ink-50"
            >
              Edit details
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-ink-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Phone</p>
              <p className="font-bold text-ink-800">{viewing.phone}</p>
            </div>
            <div className="rounded-xl bg-ink-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Area</p>
              <p className="font-bold text-ink-800">{viewing.area || "—"}</p>
            </div>
          </div>
          {viewing.notes && (
            <p className="mt-3 rounded-xl border border-sun-400/30 bg-sun-50 p-3 text-sm font-semibold text-ink-700">
              📌 {viewing.notes}
            </p>
          )}
          <h4 className="mt-5 font-display text-base font-extrabold text-ink-900">Trip history</h4>
          <div className="mt-2 divide-y divide-ink-50 rounded-xl border border-ink-100">
            {historyOf(viewing.id).length === 0 && (
              <p className="p-4 text-sm font-semibold text-ink-400">No trips yet.</p>
            )}
            {historyOf(viewing.id).map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                <span className="font-mono text-xs font-bold text-ink-400">{b.id}</span>
                <span className="min-w-0 flex-1 truncate font-bold text-ink-700">{b.route}</span>
                <span className="text-xs font-semibold text-ink-400">{fmtDate(b.pickupAt)}</span>
                <span className="font-extrabold text-ink-900">{inr(b.fare)}</span>
                <Pill status={b.status} />
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function CustomerForm({
  customer,
  isNew,
  onClose,
  onSaved,
}: {
  customer: Customer;
  isNew: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [c, setC] = useState({ ...customer });
  const [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title={isNew ? "Add customer" : `Edit ${customer.id}`}>
      <div className="space-y-4">
        <Field label="Full name">
          <input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} className={inputCls} placeholder="e.g. Gurpreet Kaur" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} className={inputCls} placeholder="98xxx xxxxx" />
          </Field>
          <Field label="Area">
            <input value={c.area} onChange={(e) => setC({ ...c, area: e.target.value })} className={inputCls} placeholder="Ludhiana" />
          </Field>
        </div>
        <Field label="Notes">
          <textarea value={c.notes} onChange={(e) => setC({ ...c, notes: e.target.value })} rows={3} className={inputCls} placeholder="Preferences, corporate account, regular routes…" />
        </Field>
        <div className="flex justify-end gap-2.5 pt-1">
          <button onClick={onClose} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">Cancel</button>
          <button
            disabled={busy || !c.name.trim() || !c.phone.trim()}
            onClick={async () => {
              setBusy(true);
              await api.saveCustomer(c);
              setBusy(false);
              onSaved(isNew ? "Customer added to directory" : "Customer updated");
            }}
            className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save customer"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/*  DRIVERS                                                            */
/* ================================================================== */

export function DriversPanel({ notify }: { notify: Notify }) {
  const { data: drivers, reload } = useAsync(() => api.listDrivers());
  const { data: vehicles } = useAsync(() => api.listVehicles());
  const [editing, setEditing] = useState<Driver | null>(null);

  if (!drivers || !vehicles) return <PanelSkeleton label="Loading driver roster…" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-500">
          <strong className="text-ink-900">{drivers.filter((d) => d.onDuty).length}</strong> of {drivers.length} drivers on duty right now
        </p>
        <button
          onClick={() =>
            setEditing({ id: "", name: "", phone: "", vehicleId: vehicles[0].id, onDuty: true, rating: 4.5, trips: 0 })
          }
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600"
        >
          <IconUsers size={16} /> Add driver
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {drivers.map((d) => {
          const v = vehicles.find((x) => x.id === d.vehicleId);
          return (
            <div key={d.id} className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-full bg-ink-900 font-display text-base font-extrabold text-white">
                    {d.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <p className="font-display text-base font-extrabold text-ink-900">{d.name}</p>
                    <p className="text-xs font-semibold text-ink-400">{d.phone}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${d.onDuty ? "bg-emerald-100 text-emerald-700" : "bg-ink-100 text-ink-400"}`}>
                  <span className={`size-1.5 rounded-full ${d.onDuty ? "blink-dot bg-emerald-500" : "bg-ink-300"}`} />
                  {d.onDuty ? "On duty" : "Off duty"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-ink-50 py-2">
                  <p className="font-display text-sm font-extrabold text-ink-900">{d.rating}★</p>
                  <p className="text-[10px] font-bold uppercase text-ink-400">Rating</p>
                </div>
                <div className="rounded-xl bg-ink-50 py-2">
                  <p className="font-display text-sm font-extrabold text-ink-900">{d.trips.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] font-bold uppercase text-ink-400">Trips</p>
                </div>
                <div className="rounded-xl bg-sky-50 py-2">
                  <p className="font-display text-sm font-extrabold text-sky-700">{v?.name.split(" ").pop()}</p>
                  <p className="text-[10px] font-bold uppercase text-ink-400">Cab</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-ink-50 pt-3">
                <Toggle
                  on={d.onDuty}
                  onChange={async (on) => {
                    await api.saveDriver({ ...d, onDuty: on });
                    reload();
                    notify(`${d.name} is now ${on ? "on duty" : "off duty"}`);
                  }}
                />
                <button onClick={() => setEditing({ ...d })} className="text-sm font-bold text-sky-600 hover:text-sky-700">
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal open onClose={() => setEditing(null)} title={editing.id ? `Edit ${editing.name}` : "Add driver"}>
          <DriverForm
            driver={editing}
            vehicles={vehicles}
            onClose={() => setEditing(null)}
            onSaved={(msg) => {
              notify(msg);
              setEditing(null);
              reload();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function DriverForm({
  driver,
  vehicles,
  onClose,
  onSaved,
}: {
  driver: Driver;
  vehicles: Vehicle[];
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [d, setD] = useState({ ...driver });
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      <Field label="Full name">
        <input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className={inputCls} placeholder="e.g. Balwinder Singh" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
          <input value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Vehicle">
          <select value={d.vehicleId} onChange={(e) => setD({ ...d, vehicleId: e.target.value })} className={inputCls}>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rating (0–5)">
          <input type="number" min={0} max={5} step={0.1} value={d.rating} onChange={(e) => setD({ ...d, rating: Number(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="Total trips">
          <input type="number" min={0} value={d.trips} onChange={(e) => setD({ ...d, trips: Number(e.target.value) })} className={inputCls} />
        </Field>
      </div>
      <Toggle on={d.onDuty} onChange={(v) => setD({ ...d, onDuty: v })} label="Currently on duty" />
      <div className="flex justify-end gap-2.5 pt-1">
        <button onClick={onClose} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">Cancel</button>
        <button
          disabled={busy || !d.name.trim()}
          onClick={async () => {
            setBusy(true);
            await api.saveDriver(d);
            setBusy(false);
            onSaved(d.id ? "Driver updated" : "Driver added to roster");
          }}
          className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save driver"}
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  FLEET                                                              */
/* ================================================================== */

const TONES = [
  { id: "sky", cls: "from-sky-100 to-sky-200" },
  { id: "ink", cls: "from-ink-100 to-ink-200" },
  { id: "sun", cls: "from-sun-50 to-ink-100" },
  { id: "mint", cls: "from-emerald-100 to-sky-100" },
  { id: "rose", cls: "from-rose-100 to-sun-50" },
  { id: "graphite", cls: "from-ink-200 to-ink-300" },
];

const blankVehicle = (): Vehicle => ({
  id: "",
  name: "",
  tag: "Sedan",
  seats: "4+1",
  bags: "2 bags",
  perKm: 12,
  base: 300,
  cityFrom: 199,
  available: true,
  description: "",
  transmission: "Manual",
  fuel: "Petrol",
  features: ["AC"],
  img: "",
  tone: TONES[0].cls,
  ribbon: "",
});

export function FleetPanel({ notify }: { notify: Notify }) {
  const { data: vehicles, reload } = useAsync(() => api.listVehicles());
  const [editing, setEditing] = useState<Vehicle | null>(null);

  if (!vehicles) return <PanelSkeleton label="Loading fleet…" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-500">
          Add cars, change rates or take a vehicle off road — the public website's fleet cards
          & fare estimator update <strong className="text-ink-800">instantly</strong>.
        </p>
        <button
          onClick={() => setEditing(blankVehicle())}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600"
        >
          <span className="grid size-5 place-items-center rounded-md bg-white/20 font-display text-sm leading-none">+</span>
          Add vehicle
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((v) => (
          <div key={v.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${v.available ? "border-ink-100" : "border-rose-200 opacity-80"}`}>
            <div className={`relative h-32 bg-gradient-to-br ${v.tone || TONES[0].cls}`}>
              <SmartImg src={v.img} alt={v.name} label={v.name} className="absolute inset-0 h-full w-full object-cover" />
              <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${v.available ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                {v.available ? "Live on site" : "Off road"}
              </span>
              {v.ribbon && (
                <span className="absolute right-3 top-3 rounded-full bg-ink-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sun-400">
                  {v.ribbon}
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="truncate font-display text-lg font-extrabold text-ink-900">{v.name}</h3>
                <span className="shrink-0 text-xs font-bold text-ink-400">{v.seats} · {v.bags}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-600">{v.tag}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-sky-50 py-2">
                  <p className="font-display text-base font-extrabold text-sky-700">₹{v.perKm}</p>
                  <p className="text-[10px] font-bold uppercase text-ink-400">per km</p>
                </div>
                <div className="rounded-xl bg-ink-50 py-2">
                  <p className="font-display text-base font-extrabold text-ink-900">₹{v.base}</p>
                  <p className="text-[10px] font-bold uppercase text-ink-400">base</p>
                </div>
                <div className="rounded-xl bg-ink-50 py-2">
                  <p className="font-display text-base font-extrabold text-ink-900">₹{v.cityFrom}</p>
                  <p className="text-[10px] font-bold uppercase text-ink-400">city from</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink-50 pt-3">
                <Toggle
                  on={v.available}
                  onChange={async (on) => {
                    await api.saveVehicle({ ...v, available: on });
                    reload();
                    notify(`${v.name} is now ${on ? "live on the website" : "hidden from the website"}`);
                  }}
                />
                <button
                  onClick={() => setEditing({ ...v })}
                  className="rounded-xl border border-ink-200 px-3.5 py-2 text-sm font-bold text-ink-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                >
                  Edit details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <VehicleForm
          vehicle={editing}
          isNew={!editing.id}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            notify(msg);
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

/* -------------------------- vehicle form -------------------------- */

function VehicleForm({
  vehicle,
  isNew,
  onClose,
  onSaved,
}: {
  vehicle: Vehicle;
  isNew: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [v, setV] = useState<Vehicle>({ ...vehicle });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Vehicle>(k: K, val: Vehicle[K]) => setV((p) => ({ ...p, [k]: val }));
  const valid = v.name.trim().length > 0 && v.perKm >= 1;

  return (
    <Modal open onClose={onClose} title={isNew ? "Add vehicle to fleet" : `Edit ${vehicle.name}`} wide>
      <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
        {/* live preview */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Card preview</p>
          <div className={`relative h-24 overflow-hidden rounded-xl bg-gradient-to-br ${v.tone || TONES[0].cls}`}>
            <SmartImg src={v.img} alt={v.name || "New vehicle"} label={v.name || "New car"} className="absolute inset-0 h-full w-full object-cover" />
            {!v.available && (
              <span className="absolute inset-0 grid place-items-center bg-ink-950/45 text-[10px] font-bold uppercase tracking-widest text-white">
                Off road
              </span>
            )}
          </div>
          <p className="mt-2 font-display text-sm font-extrabold text-ink-900">{v.name || "Vehicle name"}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600">{v.tag || "Category"}</p>
          <p className="mt-1 text-xs font-semibold text-ink-400">
            {v.seats} seats · {v.bags} · ₹{v.perKm || 0}/km
          </p>
        </div>

        {/* fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle name *">
              <input value={v.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="e.g. Honda City" />
            </Field>
            <Field label="Category / tag">
              <input value={v.tag} onChange={(e) => set("tag", e.target.value)} className={inputCls} placeholder="e.g. Executive Sedan" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Seats">
              <input value={v.seats} onChange={(e) => set("seats", e.target.value)} className={inputCls} placeholder="4+1" />
            </Field>
            <Field label="Luggage">
              <input value={v.bags} onChange={(e) => set("bags", e.target.value)} className={inputCls} placeholder="2 bags" />
            </Field>
            <Field label="Ribbon label">
              <input value={v.ribbon} onChange={(e) => set("ribbon", e.target.value)} className={inputCls} placeholder="e.g. New launch" />
            </Field>
          </div>

          <div className="rounded-xl bg-ink-900 p-3.5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-sky-300">Pricing — drives the site's fare estimator</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="₹ per km *">
                <input type="number" min={1} value={v.perKm} onChange={(e) => set("perKm", Number(e.target.value))} className={`${inputCls} !border-ink-600 !bg-ink-800 !text-white`} />
              </Field>
              <Field label="Base fare ₹">
                <input type="number" min={0} value={v.base} onChange={(e) => set("base", Number(e.target.value))} className={`${inputCls} !border-ink-600 !bg-ink-800 !text-white`} />
              </Field>
              <Field label="City from ₹">
                <input type="number" min={0} value={v.cityFrom} onChange={(e) => set("cityFrom", Number(e.target.value))} className={`${inputCls} !border-ink-600 !bg-ink-800 !text-white`} />
              </Field>
            </div>
          </div>

          <Field label="Photo URL (optional — branded placeholder is used if empty)">
            <input value={v.img} onChange={(e) => set("img", e.target.value)} className={inputCls} placeholder="https://…/photo.png" />
          </Field>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Card colour</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => set("tone", t.cls)}
                  aria-label={`Colour ${t.id}`}
                  className={`h-9 w-14 rounded-lg bg-gradient-to-br transition-all hover:scale-105 ${t.cls} ${
                    v.tone === t.cls ? "ring-2 ring-sky-500 ring-offset-2" : "ring-1 ring-ink-100"
                  }`}
                />
              ))}
            </div>
          </div>

          <Toggle on={v.available} onChange={(on) => set("available", on)} label="Available — visible on the public website" />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-ink-400">
          {isNew ? "The car appears on the website the moment you save." : "Changes go live on the website instantly."}
        </p>
        <div className="flex gap-2.5">
          <button onClick={onClose} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">
            Cancel
          </button>
          <button
            disabled={busy || !valid}
            onClick={async () => {
              setBusy(true);
              const saved = await api.saveVehicle({ ...v, name: v.name.trim() });
              setBusy(false);
              onSaved(isNew ? `${saved.name} added to fleet — live on website` : `${saved.name} updated — website synced`);
            }}
            className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-50"
          >
            {busy ? "Saving…" : isNew ? "Add to fleet" : "Save vehicle"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* --------------------------- skeleton ----------------------------- */

export function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-24">
      <div className="flex items-center gap-3 text-sm font-bold text-ink-400">
        <span className="size-2 animate-ping rounded-full bg-sky-500" />
        {label}
      </div>
    </div>
  );
}


