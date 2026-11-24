import { Hono } from 'hono';
import { SeoController } from '../controllers/seo.controller.js';

export const seoRoutes = new Hono();

seoRoutes.get('/sitemap-index-meta', (c) => SeoController.getSitemapIndexMeta(c));
seoRoutes.get('/sitemaps/travel', (c) => SeoController.getTravelSitemapChunk(c));
seoRoutes.get('/sitemaps/news-recent', (c) => SeoController.getRecentNewsSitemap(c));
seoRoutes.get('/rss/travel', (c) => SeoController.getTravelRss(c));
seoRoutes.get('/indexnow-key', (c) => SeoController.getIndexNowKey(c));

seoRoutes.post('/indexnow/submit', (c) => SeoController.submitIndexNow(c));
seoRoutes.get('/indexnow/logs', (c) => SeoController.getIndexNowLogs(c));
