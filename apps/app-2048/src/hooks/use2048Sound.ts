import { useState, useCallback, useRef } from 'react';

export function use2048Sound() {
    const [isMuted, setIsMuted] = useState<boolean>(() => {
        try {
            return localStorage.getItem('veranex_2048_muted') === 'true';
        } catch {
            return false;
        }
    });

    const audioCtxRef = useRef<AudioContext | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioContextClass) {
                audioCtxRef.current = new AudioContextClass();
            }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const next = !prev;
            try {
                localStorage.setItem('veranex_2048_muted', String(next));
            } catch {
                // Ignore storage error
            }
            return next;
        });
    }, []);

    // 1. 슬라이드 이동 효과음 (부드러운 스윕)
    const playSlideSound = useCallback(() => {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.08);
        } catch {
            // Web Audio error ignore
        }
    }, [isMuted, getAudioContext]);

    // 2. 타일 합체 효과음 (합쳐진 숫자가 클수록 피치 상승)
    const playMergeSound = useCallback((mergedValue: number = 4) => {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;

            // 숫자별 기본 주파수 매핑 (반음 계단식 상승)
            const freqMap: Record<number, number> = {
                4: 261.63,   // C4
                8: 293.66,   // D4
                16: 329.63,  // E4
                32: 392.00,  // G4
                64: 440.00,  // A4
                128: 523.25, // C5
                256: 587.33, // D5
                512: 659.25, // E5
                1024: 783.99,// G5
                2048: 1046.50// C6
            };

            const baseFreq = freqMap[mergedValue] || Math.min(1200, 260 + Math.log2(mergedValue) * 60);

            // 오실레이터 1: 주음
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.05, now + 0.12);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.14);

            // 고득점 타일(128 이상)일 경우 하모닉 2차 배음 추가
            if (mergedValue >= 128) {
                const subOsc = ctx.createOscillator();
                const subGain = ctx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(baseFreq * 1.5, now);
                subGain.gain.setValueAtTime(0.1, now);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

                subOsc.connect(subGain);
                subGain.connect(ctx.destination);
                subOsc.start(now);
                subOsc.stop(now + 0.2);
            }
        } catch {
            // Web Audio error ignore
        }
    }, [isMuted, getAudioContext]);

    // 3. 되돌리기 (Undo) 효과음
    const playUndoSound = useCallback(() => {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.12);
        } catch {
            // Ignore
        }
    }, [isMuted, getAudioContext]);

    // 4. 게임 오버 효과음
    const playGameOverSound = useCallback(() => {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const notes = [330, 294, 261, 196]; // E4, D4, C4, G3 하강

            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sawtooth';
                const start = now + idx * 0.12;
                osc.frequency.setValueAtTime(freq, start);

                gain.gain.setValueAtTime(0.12, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(start);
                osc.stop(start + 0.14);
            });
        } catch {
            // Ignore
        }
    }, [isMuted, getAudioContext]);

    // 5. 2048 승리 팡파르 효과음
    const playWinSound = useCallback(() => {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const fanfare = [
                { f: 523.25, d: 0.12 }, // C5
                { f: 659.25, d: 0.12 }, // E5
                { f: 783.99, d: 0.12 }, // G5
                { f: 1046.50, d: 0.35 } // C6
            ];

            let offset = 0;
            fanfare.forEach(note => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                const start = now + offset;
                osc.frequency.setValueAtTime(note.f, start);

                gain.gain.setValueAtTime(0.2, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + note.d);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(start);
                osc.stop(start + note.d);

                offset += note.d * 0.85;
            });
        } catch {
            // Ignore
        }
    }, [isMuted, getAudioContext]);

    return {
        isMuted,
        toggleMute,
        playSlideSound,
        playMergeSound,
        playUndoSound,
        playGameOverSound,
        playWinSound
    };
}
