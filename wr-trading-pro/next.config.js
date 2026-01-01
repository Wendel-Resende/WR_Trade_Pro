/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com', 'cdn.coinranking.com', 'static.coinstats.app'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
    optimizeCss: true,
  },
  transpilePackages: ['recharts'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
