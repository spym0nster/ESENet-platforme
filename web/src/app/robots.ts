import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://esenet-platforme.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Personal data / signed-in-only / transactional areas stay out of
      // the index. `/students` and `/students/[id]` already send
      // `robots: noindex` in their own metadata; listing them here also
      // keeps crawlers from spending budget on them.
      disallow: [
        "/students",
        "/profile",
        "/company/",
        "/admin/",
        "/notifications",
        "/applications",
        "/saved",
        "/reset-password",
        "/auth/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
