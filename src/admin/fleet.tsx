/* ================================================================== */
/*  Fleet management pages: /admin/fleet · /admin/fleet/add ·          */
/*  /admin/fleet/:id/edit — full vehicle records with an               */
/*  upload → crop → publish image workflow.                            */
/* ================================================================== */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { backend, useRealtime, type Vehicle, type VehicleImage } from "../lib/backend";
import { Field, Toggle, Toast, inputCls, inr } from "./ui";
import ImageCropper, { ASPECTS } from "./ImageCropper";
import { SmartImg } from "../motion";
import { IconArrow, IconCheck, IconStar, IconX } from "../icons";

const TONES = [
  { id: "sky", cls: "from-sky-100 to-sky-200" },
  { id: "ink", cls: "from-ink-100 to-ink-200" },
  { id: "sun", cls: "from-sun-50 to-ink-100" },
  { id: "mint", cls: "from-emerald-100 to-sky-100" },
  { id: "rose", cls: "from-rose-100 to-sun-50" },
  { id: "graphite", cls: "from-ink-200 to-ink-300" },
];

const TRANSMISSIONS = ["Manual", "Automatic", "Manual / AT"];
const FUELS = ["Petrol", "Diesel", "Petrol / CNG", "CNG", "Hybrid", "Electric"];

type Notify = (msg: string, tone?: "ok" | "err") => void;

/* ------------------------------ list ------------------------------ */

export function FleetListPage({ notify }: { notify: Notify }) {
  useRealtime();
  const vehicles = backend.listVehicles({ includeUnavailable: true });
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">Fleet</h2>
          <p className="text-sm font-semibold text-ink-400">
            {vehicles.filter((v) => v.available).length} live on the website · {vehicles.length} total
          </p>
        </div>
        <Link
          to="/admin/fleet/add"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600"
        >
          + Add vehicle
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((v) => (
          <div
            key={v.id}
            className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
              v.available ? "border-ink-100" : "border-rose-200"
            } ${v.available ? "" : "opacity-80"}`}
          >
            <button onClick={() => navigate(`/admin/fleet/${v.id}/edit`)} className="block w-full text-left">
              <div className={`relative h-36 bg-gradient-to-br ${v.tone}`}>
                <SmartImg src={v.img} alt={v.name} label={v.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    v.available ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                  }`}
                >
                  {v.available ? "Available" : "Unavailable"}
                </span>
                {v.ribbon && (
                  <span className="absolute right-3 top-3 rounded-full bg-ink-950/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    {v.ribbon}
                  </span>
                )}
              </div>
            </button>
            <div className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-lg font-extrabold text-ink-900">{v.name}</h3>
                <span className="whitespace-nowrap text-xs font-bold text-ink-400">{v.tag}</span>
              </div>
              <p className="text-xs font-semibold text-ink-400">{v.seats} seats · {v.bags} · {v.transmission} · {v.fuel}</p>
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
              <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-ink-50 pt-3">
                <Toggle
                  on={v.available}
                  onChange={(on) => {
                    backend.saveVehicle({ ...v, available: on });
                    notify(on ? `${v.name} is live on the website` : `${v.name} hidden from booking`, on ? "ok" : "err");
                  }}
                  label={v.available ? "Live on site" : "Off site"}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!window.confirm(`Archive ${v.name}? It will be removed from the public website.`)) return;
                      backend.deleteVehicle(v.id);
                      notify(`${v.name} archived`, "err");
                    }}
                    className="rounded-lg px-2 py-1 text-xs font-bold text-rose-500 hover:bg-rose-50"
                  >
                    Archive
                  </button>
                  <Link to={`/admin/fleet/${v.id}/edit`} className="rounded-lg bg-ink-50 px-2.5 py-1 text-xs font-bold text-ink-700 hover:bg-sky-50 hover:text-sky-700">
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- form page -------------------------- */

