"use client";

import { useSyncExternalStore } from "react";

type Units = { d: string; h: string; m: string; s: string };

function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}
const nowInSeconds = () => Math.floor(Date.now() / 1000);
const noTimeOnServer = () => null;

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({
  startsAt,
  endsAt,
  units,
  live,
  over,
}: {
  startsAt: string;
  endsAt: string;
  units: Units;
  live: string;
  over: string;
}) {
  // null during SSR and hydration, then the real clock — no mismatch.
  const now = useSyncExternalStore(subscribe, nowInSeconds, noTimeOnServer);
  const start = Math.floor(Date.parse(startsAt) / 1000);
  const end = Math.floor(Date.parse(endsAt) / 1000);

  if (now !== null && now >= end) {
    return <p className="font-display text-2xl font-semibold tracking-tight">{over}</p>;
  }
  if (now !== null && now >= start) {
    return (
      <p className="flex items-center gap-3 font-display text-2xl font-semibold tracking-tight">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-70" />
          <span className="relative inline-flex size-2.5 rounded-full bg-green" />
        </span>
        {live}
      </p>
    );
  }

  const left = now === null ? null : start - now;
  const cells: [string, string][] = [
    [left === null ? "––" : String(Math.floor(left / 86400)), units.d],
    [left === null ? "––" : pad(Math.floor((left % 86400) / 3600)), units.h],
    [left === null ? "––" : pad(Math.floor((left % 3600) / 60)), units.m],
    [left === null ? "––" : pad(left % 60), units.s],
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4" role="timer" aria-live="off">
      {cells.map(([value, label]) => (
        <div key={label} className="min-w-0">
          <span className="block font-display text-3xl font-bold tabular-nums tracking-tight sm:text-4xl xl:text-5xl">
            {value}
          </span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.24em] text-mist/70 sm:text-[11px]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
