import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export type StaffUser = { id: string; name: string; email: string; role: Role };

/**
 * Resolve the signed-in staff member from the DB on every request — a JWT alone is not enough:
 * a deactivated or deleted account must lose access immediately, and roles can change.
 */
export const getStaffUser = cache(async (): Promise<StaffUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

/** Page guard: any active staff member (ADMIN or AMBASSADOR). */
export async function requireStaff(): Promise<StaffUser> {
  const user = await getStaffUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Page guard: ADMIN only. Ambassadors are sent back to the dashboard. */
export async function requireAdmin(): Promise<StaffUser> {
  const user = await requireStaff();
  if (user.role !== "ADMIN") redirect("/admin?denied=1");
  return user;
}

export const isAdmin = (u: Pick<StaffUser, "role">) => u.role === "ADMIN";

export class AuthError extends Error {}

/** Action guard: returns the actor or throws AuthError (actions convert it to a friendly error). */
export async function actor(opts: { admin?: boolean } = {}): Promise<StaffUser> {
  const user = await getStaffUser();
  if (!user) throw new AuthError("Your session has expired. Sign in again.");
  if (opts.admin && user.role !== "ADMIN") throw new AuthError("Only admins can do this.");
  return user;
}