const blank = (): Vehicle => ({
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

export function VehicleFormPage({ notify }: { notify: Notify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "add";
  const existing = useMemo(() => (isNew ? null : backend.getVehicle(id)), [id, isNew]);

  const [v, setV] = useState<Vehicle>(() => (existing ? { ...existing, features: [...existing.features] } : blank()));
  const [images, setImages] = useState<VehicleImage[]>(() => (existing ? backend.imagesOf(existing.id) : []));
  const [cropping, setCropping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isNew && !existing) navigate("/admin/fleet", { replace: true });
  }, [isNew, existing, navigate]);

  if (!isNew && !existing) return null;

  const set = <K extends keyof Vehicle>(k: K, val: Vehicle[K]) => setV((p) => ({ ...p, [k]: val }));

  const addImage = (dataUrl: string) => {
    setCropping(false);
    setImages((prev) => [
      ...prev,
      {
        id: "",
        vehicleId: v.id,
        url: dataUrl,
        alt: v.name || "Vehicle photo",
        isPrimary: prev.length === 0,
        sortOrder: prev.length,
      },
    ]);
  };

  const setPrimary = (idx: number) =>
    setImages((prev) => prev.map((im, i) => ({ ...im, isPrimary: i === idx })));

  const move = (idx: number, dir: -1 | 1) =>
    setImages((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((im, i) => ({ ...im, sortOrder: i }));
    });

  const removeImage = (idx: number) =>
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length && !next.some((im) => im.isPrimary)) next[0] = { ...next[0], isPrimary: true };
      return next;
    });

  const save = () => {
    setErr("");
    if (!v.name.trim()) return setErr("Vehicle name is required.");
    if (!v.tag.trim()) return setErr("Category (tag) is required.");
    if (v.perKm <= 0) return setErr("Per-km rate must be greater than zero.");
    if (images.length === 0 && !v.img) return setErr("Upload at least one image so the fleet card isn't empty.");
    setBusy(true);
    setTimeout(() => {
      const primary = images.find((im) => im.isPrimary) ?? images[0];
      const saved = backend.saveVehicle(
        { ...v, name: v.name.trim(), img: primary ? primary.url : v.img },
        images.length ? images : undefined
      );
      setBusy(false);
      notify(isNew ? `${saved.name} added to the fleet — live on the website` : `${saved.name} updated`);
      navigate("/admin/fleet");
    }, 350);
  };

  const farePreview = (km: number) => Math.round((km * v.perKm + v.base) / 50) * 50;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/fleet" className="text-xs font-bold uppercase tracking-wider text-sky-600 hover:text-sky-700">
            ← Back to fleet
          </Link>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
            {isNew ? "Add vehicle" : `Edit ${existing?.name}`}
          </h2>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => navigate("/admin/fleet")} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-60"
          >
            {busy ? "Saving…" : isNew ? "Add to fleet" : "Save vehicle"}
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{err}</div>
      )}

      <div className="grid gap-5 xl:grid-cols-5">
        {/* left column — identity, media, specs */}
        <div className="space-y-5 xl:col-span-3">
          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <h3 className="font-display text-base font-extrabold text-ink-900">Identity</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Vehicle name">
                <input value={v.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="e.g. Honda City" />
              </Field>
              <Field label="Category">
                <input value={v.tag} onChange={(e) => set("tag", e.target.value)} className={inputCls} placeholder="e.g. Executive Sedan" />
              </Field>
              <Field label="Seats">
                <input value={v.seats} onChange={(e) => set("seats", e.target.value)} className={inputCls} placeholder="4+1" />
              </Field>
              <Field label="Luggage">
                <input value={v.bags} onChange={(e) => set("bags", e.target.value)} className={inputCls} placeholder="2 bags" />
              </Field>
              <Field label="Transmission">
                <select value={v.transmission} onChange={(e) => set("transmission", e.target.value)} className={inputCls}>
                  {TRANSMISSIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Fuel type">
                <select value={v.fuel} onChange={(e) => set("fuel", e.target.value)} className={inputCls}>
                  {FUELS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Ribbon label" hint="Small badge on the fleet card — leave blank for none">
                <input value={v.ribbon} onChange={(e) => set("ribbon", e.target.value)} className={inputCls} placeholder="e.g. New addition" />
              </Field>
              <Field label="Card backdrop">
                <div className="flex flex-wrap gap-2 pt-1">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set("tone", t.cls)}
                      aria-label={`Backdrop ${t.id}`}
                      className={`h-9 w-12 rounded-lg bg-gradient-to-br ${t.cls} transition-all ${v.tone === t.cls ? "ring-2 ring-ink-900 ring-offset-2" : "hover:scale-105"}`}
                    />
                  ))}
                </div>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Description" hint="Shown on the vehicle detail page">
                <textarea value={v.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputCls} placeholder="What makes this car a great pick…" />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Features" hint="Comma separated — shown as chips on the detail page">
                <input
                  value={v.features.join(", ")}
                  onChange={(e) => set("features", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  className={inputCls}
                  placeholder="AC, USB charging, Cruise control"
                />
              </Field>
            </div>
          </section>

          {/* media manager */}
          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-extrabold text-ink-900">Photos</h3>
                <p className="text-xs font-semibold text-ink-400">Upload → crop → publish. Star marks the primary photo.</p>
              </div>
              <button
                onClick={() => setCropping(true)}
                className="rounded-xl bg-ink-900 px-3.5 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              >
                + Upload image
              </button>
            </div>
            {images.length === 0 ? (
              <button
                onClick={() => setCropping(true)}
                className="mt-4 grid w-full place-items-center rounded-xl border-2 border-dashed border-ink-200 px-4 py-10 text-sm font-bold text-ink-400 transition-colors hover:border-sky-400 hover:text-sky-600"
              >
                No photos yet — upload the first one
              </button>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((im, i) => (
                  <div key={im.id || i} className={`group relative overflow-hidden rounded-xl border-2 ${im.isPrimary ? "border-sky-500" : "border-ink-100"}`}>
                    <img src={im.url} alt={im.alt} className="aspect-[16/10] w-full object-cover" />
                    {im.isPrimary && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        <IconStar size={10} /> Primary
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-ink-950/85 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex gap-1">
                        {!im.isPrimary && (
                          <button onClick={() => setPrimary(i)} title="Make primary" className="rounded-md bg-white/90 p-1 text-ink-900 hover:bg-white">
                            <IconStar size={13} />
                          </button>
                        )}
                        <button onClick={() => move(i, -1)} title="Move left" className="rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-ink-900 hover:bg-white">←</button>
                        <button onClick={() => move(i, 1)} title="Move right" className="rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-ink-900 hover:bg-white">→</button>
                      </div>
                      <button onClick={() => removeImage(i)} title="Remove" className="rounded-md bg-rose-500 p-1 text-white hover:bg-rose-600">
                        <IconX size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setCropping(true)}
                  className="grid aspect-[16/10] place-items-center rounded-xl border-2 border-dashed border-ink-200 text-sm font-bold text-ink-400 transition-colors hover:border-sky-400 hover:text-sky-600"
                >
                  + Add photo
                </button>
              </div>
            )}
          </section>
        </div>

        {/* right column — pricing + live preview */}
        <div className="space-y-5 xl:col-span-2">
          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <h3 className="font-display text-base font-extrabold text-ink-900">Pricing</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Field label="₹ / km">
                <input type="number" min={1} value={v.perKm} onChange={(e) => set("perKm", Number(e.target.value))} className={inputCls} />
              </Field>
              <Field label="Base ₹">
                <input type="number" min={0} value={v.base} onChange={(e) => set("base", Number(e.target.value))} className={inputCls} />
              </Field>
              <Field label="City from ₹">
                <input type="number" min={0} value={v.cityFrom} onChange={(e) => set("cityFrom", Number(e.target.value))} className={inputCls} />
              </Field>
            </div>
            <div className="mt-4 rounded-xl bg-ink-50 p-3.5 text-xs font-semibold text-ink-500">
              <p className="mb-1.5 font-bold uppercase tracking-wider text-ink-400">Live fare preview</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span>Chandigarh (100 km)</span><span className="text-right font-bold text-ink-900">{inr(farePreview(100))}</span>
                <span>Delhi IGI (310 km)</span><span className="text-right font-bold text-ink-900">{inr(farePreview(310))}</span>
                <span>Manali (235 km)</span><span className="text-right font-bold text-ink-900">{inr(farePreview(235))}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Toggle on={v.available} onChange={(on) => set("available", on)} label="Available for bookings" />
            </div>
          </section>

          {/* live website card preview */}
          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <h3 className="font-display text-base font-extrabold text-ink-900">Website preview</h3>
            <p className="text-xs font-semibold text-ink-400">Exactly how it appears on the public fleet page.</p>
            <div className="mt-4 overflow-hidden rounded-xl border border-ink-100 shadow-sm">
              <div className={`relative h-36 bg-gradient-to-br ${v.tone}`}>
                {(() => {
                  const primary = images.find((im) => im.isPrimary) ?? images[0];
                  return primary ? (
                    <img src={primary.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs font-bold text-ink-400">No photo yet</div>
                  );
                })()}
                <span className="absolute left-3 top-3 rounded-full bg-ink-950/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  {v.ribbon || v.tag}
                </span>
              </div>
              <div className="p-4">
                <h4 className="font-display text-lg font-extrabold text-ink-900">{v.name || "Vehicle name"}</h4>
                <p className="text-xs font-semibold text-ink-400">{v.seats} · {v.bags} · {v.transmission} · {v.fuel}</p>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="font-display text-2xl font-extrabold text-ink-900">₹{v.perKm}<span className="text-sm text-ink-400">/km</span></p>
                    <p className="text-[11px] font-semibold text-ink-400">City ride from ₹{v.cityFrom}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-bold text-white">
                    Book now <IconArrow size={13} />
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {cropping && <ImageCropper aspect={ASPECTS.card} onConfirm={addImage} onClose={() => setCropping(false)} title="Crop vehicle photo" />}
    </div>
  );
}
