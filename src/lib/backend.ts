/* ================================================================== */
/*  Apna Punjab Cab Service — unified backend / database layer         */
/*                                                                     */
/*  ONE source of truth for the whole platform. The public website,    */
/*  the admin CRM, notifications and realtime sync all read/write      */
/*  through this single API — the same shape as the Supabase           */
/*  deployment (schema in /supabase/schema.sql).                       */
/*                                                                     */
/*  Local mode: browser-persisted relational store with                */
/*  BroadcastChannel realtime + Notification API push.                 */
/*  Supabase mode: enabled in Admin > Settings > Backend.              */
/* ================================================================== */

import { useEffect, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type TripType = "one-way" | "round";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "enroute"
  | "completed"
  | "cancelled"
  | "rejected";
export type PayStatus = "paid" | "pending";
export type Source = "phone" | "whatsapp" | "walk-in" | "website" | "admin";

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
  description: string;
  transmission: string;
  fuel: string;
  features: string[];
  img: string;
  tone: string;
  ribbon: string;
  archived?: boolean;
}

export interface VehicleImage {
  id: string;
  vehicleId: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  altPhone?: string;
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
  pickup: string;
  dropoff: string;
  km: number;
  tripType: TripType;
  pickupAt: string;
  returnAt: string | null;
  passengers: number;
  status: BookingStatus;
  fare: number;
  pay: PayStatus;
  source: Source;
  notes: string;
  createdAt: string;
}

export interface StatusEvent {
  id: string;
  bookingId: string;
  at: string;
  from: BookingStatus | "created";
  to: BookingStatus;
  by: string;
}

export interface HeroSection {
  id: string;
  active: boolean;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  cta2Text: string;
  cta2Link: string;
  promo: string;
  imageUrl: string;
  imagePos: string;
  updatedAt: string;
}

export interface WebsiteSettings {
  tagline: string;
  phoneDisplay: string;
  phoneRaw: string;
  instagramHandle: string;
  instagram: string;
  address: string;
  email: string;
  waGreeting: string;
}

export interface Device {
  id: string;
  token: string;
  label: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  at: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
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

export interface BackendConfig {
  mode: "local" | "supabase";
  url: string;
  anonKey: string;
}

export interface DB {
  settings: {
    theme: ThemeSettings;
    content: WebsiteSettings;
    security: { salt: string; hash: string | null; changedAt: string | null };
    backend: BackendConfig;
    seededAt: string;
    version: number;
  };
  vehicles: Vehicle[];
  vehicleImages: VehicleImage[];
  customers: Customer[];
  drivers: Driver[];
  bookings: Booking[];
  statusHistory: StatusEvent[];
  hero: HeroSection;
  devices: Device[];
  notices: Notice[];
  activity: Activity[];
  seq: {
    booking: number;
    customer: number;
    driver: number;
    activity: number;
    notice: number;
    image: number;
    event: number;
  };
}

export interface Stats {
  todayCount: number;
  pendingCount: number;
  confirmedCount: number;
  enrouteCount: number;
  completedCount: number;
  cancelledCount: number;
  rejectedCount: number;
  monthRevenue: number;
  vehiclesTotal: number;
  vehiclesAvailable: number;
  driversOnDuty: number;
  driversTotal: number;
  days: { label: string; total: number; count: number }[];
  pipeline: { status: BookingStatus; count: number }[];
  recent: Booking[];
  upcoming: Booking[];
}

export const DEFAULT_PASSWORD = "12345678";
const KEY = "apc_db_v2";
const SESSION_KEY = "apc_admin_session";
const RT_CHANNEL = "apc_realtime";

export const HERO_IMG =
  "https://image.qwenlm.ai/generated-images/ee4d5791-5d97-480f-b577-7c27fa643a5f/_result.png";

const delay = (ms = 140) => new Promise((r) => setTimeout(r, ms));
const iso = (d: Date) => d.toISOString();
const daysFrom = (n: number, h = 10, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(h, m, 0, 0);
  return iso(d);
};
const round50 = (n: number) => Math.round(n / 50) * 50;
export const calcFare = (km: number, perKm: number, base: number, trip: TripType) => {
  const one = round50(km * perKm + base);
  return trip === "round" ? round50(one * 1.75) : one;
};
const uid = () => Math.random().toString(36).slice(2, 10);

export function tripSpanHours(km: number, tripType: TripType, returnAt: string | null, pickupAt: string): number {
  if (tripType === "round" && returnAt) {
    const h = (new Date(returnAt).getTime() - new Date(pickupAt).getTime()) / 3600000;
    if (h > 0 && h < 24 * 14) return h;
    return 24;
  }
  if (tripType === "round") return 24;
  return Math.min(12, Math.max(2, Math.ceil(km / 45)));
}

const ARROW = String.fromCharCode(8594);

/* ======================== column mapping ======================== */

function sbVehicle(r: Record<string, unknown>): Vehicle {
  return {
    id: r.id as string,
    name: r.name as string,
    tag: r.tag as string,
    seats: r.seats as string,
    bags: r.bags as string,
    perKm: Number(r.per_km),
    base: Number(r.base_fare),
    cityFrom: Number(r.city_from),
    available: r.available as boolean,
    archived: r.archived as boolean,
    description: (r.description as string) || "",
    transmission: (r.transmission as string) || "Manual",
    fuel: (r.fuel as string) || "Petrol",
    features: (r.features as string[]) || [],
    img: "",
    tone: (r.tone as string) || "from-sky-100 to-sky-200",
    ribbon: (r.ribbon as string) || "",
  };
}

function appVehicle(v: Vehicle): Record<string, unknown> {
  return {
    id: v.id,
    name: v.name,
    tag: v.tag,
    seats: v.seats,
    bags: v.bags,
    per_km: v.perKm,
    base_fare: v.base,
    city_from: v.cityFrom,
    available: v.available,
    archived: v.archived ?? false,
    description: v.description,
    transmission: v.transmission,
    fuel: v.fuel,
    features: v.features,
    tone: v.tone,
    ribbon: v.ribbon,
  };
}

function sbVehicleImage(r: Record<string, unknown>): VehicleImage {
  return {
    id: r.id as string,
    vehicleId: r.vehicle_id as string,
    url: r.url as string,
    alt: (r.alt as string) || "",
    isPrimary: r.is_primary as boolean,
    sortOrder: r.sort_order as number,
  };
}

function appVehicleImage(im: VehicleImage): Record<string, unknown> {
  return {
    id: im.id || undefined,
    vehicle_id: im.vehicleId,
    url: im.url,
    alt: im.alt,
    is_primary: im.isPrimary,
    sort_order: im.sortOrder,
  };
}

function sbCustomer(r: Record<string, unknown>): Customer {
  return {
    id: r.id as string,
    name: r.name as string,
    phone: r.phone as string,
    email: (r.email as string) || undefined,
    altPhone: (r.alt_phone as string) || undefined,
    area: (r.area as string) || "",
    notes: (r.notes as string) || "",
    createdAt: r.created_at as string,
  };
}

function appCustomer(c: Customer): Record<string, unknown> {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email || null,
    alt_phone: c.altPhone || null,
    area: c.area,
    notes: c.notes,
  };
}

