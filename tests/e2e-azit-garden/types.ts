export type TestTier = 'smoke' | 1 | 2 | 3 | 4;

export type FeatureCode =
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'F5'
  | 'F6'
  | 'F7'
  | 'F8'
  | 'F9'
  | 'F10'
  | 'F11'
  | 'F12';

export interface SeedPlotInput {
  plotIndex: number;
  cropId?: string | null;
  stage?: number;
  waterCount?: number;
  plantedAt?: string | null;
  lastWateredAt?: string | null;
  nextWaterAtMs?: number | null;
  isUnlocked?: number;
  soilLevel?: number;
  fertilizerUsedCount?: number;
}

export interface SeedUserOptions {
  email?: string;
  password?: string;
  name?: string;
  points?: number;
  azitLevel?: number;
  azitXp?: number;
  gardenMigrated?: number;
  unlockedPlots?: number;
  plots?: SeedPlotInput[];
  crops?: Record<string, { seedQty?: number; harvestQty?: number }>;
  viaSignup?: boolean;
}

export interface SeededUserResult {
  userId: number;
  email: string;
  password: string;
  name: string;
}

export interface LegacyUserFixtureOptions {
  email?: string;
  password?: string;
  name?: string;
  points?: number;
  azitLevel?: number;
  azitXp?: number;
  gardenMigrated?: number;
  plots?: Array<{
    plotIndex: number;
    cropId?: string | null;
    stage?: number;
    waterCount?: number;
    plantedAt?: string | null;
    lastWateredAt?: string | null;
  }>;
  crops?: Record<string, { seedQty?: number; harvestQty?: number }>;
  legacyMinihomeHandle?: string;
  legacyMinihomeLayoutJson?: Record<string, unknown>;
}

export interface BackdatePlotTimersOptions {
  nextWaterAtMs?: number | null;
  lastWateredAt?: string | null;
  plantedAt?: string | null;
}

export interface HttpResponse<T = unknown> {
  status: number;
  ok: boolean;
  headers: Headers;
  json: T | null;
  text: string;
}

export interface DbHarnessLike {
  readonly tempDir: string;
  readonly dbPath: string;
  seedUser(opts?: SeedUserOptions): SeededUserResult;
  seedLegacyUserFixture(opts?: LegacyUserFixtureOptions): SeededUserResult;
  seedUserPoints(userId: number, points: number): void;
  seedAzitProgress(
    userId: number,
    opts: { azitLevel?: number; azitXp?: number; gardenMigrated?: number; unlockedPlots?: number }
  ): void;
  seedCropInventory(
    userId: number,
    cropId: string,
    opts: { seedQty?: number; harvestQty?: number }
  ): void;
  backdatePlotTimers(userId: number, plotIndex: number, opts: BackdatePlotTimersOptions): void;
  backdateFarmerTick(userId: number, farmerCode: string, lastAutoTickMs: number): void;
  queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): T | undefined;
  queryAll<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[];
  execute(sql: string, params?: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  cleanup(): Promise<void>;
}

export interface ServerHarnessLike {
  readonly port: number;
  readonly baseUrl: string;
  readonly pid: number | undefined;
  start(): Promise<void>;
  stop(): Promise<void>;
  getLogs(): { stdout: string[]; stderr: string[] };
}

export interface HttpClientLike {
  readonly cookieHeader: string | null;
  request<T = unknown>(
    method: string,
    reqPath: string,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<HttpResponse<T>>;
  get<T = unknown>(reqPath: string, extraHeaders?: Record<string, string>): Promise<HttpResponse<T>>;
  post<T = unknown>(
    reqPath: string,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<HttpResponse<T>>;
  signup(input: { email: string; password: string; name: string }): Promise<HttpResponse>;
  login(input: { email: string; password: string }): Promise<HttpResponse>;
}

export interface AuthenticatedUserSession {
  userId: number;
  email: string;
  password: string;
  name: string;
  cookie: string;
  client: HttpClientLike;
}

export interface BrowserTelemetry {
  pageErrors: string[];
  sameOriginConsoleErrors: string[];
  sameOrigin5xx: Array<{ url: string; status: number }>;
  allConsoleErrors: string[];
}

export interface BrowserPageOptions {
  baseUrl?: string;
  sessionCookie?: string;
  viewport?: { width: number; height: number };
}

export interface UiSessionLike {
  readonly nextBaseUrl: string;
  readonly internalNextPort: number;
  withPage<T>(
    opts: BrowserPageOptions,
    fn: (page: import('puppeteer').Page, telemetry: BrowserTelemetry) => Promise<T>
  ): Promise<T>;
  stop(): Promise<void>;
}

export interface E2ETestContext {
  repoRoot: string;
  db: DbHarnessLike;
  server: ServerHarnessLike;
  baseUrl: string;
  createClient(): HttpClientLike;
  createAuthenticatedUser(opts?: SeedUserOptions): Promise<AuthenticatedUserSession>;
  getUiSession(): Promise<UiSessionLike>;
}

export interface E2ETestCase {
  id: string;
  tier: TestTier;
  feature?: FeatureCode;
  name: string;
  run: (ctx: E2ETestContext) => Promise<void>;
}

export interface E2ETestResult {
  id: string;
  tier: TestTier;
  feature?: FeatureCode;
  name: string;
  status: 'pass' | 'fail';
  durationMs: number;
  error?: string;
}

export interface E2ESummaryReport {
  tierFilter: string;
  featureFilter: string | null;
  totalMatched: number;
  executed: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: E2ETestResult[];
}
