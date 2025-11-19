import type { NextConfig } from 'next'

const isProduction = process.env.NODE_ENV === 'production'

const cdnPrefix = process.env.NEXT_PUBLIC_CDN_URL

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: !isProduction,
  compiler: {
    removeConsole: isProduction
      ? {
          exclude: ['error', 'warn'],
        }
      : false,
  },
  compress: true,
  poweredByHeader: false,
  assetPrefix: isProduction && cdnPrefix ? cdnPrefix : undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  headers: async () => [
    {
      source: '/:all*(svg|jpg|png|webp|ico)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=604800, immutable',
        },
      ],
    },
  ],
}

export default nextConfig
