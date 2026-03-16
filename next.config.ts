import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Whitelist IP address for development
  allowedDevOrigins: ['localhost:3000', '192.168.0.33:3000'],

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Modularize imports to reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
  },

  // External packages for server components
  serverExternalPackages: ['mongodb', 'firebase-admin'],

  // Enable experimental features
  experimental: {
    optimizePackageImports: [
      '@headlessui/react',
      'framer-motion',
      'motion',
      'lucide-react',
      'date-fns',
      'lodash',
      'react-use',
      '@radix-ui/react-avatar',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      'chart.js',
      'react-chartjs-2',
      'canvas-confetti',
      '@number-flow/react',
    ],
    optimizeCss: true, // Enable CSS optimization
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.firebasestorage.app',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile images
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com', // Facebook profile images
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Cloudinary images
      },
    ],
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_NAME: 'FixItNow',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Headers configuration for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Turbopack configuration (empty to silence migration warning)
  turbopack: {},

  // Webpack configuration to suppress source map warnings from dependencies
  webpack: (config, { dev }) => {
    if (dev) {
      // Suppress source map warnings in development
      config.ignoreWarnings = [
        /Failed to parse source map/,
        /Invalid source map/,
        /sourceMapURL could not be parsed/,
      ];
    }
    return config;
  },
};

export default nextConfig;
