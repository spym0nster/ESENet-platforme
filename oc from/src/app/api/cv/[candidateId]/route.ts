import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { getStaffUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { readCv } from "@/lib/storage";

export const runtime = "nodejs";

/** Streams a candidate's private CV to signed-in staff only. The blob itself is never public. */
export async function GET(_req: Request, { params }: { params: Promise<{ candidateId: string }> }) {
  const user = await getStaffUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { candidateId } = await params;
  const c = await db.candidate.findUnique({ where: { id: candidateId }, select: { cvUrl: true, cvFileName: true, applicationId: true, fullName: true } });
  if (!c?.cvUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const file = await readCv(c.cvUrl);
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await audit({ userId: user.id, action: "candidate.cv_viewed", targetType: "candidate", targetId: candidateId, summary: `${user.name} opened the CV of ${c.fullName}` });
    const name = (c.cvFileName ?? `${c.applicationId}.pdf`).replace(/"/g, "");
    return new NextResponse(file.stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${name}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[cv] read failed", err);
    return NextResponse.json({ error: "CV temporarily unavailable" }, { status: 502 });
  }
}
