/** @type {import('next').NextConfig} */
const backendUrl = process.env.API_SERVER_URL || 'http://127.0.0.1:4200';

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
        source: '/admin',
        destination: `${backendUrl}/admin`,
      },
      {
        source: '/admin/:path*',
        destination: `${backendUrl}/admin/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/travel',
        destination: '/entertainment/travel',
        permanent: true,
      },
      {
        source: '/saju',
        destination: '/entertainment/saju',
        permanent: true,
      },
      {
        source: '/utility',
        destination: '/lifestyle',
        permanent: true,
      },
      {
        source: '/novel',
        destination: '/entertainment/novel',
        permanent: true,
      },
      {
        source: '/game/tetris',
        destination: '/game/vera-pop',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
