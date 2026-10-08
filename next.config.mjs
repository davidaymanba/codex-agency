import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function supabaseImages() {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return [
      {
        protocol: u.protocol.replace(":", ""),
        hostname: u.hostname,
        port: u.port,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Separate output folder for QA builds so they never clash with a running `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: { root: import.meta.dirname },
  images: {
    formats: ["image/avif", "image/webp"],
    // Public images from Supabase Storage (local CLI + hosted project).
    remotePatterns: supabaseImages(),
  },
  poweredByHeader: false,
  // Tailwind CSS is small: inlining it removes the render-blocking stylesheet request
  // (biggest first-paint win on mobile networks).
  experimental: { inlineCss: true },
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      ...(process.env.NODE_ENV === "production"
        ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
        : []),
    ];
    return [
      { source: "/:path*", headers: security },
      // The dashboard and its APIs must never be cached by shared caches or indexed.
      { source: "/:locale(en|ar)/dashboard/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }] },
      { source: "/api/dashboard/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
};

export default withNextIntl(nextConfig);
