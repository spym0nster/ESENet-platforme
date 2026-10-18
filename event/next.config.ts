import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Logo (2 MB) and CV (4 MB) uploads travel with the form.
  experimental: { serverActions: { bodySizeLimit: "7mb" } },
};

export default nextConfig;
