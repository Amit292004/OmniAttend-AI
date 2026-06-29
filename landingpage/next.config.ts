import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/portal',
        destination: 'http://localhost:3001/portal',
      },
      {
        source: '/portal/:path*',
        destination: 'http://localhost:3001/portal/:path*',
      },
    ];
  },
  /* config options here */
};

export default nextConfig;
