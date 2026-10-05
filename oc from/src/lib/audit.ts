import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient;

export type AuditTarget =
  | "candidate"
  | "assignment"
  | "mission"
  | "team"
  | "skill"
  | "schedule"
  | "user"
  | "settings"
  | "note"
  | "export";

export type AuditEntry = {
  userId: string | null;
  action: string;
  targetType: AuditTarget;
  targetId?: string | null;
  summary: string;
  previous?: Prisma.InputJsonValue | null;
  next?: Prisma.InputJsonValue | null;
};

/** Write an audit row. Pass `tx` to make it part of the same transaction as the change it records. */
export async function audit(entry: AuditEntry, tx: Tx = db) {
  await tx.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      summary: entry.summary,
      previous: entry.previous ?? undefined,
      next: entry.next ?? undefined,
    },
  });
}
