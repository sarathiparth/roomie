import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@roomy/scoring', '@roomy/types'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google Avatar URLs
      }
    ],
  },
};

export default nextConfig;
