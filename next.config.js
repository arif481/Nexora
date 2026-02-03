/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
  // Deployed to GitHub Pages at /Nexora/ subdirectory
  basePath: '/Nexora',
  assetPrefix: '/Nexora/',
};

module.exports = nextConfig;
