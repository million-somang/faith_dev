/** @type {import('next').NextConfig} */
const backendUrl = process.env.API_SERVER_URL || 'http://localhost:4200';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
      {
        source: '/app/:path*',
        destination: `${backendUrl}/app/:path*`,
      },
      {
        source: '/onlinegame/:path*',
        destination: `${backendUrl}/onlinegame/:path*`,
      },
      {
        source: '/finance',
        destination: `${backendUrl}/finance`,
      },
      {
        source: '/finance/:path*',
        destination: `${backendUrl}/finance/:path*`,
      },
      {
        source: '/admin',
        destination: `${backendUrl}/admin`,
      },
      {
        source: '/admin/:path*',
        destination: `${backendUrl}/admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
