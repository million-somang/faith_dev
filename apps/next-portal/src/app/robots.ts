import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          'AhrefsBot',
          'SemrushBot',
          'Bytespider',
          'DotBot',
          'MJ12bot',
          'PetalBot',
          'Dataprovider',
          'BLEXBot',
          'MegaIndex',
          'ZoominfoBot',
        ],
        disallow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin',
          '/admin/',
          '/mypage',
          '/mypage/',
          '/b2b',
          '/b2b/',
          '/game/comboy',
          '/game/sfc',
        ],
      },
    ],
    sitemap: 'https://veranex.app/sitemap.xml',
    host: 'https://veranex.app',
  };
}
