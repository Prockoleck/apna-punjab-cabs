/* ------------------------------------------------------------------ */
/*  Apna Punjab Cab Service — business data, routes & fare logic       */
/*  BIZ / telHref / waHref / fleet pricing are LIVE — they resolve     */
/*  from the admin-managed database on every read.                     */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { getDb } from "./lib/db";
import { contentNow } from "./lib/settings";

const MAPS_URL =
  "https://www.google.co.in/maps/place/APNA+PUNJAB+CAB+SERVICE/@30.9606633,75.831669,17z/";
const MAPS_EMBED =
  "https://www.google.com/maps?q=APNA+PUNJAB+CAB+SERVICE,+Ludhiana,+Punjab&z=15&output=embed";

export const BIZ = {
  get name() {
    return "Apna Punjab Cab Service";
  },
  get short() {
    return "Apna Punjab";
  },
  get tagline() {
    return contentNow().tagline;
  },
  get since() {
    return 2019;
  },
  get phoneDisplay() {
    return contentNow().phoneDisplay;
  },
  get phoneRaw() {
    return contentNow().phoneRaw;
  },
  get instagram() {
    return contentNow().instagram;
  },
  get instagramHandle() {
    return contentNow().instagramHandle;
  },
  get mapsUrl() {
    return MAPS_URL;
  },
  get mapsEmbed() {
    return MAPS_EMBED;
  },
  get address() {
    return contentNow().address;
  },
  get rating() {
    return 4.6;
  },
  get reviews() {
    return 162;
  },
};

const makeTel = () => `tel:${contentNow().phoneRaw}`;
export const waHref = (text: string) =>
  `https://wa.me/${contentNow().phoneRaw.replace("+", "")}?text=${encodeURIComponent(text)}`;
const makeWaDefault = () => waHref(contentNow().waGreeting);

/* live bindings — refreshed whenever the admin saves changes */
export let telHref = makeTel();
export let WA_DEFAULT = makeWaDefault();
function refreshLiveBindings() {
  telHref = makeTel();
  WA_DEFAULT = makeWaDefault();
}
if (typeof window !== "undefined") {
  window.addEventListener("apc:db", refreshLiveBindings);
  window.addEventListener("storage", refreshLiveBindings);
}

/* ------------------------------- fleet ---------------------------- */

export type Car = {
  id: string;
  name: string;
  tag: string;
  seats: string;
  bags: string;
  perKm: number;
  perKmLabel: string;
  cityFrom: string;
  ribbon: string;
  img: string;
  tone: string; // fallback gradient class
};

/* The public fleet is LIVE: it mirrors the admin-managed vehicle
   table, so added cars, rate changes and availability updates appear
   on the website instantly. Unavailable cars are hidden from booking
   flows.                                                              */
export function liveCars(opts?: { includeUnavailable?: boolean }): Car[] {
  const vehicles = getDb().vehicles;
  return (opts?.includeUnavailable ? vehicles : vehicles.filter((v) => v.available)).map(
    (v) => ({
      id: v.id,
      name: v.name,
      tag: v.tag,
      seats: v.seats,
      bags: v.bags,
      ribbon: v.ribbon,
      img: v.img,
      tone: v.tone || "from-sky-100 to-sky-200",
      perKm: v.perKm,
      perKmLabel: `₹${v.perKm}/km`,
      cityFrom: `City ride from ₹${v.cityFrom}`,
    })
  );
}

/** Bumps whenever the database changes (any tab) so views re-render. */
export function useDbVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV((x) => x + 1);
    window.addEventListener("apc:db", bump);
    return () => window.removeEventListener("apc:db", bump);
  }, []);
  return v;
}



export const HERO_IMG =
  "https://image.qwenlm.ai/generated-images/ee4d5791-5d97-480f-b577-7c27fa643a5f/_result.png";

/* ------------------------------- routes --------------------------- */

export type Route = {
  id: string;
  name: string;
  via?: string;
  km: number;
  eta: string;
};

export const ROUTES: Route[] = [
  { id: "delhi", name: "Delhi · IGI Airport", via: "via NH-44", km: 310, eta: "5h 30m" },
  { id: "chandigarh", name: "Chandigarh", via: "via NH-5", km: 100, eta: "2h" },
  { id: "amritsar", name: "Amritsar", via: "via NH-3 / GT Road", km: 140, eta: "2h 45m" },
  { id: "shimla", name: "Shimla", via: "via Chandigarh", km: 180, eta: "4h 30m" },
  { id: "manali", name: "Manali", via: "via Bilaspur", km: 235, eta: "6h" },
];

const round50 = (n: number) => Math.round(n / 50) * 50;

