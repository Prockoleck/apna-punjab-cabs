/* Custom hand-drawn inline SVG icon set — stroke-based, inherits currentColor. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (p: P) => {
  const { size = 22, ...rest } = p;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...rest,
  };
};

export const IconPhone = (p: P) => (
  <svg {...base(p)}>
    <path d="M5.5 3.5h3l1.6 4-2 1.6a12.5 12.5 0 0 0 6.8 6.8l1.6-2 4 1.6v3c0 .9-.7 1.6-1.6 1.5C10.9 19.6 4.4 13.1 4 5.1c0-.9.6-1.6 1.5-1.6Z" />
    <path d="M14.5 5.5a5 5 0 0 1 4 4" opacity=".55" />
  </svg>
);

export const IconWhatsApp = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M12 2.2a9.7 9.7 0 0 0-8.3 14.7L2.2 21.8l5-1.5A9.7 9.7 0 1 0 12 2.2Zm0 1.8a7.9 7.9 0 1 1-4 14.7l-.5-.3-2.6.8.8-2.5-.3-.5A7.9 7.9 0 0 1 12 4Zm-3 4.2c-.2 0-.5 0-.7.3-.2.3-.9.9-.9 2.2s.9 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.8 3.3.7.5 0 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3l-.5-.3-1.8-.9c-.2-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.1-.2 0-.4.1-.5l.5-.7c.1-.2.1-.4 0-.6L10.5 9c-.2-.4-.4-.8-.7-.8h-.8Z" />
  </svg>
);

export const IconInstagram = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" stroke="none" />
  </svg>
);

export const IconStar = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 16.9 6.3 20l1.2-6.3-4.7-4.4 6.4-.8L12 2.6Z" />
  </svg>
);

export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21.5s7-6.2 7-11.5a7 7 0 1 0-14 0c0 5.3 7 11.5 7 11.5Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const IconPlane = (p: P) => (
  <svg {...base(p)}>
    <path d="M10.5 13.5 3 11l1.5-1.5 6 .5 4.5-4.5c.8-.8 2.2-1.4 3-1 .4.8-.2 2.2-1 3L12.5 12l.5 6L11.5 20l-2.5-7.5Z" />
    <path d="M4.5 19.5 8 16" opacity=".55" />
  </svg>
);

export const IconRoute = (p: P) => (
  <svg {...base(p)}>
    <circle cx="5.5" cy="18.5" r="2.2" />
    <path d="M7.7 18.5h6.8a3.5 3.5 0 0 0 0-7H9a3 3 0 0 1 0-6h4.3" strokeDasharray="3.2 2.6" />
    <path d="M18.5 2.5 21 5l-2.5 2.5L16 5l2.5-2.5Z" />
  </svg>
);

export const IconCity = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 20.5h18" />
    <path d="M5 20.5V8.5l4-2v14M9 20.5V6.5l6 3v11M15 20.5v-9l4 2v7" />
    <path d="M6.5 11h.9M6.5 14h.9M11.5 11.5h.9M11.5 14.5h.9" opacity=".55" />
  </svg>
);

export const IconLoop = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 9a8 8 0 0 1 14 2.5M19.5 15a8 8 0 0 1-14-2.5" />
    <path d="M18.8 7.5v4h-4M5.2 16.5v-4h4" />
  </svg>
);

export const IconBriefcase = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
    <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
    <path d="M12 11.2v2.6" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5l3.2 2" />
    <path d="M12 1.8v1.4M22.2 12h-1.4M12 22.2v-1.4M1.8 12h1.4" opacity=".55" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2.8 5 5.4v5.4c0 4.6 2.9 8 7 10.4 4.1-2.4 7-5.8 7-10.4V5.4L12 2.8Z" />
    <path d="m8.8 11.8 2.3 2.3 4.2-4.4" />
  </svg>
);

export const IconSparkle = (p: P) => (
  <svg {...base(p)}>
    <path d="M9.5 6.5h-6M6.5 3.5v6" opacity=".6" />
    <path d="M12.8 4.5c.8 4.6 2.7 6.5 7.3 7.3-4.6.8-6.5 2.7-7.3 7.3-.8-4.6-2.7-6.5-7.3-7.3 4.6-.8 6.5-2.7 7.3-7.3Z" />
  </svg>
);

export const IconRupee = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.5 3.5h11M6.5 8h11M7 3.5c4 0 6.5 1 6.5 4.5S10.5 12.5 7 12.5l7 8" />
  </svg>
);

export const IconBolt = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 2.5 5 13.5h5.5L11 21.5l8-11h-5.5L13 2.5Z" />
  </svg>
);

export const IconAward = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="9" r="6" />
    <path d="m8.8 14 -1.6 7 4.8-2.6 4.8 2.6-1.6-7" />
    <path d="m10 9 1.4 1.4L14.2 7.6" />
  </svg>
);

export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20c.5-3.6 2.6-5.5 5.5-5.5s5 1.9 5.5 5.5" />
    <path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14.9c1.7.8 2.7 2.5 3 5.1" opacity=".55" />
  </svg>
);

export const IconBag = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="7" width="16" height="12.5" rx="2.5" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M9.5 11v4.5M14.5 11v4.5" />
  </svg>
);

export const IconAc = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v18M12 3l-2 2M12 3l2 2M12 21l-2-2M12 21l2-2" />
    <path d="m4.2 7.5 15.6 9M4.2 7.5l.4 2.8M4.2 7.5l2.8-.4M19.8 16.5l-.4-2.8M19.8 16.5l-2.8.4" />
    <path d="m19.8 7.5-15.6 9M19.8 7.5l-2.8-.4M19.8 7.5l-.4 2.8M4.2 16.5l2.8.4M4.2 16.5l.4-2.8" opacity=".6" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const IconArrow = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);

export const IconChevD = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 9 7 7 7-7" />
  </svg>
);

export const IconNav = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 3.5 3.5 10.8l7 2.2 2.2 7L21 3.5Z" />
  </svg>
);

export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

/** Small side-view car glyph used inside route animations (drawn facing +x). */
export const CarGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 34 18" className={className} fill="currentColor" aria-hidden>
    <path d="M3 12.5 5 8c.8-1.8 2-2.8 4-2.8h9c2 0 3.4 1 4.4 2.8l1.8 3.3c2 .4 3.3 1.4 3.3 3.2 0 1-.6 1.5-1.5 1.5H4.5c-.9 0-1.5-.5-1.5-1.5 0-.7.3-1.3 0-2Z" opacity=".15" />
    <path d="M4 12.5 6 8.4C6.8 6.7 8 5.8 9.8 5.8h8.2c1.8 0 3 .9 3.8 2.6l2 4.1c1.7.4 2.7 1.2 2.7 2.6 0 .8-.5 1.3-1.3 1.3H5.3c-.8 0-1.3-.5-1.3-1.3v-2.6Z" />
    <path d="M9.9 7h3.4v3.2H8.2l1.7-3.2Zm5 0h3.3l1.6 3.2h-4.9V7Z" fill="#fff" opacity=".85" />
    <circle cx="10" cy="16" r="2.6" />
    <circle cx="24" cy="16" r="2.6" />
    <circle cx="10" cy="16" r="1" fill="#fff" />
    <circle cx="24" cy="16" r="1" fill="#fff" />
  </svg>
);

/** Brand mark — cab front with checker band. */
export const LogoMark = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden>
    <rect width="48" height="48" rx="12" fill="#0EA5E9" />
    <rect x="17" y="7" width="14" height="6" rx="2" fill="#FBBF24" />
    <path
      d="M11 30l3.4-9c.9-2.3 2.4-3.6 4.7-3.6h9.8c2.3 0 3.8 1.3 4.7 3.6L37 30"
      fill="none"
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <rect x="9" y="29" width="30" height="8" rx="2.5" fill="#fff" />
    <rect x="12" y="31" width="4" height="4" fill="#0EA5E9" />
    <rect x="20" y="31" width="4" height="4" fill="#0EA5E9" />
    <rect x="28" y="31" width="4" height="4" fill="#0EA5E9" />
    <circle cx="16" cy="39.5" r="3.4" fill="#0b1d2e" />
    <circle cx="32" cy="39.5" r="3.4" fill="#0b1d2e" />
  </svg>
);
