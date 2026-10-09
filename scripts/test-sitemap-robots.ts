import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const EXPECTED_TOOL_SLUGS = [
  'severance-calc',
  'age-calc',
  'pyeong-calc',
  'interest-calc',
  'dday-calc',
  'customs-calc',
  'text-checker',
  'calculator',
  'json-formatter',
  'ocr',
  'base64-converter',
  'svg-converter',
  'finance-dsr',
];

const EXPECTED_HUBS = [
  'https://veranex.app/lifestyle',
  'https://veranex.app/finance',
  'https://veranex.app/finance/util',
  'https://veranex.app/game',
];

const EXPECTED_GAME_URLS = [
  'https://veranex.app/game/janggi',
  'https://veranex.app/game/omok',
  'https://veranex.app/game/baseball',
  'https://veranex.app/game/2048',
  'https://veranex.app/game/sudoku',
  'https://veranex.app/game/minesweeper',
  'https://veranex.app/game/freecell',
  'https://veranex.app/game/vera-pop',
  'https://veranex.app/game/flight',
];

const AI_BOTS = [
  'GPTBot',
  'PerplexityBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
];

const ADSENSE_BOTS = [
  'Mediapartners-Google',
  'AdsBot-Google',
  'AdsBot-Google-Mobile',
];

let hasError = false;

function validateXmlWellFormedness(xmlContent: string, filePath: string): UrlEntry[] {
  console.log(`Checking XML well-formedness for: ${filePath}`);

  // 1. Prolog check
  if (!xmlContent.trim().startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    console.error(`FAIL [${filePath}]: Missing or invalid XML prolog`);
    hasError = true;
  }

  // 2. Stack-based tag matcher
  const tagRegex = /<\/?([a-zA-Z0-9_\-:]+)(?:\s+[^>]*)?>/g;
  const stack: string[] = [];
  let match;
  
  // Remove prolog & comments for tag balance check
  const stripped = xmlContent.replace(/<\?xml[\s\S]*?\?>/g, '').replace(/<!--[\s\S]*?-->/g, '');

  while ((match = tagRegex.exec(stripped)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];

    if (fullTag.endsWith('/>')) {
      // self-closing
      continue;
    }

    if (fullTag.startsWith('</')) {
      // closing tag
      const last = stack.pop();
      if (last !== tagName) {
        console.error(`FAIL [${filePath}]: Mismatched closing tag </${tagName}>, expected </${last}>`);
        hasError = true;
      }
    } else {
      // opening tag
      stack.push(tagName);
    }
  }

  if (stack.length > 0) {
    console.error(`FAIL [${filePath}]: Unclosed tags remaining in stack: ${stack.join(', ')}`);
    hasError = true;
  }

  // 3. Extract URL entries
  const urlBlockRegex = /<url>([\s\S]*?)<\/url>/g;
  const urls: UrlEntry[] = [];
  let urlMatch;

  while ((urlMatch = urlBlockRegex.exec(xmlContent)) !== null) {
    const block = urlMatch[1];
    const locMatch = /<loc>(https?:\/\/[^\s<]+)<\/loc>/.exec(block);
    const lastmodMatch = /<lastmod>([^<]+)<\/lastmod>/.exec(block);
    const changefreqMatch = /<changefreq>([^<]+)<\/changefreq>/.exec(block);
    const priorityMatch = /<priority>([^<]+)<\/priority>/.exec(block);

    if (!locMatch) {
      console.error(`FAIL [${filePath}]: <url> entry missing valid <loc> tag`);
      hasError = true;
      continue;
    }

    urls.push({
      loc: locMatch[1].trim(),
      lastmod: lastmodMatch ? lastmodMatch[1].trim() : undefined,
      changefreq: changefreqMatch ? changefreqMatch[1].trim() : undefined,
      priority: priorityMatch ? priorityMatch[1].trim() : undefined,
    });
  }

  return urls;
}

