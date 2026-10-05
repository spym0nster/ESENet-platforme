"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { OperationalDay, Role } from "@/generated/prisma/enums";
import { guarded, invalid, type ActionResult } from "@/lib/action";
import { audit } from "@/lib/audit";
import { actor } from "@/lib/auth";
import { DAY_LABEL } from "@/lib/constants";
import { db } from "@/lib/db";
import { cleanText, normalizeEmail } from "@/lib/utils";

const tempPassword = () => randomBytes(12).toString("base64url");

/* ── Platform settings ─────────────────────────────────────── */

const settingsSchema = z.object({
  applicationsOpen: z.boolean(),
  allowMultipleAssignments: z.boolean(),
  currentDayOverride: z.enum(OperationalDay).nullable(),
});

export async function updateSettings(input: z.input<typeof settingsSchema>): Promise<ActionResult> {
  return guarded("updateSettings", async () => {
    const user = await actor({ admin: true });
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await db.$transaction(async (tx) => {
      const prev = await tx.appSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
      await tx.appSetting.update({ where: { id: 1 }, data: parsed.data });
      await audit(
        {
          userId: user.id,
          action: "settings.updated",
          targetType: "settings",
          targetId: "1",
          summary: "Platform settings updated",
          previous: { applicationsOpen: prev.applicationsOpen, allowMultipleAssignments: prev.allowMultipleAssignments, currentDayOverride: prev.currentDayOverride },
          next: parsed.data,
        },
        tx,
      );
    });
    revalidatePath("/", "layout");
    return { ok: true, message: "Settings saved" };
  });
}

const dateOrEmpty = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use YYYY-MM-DD.");
const datesSchema = z.object({ J_MINUS_2: dateOrEmpty, J_MINUS_1: dateOrEmpty, JOUR_J: dateOrEmpty });

export async function setDayDates(input: z.input<typeof datesSchema>): Promise<ActionResult> {
  return guarded("setDayDates", async () => {
    const user = await actor({ admin: true });
    const parsed = datesSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    const filled = [d.J_MINUS_2, d.J_MINUS_1, d.JOUR_J];
    if (filled.every(Boolean) && !(filled[0]! < filled[1]! && filled[1]! < filled[2]!)) {
      return { ok: false, error: "Dates must run J-2 → J-1 → Jour J in order." };
    }
    await db.$transaction(async (tx) => {
      for (const key of Object.keys(d) as OperationalDay[]) {
        const date = d[key] ? new Date(`${d[key]}T00:00:00.000Z`) : null;
        const prev = await tx.scheduleDay.findUnique({ where: { key } });
        await tx.scheduleDay.upsert({ where: { key }, update: { date }, create: { key, label: DAY_LABEL[key], title: DAY_LABEL[key], date } });
        if ((prev?.date?.toISOString().slice(0, 10) ?? "") !== (d[key] ?? "")) {
          await audit(
            { userId: user.id, action: "schedule.day_date_set", targetType: "schedule", targetId: prev?.id ?? null, summary: `${DAY_LABEL[key]} date set to ${d[key] || "—"}`, previous: { date: prev?.date?.toISOString().slice(0, 10) ?? null }, next: { date: d[key] || null } },
            tx,
          );
        }
      }
    });
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Operational dates saved" };
  });
}

/* ── Staff accounts ────────────────────────────────────────── */

const newUserSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email.")),
  role: z.enum(Role),
});

export async function createStaffUser(input: z.input<typeof newUserSchema>): Promise<ActionResult<{ tempPassword: string }>> {
  return guarded<{ tempPassword: string }>("createStaffUser", async () => {
    const user = await actor({ admin: true });
    const parsed = newUserSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    const password = tempPassword();
    try {
      await db.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: { name: cleanText(d.name), email: normalizeEmail(d.email), role: d.role, passwordHash: await bcrypt.hash(password, 12) },
        });
        await audit({ userId: user.id, action: "user.created", targetType: "user", targetId: u.id, summary: `${d.role === "ADMIN" ? "Admin" : "Ambassador"} account created for ${u.name}`, next: { email: u.email, role: u.role } }, tx);
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return { ok: false, error: "An account with this email already exists.", fieldErrors: { email: "Already used." } };
      }
      throw err;
    }
    revalidatePath("/admin/settings");
    return { ok: true, data: { tempPassword: password }, message: "Account created" };
  });
}

const updateUserSchema = z.object({ id: z.string().min(1).max(64), role: z.enum(Role), active: z.boolean() });

