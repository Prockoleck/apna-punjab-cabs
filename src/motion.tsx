import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { CarGlyph } from "./icons";

/* ----------------------- reduced motion hook ---------------------- */

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

/* --------------------------- scroll reveal ------------------------ */

export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "figure";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = delay ? { transitionDelay: `${delay}ms` } : {};
  return (
    <Tag
      // @ts-expect-error polymorphic ref
      ref={ref}
      style={style}
      className={`reveal ${inView ? "is-in" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}

/* --------------------------- count-up stat ------------------------ */

export function CountUp({
  target,
  decimals = 0,
  suffix = "",
  prefix = "",
  duration = 1600,
  className = "",
}: {
  target: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(target * eased);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  const text =
    decimals > 0
      ? val.toFixed(decimals)
      : Math.round(val).toLocaleString("en-IN");

  return (
    <span ref={ref} className={className}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

/* --------------------- image with graceful fallback --------------- */

export function SmartImg({
  src,
  alt,
  className = "",
  label,
}: {
  src: string;
  alt: string;
  className?: string;
  label?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-sky-200 to-ink-200 ${className}`}
      >
        <div className="dotgrid absolute inset-0" />
        <div className="flex flex-col items-center gap-2 text-sky-700">
          <CarGlyph className="w-24 text-sky-600/80" />
          {label && (
            <span className="font-display text-sm font-semibold tracking-wide">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

/* ------------------------ animated route SVG ---------------------- */

export function RoutePath({ active }: { active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const d = "M16 62 C 86 8, 178 92, 284 30";
  return (
    <svg viewBox="0 0 300 92" className="w-full" aria-hidden>
      {/* soft baseline */}
      <path d={d} stroke="#e0f2fe" strokeWidth="7" fill="none" strokeLinecap="round" />
      {/* moving dashes */}
      <path
        d={d}
        stroke={active ? "#0EA5E9" : "#7dd3fc"}
        strokeWidth="2.4"
        fill="none"
        className="road-dash"
      />
      {/* start dot */}
      <circle cx="16" cy="62" r="5.5" fill="#0b1d2e" />
      <circle cx="16" cy="62" r="2.4" fill="#fff" />
      {/* destination pin */}
      <g transform="translate(284 26)">
        <path d="M0 4 C -7 -4, -7 -14, 0 -16 C 7 -14, 7 -4, 0 4Z" fill="#0EA5E9" />
        <circle cy="-8.5" r="3" fill="#fff" />
      </g>
      {/* travelling car */}
      {reduced ? (
        <g transform="translate(120 35)">
          <CarGlyph className="w-8 text-ink-900" />
        </g>
      ) : (
        <g>
          <animateMotion
            dur="5.5s"
            repeatCount="indefinite"
            rotate="auto"
            path={d}
          />
          <g transform="translate(-17 -14)">
            <CarGlyph className="w-8 text-ink-900" />
          </g>
        </g>
      )}
    </svg>
  );
}