function validateSitemap(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: File does not exist: ${filePath}`);
    hasError = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const urls = validateXmlWellFormedness(content, filePath);

  console.log(`[${filePath}] Found ${urls.length} URLs in sitemap`);

  // Verify total count is exactly 58
  if (urls.length !== 58) {
    console.error(`FAIL [${filePath}]: Expected exactly 58 URLs, but found ${urls.length}`);
    hasError = true;
  }

  const urlMap = new Map<string, UrlEntry>();
  for (const entry of urls) {
    if (urlMap.has(entry.loc)) {
      console.error(`FAIL [${filePath}]: Duplicate URL found: ${entry.loc}`);
      hasError = true;
    }
    urlMap.set(entry.loc, entry);

    // Validate fields
    if (entry.lastmod && !/^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod)) {
      console.error(`FAIL [${filePath}]: Invalid lastmod format "${entry.lastmod}" for ${entry.loc}`);
      hasError = true;
    }

    const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
    if (entry.changefreq && !validFreqs.includes(entry.changefreq)) {
      console.error(`FAIL [${filePath}]: Invalid changefreq "${entry.changefreq}" for ${entry.loc}`);
      hasError = true;
    }

    if (entry.priority) {
      const p = parseFloat(entry.priority);
      if (isNaN(p) || p < 0 || p > 1) {
        console.error(`FAIL [${filePath}]: Invalid priority "${entry.priority}" for ${entry.loc}`);
        hasError = true;
      }
    }
  }

  // Verify hubs
  for (const hub of EXPECTED_HUBS) {
    const entry = urlMap.get(hub);
    if (!entry) {
      console.error(`FAIL [${filePath}]: Missing hub URL "${hub}"`);
      hasError = true;
    } else {
      if (entry.priority !== '0.90' && entry.priority !== '0.9') {
        console.error(`FAIL [${filePath}]: Hub "${hub}" priority expected 0.90, got "${entry.priority}"`);
        hasError = true;
      }
      if (entry.changefreq !== 'daily') {
        console.error(`FAIL [${filePath}]: Hub "${hub}" changefreq expected daily, got "${entry.changefreq}"`);
        hasError = true;
      }
      if (entry.lastmod !== '2026-10-09') {
        console.error(`FAIL [${filePath}]: Hub "${hub}" lastmod expected 2026-10-09, got "${entry.lastmod}"`);
        hasError = true;
      }
    }
  }

  // Verify all 13 tool slugs
  for (const slug of EXPECTED_TOOL_SLUGS) {
    const toolUrl = `https://veranex.app/tools/${slug}`;
    const entry = urlMap.get(toolUrl);
    if (!entry) {
      console.error(`FAIL [${filePath}]: Missing tool URL "${toolUrl}"`);
      hasError = true;
    } else {
      if (entry.priority !== '0.85') {
        console.error(`FAIL [${filePath}]: Tool "${toolUrl}" priority expected 0.85, got "${entry.priority}"`);
        hasError = true;
      }
      if (entry.changefreq !== 'weekly') {
        console.error(`FAIL [${filePath}]: Tool "${toolUrl}" changefreq expected weekly, got "${entry.changefreq}"`);
        hasError = true;
      }
      if (entry.lastmod !== '2026-10-09') {
        console.error(`FAIL [${filePath}]: Tool "${toolUrl}" lastmod expected 2026-10-09, got "${entry.lastmod}"`);
        hasError = true;
      }
    }
  }

  // Verify all 8 core game URLs
  for (const gameUrl of EXPECTED_GAME_URLS) {
    const entry = urlMap.get(gameUrl);
    if (!entry) {
      console.error(`FAIL [${filePath}]: Missing game URL "${gameUrl}"`);
      hasError = true;
    } else {
      if (entry.priority !== '0.85') {
        console.error(`FAIL [${filePath}]: Game "${gameUrl}" priority expected 0.85, got "${entry.priority}"`);
        hasError = true;
      }
      if (entry.changefreq !== 'weekly') {
        console.error(`FAIL [${filePath}]: Game "${gameUrl}" changefreq expected weekly, got "${entry.changefreq}"`);
        hasError = true;
      }
      if (entry.lastmod !== '2026-10-09') {
        console.error(`FAIL [${filePath}]: Game "${gameUrl}" lastmod expected 2026-10-09, got "${entry.lastmod}"`);
        hasError = true;
      }
    }
  }

  // Verify core home & guides
  if (!urlMap.has('https://veranex.app/')) {
    console.error(`FAIL [${filePath}]: Missing home URL "https://veranex.app/"`);
    hasError = true;
  }
  if (!urlMap.has('https://veranex.app/guides')) {
    console.error(`FAIL [${filePath}]: Missing guides URL "https://veranex.app/guides"`);
    hasError = true;
  }
}

