import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type WheelEvent as ReactWheelEvent,
} from 'react';

export interface UseCircularDialOptions {
  readonly valueMinutes: number;
  readonly minMinutes: number;
  readonly maxMinutes: number;
  readonly minutesPerRevolution?: number;
  readonly onChangeMinutes: (nextMinutes: number) => void;
}

export interface UseCircularDialResult {
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly isDragging: boolean;
  readonly handlePointerDown: (e: ReactPointerEvent<SVGSVGElement>) => void;
  readonly handlePointerMove: (e: ReactPointerEvent<SVGSVGElement>) => void;
  readonly handlePointerUp: (e: ReactPointerEvent<SVGSVGElement>) => void;
  readonly handleWheel: (e: ReactWheelEvent<SVGSVGElement>) => void;
  readonly handleKeyDown: (e: ReactKeyboardEvent<SVGSVGElement>) => void;
}

interface PointerMetrics {
  readonly angleDeg: number;
  readonly distanceRatio: number;
}

const CENTER_PROTECT_RATIO = 0.42;

function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useCircularDial({
  valueMinutes,
  minMinutes,
  maxMinutes,
  minutesPerRevolution = 60,
  onChangeMinutes,
}: UseCircularDialOptions): UseCircularDialResult {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const isDraggingRef = useRef<boolean>(false);
  const lastAngleRef = useRef<number>(0);
  const accumulatedMinutesRef = useRef<number>(valueMinutes);
  const lastEmittedRef = useRef<number>(valueMinutes);

  const degreesPerMinute = 360 / minutesPerRevolution;

  const getPointerMetrics = useCallback(
    (clientX: number, clientY: number): PointerMetrics | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const radius = Math.min(rect.width, rect.height) / 2;
      const distanceRatio = Math.hypot(dx, dy) / radius;

      let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angleDeg < 0) angleDeg += 360;

      return { angleDeg, distanceRatio };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      const metrics = getPointerMetrics(e.clientX, e.clientY);
      if (!metrics || metrics.distanceRatio < CENTER_PROTECT_RATIO) return;

      const clampedCurrent = clampValue(valueMinutes, minMinutes, maxMinutes);
      const currentLap = Math.floor(Math.max(0, clampedCurrent - 1) / minutesPerRevolution);
      const lapLocalVal = ((clampedCurrent - 1) % minutesPerRevolution) + 1;
      const rawLapMin = Math.round(metrics.angleDeg / degreesPerMinute);

      const lapMin =
        rawLapMin === 0
          ? metrics.angleDeg < 180 && lapLocalVal < minutesPerRevolution / 2
            ? 1
            : minutesPerRevolution
          : rawLapMin;

      const clickedMinutes = clampValue(
        currentLap * minutesPerRevolution + lapMin,
        minMinutes,
        maxMinutes
      );

      isDraggingRef.current = true;
      lastAngleRef.current = metrics.angleDeg;
      accumulatedMinutesRef.current = clickedMinutes;
      lastEmittedRef.current = clickedMinutes;
      setIsDragging(true);

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture is unavailable in synthetic test environments
      }

      if (clickedMinutes !== clampedCurrent) {
        onChangeMinutes(clickedMinutes);
      }
    },
    [
      degreesPerMinute,
      getPointerMetrics,
      maxMinutes,
      minMinutes,
      minutesPerRevolution,
      onChangeMinutes,
      valueMinutes,
    ]
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!isDraggingRef.current) return;

      const metrics = getPointerMetrics(e.clientX, e.clientY);
      if (!metrics) return;

      let deltaDeg = metrics.angleDeg - lastAngleRef.current;
      if (deltaDeg > 180) deltaDeg -= 360;
      if (deltaDeg < -180) deltaDeg += 360;
      lastAngleRef.current = metrics.angleDeg;

      const nextAccumulated = clampValue(
        accumulatedMinutesRef.current + deltaDeg / degreesPerMinute,
        minMinutes,
        maxMinutes
      );
      accumulatedMinutesRef.current = nextAccumulated;

      const snapped = clampValue(Math.round(nextAccumulated), minMinutes, maxMinutes);
      if (snapped !== lastEmittedRef.current) {
        lastEmittedRef.current = snapped;
        onChangeMinutes(snapped);
      }
    },
    [degreesPerMinute, getPointerMetrics, maxMinutes, minMinutes, onChangeMinutes]
  );

  const handlePointerUp = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore if pointer capture was already released
    }
  }, []);

  const handleWheel = useCallback(
    (e: ReactWheelEvent<SVGSVGElement>) => {
      if (e.deltaY === 0) return;
      if (e.cancelable) {
        e.preventDefault();
      }
      const step = e.deltaY < 0 ? 1 : -1;
      const next = clampValue(Math.round(valueMinutes) + step, minMinutes, maxMinutes);
      if (next !== valueMinutes) {
        onChangeMinutes(next);
      }
    },
    [maxMinutes, minMinutes, onChangeMinutes, valueMinutes]
  );

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<SVGSVGElement>) => {
      const step = e.shiftKey ? 5 : 1;
      let next: number | null = null;

      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        next = clampValue(Math.round(valueMinutes) + step, minMinutes, maxMinutes);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        next = clampValue(Math.round(valueMinutes) - step, minMinutes, maxMinutes);
      } else if (e.key === 'Home') {
        next = minMinutes;
      } else if (e.key === 'End') {
        next = maxMinutes;
      }

      if (next === null) return;
      e.preventDefault();
      if (next !== valueMinutes) {
        onChangeMinutes(next);
      }
    },
    [maxMinutes, minMinutes, onChangeMinutes, valueMinutes]
  );

  return {
    svgRef,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleKeyDown,
  };
}
