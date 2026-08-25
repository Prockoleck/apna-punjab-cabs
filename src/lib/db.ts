/* ================================================================== */
/*  Apna Punjab Cab Service — client-side database + API layer         */
/*                                                                     */
/*  A versioned, seeded database persisted in localStorage, exposed    */
/*  through an async API (latency-simulated) exactly the way a REST    */
/*  backend would be. Swapping this module for a real server later     */
/*  only means re-implementing these functions over HTTP.              */
/* ================================================================== */

export type TripType = "one-way" | "round";
export type BookingStatus =
  | "new"
  | "confirmed"
  | "assigned"
  | "enroute"
  | "completed"
  | "cancelled";
export type PayStatus = "paid" | "pending";
export type Source = "phone" | "whatsapp" | "walk-in" | "website";

export interface Vehicle {
  id: string;
  name: string;
  tag: string;
  seats: string;
  bags: string;
  perKm: number;
  base: number;
  cityFrom: number;
  available: boolean;
  img: string;
  tone: string;
  ribbon: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  area: string;
  notes: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleId: string;
  onDuty: boolean;
  rating: number;
  trips: number;
}

export interface Booking {
  id: string;
  customerId: string;
  driverId: string | null;
  vehicleId: string;
  route: string;
  km: number;
  tripType: TripType;
  date: string; // ISO
  status: BookingStatus;
  fare: number;
  pay: PayStatus;
  source: Source;
  notes: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface ThemeSettings {
  accent: string;
  font: "bricolage" | "sora" | "space";
  radius: number;
}

export interface ContentSettings {
  tagline: string;
  phoneDisplay: string;
  phoneRaw: string;
  instagramHandle: string;
  instagram: string;
  address: string;
  waGreeting: string;
}

export interface Settings {
  theme: ThemeSettings;
  content: ContentSettings;
  security: { salt: string; hash: string | null; changedAt: string | null };
  seededAt: string;
  version: number;
}

export interface DB {
  settings: Settings;
  vehicles: Vehicle[];
  customers: Customer[];
  drivers: Driver[];
  bookings: Booking[];
  activity: Activity[];
  seq: { booking: number; customer: number; driver: number; activity: number };
}

const KEY = "apc_db_v1";
const SESSION_KEY = "apc_admin_session";
export const DEFAULT_PASSWORD = "12345678";

/* ------------------------------ utils ----------------------------- */

const delay = (ms = 160) => new Promise((r) => setTimeout(r, ms));
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number, h = 10, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return iso(d);
};
const round50 = (n: number) => Math.round(n / 50) * 50;
export const calcFare = (km: number, perKm: number, base: number, trip: TripType) => {
  const one = round50(km * perKm + base);
  return trip === "round" ? round50(one * 1.75) : one;
};
const uid = () => Math.random().toString(36).slice(2, 10);

/* --------------------------- seed content ------------------------- */

const VEHICLES: Vehicle[] = [
  {
    id: "dzire",
    name: "Swift Dzire",
    tag: "Budget Sedan",
    seats: "4+1",
    bags: "2 bags",
    perKm: 11,
    base: 300,
    cityFrom: 199,
    available: true,
    img: "https://image.qwenlm.ai/generated-images/d85515ce-7521-445d-b6eb-2e52d8e60219/_result.png",
    tone: "from-sky-100 to-sky-200",
    ribbon: "Most booked",
  },
  {
    id: "ertiga",
    name: "Maruti Ertiga",
    tag: "Family MPV",
    seats: "6+1",
    bags: "3 bags",
    perKm: 14,
    base: 300,
    cityFrom: 249,
    available: true,
    img: "https://image.qwenlm.ai/generated-images/0819bc14-d5ce-4f7d-a521-68e1bb635485/_result.png",
    tone: "from-ink-100 to-ink-200",
    ribbon: "Family favourite",
  },
  {
    id: "crysta",
    name: "Innova Crysta",
    tag: "Premium SUV",
    seats: "7+1",
    bags: "4 bags",
    perKm: 17,
    base: 350,
    cityFrom: 299,
    available: true,
    img: "https://image.qwenlm.ai/generated-images/8d98eede-a687-42b4-b06d-7c8a9e5b689a/_result.png",
    tone: "from-sun-50 to-ink-100",
    ribbon: "Premium pick",
  },
];

