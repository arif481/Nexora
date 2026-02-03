/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
  // Remove basePath if deploying to root domain (iamarif.me)
  // Uncomment below if deploying to subdirectory (iamarif.me/Nexora)
  // basePath: '/Nexora',
  // assetPrefix: '/Nexora/',
};

module.exports = nextConfig;
