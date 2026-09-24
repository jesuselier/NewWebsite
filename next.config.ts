import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/tier-list", destination: "/tier-list-assets/index.html" }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "i1.ytimg.com" },
      { protocol: "https", hostname: "i2.ytimg.com" },
      { protocol: "https", hostname: "i3.ytimg.com" },
      { protocol: "https", hostname: "i4.ytimg.com" },
    ],
  },
};

export default nextConfig;