/** Indicative one-way fare: distance × per-km rate + base. */
export function oneWayFare(km: number, perKm: number): number {
  return round50(km * perKm + 300);
}

/** Round trip = one-way × 1.75 (driver halt included). */
export function roundFare(one: number): number {
  return round50(one * 1.75);
}

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

/* ------------------------------ services -------------------------- */

export type Service = {
  icon: string;
  title: string;
  desc: string;
  chips?: string[];
};

export const SERVICES: Service[] = [
  {
    icon: "plane",
    title: "Airport Transfers",
    desc: "On-time pickups for flights out of Ludhiana, Chandigarh & Delhi IGI — with flight tracking, luggage help and meet-and-greet at arrivals.",
    chips: ["Chandigarh Airport · from ₹1,400", "Delhi IGI · from ₹3,700", "Late-night flights welcome"],
  },
  {
    icon: "city",
    title: "Local City Rides",
    desc: "Office, hospital, market or a function across Ludhiana — fair pricing, same trusted drivers every time.",
  },
  {
    icon: "route",
    title: "Outstation Rides",
    desc: "Ludhiana ↔ Delhi, Chandigarh, Amritsar, Manali & Shimla. One call covers the whole journey, door to door.",
    chips: ["Delhi", "Manali", "Shimla", "Amritsar"],
  },
  {
    icon: "loop",
    title: "One-Way & Round Trip",
    desc: "Pay only for the direction you travel — or lock a round trip with free driver halt time while you're there.",
  },
  {
    icon: "briefcase",
    title: "Corporate & Wedding Travel",
    desc: "Monthly billing and priority cars for corporate teams; decorated Crystas, baraat logistics and guest shuttles for weddings — planned end to end.",
  },
];

/* ------------------------------ trust badges ---------------------- */

export const BADGES = [
  {
    icon: "clock",
    title: "24×7 Availability",
    desc: "3 AM airport run or midnight emergency — a driver is always on standby in Ludhiana.",
  },
  {
    icon: "shield",
    title: "Verified Drivers",
    desc: "Background-checked, trained professionals who know Punjab's roads like their own.",
  },
  {
    icon: "sparkle",
    title: "Clean, Sanitized Cars",
    desc: "Every car is washed, vacuumed and sanitized before your trip. Fresheners included.",
  },
  {
    icon: "rupee",
    title: "Transparent Pricing",
    desc: "Fare agreed before the wheel turns. No hidden charges, no meter drama — ever.",
  },
  {
    icon: "bolt",
    title: "Instant Booking",
    desc: "One call or one WhatsApp message and your cab is confirmed in minutes.",
  },
  {
    icon: "award",
    title: "5+ Years of Trust",
    desc: "Serving Punjab since 2019 — 50,000+ trips and a 4.6★ Google rating to show for it.",
  },
];

/* ----------------------------- testimonials ----------------------- */

export const TESTIMONIALS = [
  {
    name: "Harpreet Singh",
    meta: "Ludhiana → Delhi IGI · 4:30 AM pickup",
    stars: 5,
    text: "Booked at midnight for a 4:30 AM airport run — the driver was outside my gate at 4:15. Clean Dzire, careful driving on NH-44, and the fare was exactly what was quoted on the call. This is why I don't use apps anymore.",
    tone: "bg-sky-500",
  },
  {
    name: "Simran Kaur",
    meta: "Family trip · Ludhiana → Manali → Ludhiana",
    stars: 5,
    text: "Took the Innova Crysta for a Manali round trip with in-laws and kids. Driver ji waited for us at every stop without any fuss, car was spotless all 3 days, and he even suggested good food stops. Round-trip fare was very fair.",
    tone: "bg-sun-500",
  },
  {
    name: "Rohit Verma",
    meta: "Corporate travel · monthly billing",
    stars: 4,
    text: "We use Apna Punjab for all our client pickups from Chandigarh airport. Always on time, drivers are presentable, and the monthly invoice makes accounts easy. One booking is now a single WhatsApp message.",
    tone: "bg-ink-700",
  },
];

/* -------------------------------- stats --------------------------- */

export const STATS: {
  value: number;
  suffix: string;
  label: string;
  decimals?: number;
}[] = [
  { value: 5, suffix: "+", label: "Years on the road" },
  { value: 50000, suffix: "+", label: "Trips completed" },
  { value: 2.4, suffix: "M+", decimals: 1, label: "Kilometres driven" },
  { value: 4.6, suffix: "★", decimals: 1, label: "Google rating · 162 reviews" },
];

export const MARQUEE_ITEMS = [
  "Delhi IGI Airport",
  "Chandigarh",
  "Amritsar",
  "Manali",
  "Shimla",
  "Chandigarh Airport",
  "Jalandhar",
  "Local Ludhiana",
];
