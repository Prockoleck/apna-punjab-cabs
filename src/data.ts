/* ------------------------------------------------------------------ */
/*  Apna Punjab Cab Service — business data, routes & fare logic       */
/* ------------------------------------------------------------------ */

export const BIZ = {
  name: "Apna Punjab Cab Service",
  short: "Apna Punjab",
  tagline: "Punjab's Trusted Cab Service Since 2019",
  since: 2019,
  phoneDisplay: "99142 91112",
  phoneRaw: "+919914291112",
  instagram: "https://www.instagram.com/apnapunjabcabs",
  instagramHandle: "@apnapunjabcabs",
  mapsUrl:
    "https://www.google.co.in/maps/place/APNA+PUNJAB+CAB+SERVICE/@30.9606633,75.831669,17z/",
  mapsEmbed:
    "https://www.google.com/maps?q=APNA+PUNJAB+CAB+SERVICE,+Ludhiana,+Punjab&z=15&output=embed",
  address: "GT Road, Near Bus Stand, Ludhiana, Punjab 141001",
  rating: 4.6,
  reviews: 162,
};

export const telHref = `tel:${BIZ.phoneRaw}`;
export const waHref = (text: string) =>
  `https://wa.me/${BIZ.phoneRaw.replace("+", "")}?text=${encodeURIComponent(text)}`;
export const WA_DEFAULT = waHref(
  "Hi Apna Punjab Cab Service! I'd like to book a cab. 🚖"
);

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

export const CARS: Car[] = [
  {
    id: "dzire",
    name: "Swift Dzire",
    tag: "Budget Sedan",
    seats: "4+1",
    bags: "2 bags",
    perKm: 11,
    perKmLabel: "₹11/km",
    cityFrom: "City ride from ₹199",
    ribbon: "Most booked",
    img: "https://image.qwenlm.ai/generated-images/d85515ce-7521-445d-b6eb-2e52d8e60219/_result.png",
    tone: "from-sky-100 to-sky-200",
  },
  {
    id: "ertiga",
    name: "Maruti Ertiga",
    tag: "Family MPV",
    seats: "6+1",
    bags: "3 bags",
    perKm: 14,
    perKmLabel: "₹14/km",
    cityFrom: "City ride from ₹249",
    ribbon: "Family favourite",
    img: "https://image.qwenlm.ai/generated-images/0819bc14-d5ce-4f7d-a521-68e1bb635485/_result.png",
    tone: "from-ink-100 to-ink-200",
  },
  {
    id: "crysta",
    name: "Innova Crysta",
    tag: "Premium SUV",
    seats: "7+1",
    bags: "4 bags",
    perKm: 17,
    perKmLabel: "₹17/km",
    cityFrom: "City ride from ₹299",
    ribbon: "Premium pick",
    img: "https://image.qwenlm.ai/generated-images/8d98eede-a687-42b4-b06d-7c8a9e5b689a/_result.png",
    tone: "from-sun-50 to-ink-100",
  },
];

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
