// Language-independent facts about the 2026 edition. Anything a visitor
// reads lives in the dictionaries (./dictionaries); this file holds the
// numbers, times and links both languages share.

export const EVENT = {
  edition: 8,
  // Tunisia is UTC+1 all year (no daylight saving).
  startsAt: "2026-11-25T08:00:00+01:00",
  endsAt: "2026-11-25T16:00:00+01:00",
  instagramUrl: "https://www.instagram.com/esenet_talentfair/",
  instagramHandle: "@esenet_talentfair",
  platformUrl: "https://esenet-platforme.vercel.app",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=ESEN+%C3%89cole+Sup%C3%A9rieure+de+l%27%C3%89conomie+Num%C3%A9rique+Manouba",
  // Generic club address (as on esenet-tn.com) rather than a personal one.
  contactEmail: "ambassadors@esen.tn",
  partnershipEmail: "ambassadors@esen.tn",
  // ESEN's public Facebook reel of the 2025 (Synapse) edition.
  aftermovieUrl: "https://www.facebook.com/reel/1611796053145700",
} as const;

// 2026 targets from the partnership deck — shown as targets, not results.
export const NUMBERS = [
  { key: "participants", value: 800, suffix: "+" },
  { key: "companies", value: 35, suffix: "+" },
  { key: "speakers", value: 40, suffix: "+" },
  { key: "panels", value: 3, suffix: "" },
  { key: "trained", value: 120, suffix: "+" },
] as const;

export type NumberKey = (typeof NUMBERS)[number]["key"];

// Times follow Programme-final.png (they match the partnership deck).
export const PROGRAMME = [
  { time: "08:00", key: "welcome", tag: "welcome", half: "morning" },
  { time: "09:00", key: "opening", tag: "plenary", half: "morning" },
  { time: "09:30", key: "origins", tag: "panel", half: "morning", panel: 0 },
  { time: "10:30", key: "lab", tag: "panel", half: "morning", panel: 1 },
  { time: "11:30", key: "break", tag: "networking", half: "morning" },
  { time: "12:00", key: "minds", tag: "panel", half: "afternoon", panel: 2 },
  { time: "13:00", key: "stands", tag: "companies", half: "afternoon" },
  { time: "14:00", key: "workshop", tag: "workshop", half: "afternoon" },
  { time: "16:00", key: "closing", tag: "plenary", half: "afternoon" },
] as const;

export type ProgrammeKey = (typeof PROGRAMME)[number]["key"];
export type ProgrammeTag = (typeof PROGRAMME)[number]["tag"];

// Panel accents follow the brand's Data → Intelligence → Value gradient.
export const PANEL_ACCENTS = ["blue", "cyan", "green"] as const;
export const PANEL_TIMES = ["09:30", "10:30", "12:00"] as const;

// Speakers are announced progressively. Add confirmed people here; until a
// panel has someone, the page shows a "to be announced" card for it.
export type Speaker = {
  name: string;
  role: string;
  org: string;
  country?: string;
  panel: 0 | 1 | 2;
  photo?: string;
};

export const SPEAKERS: Speaker[] = [];

// Partnership benefits per tier, from the 2026 partnership deck (p. 18).
export const TIERS = ["bronze", "silver", "gold"] as const;
export type Tier = (typeof TIERS)[number];

export const BENEFITS: { key: string; tiers: Tier[] }[] = [
  { key: "post", tiers: ["bronze", "silver", "gold"] },
  { key: "materials", tiers: ["bronze", "silver", "gold"] },
  { key: "website", tiers: ["bronze", "silver", "gold"] },
  { key: "aftermovie", tiers: ["silver", "gold"] },
  { key: "stand", tiers: ["silver", "gold"] },
  { key: "opening", tiers: ["gold"] },
  { key: "panel", tiers: ["gold"] },
  { key: "cvs", tiers: ["gold"] },
];
