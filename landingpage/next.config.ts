import type { NextConfig } from "next";

const PORTAL_URL =
  process.env.PORTAL_URL || "https://portal-plum-zeta.vercel.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/portal',
        destination: `${PORTAL_URL}/portal`,
      },
      {
        source: '/portal/:path*',
        destination: `${PORTAL_URL}/portal/:path*`,
      },
    ];
  },
  /* config options here */
};

export default nextConfig;
