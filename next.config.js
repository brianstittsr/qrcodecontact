/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: true
  },
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
