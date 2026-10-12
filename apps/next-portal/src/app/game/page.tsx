'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAppLauncher } from '@/hooks/useAppLauncher';

const ALL_GENRES = [
    { id: 'mini', label: '미니게임', icon: 'fas fa-bolt' },
    { id: 'online', label: '온라인게임', icon: 'fas fa-globe' },
    { id: 'emulator', label: '에뮬레이터', icon: 'fas fa-gamepad' },
];

const thumbClass = 'w-full h-28 block transition-transform duration-500 group-hover:scale-105';

function SudokuThumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" className={thumbClass}>
            <defs>
                <linearGradient id="sudBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#f5f3ff" />
                    <stop offset="1" stopColor="#ddd6fe" />
                </linearGradient>
            </defs>
            <rect width="320" height="120" fill="url(#sudBg)" />
            <g transform="translate(106 12)">
                <rect x="0" y="0" width="108" height="96" rx="10" fill="#ffffff" stroke="#c4b5fd" strokeWidth="2" />
                <g stroke="#ede9fe" strokeWidth="1.5">
                    <path d="M36 6V90M72 6V90M6 32H102M6 64H102" />
                </g>
                <g fontFamily="inherit" fontWeight="800" fontSize="20" textAnchor="middle">
                    <text x="18" y="25" fill="#7c3aed">5</text>
                    <text x="90" y="25" fill="#7c3aed">3</text>
                    <text x="54" y="57" fill="#7c3aed">8</text>
                    <text x="18" y="89" fill="#7c3aed">1</text>
                    <text x="90" y="89" fill="#7c3aed">9</text>
                    <text x="54" y="25" fill="#c4b5fd">7</text>
                    <text x="18" y="57" fill="#c4b5fd">2</text>
                    <text x="90" y="57" fill="#c4b5fd">6</text>
                    <text x="54" y="89" fill="#c4b5fd">4</text>
                </g>
            </g>
        </svg>
    );
}

function Game2048Thumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" className={thumbClass}>
            <defs>
                <linearGradient id="g2048Bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#faf8ef" />
                    <stop offset="1" stopColor="#f3ebd9" />
                </linearGradient>
            </defs>
            <rect width="320" height="120" fill="url(#g2048Bg)" />
            <g transform="translate(107 7)">
                <rect x="-6" y="-6" width="118" height="118" rx="12" fill="#bbada0" />
                <g fontFamily="inherit" fontWeight="800" textAnchor="middle">
                    <rect x="0" y="0" width="50" height="50" rx="6" fill="#eee4da" />
                    <text x="25" y="34" fontSize="24" fill="#776e65">2</text>
                    <rect x="56" y="0" width="50" height="50" rx="6" fill="#ede0c8" />
                    <text x="81" y="34" fontSize="24" fill="#776e65">4</text>
                    <rect x="0" y="56" width="50" height="50" rx="6" fill="#f2b179" />
                    <text x="25" y="90" fontSize="24" fill="#ffffff">8</text>
                    <rect x="56" y="56" width="50" height="50" rx="6" fill="#edc22e" />
                    <text x="81" y="88" fontSize="17" fill="#ffffff">2048</text>
                </g>
            </g>
        </svg>
    );
}

const MINE_CELLS = [
    { c: 0, r: 0, k: 'num', v: '1', col: '#2563eb' },
    { c: 1, r: 0, k: 'raised' },
    { c: 2, r: 0, k: 'flag' },
    { c: 3, r: 0, k: 'raised' },
    { c: 4, r: 0, k: 'num', v: '2', col: '#16a34a' },
    { c: 0, r: 1, k: 'raised' },
    { c: 1, r: 1, k: 'bomb' },
    { c: 2, r: 1, k: 'num', v: '3', col: '#dc2626' },
    { c: 3, r: 1, k: 'raised' },
    { c: 4, r: 1, k: 'num', v: '1', col: '#2563eb' },
    { c: 0, r: 2, k: 'empty' },
    { c: 1, r: 2, k: 'raised' },
    { c: 2, r: 2, k: 'raised' },
    { c: 3, r: 2, k: 'num', v: '2', col: '#16a34a' },
    { c: 4, r: 2, k: 'raised' },
];

function MinesweeperThumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" className={thumbClass}>
            <defs>
                <linearGradient id="mineBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#f1f5f9" />
                    <stop offset="1" stopColor="#e2e8f0" />
                </linearGradient>
            </defs>
            <rect width="320" height="120" fill="url(#mineBg)" />
            <g transform="translate(95 21)">
                {MINE_CELLS.map((cell) => {
                    const x = cell.c * 26;
                    const y = cell.r * 26;
                    if (cell.k === 'raised') {
                        return (
                            <g key={`${cell.c}-${cell.r}`}>
                                <rect x={x} y={y} width="24" height="24" rx="3" fill="#94a3b8" />
                                <rect x={x} y={y} width="24" height="22" rx="3" fill="#cbd5e1" />
                            </g>
                        );
                    }
                    if (cell.k === 'flag') {
                        return (
                            <g key={`${cell.c}-${cell.r}`}>
                                <rect x={x} y={y} width="24" height="24" rx="3" fill="#94a3b8" />
                                <rect x={x} y={y} width="24" height="22" rx="3" fill="#cbd5e1" />
                                <path d={`M${x + 9} ${y + 5}V${y + 19}`} stroke="#475569" strokeWidth="2" />
                                <path d={`M${x + 9} ${y + 5}L${x + 18} ${y + 9}L${x + 9} ${y + 12}Z`} fill="#ef4444" />
                                <rect x={x + 5} y={y + 18} width="13" height="3" rx="1" fill="#475569" />
                            </g>
                        );
                    }
                    if (cell.k === 'bomb') {
                        return (
                            <g key={`${cell.c}-${cell.r}`}>
                                <rect x={x} y={y} width="24" height="24" rx="3" fill="#fee2e2" stroke="#fecaca" />
                                <circle cx={x + 12} cy={y + 12} r="7" fill="#1f2937" />
                                <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round">
                                    <path d={`M${x + 12} ${y + 2}V${y + 22}M${x + 2} ${y + 12}H${x + 22}M${x + 5} ${y + 5}L${x + 19} ${y + 19}M${x + 19} ${y + 5}L${x + 5} ${y + 19}`} />
                                </g>
                                <circle cx={x + 9} cy={y + 9} r="2" fill="#ffffff" />
                            </g>
                        );
                    }
                    return (
                        <g key={`${cell.c}-${cell.r}`}>
                            <rect x={x} y={y} width="24" height="24" rx="3" fill="#f8fafc" stroke="#e2e8f0" />
                            {cell.k === 'num' && (
                                <text x={x + 12} y={y + 17} textAnchor="middle" fontFamily="inherit" fontWeight="800" fontSize="14" fill={cell.col}>{cell.v}</text>
                            )}
                        </g>
                    );
                })}
            </g>
        </svg>
    );
}

function FreeCellThumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" className={thumbClass}>
            <defs>
                <linearGradient id="fcBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#064e3b" />
                    <stop offset="50" stopColor="#047857" />
                    <stop offset="100" stopColor="#0f766e" />
                </linearGradient>
            </defs>
            <rect width="320" height="120" fill="url(#fcBg)" />
            <g transform="translate(18, 12)" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" fill="none" opacity="0.6">
                <rect x="0" y="0" width="28" height="38" rx="4" />
                <rect x="34" y="0" width="28" height="38" rx="4" />
                <rect x="68" y="0" width="28" height="38" rx="4" />
                <rect x="102" y="0" width="28" height="38" rx="4" />
                <rect x="150" y="0" width="28" height="38" rx="4" />
                <rect x="184" y="0" width="28" height="38" rx="4" />
                <rect x="218" y="0" width="28" height="38" rx="4" />
                <rect x="252" y="0" width="28" height="38" rx="4" />
            </g>
            <g transform="translate(168, 12)">
                <rect x="0" y="0" width="28" height="38" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <text x="5" y="12" fontSize="9" fontWeight="900" fill="#1e293b" fontFamily="sans-serif">A</text>
                <text x="14" y="24" fontSize="14" textAnchor="middle" fill="#1e293b">♠</text>
            </g>
            <g transform="translate(202, 12)">
                <rect x="0" y="0" width="28" height="38" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <text x="5" y="12" fontSize="9" fontWeight="900" fill="#dc2626" fontFamily="sans-serif">A</text>
                <text x="14" y="24" fontSize="14" textAnchor="middle" fill="#dc2626">♥</text>
            </g>
            <g transform="translate(45, 52)">
                <rect x="0" y="0" width="34" height="48" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <text x="5" y="13" fontSize="10" fontWeight="900" fill="#1e293b" fontFamily="sans-serif">K</text>
                <text x="17" y="30" fontSize="16" textAnchor="middle" fill="#1e293b">♠</text>
            </g>
            <g transform="translate(95, 52)">
                <rect x="0" y="0" width="34" height="48" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <text x="5" y="13" fontSize="10" fontWeight="900" fill="#dc2626" fontFamily="sans-serif">Q</text>
                <text x="17" y="30" fontSize="16" textAnchor="middle" fill="#dc2626">♥</text>
            </g>
            <g transform="translate(145, 52)">
                <rect x="0" y="0" width="34" height="48" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <text x="5" y="13" fontSize="10" fontWeight="900" fill="#1e293b" fontFamily="sans-serif">J</text>
                <text x="17" y="30" fontSize="16" textAnchor="middle" fill="#1e293b">♣</text>
            </g>
            <g transform="translate(195, 52)">
                <rect x="0" y="0" width="34" height="48" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <text x="4" y="13" fontSize="10" fontWeight="900" fill="#dc2626" fontFamily="sans-serif">10</text>
                <text x="17" y="30" fontSize="16" textAnchor="middle" fill="#dc2626">♦</text>
            </g>
            <g transform="translate(245, 52)">
                <rect x="0" y="0" width="34" height="48" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <text x="5" y="13" fontSize="10" fontWeight="900" fill="#1e293b" fontFamily="sans-serif">9</text>
                <text x="17" y="30" fontSize="16" textAnchor="middle" fill="#1e293b">♠</text>
            </g>
        </svg>
    );
}

function JanggiThumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" className={thumbClass}>
            <defs>
                <linearGradient id="janggiWoodBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#faeedb" />
                    <stop offset="50%" stopColor="#f3e2c6" />
                    <stop offset="100%" stopColor="#ebd4b3" />
                </linearGradient>
                <linearGradient id="thumbPieceWood" x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="40%" stopColor="#fbf7ee" />
                    <stop offset="100%" stopColor="#e8dcbf" />
                </linearGradient>
            </defs>
            <rect width="320" height="120" fill="url(#janggiWoodBg)" />
            <g stroke="#3e2415" strokeWidth="1.6" strokeLinecap="round" opacity="0.9">
                <path d="M10 20H310M10 50H310M10 70H310M10 100H310" />
                <path d="M40 10V110M90 10V110M140 10V110M180 10V110M230 10V110M280 10V110" />
                <path d="M40 20L140 100M140 20L40 100" strokeWidth="1.6" />
                <path d="M180 20L280 100M280 20L180 100" strokeWidth="1.6" />
            </g>
            <circle cx="140" cy="50" r="3" fill="#422513" />
            <circle cx="180" cy="70" r="3" fill="#422513" />
            <g>
                <polygon points="76,43 104,43 111,50 111,70 104,77 76,77 69,70 69,50" fill="url(#thumbPieceWood)" stroke="#8f6f46" strokeWidth="1" />
                <text x="90" y="66" fill="#065f46" fontSize="16" fontWeight="900" textAnchor="middle" fontFamily="serif">楚</text>
                <polygon points="29,8 51,8 57,14 57,26 51,32 29,32 23,26 23,14" fill="url(#thumbPieceWood)" stroke="#8f6f46" strokeWidth="1" />
                <text x="40" y="25" fill="#065f46" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="serif">車</text>
                <polygon points="129,38 151,38 157,44 157,56 151,62 129,62 123,56 123,44" fill="url(#thumbPieceWood)" stroke="#8f6f46" strokeWidth="1" />
                <text x="140" y="55" fill="#065f46" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="serif">包</text>
            </g>
            <g>
                <polygon points="216,43 244,43 251,50 251,70 244,77 216,77 209,70 209,50" fill="url(#thumbPieceWood)" stroke="#8f6f46" strokeWidth="1" />
                <text x="230" y="66" fill="#991b1b" fontSize="16" fontWeight="900" textAnchor="middle" fontFamily="serif">漢</text>
                <polygon points="169,58 191,58 197,64 197,76 191,82 169,82 163,76 163,64" fill="url(#thumbPieceWood)" stroke="#8f6f46" strokeWidth="1" />
                <text x="180" y="75" fill="#991b1b" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="serif">馬</text>
                <polygon points="269,88 291,88 297,94 297,106 291,112 269,112 263,106 263,94" fill="url(#thumbPieceWood)" stroke="#8f6f46" strokeWidth="1" />
                <text x="280" y="105" fill="#991b1b" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="serif">車</text>
            </g>
        </svg>
    );
}

function BaseballThumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" className={thumbClass}>
            <defs>
                <linearGradient id="bbGrass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#047857" />
                </linearGradient>
            </defs>
            <rect width="320" height="120" fill="url(#bbGrass)" />
            <polygon points="160,15 250,60 160,105 70,60" fill="#fed7aa" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 3" />
            <polygon points="160,25 235,60 160,95 85,60" fill="#059669" />
            <circle cx="160" cy="60" r="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
            <path d="M 152 48 Q 157 60 152 72" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 1.5" />
            <path d="M 168 48 Q 163 60 168 72" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 1.5" />
        </svg>
    );
}

function OmokThumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" className={thumbClass}>
            <defs>
                <linearGradient id="omokWood" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#e8c382" />
                    <stop offset="100%" stopColor="#c9934e" />
                </linearGradient>
            </defs>
            <rect width="320" height="120" fill="url(#omokWood)" />
            <g stroke="#784c1f" strokeWidth="1" opacity="0.4">
                <path d="M0 20H320M0 40H320M0 60H320M0 80H320M0 100H320M40 0V120M80 0V120M120 0V120M160 0V120M200 0V120M240 0V120M280 0V120" />
            </g>
            <line x1="60" y1="60" x2="260" y2="60" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
            <circle cx="60" cy="60" r="15" fill="#1f2937" />
            <circle cx="110" cy="60" r="15" fill="#1f2937" />
            <circle cx="160" cy="60" r="15" fill="#1f2937" />
            <circle cx="210" cy="60" r="15" fill="#1f2937" />
            <circle cx="260" cy="60" r="15" fill="#1f2937" />
            <circle cx="110" cy="30" r="14" fill="#ffffff" />
            <circle cx="160" cy="90" r="14" fill="#ffffff" />
            <circle cx="210" cy="30" r="14" fill="#ffffff" />
        </svg>
    );
}

function FlightThumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" className={thumbClass}>
            <defs>
                <linearGradient id="flightSky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
            </defs>
            <rect width="320" height="120" fill="url(#flightSky)" />
            <g transform="translate(230, 25)">
                <polygon points="0,0 -8,-10 8,-10" fill="#ef4444" />
                <polygon points="18,12 10,2 26,2" fill="#ef4444" />
            </g>
            <g stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
                <line x1="154" y1="42" x2="154" y2="12" />
                <line x1="166" y1="42" x2="166" y2="12" />
            </g>
            <g transform="translate(160, 60)">
                <ellipse cx="0" cy="0" rx="26" ry="6.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                <rect x="-16" y="-12" width="6" height="32" rx="2" fill="#94a3b8" />
                <rect x="10" y="-12" width="6" height="32" rx="2" fill="#94a3b8" />
                <rect x="-18" y="16" width="36" height="4" rx="1" fill="#64748b" />
                <ellipse cx="0" cy="-4" rx="4.5" ry="13" fill="#0284c7" />
            </g>
        </svg>
    );
}

