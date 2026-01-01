/** @type {import('next').NextConfig} */
const nextConfig = {
  skipTrailingSlashRedirect: true,
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  images: {
    unoptimized: false,
    dangerouslyAllowSVG: false,
    disableStaticImages: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cursedtours.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.cursedtours.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wp.cursedtours.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cms.cursedtours.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i0.wp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i1.wp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i2.wp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i3.wp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's0.wp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's1.wp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's2.wp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'secure.gravatar.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.tacdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.media.tacdn.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '*.replit.dev',
    '*.repl.co',
    '*.janeway.replit.dev',
    '*.kirk.replit.dev',
    '*.picard.replit.dev',
    '*.sisko.replit.dev',
  ],
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          has: [
            {
              type: 'query',
              key: 'p',
            },
          ],
          destination: '/api/legacy-redirect',
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2678400, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