function seed(): DB {
  const customers: Customer[] = [
    { id: "CU-101", name: "Harpreet Singh", phone: "98155 43210", area: "Model Town, Ludhiana", notes: "Frequent Delhi IGI airport traveller. Prefers early pickups.", createdAt: daysAgo(160) },
    { id: "CU-102", name: "Simran Kaur", phone: "98722 10456", area: "Sarabha Nagar, Ludhiana", notes: "Family trips — always books Ertiga or Crysta.", createdAt: daysAgo(140) },
    { id: "CU-103", name: "Rohit Verma", phone: "98140 87732", area: "Ferozepur Road, Ludhiana", notes: "Corporate account — Vardhman Textiles. Monthly billing.", createdAt: daysAgo(120) },
    { id: "CU-104", name: "Gurleen Dhillon", phone: "95012 33890", area: "Dugri, Ludhiana", notes: "", createdAt: daysAgo(90) },
    { id: "CU-105", name: "Amit Malhotra", phone: "98889 12043", area: "Rajguru Nagar, Ludhiana", notes: "Prefers Dzire, price sensitive.", createdAt: daysAgo(75) },
    { id: "CU-106", name: "Navjot Sidhu", phone: "98075 66121", area: "Gill Road, Ludhiana", notes: "Wedding season — baraat bookings.", createdAt: daysAgo(50) },
    { id: "CU-107", name: "Pooja Sharma", phone: "97811 40985", area: "Mullanpur, Ludhiana", notes: "Chandigarh airport regular.", createdAt: daysAgo(30) },
    { id: "CU-108", name: "Jaspreet Brar", phone: "96465 77210", area: "Samrala, Ludhiana", notes: "Outstation Manali/Shimla trips with college group.", createdAt: daysAgo(12) },
  ];

  const drivers: Driver[] = [
    { id: "DR-01", name: "Gurpreet Singh", phone: "98150 11223", vehicleId: "dzire", onDuty: true, rating: 4.8, trips: 4120 },
    { id: "DR-02", name: "Manjit Kumar", phone: "98728 44556", vehicleId: "dzire", onDuty: true, rating: 4.7, trips: 3610 },
    { id: "DR-03", name: "Sukhwinder Singh", phone: "98144 90871", vehicleId: "ertiga", onDuty: true, rating: 4.9, trips: 2980 },
    { id: "DR-04", name: "Rakesh Thakur", phone: "98073 25684", vehicleId: "crysta", onDuty: false, rating: 4.8, trips: 3350 },
    { id: "DR-05", name: "Harvinder Pal", phone: "95018 77432", vehicleId: "ertiga", onDuty: true, rating: 4.6, trips: 1840 },
  ];

  const B = (
    n: number,
    customerId: string,
    driverId: string | null,
    vehicleId: string,
    route: string,
    km: number,
    tripType: TripType,
    date: string,
    status: BookingStatus,
    fare: number,
    pay: PayStatus,
    source: Source,
    notes = ""
  ): Booking => ({
    id: `BK-${1024 + n}`,
    customerId,
    driverId,
    vehicleId,
    route,
    km,
    tripType,
    date,
    status,
    fare,
    pay,
    source,
    notes,
    createdAt: date,
  });

  const bookings: Booking[] = [
    B(17, "CU-101", "DR-02", "dzire", "Ludhiana → Delhi IGI Airport", 310, "one-way", daysAgo(0, 4, 30), "enroute", 3750, "pending", "phone", "4:30 AM pickup, flight 6E-214 at 8:05 AM."),
    B(16, "CU-104", null, "ertiga", "Ludhiana → Chandigarh", 100, "round", daysAgo(0, 9, 0), "new", 2500, "pending", "whatsapp", "Pickup 11 AM, return by 7 PM."),
    B(15, "CU-107", "DR-03", "ertiga", "Ludhiana → Chandigarh Airport", 110, "one-way", daysAgo(0, 12, 30), "assigned", 1900, "paid", "website", "2 bags, meet at departures gate."),
    B(14, "CU-102", "DR-04", "crysta", "Ludhiana → Manali", 235, "round", daysAgo(1, 6, 0), "completed", 11800, "paid", "phone", "3-day halt in Manali included."),
    B(13, "CU-105", "DR-01", "dzire", "Ludhiana → Amritsar", 140, "round", daysAgo(2, 8, 30), "completed", 3650, "paid", "phone"),
    B(12, "CU-103", "DR-02", "dzire", "Ludhiana → Delhi IGI Airport", 310, "one-way", daysAgo(3, 3, 45), "completed", 3750, "paid", "phone", "Corporate account."),
    B(11, "CU-108", "DR-05", "ertiga", "Ludhiana → Shimla", 180, "round", daysAgo(4, 7, 0), "completed", 5400, "paid", "whatsapp"),
    B(10, "CU-106", "DR-04", "crysta", "Ludhiana → Amritsar (wedding)", 140, "round", daysAgo(5, 10, 0), "completed", 6200, "paid", "phone", "Decorated car for baraat."),
    B(9, "CU-101", "DR-01", "dzire", "Ludhiana → Chandigarh", 100, "one-way", daysAgo(6, 14, 0), "completed", 1450, "paid", "whatsapp"),
    B(8, "CU-107", "DR-03", "ertiga", "Ludhiana → Chandigarh Airport", 110, "one-way", daysAgo(7, 16, 15), "completed", 1900, "paid", "website"),
    B(7, "CU-103", "DR-02", "dzire", "Ludhiana → Delhi (Okhla)", 320, "round", daysAgo(8, 6, 30), "completed", 12300, "paid", "phone", "Corporate account — 2 day halt."),
    B(6, "CU-105", "DR-01", "dzire", "Ludhiana → Jalandhar", 57, "round", daysAgo(9, 11, 0), "completed", 1650, "paid", "walk-in"),
    B(5, "CU-102", "DR-05", "ertiga", "Ludhiana → Manali", 235, "round", daysAgo(10, 5, 30), "completed", 11800, "paid", "phone"),
    B(4, "CU-108", "DR-03", "ertiga", "Ludhiana → Chandigarh", 100, "one-way", daysAgo(11, 13, 0), "completed", 1750, "paid", "whatsapp"),
    B(3, "CU-104", "DR-02", "dzire", "Ludhiana → Delhi IGI Airport", 310, "one-way", daysAgo(12, 2, 30), "completed", 3750, "paid", "phone"),
    B(2, "CU-106", "DR-04", "crysta", "Ludhiana → Shimla", 180, "round", daysAgo(13, 6, 45), "completed", 9100, "pending", "phone", "Balance ₹2,000 to collect."),
    B(1, "CU-105", null, "dzire", "Ludhiana → Chandigarh", 100, "one-way", daysAgo(13, 18, 0), "cancelled", 1450, "pending", "whatsapp", "Customer postponed."),
  ];

  const activity: Activity[] = [
    { id: "AC-4", at: daysAgo(0, 8, 12), actor: "Admin", action: "Booking created", detail: "BK-1040 · Ludhiana → Chandigarh Airport (website enquiry)" },
    { id: "AC-3", at: daysAgo(0, 7, 40), actor: "Admin", action: "Driver assigned", detail: "Manjit Kumar → BK-1041 (Delhi IGI, 4:30 AM)" },
    { id: "AC-2", at: daysAgo(1, 19, 5), actor: "Admin", action: "Trip completed", detail: "BK-1038 · Crysta Manali round trip · ₹11,800 collected" },
    { id: "AC-1", at: daysAgo(2, 10, 30), actor: "System", action: "Database seeded", detail: "CRM initialised with fleet, drivers, customers & bookings" },
  ];

  return {
    settings: {
      theme: { accent: "#0EA5E9", font: "bricolage", radius: 16 },
      content: {
        tagline: "Punjab's Trusted Cab Service Since 2019",
        phoneDisplay: "99142 91112",
        phoneRaw: "+919914291112",
        instagramHandle: "@apnapunjabcabs",
        instagram: "https://www.instagram.com/apnapunjabcabs",
        address: "GT Road, Near Bus Stand, Ludhiana, Punjab 141001",
        waGreeting: "Hi Apna Punjab Cab Service! I'd like to book a cab. 🚖",
      },
      security: { salt: uid() + uid(), hash: null, changedAt: null },
      seededAt: iso(new Date()),
      version: 1,
    },
    vehicles: VEHICLES.map((v) => ({ ...v })),
    customers,
    drivers,
    bookings,
    activity,
    seq: { booking: 1041, customer: 108, driver: 5, activity: 4 },
  };
}

