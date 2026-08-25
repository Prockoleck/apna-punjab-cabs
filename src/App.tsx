import { useEffect, useState } from "react";
import {
  BIZ,
  telHref,
  waHref,
  WA_DEFAULT,
  CARS,
  ROUTES,
  SERVICES,
  BADGES,
  TESTIMONIALS,
  STATS,
  MARQUEE_ITEMS,
  HERO_IMG,
  oneWayFare,
  roundFare,
  inr,
} from "./data";
import {
  LogoMark,
  CarGlyph,
  IconPhone,
  IconWhatsApp,
  IconInstagram,
  IconStar,
  IconPin,
  IconPlane,
  IconRoute,
  IconCity,
  IconLoop,
  IconBriefcase,
  IconClock,
  IconShield,
  IconSparkle,
  IconRupee,
  IconBolt,
  IconAward,
  IconUsers,
  IconBag,
  IconAc,
  IconCheck,
  IconArrow,
  IconMenu,
  IconX,
} from "./icons";
import { Reveal, CountUp, SmartImg, RoutePath } from "./motion";
import { useSettings } from "./lib/settings";

/* ------------------------------------------------------------------ */
/*  small building blocks                                              */
/* ------------------------------------------------------------------ */

function Eyebrow({ children, tone = "sky" }: { children: React.ReactNode; tone?: "sky" | "light" | "sun" }) {
  const color =
    tone === "light" ? "text-sky-400" : tone === "sun" ? "text-sun-600" : "text-sky-600";
  return (
    <p className={`flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] ${color}`}>
      <span className={`h-px w-8 ${tone === "light" ? "bg-sky-400" : "bg-current"}`} />
      {children}
    </p>
  );
}

