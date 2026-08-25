/* ================================================================== */
/*  Public website — true multi-page architecture:                     */
/*  / · /cars · /cars/:id · /booking · /about · /services · /contact   */
/*  /faq · /terms · /privacy — all reading from the unified backend.   */
/* ================================================================== */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  BIZ,
  telHref,
  waHref,
  WA_DEFAULT,
  liveCars,
  useDbVersion,
  ROUTES,
  SERVICES,
  BADGES,
  TESTIMONIALS,
  STATS,
  MARQUEE_ITEMS,
  FAQS,
  oneWayFare,
  roundFare,
  inr,
  type Car,
} from "../data";
import { backend, useRealtime, calcFare, HERO_IMG, type TripType } from "../lib/backend";
import { useSettings } from "../lib/settings";
import { Reveal, CountUp, SmartImg, RoutePath } from "../motion";
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
  IconChevD,
  IconMenu,
  IconX,
  IconNav,
} from "../icons";

/* --------------------------- helpers ------------------------------ */

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5 text-sun-500">
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar key={i} size={size} className={i <= n ? "" : "opacity-25"} />
      ))}
    </span>
  );
}

const SERVICE_ICONS: Record<string, (p: { size?: number; className?: string }) => ReactNode> = {
  plane: (p) => <IconPlane {...p} />,
  city: (p) => <IconCity {...p} />,
  route: (p) => <IconRoute {...p} />,
  loop: (p) => <IconLoop {...p} />,
  briefcase: (p) => <IconBriefcase {...p} />,
  clock: (p) => <IconClock {...p} />,
  shield: (p) => <IconShield {...p} />,
  sparkle: (p) => <IconSparkle {...p} />,
  rupee: (p) => <IconRupee {...p} />,
  bolt: (p) => <IconBolt {...p} />,
  award: (p) => <IconAward {...p} />,
};

function CtaLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (href.startsWith("#/")) {
    return (
      <Link to={href.slice(1)} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

/* ---------------------------- layout ------------------------------ */

const NAV = [
  { to: "/", label: "Home" },
  { to: "/cars", label: "Fleet" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export function PublicLayout() {
  useSettings();
  useDbVersion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "instant" as ScrollBehavior });
  }, [pathname]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen bg-white font-body text-ink-900 antialiased">
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b transition-all duration-300 ${
          scrolled ? "border-ink-100 bg-white/95 shadow-[0_8px_30px_-18px_rgba(11,29,46,0.35)] backdrop-blur" : "border-transparent bg-white/80 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark className="size-10 shrink-0 drop-shadow-sm" />
            <span className="leading-tight">
              <span className="block font-display text-[17px] font-extrabold tracking-tight text-ink-900">Apna Punjab</span>
              <span className="block text-[9.5px] font-bold uppercase tracking-[0.3em] text-sky-600">Cab Service</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors ${isActive ? "text-sky-600" : "text-ink-500 hover:text-ink-900"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              to="/booking"
              className="hidden items-center gap-2 rounded-full bg-ink-900 px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 xl:inline-flex"
            >
              <IconBolt size={15} className="text-sun-400" /> Book online
            </Link>
            <a
              href={telHref()}
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
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  `block border-b border-ink-50 py-3 font-display text-base font-bold ${isActive ? "text-sky-600" : "text-ink-800"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to="/booking" className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 py-3 text-sm font-bold text-white">
                <IconBolt size={15} className="text-sun-400" /> Book online
              </Link>
              <a href={WA_DEFAULT()} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-wa-500 py-3 text-sm font-bold text-white">
                <IconWhatsApp size={16} /> WhatsApp
              </a>
            </div>
          </div>
        )}
      </header>

      <main className="pb-16 md:pb-0">
        <Outlet />
      </main>

      <Footer />

      {/* floating WhatsApp */}
      <a
        href={WA_DEFAULT()}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="group fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6"
      >
        <span className="ping-ring absolute inset-0 rounded-full bg-wa-500" aria-hidden />
        <span className="relative grid size-14 place-items-center rounded-full bg-wa-500 text-white shadow-xl shadow-wa-500/40 transition-transform group-hover:scale-110">
          <IconWhatsApp size={27} />
        </span>
        <span className="pointer-events-none absolute right-16 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block">
          Book on WhatsApp
        </span>
      </a>

      {/* mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-2 border-t border-ink-100 bg-white/95 p-2.5 backdrop-blur md:hidden">
        <a href={telHref()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/30">
          <IconPhone size={17} /> Call now
        </a>
        <Link to="/booking" className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 py-3 text-sm font-bold text-white">
          <IconBolt size={16} className="text-sun-400" /> Book online
        </Link>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink-950 pb-24 pt-16 text-ink-300 md:pb-10">
      <div className="dotgrid-light absolute inset-0" aria-hidden />
      <p className="ghost-text pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[110px] font-extrabold leading-none" aria-hidden>
        APNA PUNJAB
      </p>
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-10" />
            <span className="leading-tight">
              <span className="block font-display text-base font-extrabold text-white">Apna Punjab</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.28em] text-sky-400">Cab Service</span>
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-400">{BIZ.tagline}. Airport transfers, outstation and city rides from Ludhiana.</p>
          <div className="mt-4 flex items-center gap-2">
            <Stars n={5} size={13} />
            <span className="text-xs font-bold text-white">4.6</span>
            <a href={BIZ.mapsUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-ink-400 underline-offset-2 hover:text-sky-400 hover:underline">
              · 162 Google reviews
            </a>
          </div>
        </div>

        <div>
          <p className="font-display text-sm font-extrabold uppercase tracking-wider text-white">Explore</p>
          <ul className="mt-4 space-y-2.5 text-sm font-semibold">
            {[...NAV, { to: "/booking", label: "Book online" }, { to: "/terms", label: "Terms" }, { to: "/privacy", label: "Privacy" }].map((n) => (
              <li key={n.to + n.label}>
                <Link to={n.to} className="transition-colors hover:text-sky-400">{n.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display text-sm font-extrabold uppercase tracking-wider text-white">Popular routes</p>
          <ul className="mt-4 space-y-2.5 text-sm font-semibold">
            {ROUTES.map((r) => (
              <li key={r.id}>
                <Link to="/booking" className="transition-colors hover:text-sky-400">Ludhiana → {r.name.split(" ·")[0]}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display text-sm font-extrabold uppercase tracking-wider text-white">Contact</p>
          <ul className="mt-4 space-y-3 text-sm font-semibold">
            <li className="flex items-start gap-2.5">
              <IconPhone size={16} className="mt-0.5 shrink-0 text-sky-400" />
              <a href={telHref()} className="hover:text-sky-400">{BIZ.phoneDisplay} · 24×7</a>
            </li>
            <li className="flex items-start gap-2.5">
              <IconInstagram size={16} className="mt-0.5 shrink-0 text-sky-400" />
              <a href={BIZ.instagram} target="_blank" rel="noreferrer" className="hover:text-sky-400">{BIZ.instagramHandle}</a>
            </li>
            <li className="flex items-start gap-2.5">
              <IconPin size={16} className="mt-0.5 shrink-0 text-sky-400" />
              <a href={BIZ.mapsUrl} target="_blank" rel="noreferrer" className="hover:text-sky-400">{BIZ.address}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative mx-auto mt-12 flex max-w-7xl flex-col items-start justify-between gap-3 border-t border-white/10 px-4 pt-6 text-xs font-semibold text-ink-500 sm:flex-row sm:items-center sm:px-6">
        <p>© 2026 {BIZ.name} · Ludhiana, Punjab · Since {BIZ.since}</p>
        <p className="flex flex-wrap items-center gap-x-2">
          Fares shown are indicative
          <Link to="/admin/login" className="rounded-full border border-ink-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-500 transition-colors hover:border-sky-400 hover:text-sky-400">
            Staff login
          </Link>
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------ home ------------------------------ */

function FareCheckCard() {
  const cars = liveCars();
  const car = cars[0];
  const [destId, setDestId] = useState("delhi");
  const route = ROUTES.find((r) => r.id === destId) ?? ROUTES[0];
  const fare = car ? oneWayFare(route.km, car.perKm, car.base) : 0;
  const waText = waHref(
    `Hi ${BIZ.name}! I'd like to book a ${car?.name ?? "cab"} from Ludhiana to ${route.name}. Indicative fare ${inr(fare)}. Please confirm.`
  );

  return (
    <div className="relative">
      <div className="absolute -inset-3 translate-x-3 translate-y-3 rotate-1 rounded-3xl bg-sky-200/50" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_30px_70px_-30px_rgba(11,29,46,0.35)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-ink-900">Instant fare check</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
              <span className="size-1.5 rounded-full bg-sky-500" /> Live fares
            </span>
          </div>

          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">Where to from Ludhiana?</p>
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

          {car && (
            <div key={`f-${destId}`} className="tick-in mt-1 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">Indicative one-way</p>
                <p className="font-display text-[40px] font-extrabold leading-none tracking-tight text-ink-900">{inr(fare)}</p>
              </div>
              <div className="text-right text-[13px] font-semibold text-ink-500">
                <p className="font-bold text-ink-700">{car.name}</p>
                <p>{route.km} km · ~{route.eta}</p>
              </div>
            </div>
          )}

          <div className="mt-5 grid grid-cols-[1fr_auto_auto] gap-3">
            <Link
              to={`/booking?route=${route.id}${car ? "&car=" + car.id : ""}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3.5 font-bold text-white shadow-lg shadow-sky-500/30 transition-all hover:-translate-y-0.5 hover:bg-sky-600"
            >
              <IconBolt size={17} /> Book this trip
            </Link>
            <a href={telHref()} aria-label="Book on call" className="grid w-13 place-items-center rounded-xl border-2 border-ink-100 text-ink-700 transition-colors hover:border-sky-400 hover:text-sky-600">
              <IconPhone size={19} />
            </a>
            <a href={waText} target="_blank" rel="noreferrer" aria-label="Book on WhatsApp" className="grid w-13 place-items-center rounded-xl bg-wa-500 text-white transition-all hover:-translate-y-0.5 hover:bg-wa-600">
              <IconWhatsApp size={21} />
            </a>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
            Exact fare confirmed before pickup. Tolls & parking at actuals — never hidden.
          </p>
        </div>
      </div>

      <div className="floaty absolute -left-3 -top-5 hidden items-center gap-2 rounded-full border border-ink-100 bg-white px-4 py-2 shadow-lg sm:inline-flex">
        <IconStar size={16} className="text-sun-500" />
        <span className="font-display text-sm font-extrabold text-ink-900">4.6</span>
        <span className="text-xs font-semibold text-ink-400">· 162 Google reviews</span>
      </div>
    </div>
  );
}

function HomePage() {
  const hero = backend.getHero();
  const cars = liveCars();

  return (
    <>
      {/* hero — fully admin-managed */}
      <section className="relative overflow-hidden bg-white pb-16 pt-28 sm:pb-24 sm:pt-36">
        <div className="dotgrid absolute inset-0" aria-hidden />
        <div className="absolute -right-40 -top-40 size-[540px] rounded-full bg-sky-100/80 blur-3xl" aria-hidden />
        <div className="absolute -bottom-52 -left-40 size-[480px] rounded-full bg-sun-100/70 blur-3xl" aria-hidden />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            {hero.active ? (
              <>
                <Reveal>
                  <span className="inline-flex items-center gap-2 rounded-full border border-sun-400/40 bg-sun-50 px-4 py-1.5 text-xs font-bold text-sun-600">
                    <IconClock size={13} /> {hero.badge}
                  </span>
                </Reveal>
                <Reveal delay={90}>
                  <h1 className="mt-6 font-display text-[42px] font-extrabold leading-[1.02] tracking-tight text-ink-900 sm:text-6xl xl:text-[68px]">
                    {hero.title.split(".")[0]}
                    <span className="text-sky-500">.</span>
                  </h1>
                </Reveal>
                <Reveal delay={170}>
                  <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink-500">{hero.subtitle}</p>
                </Reveal>
                <Reveal delay={250}>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <CtaLink
                      href={hero.ctaLink}
                      className="group inline-flex items-center gap-3 rounded-xl bg-sky-500 px-6 py-4 text-white shadow-xl shadow-sky-500/30 transition-all hover:-translate-y-0.5 hover:bg-sky-600"
                    >
                      <span className="grid size-9 place-items-center rounded-lg bg-white/20 transition-transform group-hover:rotate-12">
                        <IconPhone size={19} />
                      </span>
                      <span className="font-display text-lg font-extrabold tracking-tight">{hero.ctaText}</span>
                    </CtaLink>
                    {hero.cta2Text && (
                      <CtaLink
                        href={hero.cta2Link}
                        className="inline-flex items-center gap-2.5 rounded-xl border-2 border-ink-100 bg-white px-5 py-[15px] font-bold text-ink-800 transition-all hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-700"
                      >
                        <IconBolt size={18} className="text-sun-500" /> {hero.cta2Text}
                      </CtaLink>
                    )}
                  </div>
                </Reveal>
                {hero.promo && (
                  <Reveal delay={330}>
                    <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-xs font-bold text-white">
                      <span className="blink-dot size-1.5 rounded-full bg-wa-500" /> {hero.promo}
                    </p>
                  </Reveal>
                )}
              </>
            ) : (
              <FareCheckCard />
            )}
          </div>

          <div className="relative lg:col-span-6">
            {hero.active && hero.imageUrl && (
              <div className="relative mb-10 hidden overflow-hidden rounded-2xl shadow-2xl lg:block">
                <img src={hero.imageUrl} alt="Apna Punjab cab on a Punjab highway" className="h-64 w-full object-cover" style={{ objectPosition: hero.imagePos }} />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-5 flex items-center gap-3 text-white">
                  <CarGlyph className="w-10 text-sun-400" />
                  <div>
                    <p className="font-display text-lg font-extrabold leading-tight">50,000+ trips & counting</p>
                    <p className="text-xs font-semibold text-ink-200">Clean cars · verified drivers · fair fares</p>
                  </div>
                </div>
              </div>
            )}
            <Reveal delay={150}>
              <FareCheckCard />
            </Reveal>
          </div>
        </div>
      </section>

      {/* destinations marquee */}
      <section className="marquee overflow-hidden border-y border-sky-100 bg-sky-500 py-3.5">
        <div className="marquee-track flex w-max items-center gap-8">
          {[0, 1].map((half) => (
            <div key={half} className="flex items-center gap-8" aria-hidden={half === 1}>
              {MARQUEE_ITEMS.map((m) => (
                <span key={m + half} className="flex items-center gap-8 whitespace-nowrap font-display text-sm font-extrabold uppercase tracking-[0.18em] text-white">
                  {m}
                  <CarGlyph className="w-7 text-sun-400" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* stats */}
      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 text-center sm:px-6 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <p className="font-display text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
                <CountUp target={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
              </p>
              <p className="mt-1.5 text-[13px] font-bold uppercase tracking-wider text-ink-400">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* services */}
      <section className="bg-gradient-to-b from-white via-ink-50 to-ink-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
              <span className="h-px w-8 bg-current" /> What we do
            </p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
              One number for every kind of ride.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <Reveal key={s.title} delay={(i % 3) * 100} className={i === 0 ? "lg:row-span-2" : ""}>
                <article className={`group h-full rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${i === 0 ? "bg-ink-900 border-ink-900" : ""}`}>
                  <span className={`grid size-12 place-items-center rounded-xl transition-transform group-hover:rotate-6 ${i === 0 ? "bg-sky-500 text-white" : "bg-sky-100 text-sky-600"}`}>
                    {SERVICE_ICONS[s.icon]({ size: 23 })}
                  </span>
                  <h3 className={`mt-5 font-display text-xl font-extrabold ${i === 0 ? "text-white" : "text-ink-900"}`}>{s.title}</h3>
                  <p className={`mt-2.5 text-[14.5px] leading-relaxed ${i === 0 ? "text-ink-300" : "text-ink-500"}`}>{s.desc}</p>
                  {s.chips && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {s.chips.map((c) => (
                        <span key={c} className={`rounded-full px-3 py-1 text-[11px] font-bold ${i === 0 ? "bg-white/10 text-sky-300" : "bg-sky-50 text-sky-700"}`}>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  {i === 0 && (
                    <Link to="/booking" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sun-400 transition-all hover:gap-3">
                      Book an airport transfer <IconArrow size={15} />
                    </Link>
                  )}
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* fleet preview */}
      <section className="bg-ink-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Reveal className="max-w-xl">
              <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
                <span className="h-px w-8 bg-current" /> The fleet
              </p>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">Clean cars, honest per-km rates.</h2>
            </Reveal>
            <Reveal delay={120}>
              <Link to="/cars" className="inline-flex items-center gap-2 rounded-xl border-2 border-ink-200 bg-white px-5 py-3 font-bold text-ink-800 transition-all hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-700">
                Browse all cars <IconArrow size={17} />
              </Link>
            </Reveal>
          </div>
          <div className="mt-12 grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cars.slice(0, 3).map((car, i) => (
              <CarCard key={car.id} car={car} delay={i * 110} offset={i} />
            ))}
          </div>
        </div>
      </section>

      {/* why us */}
      <section className="relative overflow-hidden bg-ink-950 py-20 text-white">
        <div className="dotgrid-light absolute inset-0" aria-hidden />
        <p className="ghost-text pointer-events-none absolute right-0 top-6 select-none font-display text-[150px] font-extrabold leading-none" aria-hidden>
          24×7
        </p>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-sky-400">
              <span className="h-px w-8 bg-current" /> Why Apna Punjab
            </p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              The way Punjab used to travel — <span className="text-sky-400">on a handshake.</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES.map((b, i) => (
              <Reveal key={b.title} delay={(i % 3) * 100}>
                <div className="group flex h-full gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:-translate-y-1 hover:border-sky-400/40 hover:bg-white/10">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-400 transition-transform group-hover:scale-110">
                    {SERVICE_ICONS[b.icon]({ size: 21 })}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-extrabold">{b.title}</h3>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-ink-300">{b.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* testimonials */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
              <span className="h-px w-8 bg-current" /> Word on the street
            </p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">162 reviews. 4.6 stars. Zero drama.</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 120} className={i === 1 ? "md:-translate-y-4" : ""}>
                <figure className="flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl">
                  <Stars n={t.stars} />
                  <blockquote className="mt-4 flex-1 text-[14.5px] leading-relaxed text-ink-600">“{t.text}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-ink-50 pt-4">
                    <span className={`grid size-10 place-items-center rounded-full font-display text-sm font-extrabold text-white ${t.tone}`}>
                      {t.name.split(" ").map((w) => w[0]).join("")}
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-ink-900">{t.name}</span>
                      <span className="block text-[11px] font-semibold text-ink-400">{t.meta}</span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaBand />
    </>
  );
}

function CarCard({ car, delay = 0, offset = 0 }: { car: Car; delay?: number; offset?: number }) {
  return (
    <Reveal delay={delay} className={offset % 3 === 1 ? "lg:mt-8" : offset % 3 === 2 ? "lg:mt-16" : ""}>
      <article className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-ink-900/10">
        <Link to={`/cars/${car.id}`} className={`relative block h-44 overflow-hidden bg-gradient-to-br sm:h-48 ${car.tone}`}>
          <SmartImg src={car.img} alt={`${car.name} — ${car.tag}`} label={car.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
          {car.ribbon && (
            <span className="absolute left-3.5 top-3.5 rounded-full bg-ink-900 px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-white">
              {car.ribbon}
            </span>
          )}
        </Link>
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-xl font-extrabold text-ink-900">{car.name}</h3>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-600">{car.tag}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-extrabold text-ink-900">₹{car.perKm}</p>
              <p className="text-[10px] font-bold uppercase text-ink-400">per km</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] font-semibold text-ink-500">
            <span className="flex items-center gap-1.5"><IconUsers size={14} className="text-sky-500" /> {car.seats}</span>
            <span className="flex items-center gap-1.5"><IconBag size={14} className="text-sky-500" /> {car.bags}</span>
            <span className="flex items-center gap-1.5"><IconAc size={14} className="text-sky-500" /> {car.fuel}</span>
          </div>
          <div className="mt-5 grid grid-cols-[1fr_auto] gap-2.5">
            <Link to={`/cars/${car.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink-100 py-2.5 text-sm font-bold text-ink-700 transition-colors hover:border-sky-400 hover:text-sky-700">
              View details
            </Link>
            <Link to={`/booking?car=${car.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/25 transition-all hover:bg-sky-600">
              Book <IconArrow size={14} />
            </Link>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-sky-500 to-sky-400 py-16">
      <div className="dotgrid-light absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute bottom-3 left-0 h-1 w-full bg-ink-950/20" aria-hidden>
        <span className="drive-across absolute bottom-1 block w-14 text-ink-950/70">
          <CarGlyph className="w-14" />
        </span>
      </div>
      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-7 px-4 text-center sm:px-6">
        <Reveal>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Your cab is one call away. <span className="text-sun-400">Literally.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] font-semibold text-sky-100">
            Book online in a minute, or call {BIZ.phoneDisplay} — a real person answers, 24×7, and your fare is locked before the wheel turns.
          </p>
        </Reveal>
        <Reveal delay={130}>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href={telHref()} className="inline-flex items-center gap-3 rounded-xl bg-white px-7 py-4 font-display text-xl font-extrabold text-sky-700 shadow-2xl transition-all hover:-translate-y-1">
              <IconPhone size={22} /> {BIZ.phoneDisplay}
            </a>
            <Link to="/booking" className="inline-flex items-center gap-2.5 rounded-xl bg-ink-950 px-6 py-4 font-bold text-white transition-all hover:-translate-y-1">
              <IconBolt size={18} className="text-sun-400" /> Book online
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ /cars ----------------------------- */

function CarsPage() {
  const cars = liveCars();
  return (
    <div className="bg-ink-50/60 pb-20 pt-28 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
            <span className="h-px w-8 bg-current" /> Our fleet
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink-900 sm:text-6xl">
            Pick your ride.
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink-500">
            Every car is serviced on schedule, sanitized before each trip and driven by a verified professional. Fares below are live from our pricing desk.
          </p>
        </Reveal>

        {cars.length === 0 ? (
          <div className="mt-14 grid place-items-center rounded-2xl border-2 border-dashed border-ink-200 bg-white px-6 py-24 text-center">
            <CarGlyph className="w-16 text-ink-300" />
            <p className="mt-4 font-display text-xl font-extrabold text-ink-900">The fleet is being polished</p>
            <p className="mt-1 max-w-sm text-sm font-semibold text-ink-400">
              All cars are temporarily unavailable online — call {BIZ.phoneDisplay} and we'll arrange a cab for you.
            </p>
            <a href={telHref()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-bold text-white">
              <IconPhone size={17} /> {BIZ.phoneDisplay}
            </a>
          </div>
        ) : (
          <div className="mt-12 grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cars.map((car, i) => (
              <CarCard key={car.id} car={car} delay={(i % 3) * 110} offset={i} />
            ))}
          </div>
        )}
      </div>
      <div className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <CtaBand />
      </div>
    </div>
  );
}

/* --------------------------- /cars/:id ---------------------------- */

function CarDetailPage() {
  const { id } = useParams();
  useRealtime();
  const car = id ? backend.getVehicle(id) : null;
  const images = id ? backend.imagesOf(id) : [];

  const [activeImg, setActiveImg] = useState(0);

  if (!car) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-4 pt-24 text-center">
        <div>
          <CarGlyph className="mx-auto w-16 text-ink-300" />
          <h1 className="mt-4 font-display text-3xl font-extrabold text-ink-900">Car not found</h1>
          <p className="mt-2 text-sm font-semibold text-ink-400">It may have been retired from the fleet.</p>
          <Link to="/cars" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-bold text-white">
            ← Browse the fleet
          </Link>
        </div>
      </div>
    );
  }

  const gallery = images.length ? images : [{ id: "x", vehicleId: car.id, url: car.img, alt: car.name, isPrimary: true, sortOrder: 0 }];
  const current = gallery[Math.min(activeImg, gallery.length - 1)];

  return (
    <div className="bg-ink-50/60 pb-20 pt-28 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Link to="/cars" className="text-xs font-bold uppercase tracking-wider text-sky-600 hover:text-sky-700">← All cars</Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-12">
          {/* gallery */}
          <div className="lg:col-span-7">
            <Reveal>
              <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br shadow-xl ${car.tone}`}>
                <SmartImg
                  key={current.id}
                  src={current.url}
                  alt={current.alt}
                  label={car.name}
                  className="tick-in aspect-[16/10] w-full object-cover"
                />
                {car.ribbon && (
                  <span className="absolute left-4 top-4 rounded-full bg-ink-900 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-white">{car.ribbon}</span>
                )}
                <span className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider ${car.available ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                  {car.available ? "Available today" : "Unavailable"}
                </span>
              </div>
            </Reveal>
            {gallery.length > 1 && (
              <div className="mt-3 flex gap-2.5">
                {gallery.map((g, i) => (
                  <button
                    key={g.id}
                    onClick={() => setActiveImg(i)}
                    aria-label={`Photo ${i + 1}`}
                    className={`h-16 w-24 overflow-hidden rounded-xl border-2 transition-all ${i === activeImg ? "border-sky-500 shadow-md" : "border-transparent opacity-70 hover:opacity-100"}`}
                  >
                    <img src={g.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <Reveal delay={120}>
              <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
                <h2 className="font-display text-lg font-extrabold text-ink-900">About this car</h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-500">{car.description || "A well-maintained " + car.tag.toLowerCase() + " from our Ludhiana fleet."}</p>
                {car.features.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {car.features.map((f) => (
                      <span key={f} className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">
                        <IconCheck size={12} /> {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </div>

          {/* booking rail */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal delay={80}>
                <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-xl shadow-ink-900/5 sm:p-7">
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-600">{car.tag}</p>
                  <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-ink-900">{car.name}</h1>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] font-semibold text-ink-500">
                    <span className="flex items-center gap-1.5"><IconUsers size={15} className="text-sky-500" /> {car.seats} seats</span>
                    <span className="flex items-center gap-1.5"><IconBag size={15} className="text-sky-500" /> {car.bags}</span>
                    <span className="flex items-center gap-1.5"><IconAc size={15} className="text-sky-500" /> {car.fuel}</span>
                    <span className="flex items-center gap-1.5"><IconBolt size={15} className="text-sky-500" /> {car.transmission}</span>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-2.5 text-center">
                    <div className="rounded-2xl bg-sky-50 py-3.5">
                      <p className="font-display text-2xl font-extrabold text-sky-700">₹{car.perKm}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">per km</p>
                    </div>
                    <div className="rounded-2xl bg-ink-50 py-3.5">
                      <p className="font-display text-2xl font-extrabold text-ink-900">₹{car.base}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">base fare</p>
                    </div>
                    <div className="rounded-2xl bg-ink-50 py-3.5">
                      <p className="font-display text-2xl font-extrabold text-ink-900">₹{car.cityFrom}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">city from</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    {ROUTES.slice(0, 4).map((r) => (
                      <Link
                        key={r.id}
                        to={`/booking?car=${car.id}&route=${r.id}`}
                        className="group flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50/50"
                      >
                        <span className="text-sm font-bold text-ink-700">Ludhiana → {r.name.split(" ·")[0]}</span>
                        <span className="flex items-center gap-2.5">
                          <span className="font-display text-base font-extrabold text-ink-900">{inr(oneWayFare(r.km, car.perKm, car.base))}</span>
                          <IconArrow size={15} className="text-sky-500 transition-transform group-hover:translate-x-1" />
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-[1fr_auto] gap-2.5">
                    <Link
                      to={`/booking?car=${car.id}`}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-4 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 ${car.available ? "bg-sky-500 shadow-sky-500/30 hover:bg-sky-600" : "cursor-not-allowed bg-ink-300 shadow-none"}`}
                    >
                      <IconBolt size={18} /> {car.available ? "Book this car" : "Unavailable"}
                    </Link>
                    <a href={telHref()} aria-label="Call to book" className="grid w-14 place-items-center rounded-xl border-2 border-ink-100 text-ink-700 transition-colors hover:border-sky-400 hover:text-sky-600">
                      <IconPhone size={20} />
                    </a>
                  </div>
                  <p className="mt-3 text-[11.5px] leading-relaxed text-ink-400">
                    Fare locked before pickup · free cancellation up to 1 hour before · tolls at actuals.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- /booking ---------------------------- */

const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function BookingPage() {
  const [params] = useSearchParams();
  useRealtime();
  const cars = liveCars();
  const navigate = useNavigate();

  const [vehicleId, setVehicleId] = useState(() => {
    const q = params.get("car");
    return q && cars.some((c) => c.id === q) ? q : cars[0]?.id ?? "";
  });
  const [tripType, setTripType] = useState<TripType>("one-way");
  const [routeId, setRouteId] = useState<string>(() => params.get("route") ?? "custom");
  const [pickup, setPickup] = useState("Ludhiana");
  const [dropoff, setDropoff] = useState("");
  const [km, setKm] = useState(100);
  const [pickupAt, setPickupAt] = useState(() => {
    const d = new Date(Date.now() + 2 * 3600000);
    d.setMinutes(0, 0, 0);
    return toLocalInput(d);
  });
  const [returnAt, setReturnAt] = useState(() => {
    const d = new Date(Date.now() + 12 * 3600000);
    d.setMinutes(0, 0, 0);
    return toLocalInput(d);
  });
  const [passengers, setPassengers] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);

  const vehicle = cars.find((c) => c.id === vehicleId) ?? cars[0];

  const pickRoute = (rid: string) => {
    setRouteId(rid);
    const r = ROUTES.find((x) => x.id === rid);
    if (r) {
      setDropoff(r.name.split(" ·")[0]);
      setKm(r.km);
    }
  };

  useEffect(() => {
    const r = ROUTES.find((x) => x.id === routeId);
    if (r && !dropoff) {
      setDropoff(r.name.split(" ·")[0]);
      setKm(r.km);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fare = vehicle ? calcFare(km || 0, vehicle.perKm, vehicle.base, tripType) : 0;

  const validate = () => {
    const fe: Record<string, string> = {};
    if (!vehicle) fe.vehicle = "Pick a vehicle.";
    if (name.trim().length < 3) fe.name = "Enter your full name.";
    if (!/^[0-9+\-\s]{10,14}$/.test(phone.trim())) fe.phone = "Enter a valid phone number.";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) fe.email = "Enter a valid email.";
    if (!pickup.trim()) fe.pickup = "Required.";
    if (!dropoff.trim()) fe.dropoff = "Where are you going?";
    if (!km || km <= 0) fe.km = "Distance needed for the fare.";
    if (!pickupAt) fe.pickupAt = "Pick a pickup time.";
    if (tripType === "round" && returnAt && new Date(returnAt) <= new Date(pickupAt)) fe.returnAt = "Return must be after pickup.";
    setFieldErr(fe);
    return Object.keys(fe).length === 0;
  };

  const submit = async () => {
    setError("");
    if (!validate()) {
      setError("Please fix the highlighted fields.");
      return;
    }
    if (!vehicle) return;
    setSubmitting(true);
    const res = await backend.createWebsiteBooking({
      name,
      phone,
      email,
      altPhone,
      vehicleId: vehicle.id,
      pickup,
      dropoff,
      km,
      tripType,
      pickupAt: new Date(pickupAt).toISOString(),
      returnAt: tripType === "round" ? new Date(returnAt).toISOString() : null,
      passengers,
      notes,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong. Please try again or call us.");
      return;
    }
    setDone(res.id ?? "");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  /* ------------------------- success state ------------------------ */
  if (done && vehicle) {
    return (
      <div className="grid min-h-[80vh] place-items-center bg-ink-50/60 px-4 pb-20 pt-28">
        <div className="w-full max-w-xl rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-2xl shadow-ink-900/10">
          <span className="tick-in mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <IconCheck size={30} />
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">Booking received!</h1>
          <p className="mt-2 text-sm font-semibold text-ink-400">Your reference</p>
          <p className="font-mono text-2xl font-extrabold tracking-wide text-sky-600">{done}</p>

          <div className="mt-6 rounded-2xl bg-ink-50 p-5 text-left text-sm">
            <div className="flex justify-between gap-4 py-1.5"><span className="font-semibold text-ink-400">Vehicle</span><span className="font-extrabold text-ink-900">{vehicle.name}</span></div>
            <div className="flex justify-between gap-4 py-1.5"><span className="font-semibold text-ink-400">Route</span><span className="font-extrabold text-ink-900">{pickup} → {dropoff}</span></div>
            <div className="flex justify-between gap-4 py-1.5"><span className="font-semibold text-ink-400">Pickup</span><span className="font-extrabold text-ink-900">{new Date(pickupAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span></div>
            <div className="flex justify-between gap-4 border-t border-ink-100 py-1.5 pt-3"><span className="font-semibold text-ink-400">Indicative fare</span><span className="font-display text-lg font-extrabold text-ink-900">{inr(fare)}</span></div>
          </div>

          <div className="mt-6 space-y-2 text-left text-[13.5px] font-semibold text-ink-500">
            <p className="flex gap-2.5"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-sky-100 text-[10px] font-extrabold text-sky-700">1</span> Our team calls you within minutes to confirm.</p>
            <p className="flex gap-2.5"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-sky-100 text-[10px] font-extrabold text-sky-700">2</span> Fare is locked on that call — it never changes after.</p>
            <p className="flex gap-2.5"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-sky-100 text-[10px] font-extrabold text-sky-700">3</span> Driver details arrive on WhatsApp the evening before.</p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <a href={waHref(`Hi! I just booked online (ref ${done}) — ${vehicle.name}, ${pickup} to ${dropoff}.`)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-wa-500 py-3 text-sm font-bold text-white hover:bg-wa-600">
              <IconWhatsApp size={17} /> WhatsApp us
            </a>
            <a href={telHref()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-bold text-white hover:bg-sky-600">
              <IconPhone size={16} /> Call {BIZ.phoneDisplay}
            </a>
          </div>
          <button onClick={() => navigate("/")} className="mt-4 text-xs font-bold text-ink-400 hover:text-sky-600">← Back to home</button>
        </div>
      </div>
    );
  }

  /* --------------------------- form state ------------------------- */
  const err = (k: string) => fieldErr[k] && <span className="mt-1 block text-[11px] font-bold text-rose-600">{fieldErr[k]}</span>;

  return (
    <div className="bg-ink-50/60 pb-24 pt-28 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
            <span className="h-px w-8 bg-current" /> Book online
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
            Reserve your cab in a minute.
          </h1>
          <p className="mt-3 text-[15px] font-semibold text-ink-500">
            Live availability check · instant reference number · our team confirms on call within minutes.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          {/* form */}
          <div className="space-y-6 lg:col-span-7">
            {/* vehicle */}
            <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-ink-900">
                <span className="grid size-7 place-items-center rounded-full bg-sky-500 text-sm text-white">1</span> Choose your car
              </h2>
              {cars.length === 0 ? (
                <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                  No cars are available online right now — please call {BIZ.phoneDisplay}.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {cars.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setVehicleId(c.id)}
                      className={`rounded-2xl border-2 p-3.5 text-left transition-all hover:-translate-y-0.5 ${vehicleId === c.id ? "border-sky-500 bg-sky-50/60 shadow-md" : "border-ink-100 hover:border-sky-300"}`}
                    >
                      <span className="block truncate font-display text-[15px] font-extrabold text-ink-900">{c.name}</span>
                      <span className="block text-[11px] font-bold text-ink-400">{c.tag} · {c.seats}</span>
                      <span className="mt-1.5 block font-display text-lg font-extrabold text-sky-600">₹{c.perKm}<span className="text-xs text-ink-400">/km</span></span>
                    </button>
                  ))}
                </div>
              )}
              {err("vehicle")}
            </section>

            {/* trip */}
            <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-ink-900">
                <span className="grid size-7 place-items-center rounded-full bg-sky-500 text-sm text-white">2</span> Trip details
              </h2>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-ink-100 bg-ink-50 p-1">
                  {(["one-way", "round"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTripType(t)}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${tripType === t ? "bg-ink-900 text-white shadow" : "text-ink-500 hover:text-ink-800"}`}
                    >
                      {t === "one-way" ? "One-way" : "Round trip"}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-semibold text-ink-400">Round trip includes driver halt time</span>
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Popular routes — or enter your own below</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ROUTES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => pickRoute(r.id)}
                      className={`rounded-full border-2 px-3.5 py-1.5 text-[13px] font-bold transition-all ${routeId === r.id ? "border-ink-900 bg-ink-900 text-white" : "border-ink-100 text-ink-600 hover:border-sky-400 hover:text-sky-700"}`}
                    >
                      {r.name.split(" ·")[0]} · {r.km} km
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Pickup location</label>
                  <input value={pickup} onChange={(e) => setPickup(e.target.value)} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" placeholder="e.g. Model Town, Ludhiana" />
                  {err("pickup")}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Drop-off location</label>
                  <input value={dropoff} onChange={(e) => { setDropoff(e.target.value); setRouteId("custom"); }} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" placeholder="e.g. Delhi IGI Airport" />
                  {err("dropoff")}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Pickup date & time</label>
                  <input type="datetime-local" value={pickupAt} onChange={(e) => setPickupAt(e.target.value)} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" />
                  {err("pickupAt")}
                </div>
                {tripType === "round" ? (
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Return date & time</label>
                    <input type="datetime-local" value={returnAt} onChange={(e) => setReturnAt(e.target.value)} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" />
                    {err("returnAt")}
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Passengers</label>
                    <select value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100">
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n} passenger{n > 1 ? "s" : ""}</option>)}
                    </select>
                  </div>
                )}
                {tripType === "round" && (
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Passengers</label>
                    <select value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100">
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n} passenger{n > 1 ? "s" : ""}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Distance (km) {routeId !== "custom" ? "— auto from route" : ""}</label>
                  <input type="number" min={1} value={km} onChange={(e) => { setKm(Number(e.target.value)); setRouteId("custom"); }} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" />
                  {err("km")}
                </div>
              </div>
            </section>

            {/* contact */}
            <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-ink-900">
                <span className="grid size-7 place-items-center rounded-full bg-sky-500 text-sm text-white">3</span> Your details
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Full name *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" placeholder="e.g. Rahul Sharma" />
                  {err("name")}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Phone *</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" placeholder="98xxx xxxxx" />
                  {err("phone")}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Email (optional)</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" placeholder="you@example.com" />
                  {err("email")}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Alternate phone (optional)</label>
                  <input value={altPhone} onChange={(e) => setAltPhone(e.target.value)} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" placeholder="In case we miss you" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Special requirements</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" placeholder="Flight number, luggage count, child seat, wheelchair access…" />
                </div>
              </div>
            </section>

            {error && (
              <div className="shake rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={submitting || !vehicle}
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-sky-500 py-4.5 font-display text-lg font-extrabold text-white shadow-xl shadow-sky-500/30 transition-all hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4"
            >
              {submitting ? (
                <>
                  <span className="size-2 animate-ping rounded-full bg-white" /> Checking availability…
                </>
              ) : (
                <>
                  <IconBolt size={20} /> Confirm booking request
                </>
              )}
            </button>
            <p className="text-center text-[11.5px] font-semibold text-ink-400">
              No payment needed now — you pay the driver directly. Free cancellation up to 1 hour before pickup.
            </p>
          </div>

          {/* live summary */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-xl shadow-ink-900/5">
                {vehicle && (
                  <div className={`relative h-36 bg-gradient-to-br ${vehicle.tone}`}>
                    <SmartImg src={vehicle.img} alt={vehicle.name} label={vehicle.name} className="absolute inset-0 h-full w-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">Live fare summary</p>
                  <p className="mt-1 font-display text-xl font-extrabold text-ink-900">{vehicle?.name ?? "—"}</p>
                  <p className="text-sm font-semibold text-ink-500">{pickup || "Ludhiana"} → {dropoff || "…"}</p>

                  <div key={`${vehicleId}-${km}-${tripType}`} className="tick-in mt-5 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="font-semibold text-ink-400">Distance</span><span className="font-bold text-ink-800">{km} km {tripType === "round" ? "× round trip" : ""}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-ink-400">Rate</span><span className="font-bold text-ink-800">₹{vehicle?.perKm ?? 0}/km + ₹{vehicle?.base ?? 0} base</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-ink-400">Pickup</span><span className="font-bold text-ink-800">{pickupAt ? new Date(pickupAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—"}</span></div>
                    <div className="mt-3 flex items-end justify-between border-t border-ink-100 pt-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Indicative total</span>
                      <span className="font-display text-4xl font-extrabold tracking-tight text-ink-900">{inr(fare)}</span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 rounded-2xl bg-ink-50 p-4 text-xs font-semibold text-ink-500">
                    <p className="flex items-center gap-2"><IconCheck size={13} className="text-emerald-500" /> Availability checked against live bookings</p>
                    <p className="flex items-center gap-2"><IconCheck size={13} className="text-emerald-500" /> Fare locked on confirmation call</p>
                    <p className="flex items-center gap-2"><IconCheck size={13} className="text-emerald-500" /> Tolls & parking billed at actuals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- simple pages --------------------------- */

function PageShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="bg-ink-50/60 pb-20 pt-28 sm:pt-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal>
          <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
            <span className="h-px w-8 bg-current" /> {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">{title}</h1>
        </Reveal>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <PageShell eyebrow="Our story" title="Started with one Dzire and a promise.">
      <Reveal>
        <div className="space-y-5 text-[15.5px] leading-relaxed text-ink-600">
          <p>
            <strong className="text-ink-900">Apna Punjab Cab Service</strong> began in {BIZ.since} with a single Swift Dzire, a
            phone that never switched off, and a simple rule: <em className="font-semibold not-italic text-ink-900">the fare you hear is the fare you pay.</em>
          </p>
          <p>
            Five years and fifty thousand trips later, that rule hasn't changed. What has changed is everything around it — a
            fleet of sanitized Dzires, Ertigas and Innova Crystas; drivers who have done the Delhi run so many times they know
            every toll plaza by name; and a booking desk that answers at 3 AM because flights don't wait for office hours.
          </p>
          <p>
            We're not an app. We're the number Ludhiana families save, the account corporates trust for monthly billing, and
            the decorated Crysta that shows up for the baraat. That's the business we're in — <strong className="text-ink-900">trust, on four wheels.</strong>
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 80}>
            <div className="rounded-2xl border border-ink-100 bg-white p-5 text-center shadow-sm">
              <p className="font-display text-3xl font-extrabold text-ink-900">
                <CountUp target={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-10 space-y-4">
        {[
          { y: "2019", t: "One Dzire, one phone", d: "Gurpreet ji starts airport runs from Model Town with a promise of honest fares." },
          { y: "2021", t: "The fleet grows", d: "Ertigas join for family trips; Manali and Shimla become weekly runs." },
          { y: "2023", t: "Corporate accounts", d: "Textile houses and hospitals put us on monthly billing for staff travel." },
          { y: "2025", t: "50,000 trips", d: "Innova Crystas, wedding fleets, and a 4.6-star rating across 162 Google reviews." },
        ].map((m, i) => (
          <Reveal key={m.y} delay={i * 90}>
            <div className="flex gap-5 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <span className="font-display text-2xl font-extrabold text-sky-500">{m.y}</span>
              <div>
                <h3 className="font-display text-base font-extrabold text-ink-900">{m.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">{m.d}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-12"><CtaBand /></div>
    </PageShell>
  );
}

function ServicesPage() {
  return (
    <PageShell eyebrow="Services" title="Every ride Punjab needs.">
      <div className="grid gap-5 sm:grid-cols-2">
        {SERVICES.map((s, i) => (
          <Reveal key={s.title} delay={(i % 2) * 100}>
            <article className="group h-full rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
              <span className="grid size-12 place-items-center rounded-xl bg-sky-100 text-sky-600 transition-transform group-hover:rotate-6">
                {SERVICE_ICONS[s.icon]({ size: 23 })}
              </span>
              <h3 className="mt-4 font-display text-xl font-extrabold text-ink-900">{s.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-500">{s.desc}</p>
              {s.chips && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.chips.map((c) => (
                    <span key={c} className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-700">{c}</span>
                  ))}
                </div>
              )}
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12">
        <h2 className="font-display text-2xl font-extrabold text-ink-900">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { n: "1", t: "Tell us the route", d: "Online, call or WhatsApp — date, time, passengers." },
            { n: "2", t: "Fare gets locked", d: "One number, agreed before the wheel turns." },
            { n: "3", t: "Driver arrives early", d: "Details on WhatsApp the evening before." },
            { n: "4", t: "Pay at the end", d: "Cash, UPI or monthly corporate billing." },
          ].map((st, i) => (
            <div key={st.n} className="relative rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
              <span className="font-display text-4xl font-extrabold text-sky-100">{st.n}</span>
              <h3 className="mt-1 font-display text-base font-extrabold text-ink-900">{st.t}</h3>
              <p className="mt-1 text-[13px] font-semibold leading-relaxed text-ink-500">{st.d}</p>
              {i < 3 && <IconArrow size={18} className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-sky-300 sm:block" />}
            </div>
          ))}
        </div>
      </Reveal>
      <div className="mt-12"><CtaBand /></div>
    </PageShell>
  );
}

function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!name.trim() || !phone.trim() || !msg.trim()) return;
    setBusy(true);
    setTimeout(() => {
      backend.submitEnquiry(name.trim(), phone.trim(), msg.trim());
      setBusy(false);
      setSent(true);
    }, 500);
  };

  return (
    <PageShell eyebrow="Contact" title="Talk to a human, any hour.">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          {[
            { icon: <IconPhone size={20} />, t: "Call 24×7", d: BIZ.phoneDisplay, href: telHref(), ext: false },
            { icon: <IconWhatsApp size={20} />, t: "WhatsApp", d: "Fastest for bookings — send route + date", href: WA_DEFAULT(), ext: true },
            { icon: <IconInstagram size={20} />, t: "Instagram", d: BIZ.instagramHandle, href: BIZ.instagram, ext: true },
            { icon: <IconPin size={20} />, t: "Office", d: BIZ.address, href: BIZ.mapsUrl, ext: true },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 80}>
              <a
                href={c.href}
                target={c.ext ? "_blank" : undefined}
                rel="noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-600 transition-transform group-hover:scale-110">{c.icon}</span>
                <span>
                  <span className="block font-display text-base font-extrabold text-ink-900">{c.t}</span>
                  <span className="block text-sm font-semibold text-ink-500">{c.d}</span>
                </span>
                <IconArrow size={17} className="ml-auto text-sky-400 transition-transform group-hover:translate-x-1" />
              </a>
            </Reveal>
          ))}
          <Reveal delay={340}>
            <div className="overflow-hidden rounded-2xl border border-ink-100 shadow-sm">
              <iframe title="Apna Punjab Cab Service on Google Maps" src={BIZ.mapsEmbed} className="h-56 w-full" loading="lazy" />
            </div>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-xl shadow-ink-900/5 sm:p-7">
            {sent ? (
              <div className="py-10 text-center">
                <span className="tick-in mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <IconCheck size={26} />
                </span>
                <h2 className="mt-4 font-display text-2xl font-extrabold text-ink-900">Message received</h2>
                <p className="mx-auto mt-2 max-w-xs text-sm font-semibold text-ink-500">
                  We'll call you back on {phone} shortly. For instant booking, call {BIZ.phoneDisplay}.
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-display text-2xl font-extrabold text-ink-900">Send a message</h2>
                <p className="mt-1 text-sm font-semibold text-ink-400">Goes straight to the booking desk.</p>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Phone</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Message</label>
                    <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" placeholder="Route, date, passengers…" />
                  </div>
                  <button
                    onClick={submit}
                    disabled={busy || !name.trim() || !phone.trim() || !msg.trim()}
                    className="w-full rounded-xl bg-sky-500 py-3.5 font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-50"
                  >
                    {busy ? "Sending…" : "Send message"}
                  </button>
                </div>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}

function FaqPage() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <PageShell eyebrow="FAQ" title="Questions we hear every day.">
      <div className="space-y-3">
        {FAQS.map((f, i) => {
          const open = openIdx === i;
          return (
            <Reveal key={f.q} delay={i * 50}>
              <div className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${open ? "border-sky-300" : "border-ink-100"}`}>
                <button onClick={() => setOpenIdx(open ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="font-display text-[15.5px] font-extrabold text-ink-900">{f.q}</span>
                  <IconChevD size={18} className={`shrink-0 text-sky-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                </button>
                <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-[14.5px] leading-relaxed text-ink-500">{f.a}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
      <div className="mt-12"><CtaBand /></div>
    </PageShell>
  );
}

function TermsPage() {
  return (
    <PageShell eyebrow="Legal" title="Terms & Conditions">
      <div className="space-y-6 text-[14.5px] leading-relaxed text-ink-600">
        {[
          { h: "1. Bookings & confirmation", p: "Online booking requests are confirmed by phone or WhatsApp before the trip. A booking is final once our team confirms the fare and assigns a driver. Fares quoted on the website are indicative and are locked at confirmation." },
          { h: "2. Pricing & payments", p: "Fares are calculated as distance × per-km rate + base charge; round trips are billed at 1.75× the one-way fare including driver halt time. Tolls, parking and state taxes are charged at actuals and itemised. Payment is made directly to the driver (cash/UPI) or via monthly invoice for corporate accounts." },
          { h: "3. Cancellation", p: "Cancellation is free up to 1 hour before the scheduled pickup. Within 1 hour, a convenience fee of ₹200 applies. No-shows may be charged up to 25% of the quoted fare." },
          { h: "4. Customer conduct", p: "Passengers must not carry illegal items, smoke in the vehicle, or request the driver to violate traffic rules. Damage to the vehicle caused by a passenger is chargeable. The driver may refuse or end a trip in case of unsafe behaviour, with fare payable for the distance covered." },
          { h: "5. Waiting & halt time", p: "Round-trip bookings include standard halt time as communicated at booking. Additional night halts attract a fixed charge quoted upfront. Waiting beyond 45 minutes at any stop is billed at ₹100/hour." },
          { h: "6. Liability", p: "We carry standard commercial vehicle insurance. Our liability for indirect losses (missed flights, events) is limited to the fare of the trip. Please allow adequate buffer for airport transfers; drivers depart as per the agreed schedule." },
        ].map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-lg font-extrabold text-ink-900">{s.h}</h2>
            <p className="mt-2">{s.p}</p>
          </section>
        ))}
        <p className="rounded-2xl bg-ink-50 p-4 text-sm font-semibold text-ink-500">
          Questions about these terms? Call {BIZ.phoneDisplay} or email {BIZ.email}.
        </p>
      </div>
    </PageShell>
  );
}

function PrivacyPage() {
  return (
    <PageShell eyebrow="Legal" title="Privacy Policy">
      <div className="space-y-6 text-[14.5px] leading-relaxed text-ink-600">
        {[
          { h: "What we collect", p: "When you book, we collect your name, phone number, optional email, pickup/drop-off locations and trip details. Corporate clients additionally share billing details required for invoicing." },
          { h: "How we use it", p: "Your details are used solely to operate your booking — assigning a driver, confirming fares, sending trip updates on call/WhatsApp, and maintaining your trip history so repeat bookings are faster." },
          { h: "What we never do", p: "We never sell your data, never share your phone number with third-party marketers, and never track you beyond what is needed to run your trip. Drivers see only what they need: name, pickup point and contact number." },
          { h: "Retention & your rights", p: "Trip records are retained for billing and support. You may request a copy of your data or its deletion at any time by calling " + BIZ.phoneDisplay + " or emailing " + BIZ.email + "." },
          { h: "Cookies & analytics", p: "This website uses minimal, privacy-respecting storage to remember preferences. It does not run advertising trackers." },
        ].map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-lg font-extrabold text-ink-900">{s.h}</h2>
            <p className="mt-2">{s.p}</p>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

/* ----------------------------- exports ---------------------------- */

export const PUBLIC_ROUTES = { HomePage, CarsPage, CarDetailPage, BookingPage, AboutPage, ServicesPage, ContactPage, FaqPage, TermsPage, PrivacyPage };

export function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 pt-24 text-center">
      <div>
        <CarGlyph className="mx-auto w-20 text-ink-300" />
        <h1 className="mt-4 font-display text-5xl font-extrabold text-ink-900">Wrong turn?</h1>
        <p className="mt-2 text-sm font-semibold text-ink-400">That page doesn't exist — but Ludhiana to anywhere does.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-bold text-white">
          <IconNav size={16} /> Back to home
        </Link>
      </div>
    </div>
  );
}
