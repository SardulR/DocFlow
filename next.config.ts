/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your other configurations like 'experimental' go here
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  // This is the key part to disable ESLint during the build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
