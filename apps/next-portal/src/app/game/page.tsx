'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAppLauncher } from '@/hooks/useAppLauncher';

const ALL_GENRES = [
    {
        id: 'mini',
        label: '미니게임',
        subLabel: '무설치 11종 아케이드 · 보드 · 퍼즐',
        badge: '11 GAMES',
        badgeClass: 'bg-violet-100 text-violet-700 border-violet-200',
        icon: 'fas fa-bolt',
        image: '/images/game/icon_genre_mini.png',
        visualBg: 'from-violet-50 via-indigo-50/80 to-purple-50',
        activeRing: 'border-violet-600 ring-2 ring-violet-500/20 bg-white shadow-md',
    },
    {
        id: 'online',
        label: '온라인게임',
        subLabel: '실시간 1:1 매칭 대국 · 온라인 RPG',
        badge: 'LIVE PvP',
        badgeClass: 'bg-sky-100 text-sky-700 border-sky-200',
        icon: 'fas fa-globe',
        image: '/images/game/icon_genre_online.png',
        visualBg: 'from-sky-50 via-blue-50/80 to-indigo-50',
        activeRing: 'border-blue-600 ring-2 ring-blue-500/20 bg-white shadow-md',
    },
    {
        id: 'emulator',
        label: '에뮬레이터',
        subLabel: '추억의 8비트 · 16비트 레트로 콘솔',
        badge: 'RETRO ROM',
        badgeClass: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
        icon: 'fas fa-gamepad',
        image: '/images/game/icon_genre_emulator.png',
        visualBg: 'from-fuchsia-50 via-purple-50/80 to-indigo-50',
        activeRing: 'border-purple-600 ring-2 ring-purple-500/20 bg-white shadow-md',
    },
];

const QUICK_HERO_GAMES = [
    { label: '🎯 베라 서브마린', href: '/game/submarine' },
    { label: '🎱 당구 클럽', href: '/game/billiards' },
    { label: '✈️ 베라 플라이트', href: '/game/flight' },
    { label: '♟️ 베라장기', href: '/game/janggi' },
    { label: '⚾ 숫자야구', href: '/game/baseball' },
    { label: '⚫ 베라오목', href: '/game/omok' },
    { label: '✨ 베라 팝', href: '/game/vera-pop' },
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

function VeraPopThumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" className={thumbClass}>
            <defs>
                <linearGradient id="vpBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#312e81" />
                    <stop offset="50" stopColor="#4c1d95" />
                    <stop offset="100" stopColor="#831843" />
                </linearGradient>
            </defs>
            <rect width="320" height="120" fill="url(#vpBg)" />
            <g opacity="0.15" stroke="#ffffff" strokeWidth="1">
                <path d="M0 30H320M0 60H320M0 90H320M40 0V120M80 0V120M120 0V120M160 0V120M200 0V120M240 0V120M280 0V120" />
            </g>
            <g transform="translate(45, 60)">
                <rect x="-18" y="-18" width="36" height="36" rx="6" fill="#3b82f6" transform="rotate(45)" />
                <circle cx="0" cy="0" r="8" fill="#93c5fd" />
            </g>
            <g transform="translate(105, 60)">
                <rect x="-18" y="-18" width="36" height="36" rx="10" fill="#10b981" />
                <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#a7f3d0" />
            </g>
            <g transform="translate(160, 60)">
                <circle cx="0" cy="0" r="20" fill="#8b5cf6" />
                <circle cx="0" cy="0" r="10" fill="#ddd6fe" />
            </g>
            <g transform="translate(215, 60)">
                <polygon points="0,-22 20,16 -20,16" fill="#f59e0b" />
                <circle cx="0" cy="4" r="6" fill="#fef3c7" />
            </g>
            <g transform="translate(270, 60)">
                <rect x="-16" y="-16" width="32" height="32" rx="6" fill="#ef4444" transform="rotate(15)" />
                <circle cx="0" cy="0" r="7" fill="#fecaca" />
            </g>
        </svg>
    );
}

function BilliardsThumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" className={thumbClass}>
            <defs>
                <linearGradient id="bilCloth" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="55%" stopColor="#1d4ed8" />
                    <stop offset="100%" stopColor="#1e40af" />
                </linearGradient>
                <linearGradient id="bilWood" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5c2d16" />
                    <stop offset="50%" stopColor="#7c3f1d" />
                    <stop offset="100%" stopColor="#4a220f" />
                </linearGradient>
            </defs>
            <rect width="320" height="120" fill="url(#bilWood)" />
            <rect x="10" y="10" width="300" height="100" rx="6" fill="#1e3a8a" />
            <rect x="15" y="15" width="290" height="90" rx="3" fill="url(#bilCloth)" />
            <g fill="#f8fafc" opacity="0.8">
                <circle cx="55" cy="5" r="1.5" />
                <circle cx="107" cy="5" r="1.5" />
                <circle cx="160" cy="5" r="1.5" />
                <circle cx="213" cy="5" r="1.5" />
                <circle cx="265" cy="5" r="1.5" />
                <circle cx="55" cy="115" r="1.5" />
                <circle cx="107" cy="115" r="1.5" />
                <circle cx="160" cy="115" r="1.5" />
                <circle cx="213" cy="115" r="1.5" />
                <circle cx="265" cy="115" r="1.5" />
            </g>
            <path d="M 85 74 L 168 42 L 245 15 L 305 58 L 222 80" fill="none" stroke="#93c5fd" strokeWidth="1.8" strokeDasharray="4 3" opacity="0.85" />
            <line x1="18" y1="100" x2="72" y2="79" stroke="#fde68a" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="18" y1="100" x2="42" y2="91" stroke="#78350f" strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="72" cy="79" r="2.2" fill="#38bdf8" />
            <circle cx="85" cy="74" r="12" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="81" cy="70" r="3.5" fill="#ffffff" opacity="0.9" />
            <circle cx="88" cy="76" r="1.8" fill="#ef4444" />
            <circle cx="180" cy="38" r="12" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
            <circle cx="176" cy="34" r="3.5" fill="#fecaca" opacity="0.8" />
            <circle cx="222" cy="80" r="12" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />
            <circle cx="218" cy="76" r="3.5" fill="#fecaca" opacity="0.8" />
            <circle cx="255" cy="46" r="12" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            <circle cx="251" cy="42" r="3.5" fill="#fef08a" opacity="0.85" />
        </svg>
    );
}

function SubmarineThumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" className={thumbClass}>
            <defs>
                <linearGradient id="subSea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0c4a6e" />
                    <stop offset="60%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#020617" />
                </linearGradient>
                <pattern id="subGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.25" />
                </pattern>
            </defs>
            <rect width="320" height="120" fill="url(#subSea)" />
            <rect width="320" height="120" fill="url(#subGrid)" />
            <circle cx="85" cy="65" r="28" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle cx="85" cy="65" r="48" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.25" />
            <line x1="85" y1="65" x2="135" y2="35" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
            <g transform="translate(145, 55)">
                <path d="M 0 10 C 20 0, 80 0, 110 8 C 118 10, 122 14, 110 18 C 80 24, 20 24, 0 16 Z" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                <rect x="45" y="-6" width="18" height="10" rx="3" fill="#475569" stroke="#64748b" strokeWidth="1" />
                <line x1="52" y1="-12" x2="52" y2="-6" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="54" cy="-12" r="2" fill="#38bdf8" />
                <path d="M -4 6 L 0 12 L -4 18" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            <g transform="translate(85, 65)">
                <circle cx="0" cy="0" r="14" fill="none" stroke="#ef4444" strokeWidth="1.8" />
                <line x1="-18" y1="0" x2="18" y2="0" stroke="#ef4444" strokeWidth="1.8" />
                <line x1="0" y1="-18" x2="0" y2="18" stroke="#ef4444" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3" fill="#f59e0b" />
                <text x="18" y="-8" fill="#fde047" fontSize="10" fontWeight="900" fontFamily="monospace">B-7 HIT!</text>
            </g>
        </svg>
    );
}