export default function GamePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { launchApp } = useAppLauncher();
    const [genre, setGenre] = useState('mini');

    const genres = user ? ALL_GENRES : [{ id: 'mini', label: '미니게임', icon: 'fas fa-bolt' }];
    const activeGenre = user ? genre : 'mini';

    return (
        <main className="flex-1 max-w-6xl mx-auto px-1 sm:px-4 py-8 w-full space-y-8">
            {/* 게임 테마 히어로 배너 */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white px-6 sm:px-10 py-8 shadow-xl">
                <div className="absolute -top-14 -right-10 w-52 h-52 rounded-full bg-white/10 pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-8 w-64 h-64 rounded-full bg-indigo-300/20 pointer-events-none"></div>
                <i className="fas fa-gamepad absolute right-6 bottom-2 text-7xl sm:text-8xl text-white/15 pointer-events-none"></i>
                <div className="relative">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold mb-3">
                        <i className={activeGenre === 'mini' ? 'fas fa-bolt' : activeGenre === 'emulator' ? 'fas fa-gamepad' : 'fas fa-globe'}></i>{' '}
                        {genres.find(g => g.id === activeGenre)?.label || '미니게임'}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                        {activeGenre === 'emulator'
                            ? '추억의 8비트 & 16비트 레트로 콘솔 에뮬레이터'
                            : activeGenre === 'online'
                            ? '실시간 1:1 대국, 플레이어와 함께하는 온라인 게임'
                            : '틈날 때 가볍게, 무료로 즐기는 미니게임'}
                    </h1>
                    <p className="text-indigo-50 text-xs sm:text-sm font-medium">
                        {activeGenre === 'emulator'
                            ? '소장 ROM 파일 드래그 앤 드롭으로 브라우저에서 즉시 실행'
                            : activeGenre === 'online'
                            ? '베라오목 온라인 — 실시간 매칭과 대기실 기능으로 다른 플레이어와 1:1 두뇌 승부를 펼쳐보세요'
                            : '베라 플라이트 · 클래식 프리셀 · 스도쿠 · 2048 · 지뢰찾기 · 오목 · 장기 — 설치 없이 브라우저에서 바로 플레이하세요'}
                    </p>
                </div>
            </section>

            {/* 게임 선택 박스 */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <h2 className="text-xl font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">게임 선택</h2>

                {user && (
                    <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
                        {genres.map(g => (
                            <button
                                key={g.id}
                                onClick={() => setGenre(g.id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeGenre === g.id
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                <i className={`${g.icon} text-xs ${activeGenre === g.id ? 'text-violet-500' : ''}`} />
                                {g.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* 0. 베라 플라이트 */}
                    <button onClick={() => router.push('/game/flight')} className="bg-white border-2 text-left border-sky-200 rounded-2xl overflow-hidden hover:border-sky-400 hover:shadow-xl transition-all group relative cursor-pointer">
                        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                            1942 REMAKE
                        </div>
                        <div className="overflow-hidden bg-[#0284c7]"><FlightThumb /></div>
                        <div className="p-5">
                            <h3 className="font-black text-xl text-sky-800 mb-1 group-hover:text-sky-900 transition-colors flex items-center gap-2">
                                <span>Vera Flight (베라 플라이트)</span>
                                <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md font-bold">1942 슈팅</span>
                            </h3>
                            <p className="text-slate-500 text-xs leading-relaxed mb-3">360° 공중제비 롤링(1.5초 무적)과 메가 폭탄, 빨간 편대 격추와 4단계 무기 업그레이드로 거대 보스 전함을 격파하세요.</p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-sky-600 font-bold">
                                <span>게임 시작 →</span>
                                <span className="text-slate-400 font-normal">웹 무료 플레이</span>
                            </div>
                        </div>
                    </button>

                    {/* 1. 베라장기 */}
                    <button onClick={() => router.push('/game/janggi')} className="bg-white border-2 text-left border-cyan-200 rounded-2xl overflow-hidden hover:border-cyan-400 hover:shadow-xl transition-all group relative cursor-pointer">
                        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                            HOT NEW
                        </div>
                        <div className="overflow-hidden bg-[#f4e4cb]"><JanggiThumb /></div>
                        <div className="p-5">
                            <h3 className="font-black text-xl text-cyan-800 mb-1 group-hover:text-cyan-900 transition-colors flex items-center gap-2">
                                <span>Vera Janggi (베라장기)</span>
                                <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-md font-bold">정통 9×10</span>
                            </h3>
                            <p className="text-slate-500 text-xs leading-relaxed mb-3">4대 상차림(마상상마/원앙마 등), 공식 73.5점 덤 규정, 1일 1외통수 매일 묘수풀이 및 특수 스킬 배틀을 즐겨보세요.</p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-cyan-600 font-bold">
                                <span>게임 시작 →</span>
                                <span className="text-slate-400 font-normal">웹 무료 플레이</span>
                            </div>
                        </div>
                    </button>

                    {/* 2. 베라 숫자야구 */}
                    <button onClick={() => router.push('/game/baseball')} className="bg-white border-2 text-left border-red-200 rounded-2xl overflow-hidden hover:border-red-400 hover:shadow-xl transition-all group relative cursor-pointer">
                        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                            9 INNINGS
                        </div>
                        <div className="overflow-hidden bg-[#047857]"><BaseballThumb /></div>
                        <div className="p-5">
                            <h3 className="font-black text-xl text-red-700 mb-1 group-hover:text-red-800 transition-colors flex items-center gap-2">
                                <span>Vera Baseball (베라 숫자야구)</span>
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-md font-bold">정규 9이닝 리그</span>
                            </h3>
                            <p className="text-slate-500 text-xs leading-relaxed mb-3">서로 다른 3자리 숫자를 9회말 이내에 추리! 완봉승(3이닝 이내)과 퀄리티 스타트에 도전하세요.</p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-red-600 font-bold">
                                <span>게임 시작 →</span>
                                <span className="text-slate-400 font-normal">웹 무료 플레이</span>
                            </div>
                        </div>
                    </button>

                    {/* 3. 베라오목 */}
                    <button onClick={() => router.push('/game/omok')} className="bg-white border-2 text-left border-amber-200 rounded-2xl overflow-hidden hover:border-amber-400 hover:shadow-xl transition-all group relative cursor-pointer">
                        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                            NEW AI
                        </div>
                        <div className="overflow-hidden bg-[#dfb170]"><OmokThumb /></div>
                        <div className="p-5">
                            <h3 className="font-black text-xl text-amber-700 mb-1 group-hover:text-amber-800 transition-colors flex items-center gap-2">
                                <span>Vera Omok (베라오목)</span>
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">15×15 정통 5목</span>
                            </h3>
                            <p className="text-slate-500 text-xs leading-relaxed mb-3">초급·중급·고급(마스터) 3단계 인공지능과 대결하며 실시간 형세 분석과 청명한 바둑돌 손맛을 느껴보세요.</p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-amber-600 font-bold">
                                <span>게임 시작 →</span>
                                <span className="text-slate-400 font-normal">웹 무료 플레이</span>
                            </div>
                        </div>
                    </button>

                    {/* 4. 클래식 프리셀 */}
                    <button onClick={() => router.push('/game/freecell')} className="bg-white border-2 text-left border-emerald-200 rounded-2xl overflow-hidden hover:border-emerald-400 hover:shadow-xl transition-all group relative cursor-pointer">
                        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                            CLASSIC
                        </div>
                        <div className="overflow-hidden bg-[#064e3b]"><FreeCellThumb /></div>
                        <div className="p-5">
                            <h3 className="font-black text-xl text-emerald-700 mb-1 group-hover:text-emerald-800 transition-colors flex items-center gap-2">
                                <span>클래식 프리셀 (FreeCell)</span>
                                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">정통 솔리테어</span>
                            </h3>
                            <p className="text-slate-500 text-xs leading-relaxed mb-3">4개의 프리셀을 전략적으로 활용해 52장 카드를 홈셀로 완벽 수집하세요!</p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-emerald-600 font-bold">
                                <span>게임 시작 →</span>
                                <span className="text-slate-400 font-normal">웹 무료 플레이</span>
                            </div>
                        </div>
                    </button>

                    {/* 5. 스도쿠 */}
                    <button onClick={() => router.push('/game/sudoku')} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-violet-300 hover:shadow-lg transition-all group cursor-pointer">
                        <div className="overflow-hidden bg-[#ddd6fe]"><SudokuThumb /></div>
                        <div className="p-5">
                            <h3 className="font-extrabold text-xl text-violet-700 mb-1 group-hover:text-violet-800 transition-colors">스도쿠</h3>
                            <p className="text-slate-500 text-xs leading-relaxed mb-3">빈 칸에 숫자를 채워 9×9 퍼즐을 완성하세요!</p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-violet-600 font-bold">
                                <span>게임 시작 →</span>
                                <span className="text-slate-400 font-normal">웹 무료 플레이</span>
                            </div>
                        </div>
                    </button>

                    {/* 6. 2048 */}
                    <button onClick={() => router.push('/game/2048')} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-cyan-300 hover:shadow-lg transition-all group cursor-pointer">
                        <div className="overflow-hidden bg-[#f3ebd9]"><Game2048Thumb /></div>
                        <div className="p-5">
                            <h3 className="font-extrabold text-xl text-cyan-700 mb-1 group-hover:text-cyan-800 transition-colors">2048 챌린지</h3>
                            <p className="text-slate-500 text-xs leading-relaxed mb-3">같은 숫자를 합쳐 2048 타일을 만들어보세요!</p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-cyan-600 font-bold">
                                <span>게임 시작 →</span>
                                <span className="text-slate-400 font-normal">웹 무료 플레이</span>
                            </div>
                        </div>
                    </button>

                    {/* 7. 지뢰찾기 */}
                    <button onClick={() => router.push('/game/minesweeper')} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-red-300 hover:shadow-lg transition-all group cursor-pointer">
                        <div className="overflow-hidden bg-[#e2e8f0]"><MinesweeperThumb /></div>
                        <div className="p-5">
                            <h3 className="font-extrabold text-xl text-red-600 mb-1 group-hover:text-red-700 transition-colors">스피드 지뢰찾기</h3>
                            <p className="text-slate-500 text-xs leading-relaxed mb-3">지뢰를 피해 모든 칸을 최대한 빨리 열어보세요!</p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-red-600 font-bold">
                                <span>게임 시작 →</span>
                                <span className="text-slate-400 font-normal">웹 무료 플레이</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* 미니게임 전용 가이드 & 규칙 */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-slate-700 space-y-8">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 flex items-center gap-2">
                        <i className="fas fa-gamepad text-purple-600"></i>
                        VERA 무설치 브라우저 미니게임 가이드 & 플레이 규칙
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        VERA 게임 센터는 별도의 프로그램 설치나 회원가입 절차 없이 모든 웹 브라우저에서 즉시 실행되는 고품질 무료 미니게임을 수록하고 있습니다.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-amber-200/80 space-y-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-circle-dot text-amber-600"></i> 베라오목 (Vera Omok) 전략
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            15×15 바둑판에서 흑돌과 백돌이 번갈아 착수하여 가로, 세로, 대각선 중 5개의 돌을 연속으로 먼저 놓으면 승리합니다. 3단계 AI를 상대로 양수겸장 전략을 펼쳐보세요.
                        </p>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-emerald-200/80 space-y-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-spade text-emerald-600"></i> 클래식 프리셀 전략
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            4개의 프리셀과 빈 열을 전략적으로 활용해 52장의 트럼프 카드를 에이스(A)부터 킹(K)까지 4개 홈셀로 수집하는 정통 솔리테어입니다.
                        </p>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-grip-nine text-violet-600"></i> 스도쿠 규칙 및 해법
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            9×9 격자판의 가로줄, 세로줄, 3×3 소형 격자 안에 1부터 9까지의 숫자가 중복 없이 들어가도록 채우는 논리 퍼즐입니다.
                        </p>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-layer-group text-cyan-600"></i> 2048 퍼즐 공략법
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            같은 숫자가 적힌 타일을 합쳐 마침내 2048 타일을 완성하는 숫자 퍼즐입니다. 가장 큰 숫자를 구석에 고정하는 전략을 사용하세요.
                        </p>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-bomb text-red-500"></i> 스피드 지뢰찾기
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            숫자가 의미하는 주변 8칸의 지뢰 개수를 추론하여 안전한 칸을 빠르게 열어가는 고전 명작입니다.
                        </p>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-sky-200/80 space-y-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-plane text-sky-600"></i> 베라 플라이트 (1942)
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            태평양 상공을 가르는 정통 종스크롤 비행 슈팅 게임입니다. 롤링 회피와 전면 폭탄, 파워업 아이템으로 보스를 공략하세요.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
