const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com'],
  },
  
  serverExternalPackages: ['@xenova/transformers'],
  
  // Minimal experimental features
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = withNextIntl(nextConfig);