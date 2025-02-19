/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true
  },
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: false
  }
}

module.exports = nextConfig
