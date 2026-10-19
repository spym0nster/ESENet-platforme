import { isAdmin } from "@/app/actions/admin";
import { db } from "@/lib/server";

// Organisers only: a short-lived signed link to a visitor's CV (private
// bucket), only when they ticked the CV-sharing consent.
export async function GET(_req: Request, ctx: RouteContext<"/[lang]/admin/cv/[code]">) {
  if (!(await isAdmin())) return new Response("Forbidden", { status: 403 });
  const { code } = await ctx.params;
  const supabase = db();
  if (!supabase || !/^ESN-[A-Z0-9]{8}$/.test(code)) return new Response("Not found", { status: 404 });
  const { data: v } = await supabase.from("event_visitors").select("cv_path, consent_cv, full_name").eq("code", code).maybeSingle();
  if (!v?.cv_path || !v.consent_cv) return new Response("No CV shared", { status: 404 });
  const signed = await supabase.storage.from("event-cvs").createSignedUrl(v.cv_path, 60, { download: `CV ${v.full_name}.pdf` });
  if (!signed.data) return new Response("Not found", { status: 404 });
  return Response.redirect(signed.data.signedUrl, 302);
}
