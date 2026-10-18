import type { CSSProperties, ReactNode } from "react";

// Visual language lifted from the Data Alchimie poster (Affiche-final.png,
// Programme-final.png): the data-lined "D", the test-tube "i", the flask the
// data pours into, and node diagrams. Everything is drawn in code so it stays
// sharp and can move; every animation is switched off for reduced motion
// (see the .anim-* rules in globals.css).

type Vars = CSSProperties & Record<`--${string}`, string | number>;

// Small deterministic PRNG so particle layouts are identical on server and
// client (no hydration drift) and between builds.
function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Title lockup                                                        */
/* ------------------------------------------------------------------ */

// The poster's "D": four data lines run through the letter with nodes on
// them. The overlay multiplies, so lines only show where they cross the
// light glyph and vanish over the dark counter and background.
const D_LINES = [0.085, 0.37, 0.66, 0.946];
const D_NODES: { line: number; x: number; color: string; delay: string }[] = [
  { line: 0, x: 30, color: "#12b5d8", delay: "0s" },
  { line: 1, x: 18, color: "#2a48d0", delay: "0.6s" },
  { line: 1, x: 85, color: "#12b5d8", delay: "1.2s" },
  { line: 2, x: 18, color: "#2a48d0", delay: "1.8s" },
  { line: 2, x: 85, color: "#12b5d8", delay: "2.4s" },
  { line: 3, x: 52, color: "#5be36b", delay: "3s" },
];

function DataD() {
  return (
    <span className="relative inline-block">
      D
      <span aria-hidden className="pointer-events-none absolute inset-0 mix-blend-multiply">
        {D_LINES.map((f, i) => (
          <span
            key={f}
            className="absolute left-[0.06em] right-0 h-[0.014em] min-h-px"
            style={{
              top: `calc(var(--cap-top) + var(--cap-h) * ${f})`,
              background: i === 3 ? "linear-gradient(90deg,#2a48d0,#12b5d8 60%,#5be36b)" : "linear-gradient(90deg,#2a48d0,#12b5d8)",
            }}
          />
        ))}
        {D_NODES.map((n) => (
          <span
            key={`${n.line}-${n.x}`}
            className="anim-blink absolute size-[0.05em] min-h-1 min-w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              top: `calc(var(--cap-top) + var(--cap-h) * ${D_LINES[n.line]} + 0.007em)`,
              left: `${n.x}%`,
              background: n.color,
              animationDelay: n.delay,
            }}
          />
        ))}
      </span>
    </span>
  );
}

// The poster's test-tube "i": ringed dot, lip, tube, and a gradient liquid
// that sloshes while bubbles rise.
function TestTube({ id }: { id: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 32 110"
      className="mx-[0.035em] inline-block h-[0.8em] w-auto overflow-visible align-baseline"
    >
      <defs>
        <linearGradient id={`${id}-liquid`} x1="10" y1="58" x2="22" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2a48d0" />
          <stop offset="0.5" stopColor="#12b5d8" />
          <stop offset="1" stopColor="#5be36b" />
        </linearGradient>
        <clipPath id={`${id}-inside`}>
          <path d="M11 26V92a5 5 0 0 0 10 0V26Z" />
        </clipPath>
      </defs>
      <circle cx="16" cy="8" r="7" fill="currentColor" />
      <circle className="anim-glow" cx="16" cy="8" r="3.4" fill="#5be36b" />
      <rect x="3" y="20" width="26" height="5" rx="2.5" fill="currentColor" />
      <path d="M9 25V92a7 7 0 0 0 14 0V25Z" fill="#07122e" fillOpacity="0.9" />
      <g clipPath={`url(#${id}-inside)`}>
        <path
          className="anim-slosh"
          style={{ "--period": "-16px" } as Vars}
          d="M-8 58q4-3 8 0t8 0 8 0 8 0 8 0 8 0 8 0V112H-8Z"
          fill={`url(#${id}-liquid)`}
        />
        {[
          [14, 96, "0s"],
          [18, 90, "1.1s"],
          [15, 84, "2.2s"],
        ].map(([cx, cy, delay]) => (
          <circle
            key={String(delay)}
            className="anim-bubble"
            style={{ "--rise": "-30px", "--dur": "3.4s", animationDelay: String(delay) } as Vars}
            cx={cx}
            cy={cy}
            r="1.3"
            fill="#eef4ff"
          />
        ))}
      </g>
      <circle className="anim-blink" cx="14.5" cy="38" r="1.2" fill="#1fdcc4" />
      <circle className="anim-blink" style={{ animationDelay: "1s" }} cx="17.5" cy="47" r="1.2" fill="#1fdcc4" />
      <path d="M9 25V92a7 7 0 0 0 14 0V25" fill="none" stroke="currentColor" strokeWidth="3.6" />
    </svg>
  );
}

