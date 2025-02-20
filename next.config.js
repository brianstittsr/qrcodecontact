const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: false
  },
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['localhost']
  },
  generateEtags: false,
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig
