import { execFile, execFileSync, spawn, type ChildProcess } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import puppeteer, { type Browser, type ConsoleMessage, type HTTPResponse, type Page } from 'puppeteer';
import { findFreePort } from './server-harness.js';
import type { BrowserPageOptions, BrowserTelemetry, UiSessionLike } from './types.js';

const execFileAsync = promisify(execFile);

const MAX_LOG_LINES = 200;
const activeNextProcesses = new Set<ChildProcess>();
const activeBrowserPids = new Set<number>();
const activeChromeDirs = new Set<string>();
let nextGuardsRegistered = false;

const typecheckCache = new Map<string, { ok: boolean; exitCode: number; output: string }>();

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function killPidTreeSync(pid: number): void {
  if (!pid || pid <= 0) return;
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/T', '/F', '/PID', String(pid)], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      process.kill(pid, 'SIGKILL');
    }
  } catch {
    // Ignore already exited process
  }
}

function killNextTreeSync(child: ChildProcess): void {
  const pid = child.pid;
  if (!pid) return;
  killPidTreeSync(pid);
}

function registerNextGuards(): void {
  if (nextGuardsRegistered) return;
  nextGuardsRegistered = true;

  const cleanupAll = () => {
    for (const child of activeNextProcesses) {
      killNextTreeSync(child);
    }
    activeNextProcesses.clear();

    for (const pid of activeBrowserPids) {
      killPidTreeSync(pid);
    }
    activeBrowserPids.clear();

    for (const dir of activeChromeDirs) {
      try {
        fs.rmSync(dir, { recursive: true, force: true, maxRetries: 15, retryDelay: 100 });
      } catch {
        // Best-effort cleanup on process termination
      }
    }
    activeChromeDirs.clear();
  };

  process.once('exit', cleanupAll);
  process.once('SIGINT', () => {
    cleanupAll();
    process.exit(130);
  });
  process.once('SIGTERM', () => {
    cleanupAll();
    process.exit(143);
  });
}

function appendLines(buffer: string[], chunk: Buffer | string): void {
  const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
  for (const line of text.split(/\r?\n/)) {
    if (line.length === 0) continue;
    buffer.push(line);
    if (buffer.length > MAX_LOG_LINES) {
      buffer.shift();
    }
  }
}

export async function runNextTypecheck(repoRoot: string): Promise<{
  ok: boolean;
  exitCode: number;
  output: string;
}> {
  const cached = typecheckCache.get(repoRoot);
  if (cached) return cached;

  const tscBin = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
  const tsconfigPath = path.join(repoRoot, 'apps', 'next-portal', 'tsconfig.json');

  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      [tscBin, '-p', tsconfigPath, '--noEmit', '--incremental', 'false', '--pretty', 'false'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        windowsHide: true,
      }
    );
    const res = { ok: true, exitCode: 0, output: stdout ?? '' };
    typecheckCache.set(repoRoot, res);
    return res;
  } catch (err: unknown) {
    const e = err as { code?: number; status?: number; stdout?: string; stderr?: string; message?: string };
    const output = [e.stdout ?? '', e.stderr ?? '', e.message ?? ''].filter(Boolean).join('\n');
    const exitCode = typeof e.code === 'number' ? e.code : typeof e.status === 'number' ? e.status : 1;
    const res = { ok: false, exitCode, output };
    typecheckCache.set(repoRoot, res);
    return res;
  }
}

