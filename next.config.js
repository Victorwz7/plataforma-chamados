/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // Permite renderização dinâmica
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
  