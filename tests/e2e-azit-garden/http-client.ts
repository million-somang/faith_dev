import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import type {
  AuthenticatedUserSession,
  DbHarnessLike,
  HttpClientLike,
  HttpResponse,
  SeedUserOptions,
} from './types.js';

let ipRotationCounter = 1;

export function nextForwardedIp(): string {
  const n = ipRotationCounter++;
  const thirdOctet = Math.floor(n / 250) % 250;
  const fourthOctet = (n % 250) + 1;
  return `10.200.${thirdOctet}.${fourthOctet}`;
}

export class HttpClient implements HttpClientLike {
  public readonly baseUrl: string;
  private readonly cookies = new Map<string, string>();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public get cookieHeader(): string | null {
    if (this.cookies.size === 0) return null;
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  public getCookie(name: string): string | undefined {
    return this.cookies.get(name);
  }

  public clearCookies(): void {
    this.cookies.clear();
  }

  private captureSetCookies(headers: Headers): void {
    const getSetCookie = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
    const rawList = typeof getSetCookie === 'function' ? getSetCookie.call(headers) : [];
    for (const raw of rawList) {
      const firstPart = raw.split(';', 1)[0]?.trim();
      if (!firstPart) continue;
      const eqIdx = firstPart.indexOf('=');
      if (eqIdx <= 0) continue;
      const name = firstPart.slice(0, eqIdx).trim();
      const value = firstPart.slice(eqIdx + 1).trim();
      if (value === '') {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  public async request<T = unknown>(
    method: string,
    reqPath: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {}
  ): Promise<HttpResponse<T>> {
    const url = reqPath.startsWith('http://') || reqPath.startsWith('https://')
      ? reqPath
      : `${this.baseUrl}${reqPath.startsWith('/') ? '' : '/'}${reqPath}`;

    const headers: Record<string, string> = {
      'User-Agent': 'FaithPortal-E2E/1.0',
      ...extraHeaders,
    };

    const cookie = this.cookieHeader;
    if (cookie && !headers['Cookie'] && !headers['cookie']) {
      headers['Cookie'] = cookie;
    }

    let serializedBody: string | undefined;
    if (body !== undefined) {
      serializedBody = typeof body === 'string' ? body : JSON.stringify(body);
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const res = await fetch(url, {
      method,
      headers,
      body: serializedBody,
    });

    this.captureSetCookies(res.headers);
    const text = await res.text();
    let json: T | null = null;
    if (text.length > 0) {
      try {
        json = JSON.parse(text) as T;
      } catch {
        json = null;
      }
    }

    return {
      status: res.status,
      ok: res.ok,
      headers: res.headers,
      json,
      text,
    };
  }

  public async get<T = unknown>(
    reqPath: string,
    extraHeaders: Record<string, string> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>('GET', reqPath, undefined, extraHeaders);
  }

  public async post<T = unknown>(
    reqPath: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>('POST', reqPath, body, extraHeaders);
  }

  public async signup(input: {
    email: string;
    password: string;
    name: string;
  }): Promise<HttpResponse> {
    return this.post('/api/auth/signup', input, {
      'X-Forwarded-For': nextForwardedIp(),
    });
  }

  public async login(input: { email: string; password: string }): Promise<HttpResponse> {
    return this.post('/api/auth/login', input, {
      'X-Forwarded-For': nextForwardedIp(),
    });
  }
}

export async function createAuthenticatedUser(
  db: DbHarnessLike,
  baseUrl: string,
  opts: SeedUserOptions = {}
): Promise<AuthenticatedUserSession> {
  const client = new HttpClient(baseUrl);

  if (opts.viaSignup) {
    const suffix = crypto.randomUUID().slice(0, 8);
    const email = opts.email ?? `e2e_signup_${suffix}@faithportal.local`;
    const password = opts.password ?? `Pass!${suffix}`;
    const name = opts.name ?? `E2ESignup_${suffix}`;

    const res = await client.signup({ email, password, name });
    assert.equal(
      res.status,
      200,
      `Expected signup 200 for ${email}, got ${res.status}: ${res.text}`
    );
    const sessionId = client.getCookie('session_id');
    assert.ok(sessionId, `Expected session_id cookie after signup for ${email}`);

    const userRow = db.queryOne<{ id: number }>('SELECT id FROM users WHERE email = ?', [email]);
    assert.ok(userRow?.id, `Expected user row in SQLite for ${email}`);

    if (opts.points !== undefined) {
      db.seedUserPoints(userRow.id, opts.points);
    }
    if (
      opts.azitLevel !== undefined ||
      opts.azitXp !== undefined ||
      opts.gardenMigrated !== undefined ||
      opts.unlockedPlots !== undefined
    ) {
      db.seedAzitProgress(userRow.id, {
        azitLevel: opts.azitLevel,
        azitXp: opts.azitXp,
        gardenMigrated: opts.gardenMigrated,
        unlockedPlots: opts.unlockedPlots,
      });
    }

    return {
      userId: userRow.id,
      email,
      password,
      name,
      cookie: `session_id=${sessionId}`,
      client,
    };
  }

  const seeded = db.seedUser(opts);
  const loginRes = await client.login({
    email: seeded.email,
    password: seeded.password,
  });
  assert.equal(
    loginRes.status,
    200,
    `Expected login 200 for ${seeded.email}, got ${loginRes.status}: ${loginRes.text}`
  );
  const sessionId = client.getCookie('session_id');
  assert.ok(sessionId, `Expected session_id cookie after login for ${seeded.email}`);

  return {
    userId: seeded.userId,
    email: seeded.email,
    password: seeded.password,
    name: seeded.name,
    cookie: `session_id=${sessionId}`,
    client,
  };
}