export default function GamePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { launchApp } = useAppLauncher();
    const [genre, setGenre] = useState('mini');

    const genres = user ? ALL_GENRES : [ALL_GENRES[0]];
    const activeGenre = user ? genre : 'mini';
    const currentGenreMeta = ALL_GENRES.find(g => g.id === activeGenre) || ALL_GENRES[0];

    return (
        <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full space-y-8">
            {/* 1. 나노바나나 3D 아케이드 히어로 배너 */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white p-6 sm:p-8 shadow-xl border border-white/10">
                <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-violet-500/25 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="w-full lg:max-w-2xl space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-violet-400/20 text-violet-200 border border-violet-400/30">
                                <i className={currentGenreMeta.icon}></i> VERA ARCADE LOUNGE · {currentGenreMeta.label}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-cyan-200 border border-white/10">
                                <i className="fas fa-bolt text-amber-300"></i> 100% 무료 · 무설치 즉시 실행
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-emerald-300 border border-white/10">
                                <i className="fas fa-trophy text-amber-400"></i> 실시간 랭킹 연동
                            </span>
                        </div>

                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                                {activeGenre === 'emulator'
                                    ? '추억의 8비트 & 16비트 레트로 콘솔 에뮬레이터'
                                    : activeGenre === 'online'
                                    ? '실시간 1:1 대국, 플레이어와 함께하는 온라인 게임'
                                    : '틈날 때 가볍게, 무료로 즐기는 스마트 아케이드'}
                            </h1>
                            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
                                {activeGenre === 'emulator'
                                    ? '개인 소장 ROM 파일을 브라우저에 드래그 앤 드롭하여 별도 설치 없이 즉시 추억의 명작을 플레이하세요.'
                                    : activeGenre === 'online'
                                    ? '실시간 대기실 매칭과 1:1 오목 대국, 온라인 파티 던전 RPG까지 웹 브라우저에서 바로 승부를 펼쳐보세요.'
                                    : '베라 서브마린 · 당구 클럽(4구/3쿠션) · 베라 플라이트 · 정통 장기 · 숫자야구 · 오목 · 베라 팝 · 프리셀 · 스도쿠 · 2048 · 지뢰찾기'}
                            </p>
                        </div>

                        {/* 인기 게임 퀵 점프 칩 */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-extrabold text-indigo-300 mr-1">
                                <i className="fas fa-fire text-amber-400 mr-1"></i>인기 추천:
                            </span>
                            {QUICK_HERO_GAMES.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/15 hover:border-cyan-300/50 transition-all backdrop-blur-xs"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* 우측 나노바나나 3D 히어로 일러스트 쇼케이스 */}
                    <div className="hidden sm:flex items-center justify-center shrink-0">
                        <div className="relative w-56 h-40 lg:w-72 lg:h-48 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-md p-2 flex items-center justify-center shadow-2xl group overflow-hidden">
                            <img
                                src="/images/game/game_hero_banner.png"
                                alt="VERA 아케이드 3D 게임 라운지 일러스트"
                                className="w-full h-full object-cover rounded-2xl drop-shadow-[0_12px_24px_rgba(139,92,246,0.4)] transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 border border-white/20 backdrop-blur-md text-[10px] font-black text-cyan-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                <span>INSTANT PLAY</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. 게임 선택 & 3D 장르 스위처 박스 */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-4 sm:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                            <i className="fas fa-gamepad text-base"></i>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                                    게임 선택
                                </h2>
                                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                                    {currentGenreMeta.badge}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                카드를 클릭하면 공략 가이드와 랭킹을 볼 수 있으며, [게임 시작] 버튼으로 즉시 팝업 플레이가 가능합니다.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200/70 shrink-0">
                        <i className="fas fa-bolt text-amber-500"></i>
                        <span>현재 선택: <strong className="text-slate-900 font-black">{currentGenreMeta.label}</strong></span>
                    </div>
                </div>

                {/* 나노바나나 3D 아이콘이 적용된 프리미엄 장르 선택 독 */}
                {user && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/90 p-2 rounded-2xl border border-slate-200/70">
                        {genres.map(g => {
                            const isSelected = activeGenre === g.id;
                            return (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => setGenre(g.id)}
                                    className={`group relative rounded-xl p-3 text-left transition-all duration-200 flex items-center gap-3.5 border cursor-pointer ${
                                        isSelected
                                            ? g.activeRing
                                            : 'border-transparent bg-white/60 hover:bg-white hover:border-slate-200/90'
                                    }`}
                                >
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${g.visualBg} p-1 shrink-0 overflow-hidden border border-white shadow-xs flex items-center justify-center`}>
                                        <img
                                            src={g.image}
                                            alt={g.label}
                                            className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${g.badgeClass}`}>
                                                {g.badge}
                                            </span>
                                            {isSelected && (
                                                <span className="text-[10px] font-black text-violet-600 flex items-center gap-0.5">
                                                    <i className="fas fa-circle-check"></i> 선택됨
                                                </span>
                                            )}
                                        </div>
                                        <div className={`text-sm sm:text-base font-black truncate ${isSelected ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                            {g.label}
                                        </div>
                                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                            {g.subLabel}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {activeGenre === 'mini' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* 0-S. 베라 서브마린 (종이 좌표 해전) */}
                        <div
                            onClick={() => router.push('/game/submarine')}
                            className="bg-white border-2 text-left border-indigo-200 rounded-2xl overflow-hidden hover:border-indigo-400 hover:shadow-xl transition-all group relative cursor-pointer flex flex-col justify-between"
                        >
                            <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                                살보 해전 룰
                            </div>
                            <div>
                                <div className="overflow-hidden bg-[#0c4a6e]"><SubmarineThumb /></div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-black text-base sm:text-xl text-indigo-900 mb-1 group-hover:text-indigo-600 transition-colors flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 min-w-0">
                                        <span className="truncate whitespace-nowrap">Vera Submarine (베라 서브마린)</span>
                                        <span className="text-[11px] sm:text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-bold shrink-0 whitespace-nowrap">좌표 해전</span>
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">10×10 모눈종이 해도 위 적 정예 함대를 격침하라! 명중 시 주어지는 연속 포격권과 3×3 소나 정찰로 최소 턴수에 도전하세요.</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            launchApp('/app/submarine/', 'app-submarine');
                                        }}
                                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <i className="fas fa-play text-[10px]"></i>
                                        게임 시작 (팝업)
                                    </button>
                                    <span className="text-indigo-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                        규칙 & 공략 가이드 →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 0-A. 베라 당구 클럽 (4구 · 3구) */}
                        <div
                            onClick={() => router.push('/game/billiards')}
                            className="bg-white border-2 text-left border-blue-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-xl transition-all group relative cursor-pointer flex flex-col justify-between"
                        >
                            <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                                4구 & 3쿠션
                            </div>
                            <div>
                                <div className="overflow-hidden bg-[#1d4ed8]"><BilliardsThumb /></div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-black text-base sm:text-xl text-blue-800 mb-1 group-hover:text-blue-900 transition-colors flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 min-w-0">
                                        <span className="truncate whitespace-nowrap">Vera Billiards (베라 당구 클럽)</span>
                                        <span className="text-[11px] sm:text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold shrink-0 whitespace-nowrap">4구·3쿠션</span>
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">한국식 4구와 국제식 3구(3쿠션) 물리 엔진! 3D 당점(밀어치기·끌어치기·히네리), 고스트볼 두께 가이드, 리얼 타구음과 4단계 AI 대전을 즐겨보세요.</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            launchApp('/app/billiards/', 'app-billiards');
                                        }}
                                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <i className="fas fa-play text-[10px]"></i>
                                        게임 시작 (팝업)
                                    </button>
                                    <span className="text-blue-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                        규칙 & 공략 가이드 →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 0. 베라 플라이트 */}
                        <div
                            onClick={() => router.push('/game/flight')}
                            className="bg-white border-2 text-left border-sky-200 rounded-2xl overflow-hidden hover:border-sky-400 hover:shadow-xl transition-all group relative cursor-pointer flex flex-col justify-between"
                        >
                            <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                                1942 REMAKE
                            </div>
                            <div>
                                <div className="overflow-hidden bg-[#0284c7]"><FlightThumb /></div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-black text-base sm:text-xl text-sky-800 mb-1 group-hover:text-sky-900 transition-colors flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 min-w-0">
                                        <span className="truncate whitespace-nowrap">Vera Flight (베라 플라이트)</span>
                                        <span className="text-[11px] sm:text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md font-bold shrink-0 whitespace-nowrap">1942 슈팅</span>
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">360° 공중제비 롤링(1.5초 무적)과 메가 폭탄, 빨간 편대 격추와 4단계 무기 업그레이드로 거대 보스 전함을 격파하세요.</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            launchApp('/app/flight/', 'app-flight');
                                        }}
                                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <i className="fas fa-play text-[10px]"></i>
                                        게임 시작 (팝업)
                                    </button>
                                    <span className="text-sky-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                        규칙 & 공략 가이드 →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 1. 베라장기 */}
                        <div
                            onClick={() => router.push('/game/janggi')}
                            className="bg-white border-2 text-left border-cyan-200 rounded-2xl overflow-hidden hover:border-cyan-400 hover:shadow-xl transition-all group relative cursor-pointer flex flex-col justify-between"
                        >
                            <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                                HOT NEW
                            </div>
                            <div>
                                <div className="overflow-hidden bg-[#f4e4cb]"><JanggiThumb /></div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-black text-base sm:text-xl text-cyan-800 mb-1 group-hover:text-cyan-900 transition-colors flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 min-w-0">
                                        <span className="truncate whitespace-nowrap">Vera Janggi (베라장기)</span>
                                        <span className="text-[11px] sm:text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-md font-bold shrink-0 whitespace-nowrap">정통 9×10</span>
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">4대 상차림(마상상마/원앙마 등), 공식 73.5점 덤 규정, 1일 1외통수 매일 묘수풀이 및 특수 스킬 배틀을 즐겨보세요.</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            launchApp('/app/janggi/', 'app-janggi');
                                        }}
                                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <i className="fas fa-play text-[10px]"></i>
                                        게임 시작 (팝업)
                                    </button>
                                    <span className="text-cyan-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                        규칙 & 공략 가이드 →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. 베라 숫자야구 */}
                        <div
                            onClick={() => router.push('/game/baseball')}
                            className="bg-white border-2 text-left border-red-200 rounded-2xl overflow-hidden hover:border-red-400 hover:shadow-xl transition-all group relative cursor-pointer flex flex-col justify-between"
                        >
                            <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                                9 INNINGS
                            </div>
                            <div>
                                <div className="overflow-hidden bg-[#047857]"><BaseballThumb /></div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-black text-base sm:text-xl text-red-700 mb-1 group-hover:text-red-800 transition-colors flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 min-w-0">
                                        <span className="truncate whitespace-nowrap">Vera Baseball (베라 숫자야구)</span>
                                        <span className="text-[11px] sm:text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-md font-bold shrink-0 whitespace-nowrap">정규 9이닝 리그</span>
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">서로 다른 3자리 숫자를 9회말 이내에 추리! 완봉승(3이닝 이내)과 퀄리티 스타트에 도전하세요.</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            launchApp('/app/baseball/', 'app-baseball');
                                        }}
                                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <i className="fas fa-play text-[10px]"></i>
                                        게임 시작 (팝업)
                                    </button>
                                    <span className="text-red-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                        규칙 & 공략 가이드 →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. 베라오목 */}
                        <div
                            onClick={() => router.push('/game/omok')}
                            className="bg-white border-2 text-left border-amber-200 rounded-2xl overflow-hidden hover:border-amber-400 hover:shadow-xl transition-all group relative cursor-pointer flex flex-col justify-between"
                        >
                            <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                                NEW AI
                            </div>
                            <div>
                                <div className="overflow-hidden bg-[#dfb170]"><OmokThumb /></div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-black text-base sm:text-xl text-amber-700 mb-1 group-hover:text-amber-800 transition-colors flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 min-w-0">
                                        <span className="truncate whitespace-nowrap">Vera Omok (베라오목)</span>
                                        <span className="text-[11px] sm:text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold shrink-0 whitespace-nowrap">15×15 정통 5목</span>
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">초급·중급·고급(마스터) 3단계 인공지능과 대결하며 실시간 형세 분석과 청명한 바둑돌 손맛을 느껴보세요.</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            launchApp('/app/omok/', 'app-omok');
                                        }}
                                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <i className="fas fa-play text-[10px]"></i>
                                        게임 시작 (팝업)
                                    </button>
                                    <span className="text-amber-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                        규칙 & 공략 가이드 →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 4. 베라 팝 */}
                        <div
                            onClick={() => router.push('/game/vera-pop')}
                            className="bg-white border-2 text-left border-indigo-200 rounded-2xl overflow-hidden hover:border-indigo-400 hover:shadow-xl transition-all group relative cursor-pointer flex flex-col justify-between"
                        >
                            <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                                60s FEVER
                            </div>
                            <div>
                                <div className="overflow-hidden bg-[#312e81]"><VeraPopThumb /></div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-black text-base sm:text-xl text-indigo-700 mb-1 group-hover:text-indigo-800 transition-colors flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 min-w-0">
                                        <span className="truncate whitespace-nowrap">Vera Pop (베라 팝)</span>
                                        <span className="text-[11px] sm:text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-bold shrink-0 whitespace-nowrap">스피드 매치-3</span>
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">60초 안에 목표 점수를 돌파하면 시간 충전! 라인 레이저와 5초간 2배 점수 하이퍼 피버에 도전하세요.</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            launchApp('/app/vera-pop/', 'app-vera-pop');
                                        }}
                                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <i className="fas fa-play text-[10px]"></i>
                                        게임 시작 (팝업)
                                    </button>
                                    <span className="text-indigo-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                        규칙 & 공략 가이드 →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 5. 클래식 프리셀 */}
                        <div
                            onClick={() => router.push('/game/freecell')}
                            className="bg-white border-2 text-left border-emerald-200 rounded-2xl overflow-hidden hover:border-emerald-400 hover:shadow-xl transition-all group relative cursor-pointer flex flex-col justify-between"
                        >
                            <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                                CLASSIC
                            </div>
                            <div>
                                <div className="overflow-hidden bg-[#064e3b]"><FreeCellThumb /></div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-black text-base sm:text-xl text-emerald-700 mb-1 group-hover:text-emerald-800 transition-colors flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 min-w-0">
                                        <span className="truncate whitespace-nowrap">클래식 프리셀 (FreeCell)</span>
                                        <span className="text-[11px] sm:text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold shrink-0 whitespace-nowrap">정통 솔리테어</span>
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">4개의 프리셀을 전략적으로 활용해 52장 카드를 홈셀로 완벽 수집하세요!</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            launchApp('/app/freecell/', 'app-freecell');
                                        }}
                                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <i className="fas fa-play text-[10px]"></i>
                                        게임 시작 (팝업)
                                    </button>
                                    <span className="text-emerald-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                        규칙 & 공략 가이드 →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 6. 스도쿠 */}
                        <div
                            onClick={() => router.push('/game/sudoku')}
                            className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-violet-300 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                <div className="overflow-hidden bg-[#ddd6fe]"><SudokuThumb /></div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-extrabold text-base sm:text-xl text-violet-700 mb-1 group-hover:text-violet-800 transition-colors whitespace-nowrap truncate">스도쿠</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">빈 칸에 숫자를 채워 9×9 퍼즐을 완성하세요!</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            launchApp('/app/sudoku/', 'app-sudoku');
                                        }}
                                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <i className="fas fa-play text-[10px]"></i>
                                        게임 시작 (팝업)
                                    </button>
                                    <span className="text-violet-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                        규칙 & 공략 가이드 →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 7. 2048 */}
                        <div
                            onClick={() => router.push('/game/2048')}
                            className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-cyan-300 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                <div className="overflow-hidden bg-[#f3ebd9]"><Game2048Thumb /></div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-extrabold text-base sm:text-xl text-cyan-700 mb-1 group-hover:text-cyan-800 transition-colors whitespace-nowrap truncate">2048 챌린지</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">같은 숫자를 합쳐 2048 타일을 만들어보세요!</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            launchApp('/app/2048/', 'app-2048');
                                        }}
                                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <i className="fas fa-play text-[10px]"></i>
                                        게임 시작 (팝업)
                                    </button>
                                    <span className="text-cyan-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                        규칙 & 공략 가이드 →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 8. 지뢰찾기 */}
                        <div
                            onClick={() => router.push('/game/minesweeper')}
                            className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-red-300 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                <div className="overflow-hidden bg-[#e2e8f0]"><MinesweeperThumb /></div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-extrabold text-base sm:text-xl text-red-600 mb-1 group-hover:text-red-700 transition-colors whitespace-nowrap truncate">스피드 지뢰찾기</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">지뢰를 피해 모든 칸을 최대한 빨리 열어보세요!</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            launchApp('/app/minesweeper/', 'app-minesweeper');
                                        }}
                                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <i className="fas fa-play text-[10px]"></i>
                                        게임 시작 (팝업)
                                    </button>
                                    <span className="text-red-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                        규칙 & 공략 가이드 →
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeGenre === 'emulator' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div
                            onClick={() => router.push('/game/comboy')}
                            className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-slate-400 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                <div className="h-28 bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center text-white text-3xl transition-transform duration-500 group-hover:scale-105">
                                    <i className="fas fa-gamepad mr-2"></i> Vera Comboy
                                </div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-extrabold text-base sm:text-xl text-slate-700 mb-1 group-hover:text-slate-800 transition-colors whitespace-nowrap truncate">베라 컴보이 아케이드</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">추억의 8비트 패미콤 게임 에뮬레이터. 개인 소장 ROM 파일을 로드해 플레이해 보세요.</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            launchApp('/app/comboy/', 'app-comboy');
                                        }}
                                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <i className="fas fa-play text-[10px]"></i>
                                        실행 (팝업)
                                    </button>
                                    <span className="text-slate-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                        안내 & 보안정책 →
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => router.push('/game/sfc')}
                            className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-slate-400 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                <div className="h-28 bg-gradient-to-r from-indigo-600 to-indigo-700 flex items-center justify-center text-white text-3xl transition-transform duration-500 group-hover:scale-105">
                                    <i className="fas fa-gamepad mr-2"></i> Super Comboy
                                </div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-extrabold text-base sm:text-xl text-indigo-600 mb-1 group-hover:text-indigo-700 transition-colors whitespace-nowrap truncate">베라 슈퍼컴보이</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">추억의 16비트 슈퍼패미콤 게임 에뮬레이터. 개인 소장 SNES ROM을 로드해 플레이해 보세요.</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            launchApp('/app/sfc/', 'app-sfc');
                                        }}
                                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <i className="fas fa-play text-[10px]"></i>
                                        실행 (팝업)
                                    </button>
                                    <span className="text-indigo-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0">
                                        안내 & 보안정책 →
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeGenre === 'online' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div
                            onClick={() => launchApp('/onlinegame/ffrpg/', 'ffrpg')}
                            className="bg-white border-2 text-left border-indigo-200 rounded-2xl overflow-hidden hover:border-indigo-400 hover:shadow-xl transition-all group relative cursor-pointer flex flex-col justify-between"
                        >
                            <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                                ONLINE RPG
                            </div>
                            <div>
                                <div className="h-28 bg-[#312e81] flex items-center justify-center text-white text-3xl">
                                    <i className="fas fa-dungeon text-indigo-300"></i>
                                </div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-black text-base sm:text-xl text-indigo-700 mb-1 group-hover:text-indigo-800 transition-colors flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 min-w-0">
                                        <span className="truncate whitespace-nowrap">Vera Fantasy RPG (베라 판타지)</span>
                                        <span className="text-[11px] sm:text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-bold shrink-0 whitespace-nowrap">실시간 턴제 RPG</span>
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">전사·마법사·도적 등 직업을 육성하고 온라인 파티를 결성해 고대 던전과 보스를 공략하는 정통 레트로 턴제 RPG!</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold shadow-sm">
                                        <i className="fas fa-play text-[10px]"></i>
                                        게임 실행 (팝업)
                                    </span>
                                    <span className="text-slate-400 whitespace-nowrap shrink-0">웹 실시간 플레이</span>
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => launchApp('/onlinegame/omok-pvp/', 'omok-pvp')}
                            className="bg-white border-2 text-left border-blue-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-xl transition-all group relative cursor-pointer flex flex-col justify-between"
                        >
                            <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                                LIVE 1:1
                            </div>
                            <div>
                                <div className="h-28 bg-[#1e3a8a] flex items-center justify-center text-white text-3xl">
                                    <i className="fas fa-chess-board text-blue-300"></i>
                                </div>
                                <div className="p-4 sm:p-5 pb-2">
                                    <h3 className="font-black text-base sm:text-xl text-blue-700 mb-1 group-hover:text-blue-800 transition-colors flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 min-w-0">
                                        <span className="truncate whitespace-nowrap">Vera Omok Online (베라오목 온라인)</span>
                                        <span className="text-[11px] sm:text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold shrink-0 whitespace-nowrap">1:1 실시간 대전</span>
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">대기실에서 상대를 찾아 실시간 1:1 오목 대국을 즐기세요. 30초 턴 제한, 관전 및 실시간 이모지 채팅 지원!</p>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 pt-0">
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs mt-2">
                                    <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold shadow-sm">
                                        <i className="fas fa-play text-[10px]"></i>
                                        대기실 입장 (팝업)
                                    </span>
                                    <span className="text-slate-400 whitespace-nowrap shrink-0">웹 실시간 대전</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
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
                    <Link href="/game/submarine" className="block bg-slate-50 hover:bg-indigo-50/50 p-5 rounded-2xl border border-indigo-200/80 transition-colors space-y-2 group">
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-crosshairs text-indigo-600"></i> 베라 서브마린 (Vera Submarine)
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            10×10 해상 격자에서 적 함대의 좌표를 추리해 순항 미사일로 타격하는 전략 해전입니다. 명중 시 연속 포격권이 주어지는 살보(Salvo) 룰과 3×3 소나 스캔으로 최소 턴 승리에 도전하세요.
                        </p>
                    </Link>

                    <Link href="/game/billiards" className="block bg-slate-50 hover:bg-blue-50/50 p-5 rounded-2xl border border-blue-200/80 transition-colors space-y-2 group">
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-700 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-bullseye text-blue-600"></i> 베라 당구 클럽 (4구 · 3쿠션)
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            한국식 4구와 국제식 3구(3쿠션) 물리 엔진을 구현한 당구 게임입니다. 3D 당점 조절(밀어치기·끌어치기·히네리 회전)과 고스트볼 두께 가이드, 쿠션 반사각을 계산해 하이런을 달성하세요.
                        </p>
                    </Link>

                    <Link href="/game/flight" className="block bg-slate-50 hover:bg-sky-50/50 p-5 rounded-2xl border border-sky-200/80 transition-colors space-y-2 group">
                        <h3 className="font-bold text-slate-900 group-hover:text-sky-700 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-plane text-sky-600"></i> 베라 플라이트 (1942)
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            태평양 상공을 가르는 정통 종스크롤 비행 슈팅 게임입니다. 360° 롤링 무적 회피와 전면 폭탄, 4단계 무기 파워업 아이템으로 거대 보스 전함을 공략하세요.
                        </p>
                    </Link>

                    <Link href="/game/janggi" className="block bg-slate-50 hover:bg-cyan-50/50 p-5 rounded-2xl border border-cyan-200/80 transition-colors space-y-2 group">
                        <h3 className="font-bold text-slate-900 group-hover:text-cyan-700 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-chess-knight text-cyan-600"></i> 베라장기 (Vera Janggi) 전략
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            9×10 장기판 위에서 펼쳐지는 정통 한국 장기입니다. 마상상마·원앙마 등 4대 상차림과 공식 73.5점 덤 규정, 1일 1외통수 묘수풀이로 기력을 연마해 보세요.
                        </p>
                    </Link>

                    <Link href="/game/baseball" className="block bg-slate-50 hover:bg-red-50/50 p-5 rounded-2xl border border-red-200/80 transition-colors space-y-2 group">
                        <h3 className="font-bold text-slate-900 group-hover:text-red-700 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-baseball text-red-600"></i> 베라 숫자야구 (9 Innings)
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            서로 다른 3자리 비밀 숫자를 9회말 이내에 추리하는 두뇌 게임입니다. 스트라이크(숫자·위치 일치)와 볼(숫자만 일치) 단서를 조합해 3이닝 이내 완봉승에 도전하세요.
                        </p>
                    </Link>

                    <Link href="/game/omok" className="block bg-slate-50 hover:bg-amber-50/50 p-5 rounded-2xl border border-amber-200/80 transition-colors space-y-2 group">
                        <h3 className="font-bold text-slate-900 group-hover:text-amber-700 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-circle-dot text-amber-600"></i> 베라오목 (Vera Omok) 전략
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            15×15 바둑판에서 흑돌과 백돌이 번갈아 착수하여 가로, 세로, 대각선 중 5개의 돌을 연속으로 먼저 놓으면 승리합니다. 3단계 AI를 상대로 양수겸장 전략을 펼쳐보세요.
                        </p>
                    </Link>

                    <Link href="/game/vera-pop" className="block bg-slate-50 hover:bg-purple-50/50 p-5 rounded-2xl border border-purple-200/80 transition-colors space-y-2 group">
                        <h3 className="font-bold text-slate-900 group-hover:text-purple-700 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-wand-magic-sparkles text-purple-600"></i> 베라 팝 (Vera Pop) 매치-3
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            60초 제한 시간 안에 같은 블록 3개 이상을 매치해 점수를 획득하는 스피드 퍼즐입니다. 목표 점수 돌파 시 시간이 충전되며, 라인 레이저와 2배 피버 모드로 고득점을 노리세요.
                        </p>
                    </Link>

                    <Link href="/game/freecell" className="block bg-slate-50 hover:bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200/80 transition-colors space-y-2 group">
                        <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-clone text-emerald-600"></i> 클래식 프리셀 전략
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            4개의 프리셀과 빈 열을 전략적으로 활용해 52장의 트럼프 카드를 에이스(A)부터 킹(K)까지 4개 홈셀로 수집하는 정통 솔리테어입니다.
                        </p>
                    </Link>

                    <Link href="/game/sudoku" className="block bg-slate-50 hover:bg-violet-50/50 p-5 rounded-2xl border border-violet-200/80 transition-colors space-y-2 group">
                        <h3 className="font-bold text-slate-900 group-hover:text-violet-700 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-table-cells text-violet-600"></i> 스도쿠 규칙 및 해법
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            9×9 격자판의 가로줄, 세로줄, 3×3 소형 격자 안에 1부터 9까지의 숫자가 중복 없이 들어가도록 채우는 논리 퍼즐입니다.
                        </p>
                    </Link>

                    <Link href="/game/2048" className="block bg-slate-50 hover:bg-cyan-50/50 p-5 rounded-2xl border border-cyan-200/80 transition-colors space-y-2 group">
                        <h3 className="font-bold text-slate-900 group-hover:text-cyan-700 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-layer-group text-cyan-600"></i> 2048 퍼즐 공략법
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            같은 숫자가 적힌 타일을 합쳐 마침내 2048 타일을 완성하는 숫자 퍼즐입니다. 가장 큰 숫자를 구석에 고정하는 전략을 사용하세요.
                        </p>
                    </Link>

                    <Link href="/game/minesweeper" className="block bg-slate-50 hover:bg-rose-50/50 p-5 rounded-2xl border border-rose-200/80 transition-colors space-y-2 group">
                        <h3 className="font-bold text-slate-900 group-hover:text-rose-700 text-sm sm:text-base flex items-center gap-2">
                            <i className="fas fa-bomb text-red-500"></i> 스피드 지뢰찾기
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            숫자가 의미하는 주변 8칸의 지뢰 개수를 추론하여 안전한 칸을 빠르게 열어가는 고전 명작입니다.
                        </p>
                    </Link>
                </div>
            </section>
        </main>
    );
}