function sbDriver(r: Record<string, unknown>): Driver {
  return {
    id: r.id as string,
    name: r.name as string,
    phone: r.phone as string,
    vehicleId: (r.vehicle_id as string) || "",
    onDuty: r.on_duty as boolean,
    rating: Number(r.rating),
    trips: r.trips as number,
  };
}

function appDriver(d: Driver): Record<string, unknown> {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    vehicle_id: d.vehicleId || null,
    on_duty: d.onDuty,
    rating: d.rating,
    trips: d.trips,
  };
}

function sbBooking(r: Record<string, unknown>): Booking {
  return {
    id: r.id as string,
    customerId: r.customer_id as string,
    driverId: (r.driver_id as string) || null,
    vehicleId: r.vehicle_id as string,
    route: (r.route as string) || "",
    pickup: r.pickup as string,
    dropoff: r.dropoff as string,
    km: r.km as number,
    tripType: r.trip_type as TripType,
    pickupAt: r.pickup_at as string,
    returnAt: (r.return_at as string) || null,
    passengers: (r.passengers as number) || 2,
    status: r.status as BookingStatus,
    fare: Number(r.fare),
    pay: r.pay_status as PayStatus,
    source: (r.source as Source) || "website",
    notes: (r.notes as string) || "",
    createdAt: r.created_at as string,
  };
}

function appBooking(b: Booking): Record<string, unknown> {
  return {
    id: b.id,
    customer_id: b.customerId,
    driver_id: b.driverId || null,
    vehicle_id: b.vehicleId,
    pickup: b.pickup,
    dropoff: b.dropoff,
    km: b.km,
    trip_type: b.tripType,
    pickup_at: b.pickupAt,
    return_at: b.returnAt,
    passengers: b.passengers,
    status: b.status,
    fare: b.fare,
    pay_status: b.pay,
    source: b.source,
    notes: b.notes,
  };
}

function sbStatusEvent(r: Record<string, unknown>): StatusEvent {
  return {
    id: r.id as string,
    bookingId: r.booking_id as string,
    at: r.changed_at as string,
    from: (r.from_status as BookingStatus | "created") || "created",
    to: r.to_status as BookingStatus,
    by: (r.changed_by as string) || "Admin",
  };
}

function sbHero(r: Record<string, unknown>): HeroSection {
  return {
    id: r.id as string,
    active: r.active as boolean,
    badge: (r.badge as string) || "",
    title: r.title as string,
    subtitle: (r.subtitle as string) || "",
    ctaText: (r.cta_text as string) || "Call now",
    ctaLink: (r.cta_link as string) || "tel:+919914291112",
    cta2Text: (r.cta2_text as string) || "",
    cta2Link: (r.cta2_link as string) || "#/booking",
    promo: (r.promo as string) || "",
    imageUrl: (r.image_url as string) || "",
    imagePos: (r.image_pos as string) || "50% 38%",
    updatedAt: r.updated_at as string,
  };
}

function appHero(h: HeroSection): Record<string, unknown> {
  return {
    id: h.id,
    active: h.active,
    badge: h.badge,
    title: h.title,
    subtitle: h.subtitle,
    cta_text: h.ctaText,
    cta_link: h.ctaLink,
    cta2_text: h.cta2Text,
    cta2_link: h.cta2Link,
    promo: h.promo,
    image_url: h.imageUrl,
    image_pos: h.imagePos,
  };
}

function sbDevice(r: Record<string, unknown>): Device {
  return {
    id: r.id as string,
    token: r.fcm_token as string,
    label: (r.label as string) || "Admin device",
    createdAt: r.created_at as string,
  };
}

function appDevice(d: Device): Record<string, unknown> {
  return {
    fcm_token: d.token,
    label: d.label,
  };
}

/* ======================== seed ======================== */

