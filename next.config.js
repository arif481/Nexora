/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/Nexora' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Nexora/' : '',
};

module.exports = nextConfig;
