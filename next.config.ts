import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Whitelist IP address for development
  allowedDevOrigins: ['localhost:3000', '192.168.0.33:3000'],

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
      // Heavy packages - optimize to reduce compile time
      '@tensorflow/tfjs',
      '@tensorflow-models/mobilenet',
      'firebase',
      'chart.js',
      'react-chartjs-2',
    ],
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
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
