import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as sitemapMod from '../apps/next-portal/src/app/sitemap';
const sitemap = ((sitemapMod as any).default?.default || (sitemapMod as any).default || sitemapMod) as typeof import('../apps/next-portal/src/app/sitemap').default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  'image-resizer',
];

const EXPECTED_HUBS = [
  'https://veranex.app/lifestyle',
  'https://veranex.app/finance',
  'https://veranex.app/finance/util',
  'https://veranex.app/game',
  'https://veranex.app/news',
  'https://veranex.app/lounge',
  'https://veranex.app/entertainment/saju',
  'https://veranex.app/entertainment/travel',
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

async function validateDynamicSitemap() {
  console.log('Checking Next.js dynamic sitemap() output...');
  const entries = await sitemap();
  console.log(`Found ${entries.length} URLs in dynamic sitemap`);

  if (entries.length < 65) {
    console.error(`FAIL: Expected at least 65 URLs in dynamic sitemap, got ${entries.length}`);
    hasError = true;
  }

  const urlSet = new Set(entries.map((e) => e.url));

  for (const hub of EXPECTED_HUBS) {
    if (!urlSet.has(hub)) {
      console.error(`FAIL: Missing hub URL "${hub}"`);
      hasError = true;
    }
  }

  for (const slug of EXPECTED_TOOL_SLUGS) {
    const toolUrl = `https://veranex.app/tools/${slug}`;
    if (!urlSet.has(toolUrl)) {
      console.error(`FAIL: Missing tool URL "${toolUrl}"`);
      hasError = true;
    }
  }

  for (const gameUrl of EXPECTED_GAME_URLS) {
    if (!urlSet.has(gameUrl)) {
      console.error(`FAIL: Missing game URL "${gameUrl}"`);
      hasError = true;
    }
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

  if (!content.includes('Sitemap: https://veranex.app/sitemap.xml')) {
    console.error(`FAIL [${filePath}]: Missing Sitemap directive`);
    hasError = true;
  }

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

async function main() {
  console.log('=== Starting dynamic sitemap & robots.txt validation ===');
  const projectRoot = path.resolve(__dirname, '..');
  const publicRobots = path.join(projectRoot, 'apps/next-portal/public/robots.txt');

  await validateDynamicSitemap();
  validateRobotsTxt(publicRobots);

  if (hasError) {
    console.error('\n❌ Sitemap & robots.txt verification FAILED!');
    process.exit(1);
  } else {
    console.log('\n✅ All dynamic sitemap.ts and robots.txt validations PASSED successfully!');
    process.exit(0);
  }
}

main();
