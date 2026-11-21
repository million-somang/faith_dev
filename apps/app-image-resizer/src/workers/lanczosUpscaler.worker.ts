import type { SharpenLevel } from '../types/index';
import {
  applyAdaptiveUnsharpMask,
  resampleImageDataLanczos3,
} from '../utils/lanczosResampler';

export interface LanczosWorkerRequest {
  readonly id: number;
  readonly buffer: ArrayBuffer;
  readonly srcW: number;
  readonly srcH: number;
  readonly dstW: number;
  readonly dstH: number;
  readonly sharpenLevel: SharpenLevel;
}

export type LanczosWorkerResponse =
  | {
      readonly id: number;
      readonly type: 'progress';
      readonly percent: number;
    }
  | {
      readonly id: number;
      readonly type: 'done';
      readonly buffer: ArrayBuffer;
      readonly width: number;
      readonly height: number;
    }
  | {
      readonly id: number;
      readonly type: 'error';
      readonly message: string;
    };

interface WorkerGlobalLike {
  onmessage: ((event: MessageEvent<LanczosWorkerRequest>) => void) | null;
  postMessage(message: LanczosWorkerResponse, transfer?: Transferable[]): void;
}

const workerScope = self as unknown as WorkerGlobalLike;

workerScope.onmessage = (event: MessageEvent<LanczosWorkerRequest>) => {
  const { id, buffer, srcW, srcH, dstW, dstH, sharpenLevel } = event.data;

  try {
    const srcPixels = new Uint8ClampedArray(buffer);
    const resampled = resampleImageDataLanczos3(
      srcPixels,
      srcW,
      srcH,
      dstW,
      dstH,
      (percent) => {
        workerScope.postMessage({ id, type: 'progress', percent });
      }
    );

    const sharpened = applyAdaptiveUnsharpMask(resampled, dstW, dstH, sharpenLevel);
    workerScope.postMessage({ id, type: 'progress', percent: 96 });

    workerScope.postMessage(
      {
        id,
        type: 'done',
        buffer: sharpened.buffer,
        width: dstW,
        height: dstH,
      },
      [sharpened.buffer]
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Lanczos-3 업스케일 처리 중 오류가 발생했습니다.';
    workerScope.postMessage({ id, type: 'error', message });
  }
};