/* ---------------------------- db access --------------------------- */

let cache: DB | null = null;

export function getDb(): DB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as DB;
      return cache;
    }
  } catch {
    /* corrupted — reseed */
  }
  cache = seed();
  persist();
  return cache;
}

function persist() {
  if (!cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage full — keep in memory */
  }
  window.dispatchEvent(new CustomEvent("apc:db"));
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = null;
      window.dispatchEvent(new CustomEvent("apc:db"));
    }
  });
}

function log(action: string, detail: string, actor = "Admin") {
  const db = getDb();
  db.seq.activity += 1;
  db.activity.unshift({ id: `AC-${100 + db.seq.activity}`, at: iso(new Date()), actor, action, detail });
  if (db.activity.length > 120) db.activity.length = 120;
}

/* ------------------------------ auth ------------------------------ */

async function hashPass(pass: string, salt: string): Promise<string> {
  const text = `${salt}::apc::${pass}`;
  try {
    if (crypto?.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    /* insecure context — fall through to fallback hash */
  }
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    h1 = Math.imul(h1 ^ text.charCodeAt(i), 16777619) >>> 0;
    h2 = (Math.imul(h2, 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return h1.toString(16) + h2.toString(16);
}

export const api = {
  /* ---- session ---- */
  async login(pass: string): Promise<{ ok: boolean; error?: string }> {
    await delay(420);
    const db = getDb();
    if (!db.settings.security.hash) {
      db.settings.security.hash = await hashPass(DEFAULT_PASSWORD, db.settings.security.salt);
      persist();
    }
    const h = await hashPass(pass, db.settings.security.salt);
    if (h !== db.settings.security.hash) return { ok: false, error: "Incorrect password. Try again." };
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ token: uid() + uid(), exp: Date.now() + 12 * 3600 * 1000 })
    );
    log("Signed in", "Admin session started (12-hour session)");
    persist();
    return { ok: true };
  },

  checkSession(): boolean {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw) as { token: string; exp: number };
      if (Date.now() > s.exp) {
        localStorage.removeItem(SESSION_KEY);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  async logout() {
    await delay(120);
    localStorage.removeItem(SESSION_KEY);
    log("Signed out", "Admin session ended");
    persist();
  },

  async changePassword(
    current: string,
    next: string
  ): Promise<{ ok: boolean; error?: string }> {
    await delay(380);
    const db = getDb();
    const cur = await hashPass(current, db.settings.security.salt);
    if (db.settings.security.hash && cur !== db.settings.security.hash)
      return { ok: false, error: "Current password is incorrect." };
    if (next.length < 8) return { ok: false, error: "New password must be at least 8 characters." };
    if (next === current) return { ok: false, error: "New password must be different." };
    db.settings.security.salt = uid() + uid();
    db.settings.security.hash = await hashPass(next, db.settings.security.salt);
    db.settings.security.changedAt = iso(new Date());
    log("Security", "Admin password was changed");
    persist();
    return { ok: true };
  },

  async isDefaultPassword(): Promise<boolean> {
    const db = getDb();
    if (!db.settings.security.hash) return true;
    const h = await hashPass(DEFAULT_PASSWORD, db.settings.security.salt);
    return h === db.settings.security.hash;
  },

  /* ---- bookings ---- */
  async listBookings(): Promise<Booking[]> {
    await delay();
    return [...getDb().bookings];
  },

  async saveBooking(b: Booking): Promise<Booking> {
    await delay();
    const db = getDb();
    const i = db.bookings.findIndex((x) => x.id === b.id);
    if (i >= 0) {
      db.bookings[i] = b;
      log("Booking updated", `${b.id} · ${b.route} · status: ${b.status}`);
    } else {
      db.seq.booking += 1;
      const nb = { ...b, id: `BK-${db.seq.booking + 1000}` };
      db.bookings.unshift(nb);
      log("Booking created", `${nb.id} · ${nb.route} · ₹${nb.fare.toLocaleString("en-IN")}`);
    }
    persist();
    return b;
  },

  async deleteBooking(id: string) {
    await delay();
    const db = getDb();
    db.bookings = db.bookings.filter((b) => b.id !== id);
    log("Booking deleted", id);
    persist();
  },

  /* ---- customers ---- */
  async listCustomers(): Promise<Customer[]> {
    await delay();
    return [...getDb().customers];
  },

  async saveCustomer(c: Customer): Promise<Customer> {
    await delay();
    const db = getDb();
    const i = db.customers.findIndex((x) => x.id === c.id);
    if (i >= 0) {
      db.customers[i] = c;
      log("Customer updated", `${c.name} (${c.id})`);
    } else {
      db.seq.customer += 1;
      c = { ...c, id: `CU-${db.seq.customer + 100}` };
      db.customers.unshift(c);
      log("Customer added", `${c.name} · ${c.phone}`);
    }
    persist();
    return c;
  },

  /* ---- drivers ---- */
  async listDrivers(): Promise<Driver[]> {
    await delay();
    return [...getDb().drivers];
  },

  async saveDriver(d: Driver): Promise<Driver> {
    await delay();
    const db = getDb();
    const i = db.drivers.findIndex((x) => x.id === d.id);
    if (i >= 0) {
      db.drivers[i] = d;
      log("Driver updated", `${d.name} · ${d.onDuty ? "on duty" : "off duty"}`);
    } else {
      db.seq.driver += 1;
      d = { ...d, id: `DR-${String(db.seq.driver).padStart(2, "0")}` };
      db.drivers.push(d);
      log("Driver added", d.name);
    }
    persist();
    return d;
  },

  /* ---- vehicles ---- */
  async listVehicles(): Promise<Vehicle[]> {
    await delay();
    return getDb().vehicles.map((v) => ({ ...v }));
  },

  async saveVehicle(v: Vehicle): Promise<Vehicle> {
    await delay();
    const db = getDb();
    const i = v.id ? db.vehicles.findIndex((x) => x.id === v.id) : -1;
    if (i >= 0) {
      db.vehicles[i] = v;
      log("Fleet updated", `${v.name} · ₹${v.perKm}/km · ${v.available ? "available" : "unavailable"}`);
    } else {
      const nv: Vehicle = { ...v, id: `VH-${Date.now().toString(36).slice(-6)}` };
      db.vehicles.push(nv);
      log("Fleet added", `${nv.name} (${nv.tag}) · ₹${nv.perKm}/km · base ₹${nv.base}`);
      persist();
      return nv;
    }
    persist();
    return v;
  },

  getVehicleSync(id: string): Vehicle {
    return getDb().vehicles.find((v) => v.id === id) ?? getDb().vehicles[0];
  },

  /* ---- settings ---- */
  getSettingsSync(): Settings {
    return getDb().settings;
  },

  async saveSettings(patch: Partial<{ theme: ThemeSettings; content: ContentSettings }>) {
    await delay(240);
    const db = getDb();
    if (patch.theme) db.settings.theme = { ...db.settings.theme, ...patch.theme };
    if (patch.content) db.settings.content = { ...db.settings.content, ...patch.content };
    db.settings.version += 1;
    const parts: string[] = [];
    if (patch.theme) parts.push("theme");
    if (patch.content) parts.push("site content");
    log("Settings saved", `Updated ${parts.join(" & ") || "settings"}`);
    persist();
  },

  async resetSettings() {
    await delay();
    const db = getDb();
    const fresh = seed().settings;
    db.settings.theme = fresh.theme;
    db.settings.content = fresh.content;
    log("Settings reset", "Theme & site content restored to defaults");
    persist();
  },

  /* ---- activity & stats ---- */
  async listActivity(): Promise<Activity[]> {
    await delay(100);
    return [...getDb().activity];
  },

  async stats() {
    await delay(200);
    const db = getDb();
    const now = new Date();
    const today = now.toDateString();
    const month = now.getMonth();
    const year = now.getFullYear();

    const active = db.bookings.filter(
      (b) => !["completed", "cancelled"].includes(b.status)
    );
    const monthRevenue = db.bookings
      .filter((b) => {
        const d = new Date(b.date);
        return b.status !== "cancelled" && d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((s, b) => s + b.fare, 0);

    const days: { label: string; total: number; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const list = db.bookings.filter(
        (b) => new Date(b.date).toDateString() === key && b.status !== "cancelled"
      );
      days.push({
        label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        total: list.reduce((s, b) => s + b.fare, 0),
        count: list.length,
      });
    }

    return {
      todayCount: db.bookings.filter((b) => new Date(b.date).toDateString() === today).length,
      pending: active.length,
      monthRevenue,
      onDuty: db.drivers.filter((d) => d.onDuty).length,
      driversTotal: db.drivers.length,
      customers: db.customers.length,
      days,
      recent: db.bookings.slice(0, 6),
      pipeline: (["new", "confirmed", "assigned", "enroute", "completed", "cancelled"] as BookingStatus[]).map(
        (s) => ({ status: s, count: db.bookings.filter((b) => b.status === s).length })
      ),
    };
  },

  async resetDemo() {
    await delay(400);
    cache = seed();
    persist();
    log("Demo reset", "Database restored to fresh seed data", "System");
  },
};

export type Stats = Awaited<ReturnType<typeof api.stats>>;
