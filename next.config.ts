import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    domains: ['lh3.googleusercontent.com'], // Permite imagens do Google
  },
};

export default nextConfig;
