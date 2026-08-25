/* ------------------------------------------------------------------ */
/*  Apna Punjab Cab Service — live business data + static content      */
/*  BIZ / telHref / waHref / fleet all resolve from the unified        */
/*  backend, so admin changes appear across the site instantly.        */
/* ------------------------------------------------------------------ */

import { backend, useRealtime, HERO_IMG, type Vehicle } from "./lib/backend";
import { contentNow } from "./lib/settings";

export { HERO_IMG };

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
  since: 2019,
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
  get address() {
    return contentNow().address;
  },
  get email() {
    return contentNow().email;
  },
  mapsUrl:
    "https://www.google.co.in/maps/place/APNA+PUNJAB+CAB+SERVICE/@30.9606633,75.831669,17z/",
  mapsEmbed:
    "https://www.google.com/maps?q=APNA+PUNJAB+CAB+SERVICE,+Ludhiana,+Punjab&z=15&output=embed",
  rating: 4.6,
  reviews: 162,
};

export const telHref = () => "tel:" + BIZ.phoneRaw;
export const waHref = (text: string) =>
  "https://wa.me/" + BIZ.phoneRaw.replace("+", "") + "?text=" + encodeURIComponent(text);
export const WA_DEFAULT = () => waHref(contentNow().waGreeting);

/* ------------------------------- fleet ---------------------------- */

export type Car = Vehicle;

/** Live fleet — mirrors the admin-managed vehicles table. */
export function liveCars(opts?: { includeUnavailable?: boolean }): Car[] {
  return backend.listVehicles(opts);
}

/** Bumps whenever the database changes (any tab) so views re-render. */
export function useDbVersion(): number {
  return useRealtime();
}

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

/** Indicative one-way fare: distance x per-km rate + base. */
export function oneWayFare(km: number, perKm: number, base = 300): number {
  return round50(km * perKm + base);
}

/** Round trip = one-way x 1.75 (driver halt included). */
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
    desc: "Ludhiana to Delhi, Chandigarh, Amritsar, Manali & Shimla. One call covers the whole journey, door to door.",
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
  { icon: "clock", title: "24×7 Availability", desc: "3 AM airport run or midnight emergency — a driver is always on standby in Ludhiana." },
  { icon: "shield", title: "Verified Drivers", desc: "Background-checked, trained professionals who know Punjab's roads like their own." },
  { icon: "sparkle", title: "Clean, Sanitized Cars", desc: "Every car is washed, vacuumed and sanitized before your trip. Fresheners included." },
  { icon: "rupee", title: "Transparent Pricing", desc: "Fare agreed before the wheel turns. No hidden charges, no meter drama — ever." },
  { icon: "bolt", title: "Instant Booking", desc: "Book online in a minute, or one call / WhatsApp message and your cab is confirmed." },
  { icon: "award", title: "5+ Years of Trust", desc: "Serving Punjab since 2019 — 50,000+ trips and a 4.6-star Google rating to show for it." },
];

/* ----------------------------- testimonials ----------------------- */

export const TESTIMONIALS = [
  {
    name: "Harpreet Singh",
    meta: "Ludhiana to Delhi IGI · 4:30 AM pickup",
    stars: 5,
    text: "Booked at midnight for a 4:30 AM airport run — the driver was outside my gate at 4:15. Clean Dzire, careful driving on NH-44, and the fare was exactly what was quoted on the call. This is why I don't use apps anymore.",
    tone: "bg-sky-500",
  },
  {
    name: "Simran Kaur",
    meta: "Family trip · Ludhiana to Manali, round trip",
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

export const STATS: { value: number; suffix: string; label: string; decimals?: number }[] = [
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

export const FAQS: { q: string; a: string }[] = [
  { q: "How do I book a cab?", a: "Three easy ways: book online through our booking page (you'll get an instant reference number), call us on " + "99142 91112" + ", or send a WhatsApp message. Online bookings are confirmed on priority and our team calls back within minutes." },
  { q: "Are the fares fixed? Any hidden charges?", a: "Yes — the fare is locked before pickup and never changes after. The price you see in the fare estimator includes the vehicle, driver and fuel. Tolls and parking are billed at actuals and shown separately on your bill. Nothing else, ever." },
  { q: "Do you cover late-night and early-morning flights?", a: "Absolutely. We run 24×7 — a large share of our trips are 3–5 AM airport pickups. Your driver is assigned the previous evening and arrives 15 minutes early." },
  { q: "Can the driver wait during a round trip?", a: "Yes. Round-trip bookings include driver halt time at your stop — a full day halt for Manali/Shimla trips, and shorter halts for Chandigarh/Amritsar runs. Extra night halts can be added at a small fixed charge quoted upfront." },
  { q: "What happens if I need to cancel?", a: "Cancellation is free up to 1 hour before pickup. Within 1 hour, a small convenience fee of ₹200 applies. Just call or WhatsApp and we'll process it instantly — no forms." },
  { q: "Are your drivers verified?", a: "Every driver is background-checked, holds a valid commercial licence with 5+ years of experience, and is retrained every quarter on safety, route planning and customer service." },
  { q: "Do you offer corporate accounts and wedding packages?", a: "Yes. Corporate clients get monthly billing, priority cars and a dedicated contact. For weddings we handle decorated cars, baraat logistics and guest shuttles — tell us the date and we'll plan the fleet." },
  { q: "How is the fare calculated?", a: "Fare = distance × per-km rate + a small base charge. Round trips are billed at 1.75× the one-way fare and include driver halt time. You can check indicative fares for every route on our Routes & Fares page." },
];
