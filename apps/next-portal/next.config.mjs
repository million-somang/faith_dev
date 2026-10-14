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
        source: '/finance',
        destination: `${backendUrl}/finance`,
      },
      {
        source: '/finance/assets/:path*',
        destination: `${backendUrl}/finance/assets/:path*`,
      },
      {
        source: '/finance/stocks',
        destination: `${backendUrl}/finance/stocks`,
      },
      {
        source: '/finance/exchange',
        destination: `${backendUrl}/finance/exchange`,
      },
      {
        source: '/finance/banking',
        destination: `${backendUrl}/finance/banking`,
      },
      {
        source: '/finance/stock/:path*',
        destination: `${backendUrl}/finance/stock/:path*`,
      },
      {
        source: '/rss.xml',
        destination: `${backendUrl}/rss.xml`,
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
    ];
  },
};

export default nextConfig;
