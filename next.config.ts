import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  images: {
    domains: ['rukminim2.flixcart.com', 'rukminim1.flixcart.com'],
  }
};

export default nextConfig;
