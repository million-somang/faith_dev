import { useCallback, useEffect, useRef } from 'react';

export function useAudioFeedback() {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close().catch(() => {});
      }
      ctxRef.current = null;
    };
  }, []);

  const getContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    try {
      if (!ctxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        ctxRef.current = new AudioCtx();
      }
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume().catch(() => {});
      }
      return ctxRef.current;
    } catch {
      return null;
    }
  }, []);

  const playTone = useCallback(
    (freq: number, durationSec: number, delaySec: number = 0, volume: number = 0.045) => {
      const ctx = getContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime + delaySec;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + durationSec);
      } catch {
        // 브라우저 오디오 자동재생 정책 제한 시 무시
      }
    },
    [getContext]
  );

  const playAdd = useCallback(() => {
    playTone(587.33, 0.07, 0, 0.035);
    playTone(783.99, 0.09, 0.045, 0.035);
  }, [playTone]);

  const playComplete = useCallback(() => {
    playTone(659.25, 0.08, 0, 0.04);
    playTone(880, 0.12, 0.055, 0.045);
  }, [playTone]);

  const playFanfare = useCallback(() => {
    playTone(523.25, 0.11, 0, 0.045);
    playTone(659.25, 0.11, 0.08, 0.045);
    playTone(783.99, 0.11, 0.16, 0.045);
    playTone(1046.5, 0.24, 0.24, 0.055);
  }, [playTone]);

  const playTimerDone = useCallback(() => {
    playTone(880, 0.16, 0, 0.05);
    playTone(880, 0.16, 0.22, 0.05);
    playTone(1174.66, 0.28, 0.44, 0.055);
  }, [playTone]);

  return {
    playAdd,
    playComplete,
    playFanfare,
    playTimerDone,
  };
}
