import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://esenet-platforme.vercel.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/opportunities",
    "/companies",
    "/feed",
    "/login",
    "/signup",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" || path === "/opportunities" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  if (!isSupabaseConfigured()) return staticRoutes;

  const supabase = createPublicClient();
  const [{ data: opportunities }, { data: companies }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("companies").select("profile_id").eq("verified", true).limit(1000),
  ]);

  const opportunityRoutes: MetadataRoute.Sitemap = (opportunities ?? []).map((o) => ({
    url: `${siteUrl}/opportunities/${o.id}`,
    lastModified: o.created_at as string,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const companyRoutes: MetadataRoute.Sitemap = (companies ?? []).map((c) => ({
    url: `${siteUrl}/companies/${c.profile_id}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...opportunityRoutes, ...companyRoutes];
}