export function TitleLockup({ id, className = "" }: { id?: string; className?: string }) {
  return (
    <h1 id={id} className={`font-display font-semibold leading-none tracking-[-0.02em] ${className}`}>
      <span className="sr-only">Data Alchimie</span>
      <span
        aria-hidden
        className="flex flex-wrap items-baseline justify-center gap-x-[0.26em] gap-y-[0.06em]"
        style={{ "--cap-top": "0.153em", "--cap-h": "0.7em" } as Vars}
      >
        <span className="whitespace-nowrap">
          <DataD />
          ata
        </span>
        <span className="whitespace-nowrap">
          Alch
          <TestTube id="hero-tube" />
          mie
        </span>
      </span>
    </h1>
  );
}

// "—— Turning Data into Value ——"
export function RuledLine({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-center justify-center gap-4 sm:gap-6 ${className}`}>
      <span aria-hidden className="h-px w-8 bg-gradient-to-r from-transparent to-blue-light/70 sm:w-20" />
      <span>{children}</span>
      <span aria-hidden className="h-px w-8 bg-gradient-to-l from-transparent to-blue-light/70 sm:w-20" />
    </p>
  );
}

// DATA → INTELLIGENCE → VALUE, in the poster's three colours.
export function TransmutationRow({
  className = "",
  align = "center",
  tone = "dark",
}: {
  className?: string;
  align?: "center" | "start";
  tone?: "dark" | "light";
}) {
  // On white the bright poster colours lose contrast, so the light tone uses
  // their deeper siblings.
  const words =
    tone === "dark"
      ? [
          ["Data", "text-blue-light"],
          ["Intelligence", "text-cyan"],
          ["Value", "text-green"],
        ]
      : [
          ["Data", "text-blue"],
          ["Intelligence", "text-teal"],
          ["Value", "text-green-deep"],
        ];
  return (
    <p
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 font-display ${align === "center" ? "justify-center" : "justify-start"} font-semibold uppercase tracking-[0.3em] sm:gap-x-6 ${className}`}
    >
      {words.map(([w, color], i) => (
        <span key={w} className="flex items-center gap-x-3 sm:gap-x-6">
          <span className={color}>{w}</span>
          {i < 2 && (
            <span aria-hidden className={`tracking-normal ${tone === "dark" ? "text-snow/60" : "text-ink/35"}`}>
              →
            </span>
          )}
        </span>
      ))}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Data line — a hairline with nodes and a travelling pulse            */
/* ------------------------------------------------------------------ */

export function DataLine({ className = "", tone = "light" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <div aria-hidden className={`relative h-px w-full overflow-hidden ${tone === "dark" ? "bg-white/10" : "bg-ink/10"} ${className}`}>
      <span
        className={`anim-travel absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent to-transparent ${tone === "dark" ? "via-cyan-bright" : "via-cyan"}`}
      />
    </div>
  );
}

// A full-width rule with the three nodes sitting on it.
export function NodeRule({ className = "", tone = "light" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <div aria-hidden className={`relative ${className}`}>
      <DataLine tone={tone} />
      <span className="absolute left-[12%] top-1/2 size-2 -translate-y-1/2 rounded-full bg-blue-light" />
      <span
        className={`absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan ${tone === "dark" ? "bg-navy" : "bg-white"}`}
      />
      <span className="absolute right-[12%] top-1/2 size-2 -translate-y-1/2 bg-green" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Node-diagram icons (after the programme poster's line icons)        */
/* ------------------------------------------------------------------ */

export type IconKind =
  | "welcome"
  | "opening"
  | "origins"
  | "lab"
  | "break"
  | "minds"
  | "stands"
  | "workshop"
  | "closing";

export function NodeIcon({ kind, className = "" }: { kind: IconKind; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const };
  const dot = (cx: number, cy: number, r = 1.4) => <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />;
  const ring = (cx: number, cy: number, r = 2.6) => <circle cx={cx} cy={cy} r={r} {...p} />;
  const shapes: Record<IconKind, ReactNode> = {
    welcome: (
      <>
        <path d="M2 17h8M16 3v2M16 8v2" {...p} />
        {ring(16, 17, 3.2)}
        {dot(16, 17, 1)}
      </>
    ),
    opening: (
      <>
        <path d="M14 3v4M14 21v4M3 14h4M21 14h4" {...p} />
        {ring(14, 14)}
        {dot(14, 14, 0.9)}
        {dot(5, 5, 0.8)}
        {dot(23, 5, 0.8)}
        {dot(5, 23, 0.8)}
        {dot(23, 23, 0.8)}
      </>
    ),
    origins: (
      <>
        <path d="M5 4l9 17M10 3l4 18M18 3l-4 18M23 4l-9 17" {...p} />
        {dot(5, 4)}
        {dot(10, 3)}
        {dot(18, 3)}
        {dot(23, 4)}
        {ring(14, 22)}
      </>
    ),
    lab: (
      <>
        <path d="M5 6l18 16M23 5L5 22M5 6l18-1M5 22h18" {...p} strokeDasharray="0" />
        {dot(5, 6)}
        {dot(23, 5)}
        {dot(5, 22)}
        {dot(23, 22)}
        {ring(14, 14)}
      </>
    ),
    break: (
      <>
        <path d="M2 14h8M18 14h8M12 10v8M16 10v8" {...p} />
        {dot(2, 14)}
        {dot(26, 14)}
      </>
    ),
    minds: (
      <>
        <path d="M4 6l10 8 10-8M14 14v8" {...p} />
        <path d="M4 6L14 24 24 6Z" {...p} strokeDasharray="1.5 2.5" opacity="0.6" />
        {dot(4, 6)}
        {dot(24, 6)}
        {ring(14, 14)}
      </>
    ),
    stands: (
      <>
        <path d="M4 7h20M4 21h20M8 7v14M20 7v14" {...p} />
        {dot(4, 7)}
        {dot(24, 7)}
        {dot(4, 21)}
        {dot(24, 21)}
      </>
    ),
    workshop: (
      <>
        <path d="M3 9h22" {...p} strokeDasharray="1 3" />
        <path d="M7 13v8M14 13v8M21 13v8" {...p} />
        {dot(7, 22)}
        {dot(14, 22)}
        {dot(21, 22)}
      </>
    ),
    closing: (
      <>
        <path d="M4 4l10 16M9 3l5 17M19 3l-5 17M24 4L14 20" {...p} />
        {ring(14, 22, 2.2)}
        <path d="M17 24v-4M20 24v-6M23 24v-3" {...p} />
      </>
    ),
  };
  return (
    <svg aria-hidden viewBox="0 0 28 28" className={`size-7 shrink-0 ${className}`}>
      {shapes[kind]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* The flask                                                           */
/* ------------------------------------------------------------------ */

// Flask geometry (viewBox 0 0 480 560). Neck x 200–280 down to y 200, then
// the body slopes out to the bottom corners at x 72 / 408, y 494.
const NECK_L = 200;
const NECK_R = 280;
const SHOULDER_Y = 200;
const BASE_Y = 494;
const SLOPE = (NECK_L - 72) / (BASE_Y - SHOULDER_Y);

export function flaskEdge(side: "left" | "right", y: number) {
  const yy = Math.min(Math.max(y, 50), BASE_Y);
  const out = yy <= SHOULDER_Y ? 0 : (yy - SHOULDER_Y) * SLOPE;
  return side === "left" ? NECK_L - out : NECK_R + out;
}

export const FLASK_H = 560;
export const FLASK_W = 480;
const FOCAL = { x: 240, y: 300 };

export type Connector = { side: "left" | "right"; y: number; color: string };

export function Flask({
  connectors = [],
  className = "",
  idPrefix = "flask",
}: {
  connectors?: Connector[];
  className?: string;
  idPrefix?: string;
}) {
  const rnd = prng(8);
  const outline = "M200 54V200L72 494Q64 516 88 518H392Q416 516 408 494L280 200V54";
  const inside = "M203 56V201L76 495Q70 513 90 515H390Q410 513 404 495L277 201V56Z";

  // Data arriving from above: particles drifting into the rim.
  const incoming = Array.from({ length: 34 }, (_, i) => {
    const x = 110 + rnd() * 260;
    const y = -30 + rnd() * 70;
    return {
      x,
      y,
      r: 1.2 + rnd() * 2.4,
      color: rnd() > 0.45 ? "#1fdcc4" : "#6e8bff",
      dx: 240 + (rnd() - 0.5) * 60 - x,
      dy: 60 - y,
      dur: 2.6 + rnd() * 2.6,
      delay: -rnd() * 5,
      i,
    };
  });
  // Fibres: rim → focal point (blue), focal point → base (green).
  const fibresIn = Array.from({ length: 22 }, (_, i) => 204 + (i / 21) * 72);
  const fibresOut = Array.from({ length: 26 }, (_, i) => 92 + (i / 25) * 296);
  const bubbles = Array.from({ length: 22 }, () => ({
    x: 110 + rnd() * 260,
    y: 420 + rnd() * 90,
    r: 1 + rnd() * 2.2,
    dur: 3 + rnd() * 4,
    delay: -rnd() * 6,
  }));

  return (
    <svg aria-hidden viewBox={`0 0 ${FLASK_W} ${FLASK_H}`} className={`overflow-visible ${className}`}>
      <defs>
        <linearGradient id={`${idPrefix}-stroke`} x1="0" y1="40" x2="0" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6e8bff" />
          <stop offset="0.5" stopColor="#12b5d8" />
          <stop offset="1" stopColor="#5be36b" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-liquid`} x1="0" y1="380" x2="0" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0b7f95" stopOpacity="0.85" />
          <stop offset="1" stopColor="#5be36b" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id={`${idPrefix}-focal`}>
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.25" stopColor="#1fdcc4" stopOpacity="0.45" />
          <stop offset="1" stopColor="#1fdcc4" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${idPrefix}-inside`}>
          <path d={inside} />
        </clipPath>
        <filter id={`${idPrefix}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* connectors to the programme items */}
      {connectors.map((c, i) => {
        const ex = flaskEdge(c.side, c.y);
        const x0 = c.side === "left" ? 0 : FLASK_W;
        return (
          <g key={i}>
            <path d={`M${x0} ${c.y}H${ex}`} stroke={c.color} strokeOpacity="0.6" strokeWidth="1.2" fill="none" />
            <circle cx={ex} cy={c.y} r="9" fill={c.color} opacity="0.18" />
            <circle className="anim-blink" style={{ animationDelay: `${i * 0.4}s` }} cx={ex} cy={c.y} r="4" fill={c.color} />
          </g>
        );
      })}

      {/* incoming data */}
      {incoming.map((p) => (
        <g key={p.i}>
          {p.i % 3 === 0 && (
            <line x1={p.x} y1={p.y} x2={240 + (p.x - 240) * 0.25} y2="52" stroke={p.color} strokeOpacity="0.22" strokeWidth="0.8" />
          )}
          <circle
            className="anim-inflow"
            style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px`, "--dur": `${p.dur}s`, animationDelay: `${p.delay}s` } as Vars}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={p.color}
          />
        </g>
      ))}

      {/* glow + outline */}
      <path d={outline} fill="none" stroke={`url(#${idPrefix}-stroke)`} strokeWidth="10" opacity="0.25" filter={`url(#${idPrefix}-blur)`} />
      <path d={inside} fill="#07122e" fillOpacity="0.55" />

      <g clipPath={`url(#${idPrefix}-inside)`}>
        {/* fibres converging into the focal point and fanning into the liquid */}
        {fibresIn.map((x, i) => (
          <line key={`in${i}`} x1={x} y1="56" x2={FOCAL.x} y2={FOCAL.y} stroke="#4a8dff" strokeOpacity="0.4" strokeWidth="0.8" />
        ))}
        {fibresOut.map((x, i) => (
          <line key={`out${i}`} x1={FOCAL.x} y1={FOCAL.y} x2={x} y2="516" stroke="#5be36b" strokeOpacity="0.32" strokeWidth="0.8" />
        ))}
        {/* liquid with a moving surface */}
        <path
          className="anim-slosh"
          style={{ "--period": "-80px" } as Vars}
          d="M40 392q20-12 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0V560H40Z"
          fill={`url(#${idPrefix}-liquid)`}
        />
        <path
          className="anim-slosh"
          style={{ "--period": "-80px", animationDuration: "7s" } as Vars}
          d="M40 392q20-12 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0"
          fill="none"
          stroke="#c6f7d0"
          strokeOpacity="0.55"
          strokeWidth="1.5"
        />
        {bubbles.map((b, i) => (
          <circle
            key={i}
            className="anim-bubble"
            style={{ "--rise": "-60px", "--dur": `${b.dur}s`, animationDelay: `${b.delay}s` } as Vars}
            cx={b.x}
            cy={b.y}
            r={b.r}
            fill="#d8ffe0"
            fillOpacity="0.75"
          />
        ))}
        {/* rings floating in the air of the flask, and a glass highlight */}
        {[
          [205, 330, 6],
          [300, 350, 5],
          [250, 250, 4],
          [330, 300, 4],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="#12b5d8" strokeOpacity="0.5" strokeWidth="1.2" />
        ))}
        <path d="M184 260L104 450" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="3" strokeLinecap="round" />
      </g>

      <circle className="anim-glow" cx={FOCAL.x} cy={FOCAL.y} r="46" fill={`url(#${idPrefix}-focal)`} />
      <circle cx={FOCAL.x} cy={FOCAL.y} r="3.5" fill="#ffffff" />

      <path d={outline} fill="none" stroke={`url(#${idPrefix}-stroke)`} strokeWidth="3" strokeLinejoin="round" />
      <rect x="186" y="40" width="108" height="15" rx="7.5" fill="#07122e" stroke={`url(#${idPrefix}-stroke)`} strokeWidth="3" />
    </svg>
  );
}
