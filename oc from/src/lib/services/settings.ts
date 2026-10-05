import "server-only";
import { db } from "@/lib/db";
import type { AppSetting } from "@/generated/prisma/client";

const DEFAULTS: AppSetting = {
  id: 1,
  applicationsOpen: true,
  allowMultipleAssignments: false,
  currentDayOverride: null,
  updatedAt: new Date(0),
};

/** The singleton settings row; created on first read if the seed hasn't run. */
export async function getSettings(): Promise<AppSetting> {
  return db.appSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

/** Public pages: never crash if the DB is briefly unavailable — fall back to defaults. */
export async function getSettingsSafe(): Promise<AppSetting> {
  try {
    return await getSettings();
  } catch (err) {
    console.error("[settings] read failed, using defaults", err);
    return DEFAULTS;
  }
}