function seed(): DB {
  const vehicles: Vehicle[] = [
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
      description:
        "Punjab's favourite budget sedan — quick in city traffic, frugal on the highway. The smart pick for solo travellers, couples and small families.",
      transmission: "Manual",
      fuel: "Petrol / CNG",
      features: ["AC", "Music system", "USB charging", "Boot space 316L", "First-aid kit"],
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
      description:
        "The go-to family MPV for outstation trips — three rows of proper seats, easy luggage room, and comfort that holds up on Manali's long climbs.",
      transmission: "Manual",
      fuel: "Petrol / CNG",
      features: ["AC + rear vents", "7 seats", "USB charging", "Roof rails", "Cruise control"],
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
      description:
        "Our premium flagship for corporate travel, weddings and long highway runs — captain seats, commanding ride quality and serious luggage space.",
      transmission: "Manual / AT",
      fuel: "Diesel",
      features: ["Climate control", "Captain seats", "Cruise control", "Rear AC vents", "LED projector lamps"],
      img: "https://image.qwenlm.ai/generated-images/8d98eede-a687-42b4-b06d-7c8a9e5b689a/_result.png",
      tone: "from-sun-50 to-ink-100",
      ribbon: "Premium pick",
    },
  ];

  const vehicleImages: VehicleImage[] = vehicles.map((v, i) => ({
    id: "IMG-" + (i + 1),
    vehicleId: v.id,
    url: v.img,
    alt: v.name + " side profile",
    isPrimary: true,
    sortOrder: 0,
  }));

  const customers: Customer[] = [
    { id: "CU-101", name: "Harpreet Singh", phone: "98155 43210", email: "harpreet.s@gmail.com", area: "Model Town, Ludhiana", notes: "Frequent Delhi IGI airport traveller. Prefers early pickups.", createdAt: daysFrom(-160) },
    { id: "CU-102", name: "Simran Kaur", phone: "98722 10456", email: "simrankaur22@outlook.com", area: "Sarabha Nagar, Ludhiana", notes: "Family trips — always books Ertiga or Crysta.", createdAt: daysFrom(-140) },
    { id: "CU-103", name: "Rohit Verma", phone: "98140 87732", email: "rohit@vardhman.example", area: "Ferozepur Road, Ludhiana", notes: "Corporate account — Vardhman Textiles. Monthly billing.", createdAt: daysFrom(-120) },
    { id: "CU-104", name: "Gurleen Dhillon", phone: "95012 33890", area: "Dugri, Ludhiana", notes: "", createdAt: daysFrom(-90) },
    { id: "CU-105", name: "Amit Malhotra", phone: "98889 12043", area: "Rajguru Nagar, Ludhiana", notes: "Prefers Dzire, price sensitive.", createdAt: daysFrom(-75) },
    { id: "CU-106", name: "Navjot Sidhu", phone: "98075 66121", area: "Gill Road, Ludhiana", notes: "Wedding season — baraat bookings.", createdAt: daysFrom(-50) },
    { id: "CU-107", name: "Pooja Sharma", phone: "97811 40985", email: "pooja.sharma@gmail.com", area: "Mullanpur, Ludhiana", notes: "Chandigarh airport regular.", createdAt: daysFrom(-30) },
    { id: "CU-108", name: "Jaspreet Brar", phone: "96465 77210", area: "Samrala, Ludhiana", notes: "Outstation Manali/Shimla trips with college group.", createdAt: daysFrom(-12) },
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
    pickup: string,
    dropoff: string,
    km: number,
    tripType: TripType,
    pickupAt: string,
    returnAt: string | null,
    status: BookingStatus,
    fare: number,
    pay: PayStatus,
    source: Source,
    notes = "",
    passengers = 2
  ): Booking => ({
    id: "BK-" + (1024 + n),
    customerId,
    driverId,
    vehicleId,
    route: pickup + " " + ARROW + " " + dropoff,
    pickup,
    dropoff,
    km,
    tripType,
    pickupAt,
    returnAt,
    passengers,
    status,
    fare,
    pay,
    source,
    notes,
    createdAt: daysFrom(-15 + n, 9),
  });

  const bookings: Booking[] = [
    B(18, "CU-104", null, "ertiga", "Ludhiana", "Chandigarh Airport", 110, "one-way", daysFrom(2, 9, 30), null, "pending", 1900, "pending", "website", "Online booking — 2 suitcases, flight 6E-412 at 1 PM.", 2),
    B(17, "CU-101", "DR-02", "dzire", "Model Town, Ludhiana", "Delhi IGI Airport", 310, "one-way", daysFrom(0, 4, 30), null, "enroute", 3750, "pending", "phone", "4:30 AM pickup, flight 6E-214 at 8:05 AM.", 1),
    B(16, "CU-104", null, "ertiga", "Ludhiana", "Chandigarh", 100, "round", daysFrom(1, 9, 0), daysFrom(1, 19, 0), "pending", 2500, "pending", "whatsapp", "Pickup 9 AM, return by 7 PM.", 3),
    B(15, "CU-107", "DR-03", "ertiga", "Mullanpur", "Chandigarh Airport", 110, "one-way", daysFrom(0, 12, 30), null, "confirmed", 1900, "paid", "website", "2 bags, meet at departures gate.", 2),
    B(14, "CU-102", "DR-04", "crysta", "Sarabha Nagar", "Manali", 235, "round", daysFrom(-1, 6, 0), daysFrom(2, 20, 0), "completed", 11800, "paid", "phone", "3-day halt in Manali included.", 5),
    B(13, "CU-105", "DR-01", "dzire", "Rajguru Nagar", "Amritsar", 140, "round", daysFrom(-2, 8, 30), daysFrom(-2, 21, 0), "completed", 3650, "paid", "phone", "", 2),
    B(12, "CU-103", "DR-02", "dzire", "Ferozepur Road", "Delhi IGI Airport", 310, "one-way", daysFrom(-3, 3, 45), null, "completed", 3750, "paid", "phone", "Corporate account.", 1),
    B(11, "CU-108", "DR-05", "ertiga", "Samrala", "Shimla", 180, "round", daysFrom(-4, 7, 0), daysFrom(-1, 19, 0), "completed", 5400, "paid", "whatsapp", "", 6),
    B(10, "CU-106", "DR-04", "crysta", "Gill Road", "Amritsar (wedding)", 140, "round", daysFrom(-5, 10, 0), daysFrom(-5, 23, 0), "completed", 6200, "paid", "phone", "Decorated car for baraat.", 4),
    B(9, "CU-101", "DR-01", "dzire", "Model Town", "Chandigarh", 100, "one-way", daysFrom(-6, 14, 0), null, "completed", 1450, "paid", "whatsapp", "", 2),
    B(8, "CU-107", "DR-03", "ertiga", "Mullanpur", "Chandigarh Airport", 110, "one-way", daysFrom(-7, 16, 15), null, "completed", 1900, "paid", "website", "", 1),
    B(7, "CU-103", "DR-02", "dzire", "Ferozepur Road", "Delhi (Okhla)", 320, "round", daysFrom(-8, 6, 30), daysFrom(-6, 20, 0), "completed", 12300, "paid", "phone", "Corporate account — 2 day halt.", 2),
    B(6, "CU-105", "DR-01", "dzire", "Rajguru Nagar", "Jalandhar", 57, "round", daysFrom(-9, 11, 0), daysFrom(-9, 19, 0), "completed", 1650, "paid", "walk-in", "", 3),
    B(5, "CU-102", "DR-05", "ertiga", "Sarabha Nagar", "Manali", 235, "round", daysFrom(-10, 5, 30), daysFrom(-7, 21, 0), "completed", 11800, "paid", "phone", "", 5),
    B(4, "CU-108", "DR-03", "ertiga", "Samrala", "Chandigarh", 100, "one-way", daysFrom(-11, 13, 0), null, "completed", 1750, "paid", "whatsapp", "", 4),
    B(3, "CU-104", "DR-02", "dzire", "Dugri", "Delhi IGI Airport", 310, "one-way", daysFrom(-12, 2, 30), null, "completed", 3750, "paid", "phone", "", 1),
    B(2, "CU-106", "DR-04", "crysta", "Gill Road", "Shimla", 180, "round", daysFrom(-13, 6, 45), daysFrom(-11, 20, 0), "cancelled", 9100, "pending", "phone", "Customer postponed — rebook next month.", 2),
    B(1, "CU-105", null, "dzire", "Rajguru Nagar", "Chandigarh", 100, "one-way", daysFrom(-13, 18, 0), null, "rejected", 1450, "pending", "website", "Vehicle already booked for the same slot.", 1),
  ];

  const statusHistory: StatusEvent[] = [
    { id: "EV-101", bookingId: "BK-1042", at: daysFrom(0, 8, 41), from: "created", to: "pending", by: "Website" },
    { id: "EV-102", bookingId: "BK-1041", at: daysFrom(-1, 21, 10), from: "created", to: "pending", by: "Admin" },
    { id: "EV-103", bookingId: "BK-1041", at: daysFrom(-1, 21, 14), from: "pending", to: "confirmed", by: "Admin" },
    { id: "EV-104", bookingId: "BK-1041", at: daysFrom(0, 4, 15), from: "confirmed", to: "enroute", by: "Admin" },
    { id: "EV-105", bookingId: "BK-1040", at: daysFrom(0, 7, 52), from: "created", to: "pending", by: "Website" },
    { id: "EV-106", bookingId: "BK-1040", at: daysFrom(0, 8, 5), from: "pending", to: "confirmed", by: "Admin" },
  ];

  const hero: HeroSection = {
    id: "HERO-1",
    active: true,
    badge: "Punjab's Trusted Cab Service Since 2019",
    title: "Ludhiana to anywhere, anytime.",
    subtitle:
      "Airport transfers, outstation trips and city rides — clean cars, verified drivers and fares agreed before the wheel turns. No hidden charges, ever.",
    ctaText: "Call 99142 91112",
    ctaLink: "tel:+919914291112",
    cta2Text: "Book online",
    cta2Link: "#/booking",
    promo: "Chandigarh airport transfers from ₹1,400 · Drivers online 24×7",
    imageUrl: HERO_IMG,
    imagePos: "50% 38%",
    updatedAt: iso(new Date()),
  };

  const notices: Notice[] = [
    {
      id: "NT-102",
      at: daysFrom(0, 8, 41),
      title: "New booking received",
      body: "Gurleen Dhillon booked Maruti Ertiga · Ludhiana to Chandigarh Airport",
      link: "#/admin/bookings/BK-1042",
      read: false,
    },
    {
      id: "NT-101",
      at: daysFrom(0, 7, 52),
      title: "New booking received",
      body: "Pooja Sharma booked Maruti Ertiga · Mullanpur to Chandigarh Airport",
      link: "#/admin/bookings/BK-1040",
      read: true,
    },
  ];

  const activity: Activity[] = [
    { id: "AC-105", at: daysFrom(0, 8, 41), actor: "Website", action: "Booking created", detail: "BK-1042 · Ludhiana to Chandigarh Airport (online booking)" },
    { id: "AC-104", at: daysFrom(0, 8, 12), actor: "Admin", action: "Booking created", detail: "BK-1040 · Mullanpur to Chandigarh Airport (website enquiry)" },
    { id: "AC-103", at: daysFrom(0, 7, 40), actor: "Admin", action: "Driver assigned", detail: "Manjit Kumar assigned to BK-1041 (Delhi IGI, 4:30 AM)" },
    { id: "AC-102", at: daysFrom(-1, 19, 5), actor: "Admin", action: "Trip completed", detail: "BK-1038 · Crysta Manali round trip · ₹11,800 collected" },
    { id: "AC-101", at: daysFrom(-2, 10, 30), actor: "System", action: "Database seeded", detail: "CRM initialised with fleet, drivers, customers & bookings" },
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
        email: "bookings@apnapunjabcabs.in",
        waGreeting: "Hi Apna Punjab Cab Service! I'd like to book a cab.",
      },
      security: { salt: uid() + uid(), hash: null, changedAt: null },
      backend: {
        mode: "local",
        url: "https://qzgvvfywjmspbbqglpdx.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Z3Z2Znl3am1zcGJicWdscGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzM4OTgsImV4cCI6MjEwMzMwOTg5OH0.WYA6SVp_qxGfPwYUt5BuLKeyrw7Yzwr8k5E0dgklruA",
      },
      seededAt: iso(new Date()),
      version: 2,
    },
    vehicles,
    vehicleImages,
    customers,
    drivers,
    bookings,
    statusHistory,
    hero,
    devices: [],
    notices,
    activity,
    seq: { booking: 1042, customer: 108, driver: 5, activity: 105, notice: 102, image: 3, event: 106 },
  };
}

