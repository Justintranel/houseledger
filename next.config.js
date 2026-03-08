/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  // Allow socket.io client assets
  webpack: (config) => {
    config.externals.push({ bufferutil: "bufferutil", "utf-8-validate": "utf-8-validate" });
    return config;
  },
};

module.exports = nextConfig;