function shouldProxyToApi(reqUrl: string): boolean {
  const pathname = reqUrl.split('?', 1)[0] ?? '/';
  return (
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/uploads/') ||
    pathname.startsWith('/app/') ||
    pathname.startsWith('/onlinegame/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  );
}

export class NextServerHarness {
  public readonly repoRoot: string;
  public readonly apiBaseUrl: string;
  public internalPort = 0;
  public proxyPort = 0;
  public baseUrl = '';

  private readonly readyTimeoutMs: number;
  private child: ChildProcess | null = null;
  private proxyServer: http.Server | null = null;
  private readonly stdoutLines: string[] = [];
  private readonly stderrLines: string[] = [];
  private exitedEarlyError: Error | null = null;
  private stopping = false;

  constructor(opts: { repoRoot: string; apiBaseUrl: string; readyTimeoutMs?: number }) {
    this.repoRoot = opts.repoRoot;
    this.apiBaseUrl = opts.apiBaseUrl.replace(/\/+$/, '');
    this.readyTimeoutMs = opts.readyTimeoutMs ?? 25000;
    registerNextGuards();
  }

  public async start(): Promise<void> {
    if (this.child || this.proxyServer) {
      throw new Error('NextServerHarness is already started');
    }

    const nextPortalDir = path.join(this.repoRoot, 'apps', 'next-portal');
    const buildIdPath = path.join(nextPortalDir, '.next', 'BUILD_ID');
    const manifestPath = path.join(nextPortalDir, '.next', 'routes-manifest.json');
    if (!fs.existsSync(buildIdPath) || !fs.existsSync(manifestPath)) {
      throw new Error(
        `apps/next-portal/.next build artifacts missing (${buildIdPath}). Run next build before F10/F11 UI tests.`
      );
    }

    this.internalPort = await findFreePort('127.0.0.1');
    this.proxyPort = await findFreePort('127.0.0.1');
    this.baseUrl = `http://127.0.0.1:${this.proxyPort}`;
    this.exitedEarlyError = null;
    this.stopping = false;
    this.stdoutLines.length = 0;
    this.stderrLines.length = 0;

    const nextBin = path.join(this.repoRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
    const child = spawn(
      process.execPath,
      [nextBin, 'start', '-H', '127.0.0.1', '-p', String(this.internalPort)],
      {
        cwd: nextPortalDir,
        shell: false,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: String(this.internalPort),
          API_SERVER_URL: this.apiBaseUrl,
        },
      }
    );

    this.child = child;
    activeNextProcesses.add(child);

    child.stdout?.on('data', (chunk: Buffer) => appendLines(this.stdoutLines, chunk));
    child.stderr?.on('data', (chunk: Buffer) => appendLines(this.stderrLines, chunk));
    child.once('error', (err) => {
      if (!this.stopping) {
        this.exitedEarlyError = err;
      }
    });
    child.once('exit', (code, signal) => {
      activeNextProcesses.delete(child);
      if (!this.stopping) {
        this.exitedEarlyError = new Error(
          `next start exited prematurely (code=${code}, signal=${signal})`
        );
      }
    });

    await this.waitForNextReady();
    await this.startReverseProxy();
  }

  private async waitForNextReady(): Promise<void> {
    const deadline = Date.now() + this.readyTimeoutMs;
    const probeUrl = `http://127.0.0.1:${this.internalPort}/minihome/me`;

    while (Date.now() < deadline) {
      if (this.exitedEarlyError) {
        throw new Error(
          `${this.exitedEarlyError.message}\n--- next stdout ---\n${this.stdoutLines.join('\n')}\n--- next stderr ---\n${this.stderrLines.join('\n')}`
        );
      }

      try {
        const res = await fetch(probeUrl, {
          signal: AbortSignal.timeout(2000),
          redirect: 'manual',
        });
        if (res.status >= 200 && res.status < 400) {
          return;
        }
      } catch {
        // Next still starting
      }

      await sleepMs(150);
    }

    await this.stop();
    throw new Error(
      `Timed out waiting ${this.readyTimeoutMs}ms for Next.js at ${probeUrl}\n--- next stdout ---\n${this.stdoutLines.join('\n')}\n--- next stderr ---\n${this.stderrLines.join('\n')}`
    );
  }

  private async startReverseProxy(): Promise<void> {
    const apiTarget = new URL(this.apiBaseUrl);
    const nextTargetPort = this.internalPort;

    const server = http.createServer((req, res) => {
      const reqUrl = req.url ?? '/';
      const toApi = shouldProxyToApi(reqUrl);
      const targetHost = toApi ? apiTarget.hostname : '127.0.0.1';
      const targetPort = toApi ? Number(apiTarget.port || 80) : nextTargetPort;

      const forwardHeaders: http.OutgoingHttpHeaders = { ...req.headers };
      forwardHeaders.host = `${targetHost}:${targetPort}`;

      const proxyReq = http.request(
        {
          hostname: targetHost,
          port: targetPort,
          path: reqUrl,
          method: req.method,
          headers: forwardHeaders,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
          proxyRes.pipe(res);
        }
      );

      proxyReq.on('error', (err) => {
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
        }
        if (!res.destroyed) {
          res.end(JSON.stringify({ success: false, error: { code: 502, message: err.message } }));
        }
      });

      req.on('aborted', () => {
        proxyReq.destroy();
      });

      req.pipe(proxyReq);
    });

    this.proxyServer = server;
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(this.proxyPort, '127.0.0.1', () => {
        server.off('error', reject);
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    this.stopping = true;

    const proxy = this.proxyServer;
    this.proxyServer = null;
    if (proxy) {
      proxy.closeAllConnections?.();
      await new Promise<void>((resolve) => {
        proxy.close(() => resolve());
      });
    }

    const child = this.child;
    this.child = null;
    if (child) {
      const exitPromise =
        child.exitCode !== null || child.signalCode !== null
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              const timer = setTimeout(resolve, 3000);
              child.once('close', () => {
                clearTimeout(timer);
                resolve();
              });
            });
      killNextTreeSync(child);
      await exitPromise;
      activeNextProcesses.delete(child);
    }
  }
}

const EXTERNAL_NOISE_DOMAINS = [
  'api.open-meteo.com',
  'cdnjs.cloudflare.com',
  'pagead2.googlesyndication.com',
  'googleads.g.doubleclick.net',
  'www.googletagmanager.com',
];

function isExternalThirdPartyNoise(text: string, locationUrl?: string): boolean {
  const combined = `${text} ${locationUrl ?? ''}`;
  if (EXTERNAL_NOISE_DOMAINS.some((domain) => combined.includes(domain))) {
    return true;
  }
  if (
    locationUrl &&
    /^https?:\/\//i.test(locationUrl) &&
    !locationUrl.startsWith('http://127.0.0.1') &&
    !locationUrl.startsWith('http://localhost')
  ) {
    return true;
  }
  return false;
}

export class BrowserHarness {
  public readonly userDataDir: string;
  private browser: Browser | null = null;

  constructor() {
    this.userDataDir = path.join(os.tmpdir(), `e2e-azit-chrome-${crypto.randomUUID()}`);
    activeChromeDirs.add(this.userDataDir);
  }

  public async start(): Promise<void> {
    if (this.browser) return;
    registerNextGuards();
    fs.mkdirSync(this.userDataDir, { recursive: true });
    this.browser = await puppeteer.launch({
      headless: true,
      userDataDir: this.userDataDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    const browserPid = this.browser.process()?.pid;
    if (browserPid) {
      activeBrowserPids.add(browserPid);
    }
  }

  public async withPage<T>(
    opts: BrowserPageOptions & { baseUrl: string },
    fn: (page: Page, telemetry: BrowserTelemetry) => Promise<T>
  ): Promise<T> {
    if (!this.browser) {
      await this.start();
    }
    const browser = this.browser!;
    const browserCtx = await browser.createBrowserContext();
    const page = await browserCtx.newPage();

    const telemetry: BrowserTelemetry = {
      pageErrors: [],
      sameOriginConsoleErrors: [],
      sameOrigin5xx: [],
      allConsoleErrors: [],
    };

    const failedExternalUrls = new Set<string>();

    const onPageError = (err: unknown) => {
      telemetry.pageErrors.push(err instanceof Error ? err.message : String(err));
    };

    const onRequestFailed = (req: import('puppeteer').HTTPRequest) => {
      const url = req.url();
      const errText = req.failure()?.errorText ?? 'unknown';
      if (!url.startsWith(opts.baseUrl)) {
        failedExternalUrls.add(url);
      } else if (errText !== 'net::ERR_ABORTED') {
        telemetry.sameOriginConsoleErrors.push(
          `Same-origin request failed: ${url} (${errText})`
        );
      }
    };

    const onConsole = (msg: ConsoleMessage) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      const locUrl = msg.location()?.url;
      telemetry.allConsoleErrors.push(locUrl ? `${text} (${locUrl})` : text);

      if (isExternalThirdPartyNoise(text, locUrl)) {
        return;
      }
      if (
        text.includes('Failed to load resource') &&
        failedExternalUrls.size > 0 &&
        (!locUrl || !locUrl.startsWith(opts.baseUrl))
      ) {
        return;
      }
      telemetry.sameOriginConsoleErrors.push(locUrl ? `${text} (${locUrl})` : text);
    };

    const onResponse = (res: HTTPResponse) => {
      const url = res.url();
      if (url.startsWith(opts.baseUrl) && res.status() >= 500) {
        telemetry.sameOrigin5xx.push({ url, status: res.status() });
      }
    };

    page.on('pageerror', onPageError);
    page.on('requestfailed', onRequestFailed);
    page.on('console', onConsole);
    page.on('response', onResponse);

    try {
      await page.setViewport(opts.viewport ?? { width: 1280, height: 800 });

      if (opts.sessionCookie) {
        const match = opts.sessionCookie.match(/session_id=([^;]+)/);
        const sessionVal = match ? match[1].trim() : opts.sessionCookie.trim();
        if (sessionVal) {
          await page.setCookie({
            name: 'session_id',
            value: sessionVal,
            url: opts.baseUrl,
            path: '/',
          });
        }
      }

      return await fn(page, telemetry);
    } finally {
      page.off('pageerror', onPageError);
      page.off('requestfailed', onRequestFailed);
      page.off('console', onConsole);
      page.off('response', onResponse);
      try {
        await page.close();
      } catch {
        // Ignore
      }
      try {
        await browserCtx.close();
      } catch {
        // Ignore
      }
    }
  }

  public async stop(): Promise<void> {
    const browser = this.browser;
    this.browser = null;
    const browserPid = browser?.process()?.pid;
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore close errors
      }
    }
    if (browserPid) {
      activeBrowserPids.delete(browserPid);
    }

    if (fs.existsSync(this.userDataDir)) {
      for (let attempt = 1; attempt <= 15; attempt++) {
        try {
          fs.rmSync(this.userDataDir, { recursive: true, force: true, maxRetries: 15, retryDelay: 100 });
          break;
        } catch (err: unknown) {
          const code = (err as NodeJS.ErrnoException)?.code;
          if (code === 'EBUSY' || code === 'EPERM' || code === 'ENOTEMPTY') {
            await sleepMs(100);
            continue;
          }
          break;
        }
      }
    }
    activeChromeDirs.delete(this.userDataDir);
  }
}

export class UiSession implements UiSessionLike {
  public readonly nextServer: NextServerHarness;
  public readonly browser: BrowserHarness;

  constructor(repoRoot: string, apiBaseUrl: string) {
    this.nextServer = new NextServerHarness({ repoRoot, apiBaseUrl });
    this.browser = new BrowserHarness();
  }

  public get nextBaseUrl(): string {
    return this.nextServer.baseUrl;
  }

  public get internalNextPort(): number {
    return this.nextServer.internalPort;
  }

  public async start(): Promise<void> {
    await this.nextServer.start();
    await this.browser.start();
  }

  public async withPage<T>(
    opts: BrowserPageOptions,
    fn: (page: Page, telemetry: BrowserTelemetry) => Promise<T>
  ): Promise<T> {
    return this.browser.withPage(
      {
        ...opts,
        baseUrl: opts.baseUrl ?? this.nextBaseUrl,
      },
      fn
    );
  }

  public async stop(): Promise<void> {
    await this.browser.stop();
    await this.nextServer.stop();
  }
}
