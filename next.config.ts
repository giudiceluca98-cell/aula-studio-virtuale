import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // The local app is opened through both names depending on the browser.
  // Allowing both keeps Next's development scripts (including hydration)
  // available instead of leaving forms as inert server-rendered HTML.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const connectSrc = ["'self'", "https://*.supabase.co", "wss://*.supabase.co"];
    if (isDev) {
      connectSrc.push(
        "ws://localhost:*",
        "http://localhost:*",
        "ws://127.0.0.1:*",
        "http://127.0.0.1:*",
      );
    }

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), browsing-topics=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self' data:",
              `connect-src ${connectSrc.join(" ")}`,
              "frame-src https://*.supabase.co https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
              "media-src 'self' blob: https:",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              isDev ? "" : "upgrade-insecure-requests",
            ].filter(Boolean).join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