/* ======================== storage engine ======================== */

let cache: DB | null = null;
let bc: BroadcastChannel | null = null;

export function getDb(): DB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.settings && parsed.settings.version === 2) {
        cache = parsed;
        // Auto-load from Supabase if mode is supabase and data not yet loaded
        if (parsed.settings.backend.mode === "supabase" && parsed.settings.backend.url && !sbLoaded) {
          setTimeout(() => loadFromSupabase(), 50);
        }
        return cache;
      }
    }
  } catch {
    /* corrupted — reseed */
  }
  cache = seed();
  persist();
  // Auto-load from Supabase if mode is supabase
  if (cache.settings.backend.mode === "supabase" && cache.settings.backend.url) {
    setTimeout(() => loadFromSupabase(), 50);
  }
  return cache;
}

function persist() {
  if (!cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage full — keep in-memory copy */
  }
  emit();
}

function emit() {
  window.dispatchEvent(new CustomEvent("apc:db"));
  try {
    if (bc) bc.postMessage({ type: "db", at: Date.now() });
  } catch {
    /* channel closed */
  }
}

if (typeof window !== "undefined") {
  try {
    bc = new BroadcastChannel(RT_CHANNEL);
    bc.onmessage = () => {
      cache = null;
      window.dispatchEvent(new CustomEvent("apc:db"));
    };
  } catch {
    bc = null;
  }
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = null;
      window.dispatchEvent(new CustomEvent("apc:db"));
    }
  });
}

/** Re-render on every database change — from this tab or any other tab. */
export function useRealtime(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    window.addEventListener("apc:db", fn);
    return () => window.removeEventListener("apc:db", fn);
  }, []);
  return tick;
}

function log(action: string, detail: string, actor = "Admin") {
  const db = getDb();
  db.seq.activity += 1;
  db.activity.unshift({
    id: "AC-" + (100 + db.seq.activity),
    at: iso(new Date()),
    actor,
    action,
    detail,
  });
  if (db.activity.length > 150) db.activity.length = 150;
}

/* ======================== auth ======================== */

async function hashPass(pass: string, salt: string): Promise<string> {
  const text = salt + "::apc::" + pass;
  try {
    if (crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    /* insecure context — fallback below */
  }
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    h1 = Math.imul(h1 ^ text.charCodeAt(i), 16777619) >>> 0;
    h2 = (Math.imul(h2, 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return h1.toString(16) + h2.toString(16);
}

/* ======================== availability engine ======================== */

const ACTIVE: BookingStatus[] = ["pending", "confirmed", "enroute"];

function findConflict(
  db: DB,
  vehicleId: string,
  pickupAt: string,
  returnAt: string | null,
  km: number,
  tripType: TripType,
  ignoreId?: string
): Booking | null {
  const h = tripSpanHours(km, tripType, returnAt, pickupAt);
  const start = new Date(pickupAt).getTime();
  const end = start + h * 3600000;
  for (const b of db.bookings) {
    if (b.id === ignoreId || b.vehicleId !== vehicleId) continue;
    if (ACTIVE.indexOf(b.status) === -1) continue;
    const bh = tripSpanHours(b.km, b.tripType, b.returnAt, b.pickupAt);
    const bs = new Date(b.pickupAt).getTime();
    const be = bs + bh * 3600000;
    if (start < be && bs < end) return b;
  }
  return null;
}

/* ======================== notifications ======================== */

/** Secondary event — never allowed to fail the primary booking write. */
function notifyAdmins(title: string, body: string, link: string) {
  try {
    const db = getDb();
    db.seq.notice += 1;
    db.notices.unshift({
      id: "NT-" + (db.seq.notice + 100),
      at: iso(new Date()),
      title,
      body,
      link,
      read: false,
    });
    if (db.notices.length > 60) db.notices.length = 60;

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification(title, { body, icon: "./icon-512.png", tag: link });
      } catch {
        /* in-app feed still works */
      }
    }
    persist();
  } catch (err) {
    console.warn("[apc] notification failed (booking unaffected)", err);
  }
}

/* ======================== Supabase helpers ======================== */

let sbClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const cfg = getDb().settings.backend;
  if (cfg.mode !== "supabase" || !cfg.url || !cfg.anonKey) return null;
  if (!sbClient) sbClient = createClient(cfg.url, cfg.anonKey);
  return sbClient;
}