export async function updateStaffUser(input: z.input<typeof updateUserSchema>): Promise<ActionResult> {
  return guarded("updateStaffUser", async () => {
    const user = await actor({ admin: true });
    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    if (d.id === user.id && (d.role !== "ADMIN" || !d.active)) {
      return { ok: false, error: "You can't remove your own admin access. Ask another admin." };
    }
    const res = await db.$transaction(async (tx) => {
      const prev = await tx.user.findUnique({ where: { id: d.id } });
      if (!prev) return "missing" as const;
      if (prev.role === "ADMIN" && (d.role !== "ADMIN" || !d.active)) {
        const admins = await tx.user.count({ where: { role: "ADMIN", active: true, id: { not: d.id } } });
        if (admins === 0) return "last-admin" as const;
      }
      await tx.user.update({ where: { id: d.id }, data: { role: d.role, active: d.active } });
      await audit(
        { userId: user.id, action: "user.updated", targetType: "user", targetId: d.id, summary: `${prev.name}: ${prev.role}/${prev.active ? "active" : "disabled"} → ${d.role}/${d.active ? "active" : "disabled"}`, previous: { role: prev.role, active: prev.active }, next: { role: d.role, active: d.active } },
        tx,
      );
      return "ok" as const;
    });
    if (res === "missing") return { ok: false, error: "This account no longer exists." };
    if (res === "last-admin") return { ok: false, error: "There must always be at least one active admin." };
    revalidatePath("/admin/settings");
    return { ok: true, message: "Account updated" };
  });
}

export async function resetStaffPassword(id: string): Promise<ActionResult<{ tempPassword: string }>> {
  return guarded<{ tempPassword: string }>("resetStaffPassword", async () => {
    const user = await actor({ admin: true });
    if (!z.string().min(1).max(64).safeParse(id).success) return { ok: false, error: "Invalid account." };
    const password = tempPassword();
    const target = await db.user.findUnique({ where: { id }, select: { name: true } });
    if (!target) return { ok: false, error: "This account no longer exists." };
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
      await audit({ userId: user.id, action: "user.password_reset", targetType: "user", targetId: id, summary: `Password reset for ${target.name}` }, tx);
    });
    return { ok: true, data: { tempPassword: password }, message: "Temporary password generated" };
  });
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password.").max(200),
    next: z.string().min(12, "Use at least 12 characters.").max(200),
    confirm: z.string().max(200),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Passwords don't match." })
  .refine((v) => v.next !== v.current, { path: ["next"], message: "Choose a different password." });

export async function changeOwnPassword(input: z.input<typeof passwordSchema>): Promise<ActionResult> {
  return guarded("changeOwnPassword", async () => {
    const user = await actor();
    const parsed = passwordSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const row = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
    if (!(await bcrypt.compare(parsed.data.current, row.passwordHash))) {
      return { ok: false, error: "Current password is incorrect.", fieldErrors: { current: "Incorrect." } };
    }
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.next, 12) } });
      await audit({ userId: user.id, action: "user.password_changed", targetType: "user", targetId: user.id, summary: `${user.name} changed their password` }, tx);
    });
    return { ok: true, message: "Password changed" };
  });
}

/* ── Skills ────────────────────────────────────────────────── */

export async function addSkill(name: string): Promise<ActionResult> {
  return guarded("addSkill", async () => {
    const user = await actor({ admin: true });
    const parsed = z.string().trim().min(2, "Name is required.").max(60).safeParse(name);
    if (!parsed.success) return invalid(parsed.error);
    const clean = cleanText(parsed.data);
    const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || randomBytes(4).toString("hex");
    try {
      await db.$transaction(async (tx) => {
        const max = await tx.skill.aggregate({ _max: { sortOrder: true }, where: { isOther: false } });
        const s = await tx.skill.create({ data: { name: clean, slug, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
        await audit({ userId: user.id, action: "skill.created", targetType: "skill", targetId: s.id, summary: `Skill “${clean}” added`, next: { name: clean } }, tx);
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return { ok: false, error: "This skill already exists." };
      throw err;
    }
    revalidatePath("/admin", "layout");
    revalidatePath("/apply");
    return { ok: true, message: "Skill added" };
  });
}

export async function setSkillActive(id: string, active: boolean): Promise<ActionResult> {
  return guarded("setSkillActive", async () => {
    const user = await actor({ admin: true });
    const skill = await db.skill.findUnique({ where: { id } });
    if (!skill) return { ok: false, error: "This skill no longer exists." };
    await db.$transaction(async (tx) => {
      await tx.skill.update({ where: { id }, data: { active } });
      await audit({ userId: user.id, action: active ? "skill.enabled" : "skill.disabled", targetType: "skill", targetId: id, summary: `Skill “${skill.name}” ${active ? "shown on" : "hidden from"} the application form`, previous: { active: skill.active }, next: { active } }, tx);
    });
    revalidatePath("/admin", "layout");
    revalidatePath("/apply");
    return { ok: true, message: active ? "Skill shown on the form" : "Skill hidden from the form" };
  });
}
