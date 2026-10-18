'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MINIHOME_BGM_TRACKS } from '@/data/minihomeCatalogData';
import { MinihomeBgmTrack } from '@/types/minihome.types';

interface MinihomeBgmPlayerProps {
    trackId: string;
    isEditMode: boolean;
    onChangeTrack?: (newTrackId: string) => void;
}

export const MinihomeBgmPlayer: React.FC<MinihomeBgmPlayerProps> = ({
    trackId,
    isEditMode,
    onChangeTrack,
}) => {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const noteIndexRef = useRef<number>(0);

    const currentTrack: MinihomeBgmTrack =
        MINIHOME_BGM_TRACKS.find((t) => t.trackId === trackId) || MINIHOME_BGM_TRACKS[0];

    const stopLoop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const playNote = useCallback((freq: number, waveType: OscillatorType) => {
        try {
            if (!audioCtxRef.current) {
                const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                audioCtxRef.current = new AudioCtx();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = waveType;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            // 부드러운 오르골 엔벨로프
            gain.gain.setValueAtTime(0.001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 0.48);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch (_) {
            // 오디오 컨텍스트 미지원 시 무시
        }
    }, []);

    const startLoop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        noteIndexRef.current = 0;
        const stepMs = Math.round((60 / currentTrack.tempoBpm) * 1000 * 0.75);

        playNote(currentTrack.notesHz[0], currentTrack.waveType);
        noteIndexRef.current = 1;

        intervalRef.current = setInterval(() => {
            const notes = currentTrack.notesHz;
            const hz = notes[noteIndexRef.current % notes.length];
            playNote(hz, currentTrack.waveType);
            noteIndexRef.current += 1;
        }, stepMs);

        setIsPlaying(true);
    }, [currentTrack, playNote]);

    // 트랙 변경 시 재생 중이면 새 트랙으로 재시작
    useEffect(() => {
        if (isPlaying) {
            startLoop();
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [trackId, isPlaying, startLoop]);

    useEffect(() => {
        return () => {
            stopLoop();
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => {});
            }
        };
    }, [stopLoop]);

    const handleTogglePlay = () => {
        if (isPlaying) {
            stopLoop();
        } else {
            startLoop();
        }
    };

    const handleNextTrack = () => {
        const idx = MINIHOME_BGM_TRACKS.findIndex((t) => t.trackId === currentTrack.trackId);
        const nextTrack = MINIHOME_BGM_TRACKS[(idx + 1) % MINIHOME_BGM_TRACKS.length];
        if (onChangeTrack) {
            onChangeTrack(nextTrack.trackId);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 text-white px-3.5 py-2 rounded-2xl border border-slate-700 shadow-xs">
            {/* CD 아이콘 & 이퀄라이저 상태 */}
            <div className="flex items-center gap-2 min-w-0">
                <span
                    className={`w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-[11px] shrink-0 ${
                        isPlaying ? 'animate-spin' : ''
                    }`}
                >
                    💿
                </span>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                            BGM
                        </span>
                        <span className="text-xs font-bold text-slate-100 truncate max-w-[170px] sm:max-w-[230px]">
                            {currentTrack.title}
                        </span>
                    </div>
                </div>
            </div>

            {/* 컨트롤 버튼 */}
            <div className="flex items-center gap-1.5 ml-auto">
                <button
                    type="button"
                    onClick={handleTogglePlay}
                    aria-label={isPlaying ? 'BGM 일시정지' : 'BGM 재생'}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                        isPlaying
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                >
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-[10px]`}></i>
                    <span>{isPlaying ? '정지' : '재생'}</span>
                </button>

                {onChangeTrack && (
                    <button
                        type="button"
                        onClick={handleNextTrack}
                        title="다음 BGM 선곡"
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                        <i className="fas fa-forward-step text-[10px] mr-1"></i>곡변경
                    </button>
                )}
            </div>

            {/* 꾸미기 모드일 때 드롭다운 선곡기 표시 */}
            {isEditMode && onChangeTrack && (
                <div className="w-full pt-2 mt-1 border-t border-slate-800 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-amber-300 shrink-0">🎵 배경음악 설정:</span>
                    <select
                        value={currentTrack.trackId}
                        onChange={(e) => onChangeTrack(e.target.value)}
                        aria-label="미니홈피 배경음악 선택"
                        className="flex-1 bg-slate-800 text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-400"
                    >
                        {MINIHOME_BGM_TRACKS.map((track) => (
                            <option key={track.trackId} value={track.trackId}>
                                [{track.moodLabel}] {track.title} - {track.artist}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};