let sbLoaded = false;
let sbLoading = false;

async function loadFromSupabase() {
  const sb = getSupabase();
  if (!sb || sbLoaded || sbLoading) return;
  sbLoading = true;
  try {
    const db = getDb();

    const [vehRes, imgRes, custRes, drvRes, bkRes, histRes, heroRes, devRes] = await Promise.all([
      sb.from("vehicles").select("*"),
      sb.from("vehicle_images").select("*").order("sort_order"),
      sb.from("customers").select("*"),
      sb.from("drivers").select("*"),
      sb.from("bookings").select("*").order("pickup_at", { ascending: false }),
      sb.from("booking_status_history").select("*").order("changed_at", { ascending: false }),
      sb.from("hero_sections").select("*").eq("id", "HERO-1").single(),
      sb.from("notification_devices").select("*"),
    ]);

    if (vehRes.data) db.vehicles = vehRes.data.map(sbVehicle);
    if (imgRes.data) db.vehicleImages = imgRes.data.map(sbVehicleImage);
    if (custRes.data) db.customers = custRes.data.map(sbCustomer);
    if (drvRes.data) db.drivers = drvRes.data.map(sbDriver);
    if (bkRes.data) db.bookings = bkRes.data.map(sbBooking);
    if (histRes.data) db.statusHistory = histRes.data.map(sbStatusEvent);
    if (heroRes.data) db.hero = sbHero(heroRes.data);
    if (devRes.data) db.devices = devRes.data.map(sbDevice);

    // Load vehicle images into vehicle img fields
    const primaryByVehicle = new Map<string, string>();
    for (const im of db.vehicleImages) {
      if (im.isPrimary && !primaryByVehicle.has(im.vehicleId)) {
        primaryByVehicle.set(im.vehicleId, im.url);
      }
    }
    for (const v of db.vehicles) {
      const img = primaryByVehicle.get(v.id);
      if (img) v.img = img;
    }

    persist();
    sbLoaded = true;
    console.log("[apc] Supabase data loaded");
  } catch (err) {
    console.warn("[apc] Supabase load failed, using local data", err);
  } finally {
    sbLoading = false;
  }
}

function sbFire(promise: Promise<unknown>, label: string) {
  promise.catch((err) => console.warn("[apc] Supabase write failed (" + label + ")", err));
}

/* ======================== API ======================== */

export interface WebsiteBookingInput {
  name: string;
  phone: string;
  email?: string;
  altPhone?: string;
  vehicleId: string;
  pickup: string;
  dropoff: string;
  km: number;
  tripType: TripType;
  pickupAt: string;
  returnAt: string | null;
  passengers: number;
  notes: string;
}

