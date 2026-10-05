"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Hero visual: an "identity file" card with a data line running J-2 → J-1 → JOUR J.
 * Thin lines, three nodes, one draw-in animation. Decorative — hidden from assistive tech.
 */
export function OpsDiagram() {
  const reduce = useReducedMotion();
  const draw = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { duration: 1.1, delay, ease: [0.2, 0.7, 0.2, 1] as const },
        };
  const pop = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { scale: 0, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          transition: { duration: 0.35, delay },
        };

  const nodes = [
    { x: 70, y: 250, label: "J-2", sub: "SETUP" },
    { x: 220, y: 160, label: "J-1", sub: "PREP" },
    { x: 380, y: 92, label: "JOUR J", sub: "OPS" },
  ];

  return (
    <div aria-hidden className="frame-ticks relative border border-line bg-surface/60 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between border-b border-line pb-3">
        <p className="eyebrow">OC / Operations system</p>
        <p className="eyebrow text-right">
          File
          <br />
          <span className="text-text">026</span>
        </p>
      </div>

      <svg viewBox="0 0 460 320" className="mt-4 w-full">
        <defs>
          <linearGradient id="ops-line" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--esen-blue)" />
            <stop offset="55%" stopColor="var(--cyan)" />
            <stop offset="100%" stopColor="var(--green)" />
          </linearGradient>
          <pattern id="ops-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="var(--line)" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="460" height="320" fill="url(#ops-grid)" opacity="0.6" />

        {/* scattered data points — the "raw data" */}
        {[
          [30, 40], [52, 70], [96, 38], [120, 88], [150, 52], [40, 120], [84, 150], [132, 128],
          [300, 250], [330, 220], [360, 270], [410, 230], [430, 280], [270, 290],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.6" fill="var(--text-dim)" />
        ))}

        <motion.path
          d="M70 250 L140 250 L220 160 L300 160 L380 92 L440 92"
          fill="none"
          stroke="url(#ops-line)"
          strokeWidth="1.6"
          {...draw(0.2)}
        />
        <motion.path d="M220 160 L220 300" fill="none" stroke="var(--line-strong)" strokeDasharray="3 4" {...draw(0.8)} />
        <motion.path d="M380 92 L380 300" fill="none" stroke="var(--line-strong)" strokeDasharray="3 4" {...draw(1)} />
        <motion.path d="M70 250 L70 300" fill="none" stroke="var(--line-strong)" strokeDasharray="3 4" {...draw(0.6)} />

        {nodes.map((n, i) => (
          <motion.g key={n.label} style={{ transformOrigin: `${n.x}px ${n.y}px` }} {...pop(0.5 + i * 0.35)}>
            <circle cx={n.x} cy={n.y} r="11" fill="var(--bg)" stroke={i === 2 ? "var(--green)" : "var(--azure)"} strokeWidth="1.2" />
            <circle cx={n.x} cy={n.y} r="3.5" fill={i === 2 ? "var(--green)" : "var(--azure)"} />
            <text x={n.x} y={n.y - 22} textAnchor="middle" fill="var(--text)" fontSize="13" fontWeight="700" fontFamily="var(--font-display)">
              {n.label}
            </text>
          </motion.g>
        ))}
        {nodes.map((n) => (
          <text key={n.sub} x={n.x} y="314" textAnchor="middle" fill="var(--text-dim)" fontSize="9" letterSpacing="2" fontFamily="var(--font-mono)">
            {n.sub}
          </text>
        ))}
      </svg>

      <div className="mt-2 grid grid-cols-3 gap-px border-t border-line pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
        <span>Data</span>
        <span className="text-center">Intelligence</span>
        <span className="text-right text-green">Value</span>
      </div>
    </div>
  );
}