interface RobotSection {
  userAgent: string;
  allows: string[];
  disallows: string[];
}

function parseRobotsTxt(content: string): RobotSection[] {
  const lines = content.split('\n');
  const sections: RobotSection[] = [];
  let current: RobotSection | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.toLowerCase().startsWith('user-agent:')) {
      const ua = line.substring('user-agent:'.length).trim();
      current = { userAgent: ua, allows: [], disallows: [] };
      sections.push(current);
    } else if (line.toLowerCase().startsWith('allow:') && current) {
      const val = line.substring('allow:'.length).trim();
      current.allows.push(val);
    } else if (line.toLowerCase().startsWith('disallow:') && current) {
      const val = line.substring('disallow:'.length).trim();
      current.disallows.push(val);
    }
  }

  return sections;
}

function validateRobotsTxt(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: File does not exist: ${filePath}`);
    hasError = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = parseRobotsTxt(content);

  console.log(`[${filePath}] Parsed ${sections.length} User-agent blocks from robots.txt`);

  // Verify Sitemap
  if (!content.includes('Sitemap: https://veranex.app/sitemap.xml')) {
    console.error(`FAIL [${filePath}]: Missing Sitemap directive`);
    hasError = true;
  }

  // Check AI bots
  for (const botName of AI_BOTS) {
    const section = sections.find(s => s.userAgent.toLowerCase() === botName.toLowerCase());
    if (!section) {
      console.error(`FAIL [${filePath}]: Missing AI bot section for "${botName}"`);
      hasError = true;
      continue;
    }

    const requiredAllows = ['/', '/tools/', '/lifestyle', '/finance', '/finance/', '/finance/util', '/guides/', '/game', '/game/'];
    for (const reqAllow of requiredAllows) {
      if (!section.allows.includes(reqAllow)) {
        console.error(`FAIL [${filePath}]: Bot "${botName}" missing "Allow: ${reqAllow}"`);
        hasError = true;
      }
    }

    const requiredDisallows = ['/admin/', '/api/'];
    for (const reqDisallow of requiredDisallows) {
      if (!section.disallows.includes(reqDisallow)) {
        console.error(`FAIL [${filePath}]: Bot "${botName}" missing "Disallow: ${reqDisallow}"`);
        hasError = true;
      }
    }
  }

  // Check AdSense bots disallow /tools and /tools/, and /game and /game/
  for (const botName of ADSENSE_BOTS) {
    const section = sections.find(s => s.userAgent.toLowerCase() === botName.toLowerCase());
    if (!section) {
      console.error(`FAIL [${filePath}]: Missing AdSense bot section for "${botName}"`);
      hasError = true;
      continue;
    }

    if (!section.disallows.includes('/tools/') || !section.disallows.includes('/tools')) {
      console.error(`FAIL [${filePath}]: AdSense bot "${botName}" must disallow /tools/ and /tools`);
      hasError = true;
    }

    if (!section.disallows.includes('/game/') || !section.disallows.includes('/game')) {
      console.error(`FAIL [${filePath}]: AdSense bot "${botName}" must disallow /game/ and /game`);
      hasError = true;
    }
  }
}

// Execute tests
console.log('=== Starting sitemap.xml & robots.txt validation ===');

const projectRoot = path.resolve(__dirname, '..');
const publicSitemap = path.join(projectRoot, 'apps/main-portal/public/sitemap.xml');
const distSitemap = path.join(projectRoot, 'apps/main-portal/dist/sitemap.xml');
const publicRobots = path.join(projectRoot, 'apps/main-portal/public/robots.txt');
const distRobots = path.join(projectRoot, 'apps/main-portal/dist/robots.txt');

// Test sitemaps
validateSitemap(publicSitemap);
if (fs.existsSync(distSitemap)) {
  validateSitemap(distSitemap);
}

// Test robots.txt
validateRobotsTxt(publicRobots);
if (fs.existsSync(distRobots)) {
  validateRobotsTxt(distRobots);
}

if (hasError) {
  console.error('\n❌ Sitemap & robots.txt verification FAILED!');
  process.exit(1);
} else {
  console.log('\n✅ All sitemap.xml and robots.txt validations PASSED successfully!');
  process.exit(0);
}
