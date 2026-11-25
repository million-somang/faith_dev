import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import type { ServerHarnessLike } from './types.js';

const MAX_LOG_LINES = 200;
const activeProcesses = new Set<ChildProcess>();
let processGuardsRegistered = false;

function killChildTreeSync(child: ChildProcess): void {
  const pid = child.pid;
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/T', '/F', '/PID', String(pid)], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      child.kill('SIGKILL');
    }
  } catch {
    // Ignore errors if process already exited
  }
}

function registerProcessGuards(): void {
  if (processGuardsRegistered) return;
  processGuardsRegistered = true;

  const cleanupAll = () => {
    for (const child of activeProcesses) {
      killChildTreeSync(child);
    }
    activeProcesses.clear();
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

function appendLogLines(buffer: string[], chunk: Buffer | string): void {
  const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  for (const line of lines) {
    buffer.push(line);
    if (buffer.length > MAX_LOG_LINES) {
      buffer.shift();
    }
  }
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function findFreePort(host = '127.0.0.1'): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, host, () => {
      const addr = srv.address();
      if (!addr || typeof addr === 'string') {
        srv.close(() => reject(new Error('Failed to resolve ephemeral port')));
        return;
      }
      const port = addr.port;
      srv.close((err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
  });
}

export interface ServerHarnessOptions {
  repoRoot: string;
  dbPath: string;
  port?: number;
  readyTimeoutMs?: number;
  extraEnv?: Record<string, string>;
}

export class ServerHarness implements ServerHarnessLike {
  public readonly repoRoot: string;
  public readonly dbPath: string;
  public port = 0;
  public baseUrl = '';
  public pid: number | undefined;

  private readonly requestedPort?: number;
  private readonly readyTimeoutMs: number;
  private readonly extraEnv: Record<string, string>;
  private child: ChildProcess | null = null;
  private readonly stdoutLines: string[] = [];
  private readonly stderrLines: string[] = [];
  private exitedEarlyError: Error | null = null;
  private stopping = false;

  constructor(opts: ServerHarnessOptions) {
    this.repoRoot = opts.repoRoot;
    this.dbPath = opts.dbPath;
    this.requestedPort = opts.port;
    this.readyTimeoutMs = opts.readyTimeoutMs ?? 15000;
    this.extraEnv = opts.extraEnv ?? {};
    registerProcessGuards();
  }

  public async start(): Promise<void> {
    if (this.child) {
      throw new Error('ServerHarness is already started');
    }

    this.port = this.requestedPort ?? (await findFreePort('127.0.0.1'));
    this.baseUrl = `http://127.0.0.1:${this.port}`;
    this.exitedEarlyError = null;
    this.stopping = false;
    this.stdoutLines.length = 0;
    this.stderrLines.length = 0;

    const tsxCli = path.resolve(this.repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
    const serverEntry = path.join('apps', 'api-server', 'src', 'server.ts');

    const child = spawn(process.execPath, [tsxCli, serverEntry], {
      cwd: this.repoRoot,
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: String(this.port),
        DATABASE_PATH: this.dbPath,
        NODE_ENV: 'test',
        ENABLE_RSS_SCHEDULER: 'false',
        TELEGRAM_BOT_TOKEN: '',
        TELEGRAM_CHAT_ID: '',
        ...this.extraEnv,
      },
    });

    this.child = child;
    this.pid = child.pid;
    activeProcesses.add(child);

    child.stdout?.on('data', (chunk: Buffer) => appendLogLines(this.stdoutLines, chunk));
    child.stderr?.on('data', (chunk: Buffer) => appendLogLines(this.stderrLines, chunk));

    child.once('error', (err) => {
      if (!this.stopping) {
        this.exitedEarlyError = err;
      }
    });

    child.once('exit', (code, signal) => {
      activeProcesses.delete(child);
      if (!this.stopping) {
        this.exitedEarlyError = new Error(
          `Ephemeral api-server exited prematurely (code=${code}, signal=${signal})`
        );
      }
    });

    await this.waitForReady();
  }

  private async waitForReady(): Promise<void> {
    const deadline = Date.now() + this.readyTimeoutMs;

    while (Date.now() < deadline) {
      if (this.exitedEarlyError) {
        throw new Error(
          `${this.exitedEarlyError.message}\n--- stdout ---\n${this.stdoutLines.join('\n')}\n--- stderr ---\n${this.stderrLines.join('\n')}`
        );
      }

      try {
        const res = await fetch(`${this.baseUrl}/health`, {
          headers: { 'User-Agent': 'FaithPortal-E2E/1.0' },
          signal: AbortSignal.timeout(1500),
        });
        if (res.status === 200) {
          const payload = (await res.json()) as { status?: string; db?: string };
          if (payload.status === 'ok' && payload.db === 'connected') {
            return;
          }
        }
      } catch {
        // Server still booting
      }

      await sleepMs(150);
    }

    const logs = this.getLogs();
    await this.stop();
    throw new Error(
      `Timed out waiting ${this.readyTimeoutMs}ms for ${this.baseUrl}/health\n--- stdout ---\n${logs.stdout.join('\n')}\n--- stderr ---\n${logs.stderr.join('\n')}`
    );
  }

  public async stop(): Promise<void> {
    const child = this.child;
    if (!child) return;

    this.stopping = true;

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

    killChildTreeSync(child);
    await exitPromise;
    activeProcesses.delete(child);
    this.child = null;
  }

  public getLogs(): { stdout: string[]; stderr: string[] } {
    return {
      stdout: [...this.stdoutLines],
      stderr: [...this.stderrLines],
    };
  }
}
