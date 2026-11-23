import type { ResizeSettings, RuntimeBackend, UpscaleEngine } from '../types/index';
import type {
  UpscaleWorkerLimits,
  UpscaleWorkerRequest,
  UpscaleWorkerResponse,
} from '../workers/upscalePipeline.worker';

export class WorkerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerUnavailableError';
  }
}

export interface WorkerUpscaleResult {
  readonly blob: Blob;
  readonly width: number;
  readonly height: number;
  readonly size: number;
  readonly wasCappedForMemory: boolean;
  readonly usedEngine: UpscaleEngine;
  readonly runtimeBackend: RuntimeBackend;
  readonly sharpnessGainPercent: number;
}

interface PendingJob {
  readonly resolve: (result: WorkerUpscaleResult) => void;
  readonly reject: (reason: unknown) => void;
  readonly onProgress?: (percent: number, statusText: string) => void;
  readonly cleanup: () => void;
}

let sharedWorker: Worker | null = null;
let workerBooted = false;
let nextJobId = 1;
const pendingJobs = new Map<number, PendingJob>();

function createAbortError(): DOMException {
  return new DOMException('작업이 중단되었습니다.', 'AbortError');
}

export function supportsBackgroundUpscaleWorker(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof createImageBitmap === 'function'
  );
}

function resetWorkerWithError(errorFactory: () => unknown): void {
  const current = sharedWorker;
  sharedWorker = null;
  const hadBooted = workerBooted;
  workerBooted = false;

  if (current) {
    try {
      current.terminate();
    } catch {
      // 이미 종료된 워커 무시
    }
  }

  const jobs = Array.from(pendingJobs.values());
  pendingJobs.clear();
  for (const job of jobs) {
    job.cleanup();
    job.reject(hadBooted ? errorFactory() : new WorkerUnavailableError('백그라운드 워커 초기화 실패'));
  }
}

function getOrCreateUpscaleWorker(): Worker {
  if (sharedWorker) return sharedWorker;

  let worker: Worker;
  try {
    worker = new Worker(new URL('../workers/upscalePipeline.worker.ts', import.meta.url), {
      type: 'module',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '워커 생성 실패';
    throw new WorkerUnavailableError(msg);
  }

  worker.onmessage = (event: MessageEvent<UpscaleWorkerResponse>) => {
    workerBooted = true;
    const msg = event.data;
    const job = pendingJobs.get(msg.jobId);
    if (!job) return;

    if (msg.type === 'progress') {
      job.onProgress?.(msg.percent, msg.statusText);
      return;
    }

    pendingJobs.delete(msg.jobId);
    job.cleanup();

    if (msg.type === 'done') {
      job.resolve({
        blob: msg.blob,
        width: msg.width,
        height: msg.height,
        size: msg.size,
        wasCappedForMemory: msg.wasCappedForMemory,
        usedEngine: msg.usedEngine,
        runtimeBackend: msg.runtimeBackend,
        sharpnessGainPercent: msg.sharpnessGainPercent,
      });
    } else if (msg.type === 'aborted') {
      job.reject(createAbortError());
    } else if (msg.type === 'error') {
      job.reject(new Error(msg.message));
    }
  };

  worker.onerror = (event: ErrorEvent) => {
    const message = event.message || '백그라운드 워커 실행 오류';
    resetWorkerWithError(() => new Error(message));
  };

  worker.onmessageerror = () => {
    resetWorkerWithError(() => new Error('백그라운드 워커 메시지 직렬화 오류'));
  };

  sharedWorker = worker;
  workerBooted = false;
  return worker;
}

export async function runUpscaleInBackgroundWorker(params: {
  readonly file: File;
  readonly settings: ResizeSettings;
  readonly mimeType: string;
  readonly limits: UpscaleWorkerLimits;
  readonly onProgress?: (percent: number, statusText: string) => void;
  readonly signal?: AbortSignal;
}): Promise<WorkerUpscaleResult> {
  if (!supportsBackgroundUpscaleWorker()) {
    throw new WorkerUnavailableError('이 브라우저는 백그라운드 OffscreenCanvas 워커를 지원하지 않습니다.');
  }

  if (params.signal?.aborted) {
    throw createAbortError();
  }

  const worker = getOrCreateUpscaleWorker();
  const jobId = nextJobId;
  nextJobId += 1;

  return new Promise<WorkerUpscaleResult>((resolve, reject) => {
    let forceKillTimer: number | null = null;

    const handleAbort = (): void => {
      const cancelMsg: UpscaleWorkerRequest = { type: 'cancel', jobId };
      try {
        sharedWorker?.postMessage(cancelMsg);
      } catch {
        // 전송 실패 시 타임아웃 정리로 이관
      }

      if (forceKillTimer === null && typeof window !== 'undefined') {
        forceKillTimer = window.setTimeout(() => {
          forceKillTimer = null;
          if (pendingJobs.has(jobId)) {
            resetWorkerWithError(() => createAbortError());
          }
        }, 3500);
      }
    };

    const cleanup = (): void => {
      if (forceKillTimer !== null && typeof window !== 'undefined') {
        window.clearTimeout(forceKillTimer);
        forceKillTimer = null;
      }
      if (params.signal) {
        params.signal.removeEventListener('abort', handleAbort);
      }
    };

    pendingJobs.set(jobId, {
      resolve,
      reject,
      onProgress: params.onProgress,
      cleanup,
    });

    if (params.signal) {
      params.signal.addEventListener('abort', handleAbort, { once: true });
    }

    try {
      const runMsg: UpscaleWorkerRequest = {
        type: 'run',
        jobId,
        file: params.file,
        settings: params.settings,
        mimeType: params.mimeType,
        limits: params.limits,
      };
      worker.postMessage(runMsg);
    } catch (err: unknown) {
      pendingJobs.delete(jobId);
      cleanup();
      reject(new WorkerUnavailableError(err instanceof Error ? err.message : '워커 메시지 전송 실패'));
    }
  });
}

export function terminateUpscaleWorker(): void {
  resetWorkerWithError(() => createAbortError());
}
