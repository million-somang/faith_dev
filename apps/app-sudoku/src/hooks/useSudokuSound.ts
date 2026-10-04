import { useState, useCallback, useRef, useEffect } from 'react';

// Web Audio API 절차적 사운드 효과 합성 훅 (외부 mp3 파일 의존성 제로)
export function useSudokuSound() {
    const [isMuted, setIsMuted] = useState<boolean>(() => {
        try {
            return localStorage.getItem('veranex_sudoku_muted') === 'true';
        } catch {
            return false;
        }
    });

    const audioCtxRef = useRef<AudioContext | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
                localStorage.setItem('veranex_sudoku_muted', String(next));
            } catch { }
            return next;
        });
    }, []);

    // 1. 셀 선택 (부드러운 클릭음)
    const playSelect = useCallback(() => {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    }, [isMuted, getAudioContext]);

    // 2. 숫자 입력 (청명한 실로폰음 - 숫자에 따라 음고 상승)
    const playNumberInput = useCallback((num: number) => {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        // C4 ~ D5 스케일 매핑
        const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33];
        const freq = frequencies[(num - 1) % frequencies.length] || 440;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
    }, [isMuted, getAudioContext]);

    // 3. 연필 메모 입력 (가벼운 펜 틱음)
    const playNote = useCallback(() => {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
    }, [isMuted, getAudioContext]);

    // 4. 지우기 (소프트 브러시음)
    const playErase = useCallback(() => {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    }, [isMuted, getAudioContext]);

    // 5. 오답 실수 (경고 버저음)
    const playMistake = useCallback(() => {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.18);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
    }, [isMuted, getAudioContext]);

    // 6. 힌트 사용 (신비로운 차임음)
    const playHint = useCallback(() => {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

            gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.07);
            gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + idx * 0.07 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.07);
            osc.stop(ctx.currentTime + idx * 0.07 + 0.25);
        });
    }, [isMuted, getAudioContext]);

    // 7. 게임 승리 / 클리어 (승리의 메이저 팡파르 아르페지오)
    const playVictory = useCallback(() => {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

            const duration = idx === notes.length - 1 ? 0.6 : 0.2;
            gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.08);
            osc.stop(ctx.currentTime + idx * 0.08 + duration);
        });
    }, [isMuted, getAudioContext]);

    // 언마운트 시 오디오 컨텍스트 닫기 (메모리 누수 방지)
    useEffect(() => {
        return () => {
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close().catch(() => {});
            }
        };
    }, []);

    return {
        isMuted,
        toggleMute,
        playSelect,
        playNumberInput,
        playNote,
        playErase,
        playMistake,
        playHint,
        playVictory
    };
}