export const backend = {
  async login(pass: string): Promise<{ ok: boolean; error?: string }> {
    await delay(200);
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.auth.signInWithPassword({
        email: "admin@apnapunjabcabs.in",
        password: pass,
      });
      if (error) return { ok: false, error: error.message };
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ token: data.session.access_token, exp: Date.now() + 12 * 3600 * 1000 })
      );
      // Load data from Supabase after auth
      await loadFromSupabase();
      log("Signed in", "Admin session started via Supabase (12-hour session)");
      persist();
      return { ok: true };
    }
    // local mode
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
      // If Supabase mode, also verify the Supabase session is still valid (async, best-effort)
      const sb = getSupabase();
      if (sb && !sbLoaded) {
        sb.auth.getSession().then(({ data }) => {
          if (!data.session) {
            localStorage.removeItem(SESSION_KEY);
            window.dispatchEvent(new CustomEvent("apc:db"));
          }
        }).catch(() => {});
      }
      return true;
    } catch {
      return false;
    }
  },

  async logout() {
    await delay(100);
    const sb = getSupabase();
    if (sb) {
      await sb.auth.signOut();
    }
    localStorage.removeItem(SESSION_KEY);
    log("Signed out", "Admin session ended");
    persist();
  },

  async changePassword(current: string, next: string): Promise<{ ok: boolean; error?: string }> {
    await delay(360);
    const sb = getSupabase();
    if (sb) {
      // Supabase: update user password
      const { error } = await sb.auth.updateUser({ password: next });
      if (error) return { ok: false, error: error.message };
      log("Security", "Admin password was changed via Supabase");
      persist();
      return { ok: true };
    }
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
    const sb = getSupabase();
    if (sb) return false; // Supabase manages auth; no "default password" concept
    const db = getDb();
    if (!db.settings.security.hash) return true;
    const h = await hashPass(DEFAULT_PASSWORD, db.settings.security.salt);
    return h === db.settings.security.hash;
  },

  /* ---- bookings ---- */
  listBookings(): Booking[] {
    return [...getDb().bookings].sort((a, b) => b.pickupAt.localeCompare(a.pickupAt));
  },

  getBooking(id: string): Booking | null {
    return getDb().bookings.find((b) => b.id === id) ?? null;
  },

  statusHistoryOf(id: string): StatusEvent[] {
    return getDb()
      .statusHistory.filter((e) => e.bookingId === id)
      .sort((a, b) => a.at.localeCompare(b.at));
  },

  saveBooking(b: Booking, by = "Admin"): Booking {
    const db = getDb();
    const i = db.bookings.findIndex((x) => x.id === b.id);
    if (i >= 0) {
      const prev = db.bookings[i];
      if (prev.status !== b.status) {
        db.seq.event += 1;
        db.statusHistory.unshift({
          id: "EV-" + (db.seq.event + 100),
          bookingId: b.id,
          at: iso(new Date()),
          from: prev.status,
          to: b.status,
          by,
        });
      }
      db.bookings[i] = b;
      log("Booking updated", b.id + " · " + b.route + " · status: " + b.status, by);
    } else {
      db.seq.booking += 1;
      b = { ...b, id: "BK-" + (db.seq.booking + 1000) };
      db.bookings.unshift(b);
      db.seq.event += 1;
      db.statusHistory.unshift({
        id: "EV-" + (db.seq.event + 100),
        bookingId: b.id,
        at: iso(new Date()),
        from: "created",
        to: b.status,
        by,
      });
      log("Booking created", b.id + " · " + b.route + " · ₹" + b.fare.toLocaleString("en-IN"), by);
    }
    persist();

    // Supabase write
    const sb = getSupabase();
    if (sb) {
      sbFire(
        sb.from("bookings").upsert(appBooking(b), { onConflict: "id" }),
        "saveBooking:" + b.id
      );
    }

    return b;
  },

  deleteBooking(id: string) {
    const db = getDb();
    db.bookings = db.bookings.filter((b) => b.id !== id);
    log("Booking deleted", id);
    persist();

    const sb = getSupabase();
    if (sb) {
      sbFire(sb.from("bookings").delete().eq("id", id), "deleteBooking:" + id);
    }
  },

  async createWebsiteBooking(input: WebsiteBookingInput): Promise<{ ok: boolean; id?: string; error?: string }> {
    await delay(500);

    // Client-side validation
    if (!input.name.trim() || input.name.trim().length < 3) return { ok: false, error: "Please enter your full name." };
    if (!/^[0-9+\-\s]{10,14}$/.test(input.phone.trim())) return { ok: false, error: "Please enter a valid phone number." };
    if (input.email && !/^\S+@\S+\.\S+$/.test(input.email)) return { ok: false, error: "Please enter a valid email address." };
    if (!input.pickup.trim() || !input.dropoff.trim()) return { ok: false, error: "Pickup and drop-off locations are required." };
    if (!input.pickupAt || new Date(input.pickupAt).getTime() < Date.now() - 5 * 60000)
      return { ok: false, error: "Pickup time must be in the future." };
    if (input.tripType === "round" && input.returnAt && new Date(input.returnAt) <= new Date(input.pickupAt))
      return { ok: false, error: "Return time must be after pickup time." };

    const sb = getSupabase();
    if (sb) {
      // Use the create_booking RPC
      const { data, error } = await sb.rpc("create_booking", {
        p_name: input.name.trim(),
        p_phone: input.phone.trim(),
        p_email: input.email?.trim() || null,
        p_alt_phone: input.altPhone?.trim() || null,
        p_vehicle_id: input.vehicleId,
        p_pickup: input.pickup.trim(),
        p_dropoff: input.dropoff.trim(),
        p_km: input.km,
        p_trip_type: input.tripType,
        p_pickup_at: input.pickupAt,
        p_return_at: input.tripType === "round" ? input.returnAt : null,
        p_passengers: input.passengers,
        p_notes: input.notes.trim() || "",
        p_source: "website",
      });
      if (error) return { ok: false, error: error.message };

      // Reload data from Supabase
      sbLoaded = false;
      await loadFromSupabase();

      const bookingId = data as string;
      const db = getDb();
      const booking = db.bookings.find((b) => b.id === bookingId);
      const vehicle = db.vehicles.find((v) => v.id === input.vehicleId);
      const customer = db.customers.find((c) => c.phone.replace(/\s/g, "") === input.phone.replace(/\s/g, ""));

      // Fire-and-forget Telegram notification
      if (booking) {
        const supabaseUrl = "https://qzgvvfywjmspbbqglpdx.supabase.co";
        const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Z3Z2Znl3am1zcGJicWdscGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzM4OTgsImV4cCI6MjEwMzMwOTg5OH0.WYA6SVp_qxGfPwYUt5BuLKeyrw7Yzwr8k5E0dgklruA";
        fetch(`${supabaseUrl}/functions/v1/notify-admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${anonKey}` },
          body: JSON.stringify({ record: { ...booking, customer_id: customer?.id ?? booking.customerId, vehicle_id: booking.vehicleId } }),
        }).catch(() => {});
      }

      if (booking && vehicle) {
        const when = new Date(booking.pickupAt).toLocaleString("en-IN", {
          day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
        });
        notifyAdmins(
          "New booking received",
          (customer?.name || input.name) + " booked " + vehicle.name + ". Pickup: " + booking.pickup + " · " + when,
          "#/admin/bookings/" + booking.id
        );
      }
      return { ok: true, id: bookingId };
    }

    // Local mode — original logic
    const db = getDb();
    const vehicle = db.vehicles.find((v) => v.id === input.vehicleId && !v.archived);
    if (!vehicle) return { ok: false, error: "Please choose a vehicle." };
    if (!vehicle.available) return { ok: false, error: vehicle.name + " is temporarily unavailable. Please pick another car or call us." };

    const conflict = findConflict(db, vehicle.id, input.pickupAt, input.returnAt, input.km, input.tripType);
    if (conflict) return { ok: false, error: vehicle.name + " is already booked for an overlapping time slot (" + conflict.id + "). Please pick a different time or vehicle — or call us and we will arrange it." };

    let customer = db.customers.find((c) => c.phone.replace(/\s/g, "") === input.phone.replace(/\s/g, ""));
    if (!customer) {
      db.seq.customer += 1;
      customer = {
        id: "CU-" + (db.seq.customer + 100),
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email && input.email.trim() ? input.email.trim() : undefined,
        altPhone: input.altPhone && input.altPhone.trim() ? input.altPhone.trim() : undefined,
        area: input.pickup.split(",")[0].trim(),
        notes: "Online customer",
        createdAt: iso(new Date()),
      };
      db.customers.unshift(customer);
      log("Customer added", customer.name + " · " + customer.phone + " (online booking)", "Website");
    }

    const fare = calcFare(input.km, vehicle.perKm, vehicle.base, input.tripType);
    db.seq.booking += 1;
    const booking: Booking = {
      id: "BK-" + (db.seq.booking + 1000),
      customerId: customer.id,
      driverId: null,
      vehicleId: vehicle.id,
      route: input.pickup.trim() + " " + ARROW + " " + input.dropoff.trim(),
      pickup: input.pickup.trim(),
      dropoff: input.dropoff.trim(),
      km: input.km,
      tripType: input.tripType,
      pickupAt: input.pickupAt,
      returnAt: input.tripType === "round" ? input.returnAt : null,
      passengers: input.passengers,
      status: "pending",
      fare,
      pay: "pending",
      source: "website",
      notes: input.notes.trim() ? "Online booking — " + input.notes.trim() : "Online booking",
      createdAt: iso(new Date()),
    };
    db.bookings.unshift(booking);
    db.seq.event += 1;
    db.statusHistory.unshift({
      id: "EV-" + (db.seq.event + 100),
      bookingId: booking.id,
      at: iso(new Date()),
      from: "created",
      to: "pending",
      by: "Website",
    });
    log("Booking created", booking.id + " · " + booking.route + " · " + vehicle.name + " · ₹" + fare.toLocaleString("en-IN") + " (online booking)", "Website");

    const when = new Date(booking.pickupAt).toLocaleString("en-IN", {
      day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
    });
    notifyAdmins(
      "New booking received",
      customer.name + " booked " + vehicle.name + ". Pickup: " + booking.pickup + " · " + when,
      "#/admin/bookings/" + booking.id
    );
    return { ok: true, id: booking.id };
  },

  checkAvailability(
    vehicleId: string,
    pickupAt: string,
    returnAt: string | null,
    km: number,
    tripType: TripType,
    ignoreId?: string
  ): { ok: boolean; error?: string } {
    const db = getDb();
    const v = db.vehicles.find((x) => x.id === vehicleId);
    if (!v || !v.available) return { ok: false, error: "Vehicle unavailable" };
    const c = findConflict(db, vehicleId, pickupAt, returnAt, km, tripType, ignoreId);
    return c ? { ok: false, error: "Overlaps " + c.id } : { ok: true };
  },

  /* ---- customers ---- */
  listCustomers(): Customer[] {
    return [...getDb().customers];
  },

  saveCustomer(c: Customer): Customer {
    const db = getDb();
    const i = db.customers.findIndex((x) => x.id === c.id);
    if (i >= 0) {
      db.customers[i] = c;
      log("Customer updated", c.name + " (" + c.id + ")");
    } else {
      db.seq.customer += 1;
      c = { ...c, id: "CU-" + (db.seq.customer + 100) };
      db.customers.unshift(c);
      log("Customer added", c.name + " · " + c.phone);
    }
    persist();

    const sb = getSupabase();
    if (sb) {
      sbFire(sb.from("customers").upsert(appCustomer(c), { onConflict: "id" }), "saveCustomer:" + c.id);
    }
    return c;
  },

  deleteCustomer(id: string) {
    const db = getDb();
    db.customers = db.customers.filter((c) => c.id !== id);
    log("Customer deleted", id);
    persist();

    const sb = getSupabase();
    if (sb) {
      sbFire(sb.from("customers").delete().eq("id", id), "deleteCustomer:" + id);
    }
  },

  /* ---- drivers ---- */
  listDrivers(): Driver[] {
    return [...getDb().drivers];
  },

  saveDriver(d: Driver): Driver {
    const db = getDb();
    const i = db.drivers.findIndex((x) => x.id === d.id);
    if (i >= 0) {
      db.drivers[i] = d;
      log("Driver updated", d.name);
    } else {
      db.seq.driver += 1;
      d = { ...d, id: "DR-" + String(db.seq.driver + 10).padStart(2, "0") };
      db.drivers.push(d);
      log("Driver added", d.name + " · " + d.phone);
    }
    persist();

    const sb = getSupabase();
    if (sb) {
      sbFire(sb.from("drivers").upsert(appDriver(d), { onConflict: "id" }), "saveDriver:" + d.id);
    }
    return d;
  },

  /* ---- vehicles ---- */
  listVehicles(opts?: { includeUnavailable?: boolean; includeArchived?: boolean }): Vehicle[] {
    let vs = getDb().vehicles;
    if (!opts || !opts.includeArchived) vs = vs.filter((v) => !v.archived);
    if (!opts || !opts.includeUnavailable) vs = vs.filter((v) => v.available);
    return vs.map((v) => ({ ...v }));
  },

  getVehicle(id: string): Vehicle | null {
    return getDb().vehicles.find((v) => v.id === id && !v.archived) ?? null;
  },

  imagesOf(vehicleId: string): VehicleImage[] {
    return getDb()
      .vehicleImages.filter((i) => i.vehicleId === vehicleId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  saveVehicle(v: Vehicle, images?: VehicleImage[]): Vehicle {
    const db = getDb();
    const i = db.vehicles.findIndex((x) => x.id === v.id);
    if (i >= 0) {
      db.vehicles[i] = v;
      log("Fleet updated", v.name + " · ₹" + v.perKm + "/km · " + (v.available ? "available" : "unavailable"));
    } else {
      v = { ...v, id: "VH-" + uid().toUpperCase().slice(0, 6) };
      db.vehicles.push(v);
      log("Fleet added", v.name + " · " + v.tag + " · ₹" + v.perKm + "/km");
    }
    if (images) {
      db.vehicleImages = db.vehicleImages.filter((im) => im.vehicleId !== v.id);
      let hasPrimary = images.some((im) => im.isPrimary);
      images.forEach((im, idx) => {
        db.seq.image += 1;
        const isPrimary = im.isPrimary || (!hasPrimary && idx === 0);
        if (isPrimary) hasPrimary = true;
        db.vehicleImages.push({
          id: im.id || "IMG-" + (db.seq.image + 100),
          vehicleId: v.id,
          url: im.url,
          alt: im.alt || v.name,
          isPrimary,
          sortOrder: idx,
        });
      });
      const primary = images.find((im) => im.isPrimary) ?? images[0];
      if (primary) {
        const j = db.vehicles.findIndex((x) => x.id === v.id);
        if (j >= 0) db.vehicles[j] = { ...db.vehicles[j], img: primary.url };
      }
    }
    persist();

    const sb = getSupabase();
    if (sb) {
      sbFire(sb.from("vehicles").upsert(appVehicle(v), { onConflict: "id" }), "saveVehicle:" + v.id);
      if (images) {
        sbFire(
          (async () => {
            await sb.from("vehicle_images").delete().eq("vehicle_id", v.id);
            if (images.length > 0) {
              await sb.from("vehicle_images").insert(images.map(appVehicleImage));
            }
          })(),
          "saveVehicleImages:" + v.id
        );
      }
    }
    return v;
  },

  deleteVehicle(id: string) {
    const db = getDb();
    const v = db.vehicles.find((x) => x.id === id);
    db.vehicles = db.vehicles.map((x) => (x.id === id ? { ...x, archived: true, available: false } : x));
    if (v) log("Fleet archived", v.name + " removed from the website");
    persist();

    const sb = getSupabase();
    if (sb) {
      const archived = db.vehicles.find((x) => x.id === id);
      if (archived) {
        sbFire(sb.from("vehicles").upsert(appVehicle(archived), { onConflict: "id" }), "deleteVehicle:" + id);
      }
    }
  },

  /* ---- hero + content ---- */
  getHero(): HeroSection {
    return { ...getDb().hero };
  },

  saveHero(h: HeroSection) {
    const db = getDb();
    db.hero = { ...h, updatedAt: iso(new Date()) };
    log("Website updated", "Hero section " + (h.active ? "published" : "hidden"));
    persist();

    const sb = getSupabase();
    if (sb) {
      sbFire(sb.from("hero_sections").upsert(appHero(h), { onConflict: "id" }), "saveHero");
    }
  },

  getSettingsSync() {
    return getDb().settings;
  },

  saveSettings(patch: Partial<{ theme: ThemeSettings; content: WebsiteSettings; backend: BackendConfig }>) {
    const db = getDb();
    if (patch.theme) db.settings.theme = { ...db.settings.theme, ...patch.theme };
    if (patch.content) db.settings.content = { ...db.settings.content, ...patch.content };
    if (patch.backend) {
      db.settings.backend = { ...db.settings.backend, ...patch.backend };
      // Reset Supabase client when backend config changes
      if (patch.backend.mode !== "supabase" || patch.backend.url !== db.settings.backend.url) {
        sbClient = null;
        sbLoaded = false;
      }
      // Trigger data load when switching to Supabase
      if (patch.backend.mode === "supabase" && patch.backend.url && patch.backend.anonKey) {
        setTimeout(() => loadFromSupabase(), 100);
      }
      log("Backend", "Data source set to " + (patch.backend.mode === "supabase" ? "Supabase" : "local demo database"));
    }
    log("Settings saved", Object.keys(patch).join(", "));
    persist();

    // Save theme/content to Supabase
    const sb = getSupabase();
    if (sb && (patch.theme || patch.content)) {
      const s = db.settings;
      sbFire(
        sb.from("website_settings").upsert({
          id: 1,
          tagline: s.content.tagline,
          phone_display: s.content.phoneDisplay,
          phone_raw: s.content.phoneRaw,
          instagram_handle: s.content.instagramHandle,
          instagram: s.content.instagram,
          address: s.content.address,
          email: s.content.email,
          wa_greeting: s.content.waGreeting,
          theme_accent: s.theme.accent,
          theme_font: s.theme.font,
          theme_radius: s.theme.radius,
        }, { onConflict: "id" }),
        "saveSettings"
      );
    }
  },

  async resetAll() {
    await delay(300);
    const sb = getSupabase();
    if (sb) {
      // Clear Supabase tables
      await sb.from("booking_status_history").delete().neq("id", "");
      await sb.from("bookings").delete().neq("id", "");
      await sb.from("customers").delete().neq("id", "");
      await sb.from("drivers").delete().neq("id", "");
      await sb.from("vehicle_images").delete().neq("id", "");
      await sb.from("vehicles").delete().neq("id", "");
      sbLoaded = false;
    }
    localStorage.removeItem(KEY);
    cache = seed();
    persist();
    if (sb) {
      // Re-seed to Supabase
      await loadFromSupabase();
    }
  },

  /* ---- notification devices (Telegram) ---- */
  listDevices(): Device[] {
    return [...getDb().devices];
  },

  async registerDevice(chatId: string, label?: string): Promise<Device | null> {
    if (!chatId || !/^\d+$/.test(chatId)) return null;
    const db = getDb();
    // Dedup: same chat_id already registered
    const existing = db.devices.find((d) => d.token === chatId);
    if (existing) return existing;

    const d: Device = { id: uid(), token: chatId, label: label || "Telegram (" + chatId + ")", createdAt: iso(new Date()) };
    db.devices.push(d);
    log("Device registered", d.label);
    persist();

    const sb = getSupabase();
    if (sb) {
      sbFire(sb.from("notification_devices").upsert(appDevice(d), { onConflict: "fcm_token" }), "registerDevice");
    }
    return d;
  },

  removeDevice(id: string) {
    const db = getDb();
    const device = db.devices.find((d) => d.id === id);
    db.devices = db.devices.filter((d) => d.id !== id);
    log("Device removed", "Telegram device unregistered");
    persist();

    const sb = getSupabase();
    if (sb && device) {
      sbFire(sb.from("notification_devices").delete().eq("fcm_token", device.token), "removeDevice");
    }
  },

  listNotices(): Notice[] {
    return [...getDb().notices];
  },

  markNoticeRead(id: string) {
    const db = getDb();
    db.notices = db.notices.map((n) => (n.id === id ? { ...n, read: true } : n));
    persist();
  },

  markAllRead() {
    const db = getDb();
    db.notices = db.notices.map((n) => ({ ...n, read: true }));
    persist();
  },

  testNotification() {
    notifyAdmins("Test notification", "Push pipeline is working — new bookings will arrive like this.", "#/admin/bookings");
  },

  /* ---- enquiry from contact page ---- */
  submitEnquiry(name: string, phone: string, message: string) {
    log("Enquiry received", name + " (" + phone + "): " + message.slice(0, 90), "Website");
    notifyAdmins("New website enquiry", name + " · " + phone + " — " + message.slice(0, 80), "#/admin/customers");
  },

  /* ---- stats ---- */
  stats(): Stats {
    const db = getDb();
    const today = new Date().toDateString();
    const monthPrefix = iso(new Date()).slice(0, 7);
    const activeVehicles = db.vehicles.filter((v) => !v.archived);

    const days: Stats["days"] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const dayBookings = db.bookings.filter(
        (b) => new Date(b.pickupAt).toDateString() === key && b.status !== "cancelled" && b.status !== "rejected"
      );
      days.push({ label, total: dayBookings.reduce((s, b) => s + b.fare, 0), count: dayBookings.length });
    }

    const count = (s: BookingStatus) => db.bookings.filter((b) => b.status === s).length;
    const all: BookingStatus[] = ["pending", "confirmed", "enroute", "completed", "cancelled", "rejected"];
    return {
      todayCount: db.bookings.filter((b) => new Date(b.createdAt).toDateString() === today).length,
      pendingCount: count("pending"),
      confirmedCount: count("confirmed"),
      enrouteCount: count("enroute"),
      completedCount: count("completed"),
      cancelledCount: count("cancelled"),
      rejectedCount: count("rejected"),
      monthRevenue: db.bookings
        .filter((b) => b.pickupAt.slice(0, 7) === monthPrefix && b.status !== "cancelled" && b.status !== "rejected")
        .reduce((s, b) => s + b.fare, 0),
      vehiclesTotal: activeVehicles.length,
      vehiclesAvailable: activeVehicles.filter((v) => v.available).length,
      driversOnDuty: db.drivers.filter((d) => d.onDuty).length,
      driversTotal: db.drivers.length,
      days,
      pipeline: all.map((s) => ({ status: s, count: count(s) })),
      recent: [...db.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
      upcoming: db.bookings
        .filter((b) => ACTIVE.indexOf(b.status) !== -1 && new Date(b.pickupAt).getTime() > Date.now())
        .sort((a, b) => a.pickupAt.localeCompare(b.pickupAt))
        .slice(0, 5),
    };
  },

  listActivity(): Activity[] {
    return [...getDb().activity];
  },
};

/* ======================== Supabase realtime ======================== */

/** Live channel — Supabase Realtime when configured, local events always. */
export function useBackendRealtime(onEvent?: (evt: string) => void): number {
  const tick = useRealtime();
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const ch = sb
      .channel("bookings-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload) => {
          const evt = payload.eventType;
          const rec = payload.new as Record<string, unknown>;
          if (evt === "INSERT" || evt === "UPDATE") {
            // Refresh bookings in cache
            sb.from("bookings").select("*").order("pickup_at", { ascending: false }).then(({ data }) => {
              const db = getDb();
              if (data) db.bookings = data.map(sbBooking);
              persist();
              onEvent && onEvent(evt + ":" + rec.id);
            });
          } else if (evt === "DELETE") {
            const oldRec = payload.old as Record<string, unknown>;
            const db = getDb();
            db.bookings = db.bookings.filter((b) => b.id !== oldRec.id);
            persist();
            onEvent && onEvent("delete:" + oldRec.id);
          }
        }
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return tick;
}
