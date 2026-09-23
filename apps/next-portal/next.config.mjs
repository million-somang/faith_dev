/** @type {import('next').NextConfig} */
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
        destination: process.env.API_SERVER_URL || 'http://localhost:4200/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: process.env.API_SERVER_URL ? `${process.env.API_SERVER_URL}/uploads/:path*` : 'http://localhost:4200/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