function Stars({ n, size = 15, className = "text-sun-500" }: { n: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar key={i} size={size} className={i <= n ? "" : "opacity-25"} />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  header                                                             */
/* ------------------------------------------------------------------ */

const NAV = [
  ["Services", "#services"],
  ["Fleet", "#fleet"],
  ["Routes & Fares", "#routes"],
  ["Why Us", "#why"],
  ["Reviews", "#reviews"],
  ["Contact", "#contact"],
] as const;

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b transition-all duration-300 ${
        scrolled ? "border-ink-100 bg-white/95 shadow-[0_8px_30px_-18px_rgba(11,29,46,0.35)] backdrop-blur" : "border-transparent bg-white/80 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <LogoMark className="size-10 shrink-0 drop-shadow-sm" />
          <span className="leading-tight">
            <span className="block font-display text-[17px] font-extrabold tracking-tight text-ink-900">
              Apna Punjab
            </span>
            <span className="block text-[9.5px] font-bold uppercase tracking-[0.3em] text-sky-600">
              Cab Service
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-semibold text-ink-500 transition-colors hover:text-ink-900"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <span className="hidden items-center gap-1.5 rounded-full border border-ink-100 bg-ink-50 px-3 py-1.5 text-xs font-bold text-ink-700 xl:inline-flex">
            <IconStar size={13} className="text-sun-500" />
            4.6 · 162 reviews
          </span>
          <a
            href={telHref}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 py-2.5 pl-3.5 pr-4 text-sm font-bold text-white shadow-lg shadow-sky-500/30 transition-all hover:-translate-y-0.5 hover:bg-sky-600"
          >
            <IconPhone size={16} />
            <span className="hidden sm:inline">{BIZ.phoneDisplay}</span>
            <span className="sm:hidden">Call</span>
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="grid size-10 place-items-center rounded-full border border-ink-100 text-ink-700 transition-colors hover:border-sky-300 hover:text-sky-600 lg:hidden"
          >
            {open ? <IconX size={20} /> : <IconMenu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-white px-4 pb-5 pt-2 shadow-xl lg:hidden">
          {NAV.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block border-b border-ink-50 py-3 font-display text-base font-bold text-ink-800"
            >
              {label}
            </a>
          ))}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <a
              href={telHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-bold text-white"
            >
              <IconPhone size={16} /> Call now
            </a>
            <a
              href={WA_DEFAULT}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-wa-500 py-3 text-sm font-bold text-white"
            >
              <IconWhatsApp size={16} /> WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  hero + live fare check card                                        */
/* ------------------------------------------------------------------ */

function FareCheckCard() {
  const [destId, setDestId] = useState("delhi");
  const route = ROUTES.find((r) => r.id === destId) ?? ROUTES[0];
  const fare = oneWayFare(route.km, CARS[0].perKm);
  const waText = waHref(
    `Hi Apna Punjab Cab Service! I'd like to book a Swift Dzire from Ludhiana to ${route.name}. Indicative fare ${inr(fare)}. Please confirm.`
  );

  return (
    <div className="relative">
      {/* offset frame */}
      <div className="absolute -inset-3 translate-x-3 translate-y-3 rotate-1 rounded-3xl bg-sky-200/50" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_30px_70px_-30px_rgba(11,29,46,0.35)]">
        {/* photo header */}
        <div className="relative h-44 sm:h-52">
          <SmartImg
            src={HERO_IMG}
            alt="Apna Punjab cab on a Punjab highway at golden hour"
            label="On the road, 24×7"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/20 to-transparent" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-ink-950/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
            <span className="blink-dot size-1.5 rounded-full bg-wa-500" />
            Drivers online · 24×7
          </span>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
              Tonight's popular run
            </p>
            <p key={route.id} className="tick-in font-display text-2xl font-extrabold text-white sm:text-[27px]">
              Ludhiana → {route.name}
            </p>
          </div>
        </div>

        {/* body */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-ink-900">Instant fare check</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
              <span className="size-1.5 rounded-full bg-sky-500" /> Live fares
            </span>
          </div>

          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">
            Where to from Ludhiana?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROUTES.map((r) => (
              <button
                key={r.id}
                onClick={() => setDestId(r.id)}
                className={`rounded-full border-2 px-3.5 py-1.5 text-[13px] font-bold transition-all ${
                  r.id === destId
                    ? "border-ink-900 bg-ink-900 text-white shadow-md"
                    : "border-ink-100 bg-white text-ink-600 hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-700"
                }`}
              >
                {r.name.split(" ·")[0]}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <RoutePath active />
          </div>

          <div key={`f-${destId}`} className="tick-in mt-1 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">
                Indicative one-way
              </p>
              <p className="font-display text-[40px] font-extrabold leading-none tracking-tight text-ink-900">
                {inr(fare)}
              </p>
            </div>
            <div className="text-right text-[13px] font-semibold text-ink-500">
              <p className="font-bold text-ink-700">Swift Dzire</p>
              <p>
                {route.km} km · ~{route.eta}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
            <a
              href={telHref}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-sky-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-sky-500/30 transition-all hover:-translate-y-0.5 hover:bg-sky-600"
            >
              <IconPhone size={18} /> Book on call
            </a>
            <a
              href={waText}
              target="_blank"
              rel="noreferrer"
              aria-label="Book on WhatsApp"
              className="grid w-14 place-items-center rounded-xl bg-wa-500 text-white transition-all hover:-translate-y-0.5 hover:bg-wa-600"
            >
              <IconWhatsApp size={22} />
            </a>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
            Exact fare confirmed on call or WhatsApp before pickup. Tolls & parking at actuals — never hidden.
          </p>
        </div>
      </div>

      {/* floating rating chip */}
      <div className="floaty absolute -left-3 -top-5 hidden items-center gap-2 rounded-full border border-ink-100 bg-white px-4 py-2 shadow-lg sm:inline-flex">
        <IconStar size={16} className="text-sun-500" />
        <span className="font-display text-sm font-extrabold text-ink-900">4.6</span>
        <span className="text-xs font-semibold text-ink-400">· 162 Google reviews</span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-white pb-16 pt-28 sm:pb-24 sm:pt-36">
      <div className="dotgrid absolute inset-0" aria-hidden />
      <div className="absolute -right-40 -top-40 size-[540px] rounded-full bg-sky-100/80 blur-3xl" aria-hidden />
      <div className="absolute -bottom-52 -left-40 size-[480px] rounded-full bg-sun-100/70 blur-3xl" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <Reveal>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3.5 py-1.5 text-xs font-bold text-ink-700 shadow-sm">
                <IconPin size={13} className="text-sky-500" /> Ludhiana, Punjab
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sun-400/40 bg-sun-50 px-3.5 py-1.5 text-xs font-bold text-sun-600">
                <IconClock size={13} /> 24×7 · Since 2019
              </span>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-6 font-display text-[42px] font-extrabold leading-[1.02] tracking-tight text-ink-900 sm:text-6xl xl:text-[72px]">
              Ludhiana to
              <br />
              anywhere,{" "}
              <span className="relative inline-block text-sky-500">
                anytime
                <svg
                  viewBox="0 0 200 12"
                  className="absolute -bottom-2 left-0 w-full"
                  aria-hidden
                >
                  <path
                    d="M4 9 C 60 2, 140 2, 196 7"
                    stroke="#f0a51f"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
              <span className="text-ink-900">.</span>
            </h1>
          </Reveal>

          <Reveal delay={170}>
            <p className="mt-7 max-w-lg text-[17px] leading-relaxed text-ink-500">
              <strong className="font-bold text-ink-800">{BIZ.tagline}.</strong> Airport
              transfers, outstation trips and city rides — clean cars, verified drivers and
              fares agreed <em className="font-semibold not-italic text-ink-800">before</em> the
              wheel turns. No hidden charges, ever.
            </p>
          </Reveal>

          <Reveal delay={250}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={telHref}
                className="group inline-flex items-center gap-3 rounded-xl bg-sky-500 px-6 py-4 text-white shadow-xl shadow-sky-500/30 transition-all hover:-translate-y-0.5 hover:bg-sky-600"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-white/20 transition-transform group-hover:rotate-12">
                  <IconPhone size={19} />
                </span>
                <span className="text-left leading-tight">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-sky-100">
                    Book now — it's instant
                  </span>
                  <span className="font-display text-xl font-extrabold tracking-tight">
                    {BIZ.phoneDisplay}
                  </span>
                </span>
              </a>
              <a
                href={WA_DEFAULT}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 rounded-xl border-2 border-ink-100 bg-white px-5 py-[18px] font-bold text-ink-800 transition-all hover:-translate-y-0.5 hover:border-wa-500 hover:text-wa-700"
              >
                <IconWhatsApp size={20} className="text-wa-500" /> WhatsApp us
              </a>
            </div>
          </Reveal>

          <Reveal delay={330}>
            <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-semibold text-ink-500">
              <li className="flex items-center gap-1.5">
                <Stars n={5} size={13} /> <span className="text-ink-800">4.6</span> on Google
              </li>
              <li className="flex items-center gap-1.5">
                <IconCheck size={14} className="text-sky-500" /> 50,000+ trips done
              </li>
              <li className="flex items-center gap-1.5">
                <IconCheck size={14} className="text-sky-500" /> Clean, sanitized cars
              </li>
            </ul>
          </Reveal>
        </div>

        <Reveal delay={200} className="lg:col-span-6">
          <FareCheckCard />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  stats + marquee                                                    */
/* ------------------------------------------------------------------ */

function StatsBand() {
  return (
    <section className="border-y border-ink-100 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 90} className="text-center lg:text-left">
            <p className="font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-[38px]">
              <CountUp target={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} />
            </p>
            <p className="mt-1 text-[13px] font-semibold text-ink-400">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="marquee overflow-hidden bg-sky-500 py-3.5" aria-hidden>
      <div className="marquee-track flex w-max items-center">
        {items.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-3 pr-3 font-display text-sm font-bold uppercase tracking-[0.18em] text-white"
          >
            {item}
            <CarGlyph className="w-7 text-sky-100/80" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  services                                                           */
/* ------------------------------------------------------------------ */

const SERVICE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  plane: IconPlane,
  city: IconCity,
  route: IconRoute,
  loop: IconLoop,
  briefcase: IconBriefcase,
};

const SERVICE_SPANS = ["md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-2"];

function Services() {
  return (
    <section id="services" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <Eyebrow>Our services</Eyebrow>
            <h2 className="mt-4 max-w-xl font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
              Every ride Punjab needs.
            </h2>
          </Reveal>
          <Reveal delay={120} className="max-w-sm">
            <p className="text-[15px] leading-relaxed text-ink-500">
              From a quick run across Ludhiana to a week-long Manali trip — one number covers
              the whole journey.
            </p>
            <a
              href="#routes"
              className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-sky-600 transition-all hover:gap-3"
            >
              See popular routes & fares <IconArrow size={16} />
            </a>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-6">
          {SERVICES.map((s, i) => {
            const Icon = SERVICE_ICONS[s.icon];
            const sun = s.icon === "briefcase";
            return (
              <Reveal key={s.title} delay={i * 70} className={SERVICE_SPANS[i]}>
                <article
                  className={`group h-full rounded-xl border border-ink-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/10 sm:p-7 ${
                    sun ? "md:bg-gradient-to-br md:from-sun-50 md:to-white" : ""
                  }`}
                >
                  <div
                    className={`grid size-12 place-items-center rounded-lg transition-colors duration-300 ${
                      sun
                        ? "bg-sun-100 text-sun-600 group-hover:bg-sun-500 group-hover:text-white"
                        : "bg-sky-50 text-sky-600 group-hover:bg-sky-500 group-hover:text-white"
                    }`}
                  >
                    <Icon size={23} />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-extrabold tracking-tight text-ink-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.desc}</p>
                  {s.chips && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {s.chips.map((c) => (
                        <span
                          key={c}
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            sun
                              ? "border-sun-400/40 bg-white text-sun-600"
                              : "border-ink-100 bg-ink-50 text-ink-600"
                          }`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  fleet                                                              */
/* ------------------------------------------------------------------ */

function Fleet() {
  return (
    <section id="fleet" className="bg-gradient-to-b from-white via-ink-50 to-ink-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Our fleet</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
            Clean cars, honest per-km rates.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
            Every vehicle is serviced on schedule, sanitized before each trip, and driven by a
            verified professional. Pick your ride:
          </p>
        </Reveal>

        <div className="mt-14 grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CARS.map((car, i) => (
            <Reveal key={car.id} delay={i * 110} className={i === 1 ? "lg:mt-8" : i === 2 ? "lg:mt-16" : ""}>
              <article className="group overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-ink-900/10">
                <div className={`relative h-44 overflow-hidden bg-gradient-to-br sm:h-48 ${car.tone}`}>
                  <SmartImg
                    src={car.img}
                    alt={`${car.name} — ${car.tag}`}
                    label={car.name}
                    className="absolute inset-0 h-full w-full object-contain p-1 transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  <span
                    className={`absolute left-3.5 top-3.5 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wider ${
                      i === 0 ? "bg-sun-500 text-ink-950" : "bg-ink-900 text-white"
                    }`}
                  >
                    {car.ribbon}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
                      {car.name}
                    </h3>
                    <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
                      {car.tag}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 divide-x divide-ink-100 rounded-lg border border-ink-100 bg-ink-50/60 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <IconUsers size={17} className="text-sky-600" />
                      <span className="text-xs font-bold text-ink-800">{car.seats}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">seats</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <IconBag size={17} className="text-sky-600" />
                      <span className="text-xs font-bold text-ink-800">{car.bags}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">luggage</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <IconAc size={17} className="text-sky-600" />
                      <span className="text-xs font-bold text-ink-800">Chilled</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">AC + GPS</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <p className="font-display text-[32px] font-extrabold leading-none tracking-tight text-ink-900">
                      {car.perKmLabel}
                    </p>
                    <p className="text-xs font-semibold text-ink-400">{car.cityFrom}</p>
                  </div>

                  <a
                    href={telHref}
                    className="mt-5 block w-full rounded-xl border-2 border-ink-900 py-3 text-center font-bold text-ink-900 transition-all hover:bg-ink-900 hover:text-white"
                  >
                    Book on call · {BIZ.phoneDisplay}
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[13px] font-semibold text-ink-500">
            {["AC in every car", "GPS tracked", "First-aid kit on board", "Charging points & music", "Child seat on request"].map((f) => (
              <li key={f} className="flex items-center gap-1.5">
                <IconCheck size={14} className="text-sky-500" /> {f}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  routes + fare estimator                                            */
/* ------------------------------------------------------------------ */

function RoutesSection() {
  const [routeId, setRouteId] = useState("delhi");
  const [carId, setCarId] = useState("dzire");
  const [round, setRound] = useState(false);

  const route = ROUTES.find((r) => r.id === routeId) ?? ROUTES[0];
  const car = CARS.find((c) => c.id === carId) ?? CARS[0];
  const one = oneWayFare(route.km, car.perKm);
  const fare = round ? roundFare(one) : one;
  const tripLabel = round ? "round trip" : "one-way";

  const waText = waHref(
    `Hi Apna Punjab Cab Service! I'd like to book a ${car.name} from Ludhiana to ${route.name} (${tripLabel}, ~${route.km} km). Indicative fare ${inr(fare)}. Please confirm my booking.`
  );

  return (
    <section id="routes" className="relative bg-white py-20 sm:py-24">
      <div className="dotgrid absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12">
        {/* sticky intro */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <Eyebrow>Popular routes & fares</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
                Fixed routes. Fair fares.
                <br />
                <span className="text-sky-500">Zero surprises.</span>
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-500">
                These are the runs we do every single day, so the pricing is sharp and the
                drivers know every shortcut, toll plaza and food stop on the way.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <ul className="mt-7 space-y-3">
                {[
                  "Fare locked before pickup — it never changes after",
                  "Tolls & parking billed at actuals, shown on the bill",
                  "Round trip includes driver halt time at your stop",
                  "Free cancellation up to 1 hour before pickup",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[14px] font-semibold text-ink-600">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-600">
                      <IconCheck size={12} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={200}>
              <div className="relative mt-9 overflow-hidden rounded-xl bg-ink-900 p-6 text-white sm:p-7">
                <div className="dotgrid-light absolute inset-0" aria-hidden />
                <div className="relative">
                  <p className="font-display text-xl font-extrabold">Prefer to just talk?</p>
                  <a
                    href={telHref}
                    className="mt-1 inline-block font-display text-[26px] font-extrabold tracking-tight text-sky-300 transition-colors hover:text-sky-200"
                  >
                    {BIZ.phoneDisplay}
                  </a>
                  <p className="mt-1 text-[13px] font-semibold text-ink-300">
                    Lines open 24×7 — yes, even at 3 AM.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href={telHref}
                      className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-sky-400"
                    >
                      <IconPhone size={15} /> Call now
                    </a>
                    <a
                      href={WA_DEFAULT}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-4 py-2.5 text-sm font-bold transition-colors hover:border-wa-500 hover:text-wa-500"
                    >
                      <IconWhatsApp size={15} /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* estimator */}
        <Reveal delay={140} className="lg:col-span-7">
          <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_30px_70px_-35px_rgba(11,29,46,0.3)] sm:p-8">
            {/* step 1 */}
            <div className="flex items-center gap-2.5">
              <span className="grid size-6 place-items-center rounded-full bg-sky-500 text-xs font-extrabold text-white">1</span>
              <p className="text-sm font-extrabold uppercase tracking-wider text-ink-800">Pick a route</p>
            </div>
            <div className="mt-3 grid gap-2">
              {ROUTES.map((r) => {
                const active = r.id === routeId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setRouteId(r.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                      active
                        ? "border-sky-500 bg-sky-50/70 shadow-sm"
                        : "border-ink-100 hover:-translate-y-0.5 hover:border-sky-300"
                    }`}
                  >
                    <span>
                      <span className="block font-bold text-ink-900">Ludhiana → {r.name}</span>
                      <span className="block text-xs font-semibold text-ink-400">{r.via}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2.5">
                      <span className="text-right text-xs font-bold text-ink-500">
                        {r.km} km
                        <span className="block font-semibold text-ink-400">~{r.eta}</span>
                      </span>
                      <span
                        className={`grid size-5 place-items-center rounded-full transition-colors ${
                          active ? "bg-sky-500 text-white" : "border-2 border-ink-200 bg-white"
                        }`}
                      >
                        {active && <IconCheck size={11} />}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* step 2 */}
            <div className="mt-7 flex items-center gap-2.5">
              <span className="grid size-6 place-items-center rounded-full bg-sky-500 text-xs font-extrabold text-white">2</span>
              <p className="text-sm font-extrabold uppercase tracking-wider text-ink-800">Pick a car</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {CARS.map((c) => {
                const active = c.id === carId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCarId(c.id)}
                    className={`rounded-xl border-2 px-2 py-3 text-center transition-all ${
                      active
                        ? "border-sky-500 bg-sky-50/70 shadow-sm"
                        : "border-ink-100 hover:-translate-y-0.5 hover:border-sky-300"
                    }`}
                  >
                    <span className="block truncate text-[13px] font-extrabold text-ink-900 sm:text-sm">
                      {c.name}
                    </span>
                    <span className="block text-[11px] font-bold text-sky-600">{c.perKmLabel}</span>
                    <span className="block text-[10px] font-semibold text-ink-400">{c.seats} seats</span>
                  </button>
                );
              })}
            </div>

            {/* step 3 */}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-6 place-items-center rounded-full bg-sky-500 text-xs font-extrabold text-white">3</span>
                <p className="text-sm font-extrabold uppercase tracking-wider text-ink-800">Trip type</p>
              </div>
              <div className="inline-flex rounded-full border border-ink-100 bg-ink-50 p-1">
                {[false, true].map((v) => (
                  <button
                    key={String(v)}
                    onClick={() => setRound(v)}
                    className={`rounded-full px-5 py-2 text-[13px] font-bold transition-all ${
                      round === v ? "bg-ink-900 text-white shadow" : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    {v ? "Round trip" : "One-way"}
                  </button>
                ))}
              </div>
            </div>

            {/* result */}
            <div
              key={`${routeId}-${carId}-${round}`}
              className="tick-in relative mt-7 overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 p-6 text-white sm:p-7"
            >
              <svg viewBox="0 0 400 40" className="absolute bottom-4 left-0 w-full opacity-40" aria-hidden>
                <path d="M0 20 H 400" stroke="#fff" strokeWidth="2" className="road-dash" />
              </svg>
              <div className="absolute -right-4 bottom-1 w-16 text-sky-100/70 sm:w-20" aria-hidden>
                <CarGlyph className="w-full" />
              </div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-100">
                Indicative {tripLabel} fare
              </p>
              <p className="mt-1 font-display text-5xl font-extrabold tracking-tight sm:text-[56px]">
                {inr(fare)}
              </p>
              <p className="mt-2 text-sm font-semibold text-sky-100">
                {route.km} km · ~{route.eta} · {car.name} ({car.perKmLabel})
              </p>
              <p className="mt-1 text-xs font-semibold text-sky-200/90">
                ≈ {route.km} km × ₹{car.perKm} + ₹300 base{round ? " · × 1.75 round-trip factor (driver halt included)" : ""}
              </p>
              <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
                <a
                  href={telHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-bold text-ink-900 transition-all hover:-translate-y-0.5 hover:bg-sky-50"
                >
                  <IconPhone size={17} /> Confirm on call
                </a>
                <a
                  href={waText}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-wa-500 px-5 py-3.5 font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-wa-600"
                >
                  <IconWhatsApp size={17} /> Book on WhatsApp
                </a>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-ink-400">
              Fares are indicative for standard conditions and may vary with season, night
              hours (10 PM–5 AM) and fuel prices. Your exact fare is confirmed on call or
              WhatsApp <strong className="text-ink-600">before</strong> the trip — and never changes after pickup.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  why choose us (navy)                                               */
/* ------------------------------------------------------------------ */

const BADGE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  clock: IconClock,
  shield: IconShield,
  sparkle: IconSparkle,
  rupee: IconRupee,
  bolt: IconBolt,
  award: IconAward,
};

function WhyUs() {
  return (
    <section id="why" className="relative overflow-hidden bg-ink-950 py-20 text-white sm:py-24">
      <div className="dotgrid-light absolute inset-0 opacity-70" aria-hidden />
      <p
        className="ghost-text pointer-events-none absolute -top-8 right-0 select-none font-display text-[10rem] font-extrabold leading-none sm:text-[15rem] lg:block hidden"
        aria-hidden
      >
        24×7
      </p>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow tone="light">Why Apna Punjab</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Trusted like family,
            <br />
            <span className="text-sky-400">since {BIZ.since}.</span>
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-300">
            Apps give you a random car. We give you a driver who knows your name, your lane,
            and how important that 6 AM flight is.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((b, i) => {
            const Icon = BADGE_ICONS[b.icon];
            return (
              <Reveal key={b.title} delay={i * 80}>
                <article className="group h-full rounded-xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/60 hover:bg-white/[0.07]">
                  <div className="grid size-11 place-items-center rounded-lg bg-sky-500/15 text-sky-400 transition-colors duration-300 group-hover:bg-sky-500 group-hover:text-white">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-extrabold tracking-tight">{b.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-300/90">{b.desc}</p>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={150}>
          <div className="mt-12 flex flex-wrap items-center gap-3">
            {[`4.6★ on Google · ${BIZ.reviews} reviews`, "50,000+ happy riders", "Ludhiana based · Punjab wide"].map((c) => (
              <span key={c} className="rounded-full border border-white/15 px-4 py-2 text-[13px] font-bold text-ink-200">
                {c}
              </span>
            ))}
            <a
              href={BIZ.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold text-sky-400 underline-offset-4 transition-all hover:gap-3 hover:text-sky-300 hover:underline"
            >
              Read our Google reviews <IconArrow size={15} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  testimonials                                                       */
/* ------------------------------------------------------------------ */

function Testimonials() {
  return (
    <section id="reviews" className="bg-gradient-to-b from-ink-50 to-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <Eyebrow>Google reviews</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
              Riders talk. We just drive.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <a
              href={BIZ.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-xl border border-ink-100 bg-white px-6 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="font-display text-4xl font-extrabold tracking-tight text-ink-900">4.6</span>
              <span>
                <Stars n={5} />
                <span className="mt-1 block text-xs font-bold text-ink-400">
                  {BIZ.reviews} verified reviews · Google Maps
                </span>
              </span>
            </a>
          </Reveal>
        </div>

        <div className="mt-12 grid items-start gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 110}
              className={i === 0 ? "md:-rotate-1" : i === 1 ? "md:translate-y-6 md:rotate-1" : "md:-rotate-[0.6deg]"}
            >
              <figure className="relative h-full rounded-xl border border-ink-100 bg-white p-6 shadow-sm transition-all duration-300 hover:rotate-0 hover:shadow-xl hover:shadow-ink-900/10 sm:p-7">
                <span
                  className="pointer-events-none absolute -top-4 left-5 select-none font-display text-6xl leading-none text-sky-200"
                  aria-hidden
                >
                  &ldquo;
                </span>
                <Stars n={t.stars} />
                <blockquote className="mt-3 text-sm leading-relaxed text-ink-600">
                  {t.text}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-4">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full ${t.tone} font-display text-sm font-extrabold text-white`}
                  >
                    {t.name.split(" ").map((w) => w[0]).join("")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-ink-900">{t.name}</span>
                    <span className="block truncate text-[11px] font-semibold text-ink-400">{t.meta}</span>
                  </span>
                  <span className="ml-auto grid size-6 shrink-0 place-items-center rounded-full border border-ink-200 font-display text-[13px] font-extrabold text-ink-400" title="Posted on Google">
                    G
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA band                                                           */
/* ------------------------------------------------------------------ */

function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-sky-500 to-sky-600 py-16 text-white sm:py-20">
      <div className="absolute inset-x-0 bottom-5 hidden sm:block" aria-hidden>
        <svg viewBox="0 0 800 40" className="w-full opacity-40" preserveAspectRatio="none">
          <path d="M0 20 H 800" stroke="#fff" strokeWidth="2.5" className="road-dash" />
        </svg>
        <div className="drive-across absolute bottom-[22px] left-0 w-14 text-white/90">
          <CarGlyph className="w-full" />
        </div>
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 px-4 sm:px-6 lg:flex-row lg:items-center">
        <Reveal>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-100">
            Book in 60 seconds
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Ready to ride? <span className="text-sun-400">Punjab is waiting.</span>
          </h2>
        </Reveal>
        <Reveal delay={130} className="w-full lg:w-auto">
          <a
            href={telHref}
            className="block font-display text-3xl font-extrabold tracking-tight underline-offset-8 transition-all hover:underline sm:text-4xl"
          >
            {BIZ.phoneDisplay}
          </a>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={telHref}
              className="inline-flex items-center gap-2.5 rounded-xl bg-ink-950 px-6 py-3.5 font-bold transition-all hover:-translate-y-0.5 hover:bg-ink-900"
            >
              <IconPhone size={18} /> Call now — free quote
            </a>
            <a
              href={WA_DEFAULT}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl bg-white px-6 py-3.5 font-bold text-ink-900 transition-all hover:-translate-y-0.5 hover:bg-sky-50"
            >
              <IconWhatsApp size={18} className="text-wa-600" /> WhatsApp booking
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  footer + contact                                                   */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer id="contact" className="bg-ink-950 pb-10 pt-16 text-ink-300 sm:pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <a href="#top" className="flex items-center gap-3">
              <LogoMark className="size-11" />
              <span className="leading-tight">
                <span className="block font-display text-lg font-extrabold tracking-tight text-white">
                  Apna Punjab
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-sky-400">
                  Cab Service
                </span>
              </span>
            </a>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-400">
              {BIZ.tagline}. Airport transfers, outstation rides and city travel from Ludhiana —
              one call, honest fare, clean car.
            </p>
            <div className="mt-6 flex gap-2.5">
              <a
                href={telHref}
                aria-label="Call us"
                className="grid size-10 place-items-center rounded-lg border border-white/15 text-ink-200 transition-all hover:-translate-y-0.5 hover:border-sky-400 hover:bg-sky-500 hover:text-white"
              >
                <IconPhone size={17} />
              </a>
              <a
                href={WA_DEFAULT}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="grid size-10 place-items-center rounded-lg border border-white/15 text-ink-200 transition-all hover:-translate-y-0.5 hover:border-wa-500 hover:bg-wa-500 hover:text-white"
              >
                <IconWhatsApp size={17} />
              </a>
              <a
                href={BIZ.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="grid size-10 place-items-center rounded-lg border border-white/15 text-ink-200 transition-all hover:-translate-y-0.5 hover:border-sky-400 hover:bg-sky-500 hover:text-white"
              >
                <IconInstagram size={17} />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-white">
              Quick links
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold">
              {NAV.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="transition-colors hover:text-sky-400">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-white">
              We cover
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold">
              {SERVICES.map((s) => (
                <li key={s.title} className="flex items-center gap-2">
                  <IconCheck size={13} className="shrink-0 text-sky-500" /> {s.title}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {["Ludhiana", "Jalandhar", "Khanna", "Phagwara", "Moga", "Patiala"].map((c) => (
                <span key={c} className="rounded-full border border-white/12 px-2.5 py-1 text-[11px] font-bold text-ink-400">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-white">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm font-semibold">
              <li>
                <a href={telHref} className="flex items-center gap-2.5 text-white transition-colors hover:text-sky-400">
                  <IconPhone size={16} className="text-sky-500" /> {BIZ.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={WA_DEFAULT} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 transition-colors hover:text-wa-500">
                  <IconWhatsApp size={16} className="text-wa-500" /> WhatsApp booking
                </a>
              </li>
              <li>
                <a href={BIZ.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 transition-colors hover:text-sky-400">
                  <IconInstagram size={16} className="text-sky-500" /> {BIZ.instagramHandle}
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-ink-400">
                <IconPin size={16} className="mt-0.5 shrink-0 text-sky-500" /> {BIZ.address}
              </li>
              <li className="flex items-center gap-2.5">
                <span className="blink-dot size-2 rounded-full bg-wa-500" />
                <span className="text-wa-500">Open 24×7 · all 7 days</span>
              </li>
            </ul>
          </div>
        </div>

        {/* map */}
        <div className="relative mt-14 overflow-hidden rounded-xl border border-white/10">
          <iframe
            title="Apna Punjab Cab Service on Google Maps — Ludhiana"
            src={BIZ.mapsEmbed}
            className="h-64 w-full border-0 sm:h-72"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a
            href={BIZ.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink-950/85 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-sky-500"
          >
            <IconPin size={13} /> Open in Google Maps
          </a>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs font-semibold text-ink-500 sm:flex-row sm:items-center">
          <p>
            © 2026 {BIZ.name} · Ludhiana, Punjab · Since {BIZ.since}
          </p>
          <p className="flex flex-wrap items-center gap-x-2">
            Demo website concept — crafted with pride in Punjab{" "}
            <span className="text-sky-500">·</span> Fares shown are indicative
            <a
              href="#/admin"
              className="rounded-full border border-ink-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-400 transition-colors hover:border-sky-400 hover:text-sky-400"
            >
              Staff login
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  floating actions                                                   */
/* ------------------------------------------------------------------ */

function FloatingActions() {
  return (
    <>
      <div className="group fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6">
        <span className="ping-ring absolute inset-0 rounded-full bg-wa-500" aria-hidden />
        <a
          href={WA_DEFAULT}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="relative grid size-14 place-items-center rounded-full bg-wa-500 text-white shadow-xl shadow-wa-500/40 transition-transform duration-300 hover:scale-110"
        >
          <IconWhatsApp size={27} />
        </a>
        <span className="pointer-events-none absolute right-16 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 md:block">
          Chat on WhatsApp
        </span>
      </div>

      {/* mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 border-t border-ink-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <a href={telHref} className="flex h-14 items-center justify-center gap-2 bg-sky-500 font-bold text-white transition-colors active:bg-sky-600">
          <IconPhone size={18} /> Call now
        </a>
        <a
          href={WA_DEFAULT}
          target="_blank"
          rel="noreferrer"
          className="flex h-14 items-center justify-center gap-2 bg-wa-500 font-bold text-white transition-colors active:bg-wa-600"
        >
          <IconWhatsApp size={18} /> WhatsApp
        </a>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  app                                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  /* re-render the whole page whenever admin-side settings change */
  useSettings();
  return (
    <div className="bg-white font-body text-ink-900 antialiased">
      <Header />
      <main className="pb-14 md:pb-0">
        <Hero />
        <StatsBand />
        <Marquee />
        <Services />
        <Fleet />
        <RoutesSection />
        <WhyUs />
        <Testimonials />
        <CtaBand />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
