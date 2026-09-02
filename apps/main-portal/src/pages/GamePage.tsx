import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer, t } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';

const GENRES = [
    { id: 'mini', label: '미니게임', icon: 'fas fa-bolt' },
    { id: 'classic', label: '고전게임', icon: 'fas fa-ghost' },
    { id: 'emulator', label: '에뮬레이터', icon: 'fas fa-gamepad' },
];

const thumbClass = 'w-full h-28 block transition-transform duration-500 group-hover:scale-105';

// 테트리스: 어두운 보드 위 컬러 테트로미노
function TetrisThumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" className={thumbClass}>
            <defs>
                <linearGradient id="tetBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#064e3b" />
                    <stop offset="1" stopColor="#065f46" />
                </linearGradient>
            </defs>
            <rect width="320" height="120" fill="url(#tetBg)" />
            <g opacity="0.1" stroke="#ffffff" strokeWidth="1">
                <path d="M0 30H320M0 60H320M0 90H320M40 0V120M80 0V120M120 0V120M160 0V120M200 0V120M240 0V120M280 0V120" />
            </g>
            {/* O */}
            <rect x="34" y="20" width="22" height="22" rx="4" fill="#fbbf24" />
            <rect x="56" y="20" width="22" height="22" rx="4" fill="#fbbf24" />
            <rect x="34" y="42" width="22" height="22" rx="4" fill="#f59e0b" />
            <rect x="56" y="42" width="22" height="22" rx="4" fill="#f59e0b" />
            {/* T */}
            <rect x="150" y="14" width="22" height="22" rx="4" fill="#a78bfa" />
            <rect x="172" y="14" width="22" height="22" rx="4" fill="#a78bfa" />
            <rect x="194" y="14" width="22" height="22" rx="4" fill="#a78bfa" />
            <rect x="172" y="36" width="22" height="22" rx="4" fill="#8b5cf6" />
            {/* L */}
            <rect x="256" y="16" width="22" height="22" rx="4" fill="#fb923c" />
            <rect x="256" y="38" width="22" height="22" rx="4" fill="#fb923c" />
            <rect x="256" y="60" width="22" height="22" rx="4" fill="#f97316" />
            <rect x="278" y="60" width="22" height="22" rx="4" fill="#f97316" />
            {/* I */}
            <rect x="150" y="74" width="22" height="22" rx="4" fill="#22d3ee" />
            <rect x="172" y="74" width="22" height="22" rx="4" fill="#22d3ee" />
            <rect x="194" y="74" width="22" height="22" rx="4" fill="#06b6d4" />
            <rect x="216" y="74" width="22" height="22" rx="4" fill="#06b6d4" />
            {/* S */}
            <rect x="40" y="74" width="22" height="22" rx="4" fill="#34d399" />
            <rect x="62" y="74" width="22" height="22" rx="4" fill="#34d399" />
            <rect x="62" y="96" width="22" height="22" rx="4" fill="#10b981" />
            <rect x="84" y="96" width="22" height="22" rx="4" fill="#10b981" />
        </svg>
    );
}

// 스도쿠: 흰 패널 위 격자와 숫자
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

// 2048: 정통 팔레트 타일
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

// 지뢰찾기: 베벨 격자 + 숫자/지뢰/깃발
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
                    // num / empty (열린 칸)
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

// 프리셀: 녹색 펠트 테이블 위 프리셀/홈셀 및 에이스/킹 플레잉 카드
function FreeCellThumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" className={thumbClass}>
            <defs>
                <linearGradient id="fcBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#064e3b" />
                    <stop offset="50" stopColor="#047857" />
                    <stop offset="100" stopColor="#0f766e" />
                </linearGradient>
                <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
                </filter>
            </defs>
            <rect width="320" height="120" fill="url(#fcBg)" />

            {/* 상단 4 프리셀 & 4 홈셀 슬롯 테두리 */}
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

            {/* 홈셀 수집 카드 (A♠, A♥) */}
            <g transform="translate(168, 12)" filter="url(#cardShadow)">
                <rect x="0" y="0" width="28" height="38" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <text x="5" y="12" fontSize="9" fontWeight="900" fill="#1e293b" fontFamily="sans-serif">A</text>
                <text x="14" y="24" fontSize="14" textAnchor="middle" fill="#1e293b">♠</text>
            </g>
            <g transform="translate(202, 12)" filter="url(#cardShadow)">
                <rect x="0" y="0" width="28" height="38" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <text x="5" y="12" fontSize="9" fontWeight="900" fill="#dc2626" fontFamily="sans-serif">A</text>
                <text x="14" y="24" fontSize="14" textAnchor="middle" fill="#dc2626">♥</text>
            </g>

            {/* 하단 캐스케이드 카드 스택 (K♠, Q♥, J♣, 10♦) */}
            <g transform="translate(45, 52)" filter="url(#cardShadow)">
                <rect x="0" y="0" width="34" height="48" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <text x="5" y="13" fontSize="10" fontWeight="900" fill="#1e293b" fontFamily="sans-serif">K</text>
                <text x="17" y="30" fontSize="16" textAnchor="middle" fill="#1e293b">♠</text>
            </g>
            <g transform="translate(95, 52)" filter="url(#cardShadow)">
                <rect x="0" y="0" width="34" height="48" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <text x="5" y="13" fontSize="10" fontWeight="900" fill="#dc2626" fontFamily="sans-serif">Q</text>
                <text x="17" y="30" fontSize="16" textAnchor="middle" fill="#dc2626">♥</text>
            </g>
            <g transform="translate(145, 52)" filter="url(#cardShadow)">
                <rect x="0" y="0" width="34" height="48" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <text x="5" y="13" fontSize="10" fontWeight="900" fill="#1e293b" fontFamily="sans-serif">J</text>
                <text x="17" y="30" fontSize="16" textAnchor="middle" fill="#1e293b">♣</text>
            </g>
            <g transform="translate(195, 52)" filter="url(#cardShadow)">
                <rect x="0" y="0" width="34" height="48" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <text x="4" y="13" fontSize="10" fontWeight="900" fill="#dc2626" fontFamily="sans-serif">10</text>
                <text x="17" y="30" fontSize="16" textAnchor="middle" fill="#dc2626">♦</text>
            </g>
            <g transform="translate(245, 52)" filter="url(#cardShadow)">
                <rect x="0" y="0" width="34" height="48" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <text x="5" y="13" fontSize="10" fontWeight="900" fill="#1e293b" fontFamily="sans-serif">9</text>
                <text x="17" y="30" fontSize="16" textAnchor="middle" fill="#1e293b">♠</text>
            </g>
        </svg>
    );
}

// 베라 팝: 네온 보석 매치-3
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
            {/* 네온 배경 그리드 선 */}
            <g opacity="0.15" stroke="#ffffff" strokeWidth="1">
                <path d="M0 30H320M0 60H320M0 90H320M40 0V120M80 0V120M120 0V120M160 0V120M200 0V120M240 0V120M280 0V120" />
            </g>
            {/* 5종 네온 보석 */}
            {/* 1. 블루 사파이어 */}
            <g transform="translate(45, 60)">
                <rect x="-18" y="-18" width="36" height="36" rx="6" fill="#3b82f6" transform="rotate(45)" filter="drop-shadow(0 0 8px #3b82f6)" />
                <circle cx="0" cy="0" r="8" fill="#93c5fd" />
            </g>
            {/* 2. 에메랄드 그린 */}
            <g transform="translate(105, 60)">
                <rect x="-18" y="-18" width="36" height="36" rx="10" fill="#10b981" filter="drop-shadow(0 0 8px #10b981)" />
                <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#a7f3d0" />
            </g>
            {/* 3. 퍼플 아메지스트 */}
            <g transform="translate(160, 60)">
                <circle cx="0" cy="0" r="20" fill="#8b5cf6" filter="drop-shadow(0 0 10px #8b5cf6)" />
                <circle cx="0" cy="0" r="10" fill="#ddd6fe" />
            </g>
            {/* 4. 옐로우 토파즈 */}
            <g transform="translate(215, 60)">
                <polygon points="0,-22 20,16 -20,16" fill="#f59e0b" filter="drop-shadow(0 0 8px #f59e0b)" />
                <circle cx="0" cy="4" r="6" fill="#fef3c7" />
            </g>
            {/* 5. 레드 루비 */}
            <g transform="translate(270, 60)">
                <rect x="-16" y="-16" width="32" height="32" rx="6" fill="#ef4444" transform="rotate(15)" filter="drop-shadow(0 0 8px #ef4444)" />
                <circle cx="0" cy="0" r="7" fill="#fecaca" />
            </g>
        </svg>
    );
}

export default function GamePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [genre, setGenre] = useState('mini');

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PageSEO
                title="미니게임 - 베라 팝, 프리셀, 테트리스, 스도쿠, 2048, 지뢰찾기"
                description="베라 팝(Vera Pop), 클래식 프리셀(FreeCell), 테트리스, 스도쿠, 2048, 지뢰찾기 등 재미있는 브라우저 미니게임을 설치 없이 무료로 즐겨보세요."
                path="/game"
            />
            <Header user={user} onLogout={logout} />
            <main className="flex-1 max-w-6xl mx-auto px-1 sm:px-4 py-12 w-full">
                {/* 게임 테마 히어로 배너 */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white px-6 sm:px-10 py-8 shadow-xl mb-10">
                    <div className="absolute -top-14 -right-10 w-52 h-52 rounded-full bg-white/10 pointer-events-none"></div>
                    <div className="absolute -bottom-20 -left-8 w-64 h-64 rounded-full bg-indigo-300/20 pointer-events-none"></div>
                    <i className="fas fa-gamepad absolute right-6 bottom-2 text-7xl sm:text-8xl text-white/15 pointer-events-none"></i>
                    <div className="relative">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold mb-3">
                            <i className="fas fa-bolt"></i> {t('미니게임')}
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                            {t('틈날 때 가볍게, 무료로 즐기는 미니게임')}
                        </h1>
                        <p className="text-indigo-50 text-sm font-medium">
                            {t('베라 팝 · 클래식 프리셀 · 테트리스 · 스도쿠 · 2048 · 지뢰찾기 — 설치 없이 브라우저에서 바로 플레이하세요')}
                        </p>
                    </div>
                </section>

                {/* 게임 선택 */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-[20px] font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">{t('게임 선택')}</h2>

                    {/* 장르 탭 */}
                    <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
                        {GENRES.map(g => (
                            <button
                                key={g.id}
                                onClick={() => setGenre(g.id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${genre === g.id
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                <i className={`${g.icon} text-xs ${genre === g.id ? 'text-violet-500' : ''}`} />
                                {t(g.label)}
                            </button>
                        ))}
                    </div>

                    {genre === 'mini' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* 🌟 1. 베라 팝 (Vera Pop) - 60초 스테이지 무한 타임어택 */}
                            <button onClick={() => navigate('/game/vera-pop')} className="bg-white border-2 text-left border-indigo-200 rounded-2xl overflow-hidden hover:border-indigo-400 hover:shadow-xl transition-all group relative">
                                <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-400 to-rose-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                                    NEW 60s
                                </div>
                                <div className="overflow-hidden bg-[#312e81]"><VeraPopThumb /></div>
                                <div className="p-5">
                                    <h3 className="font-black text-xl text-indigo-700 mb-1 group-hover:text-indigo-800 transition-colors flex items-center gap-2">
                                        <span>Vera Pop (베라 팝)</span>
                                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-bold">무한 스테이지 매치-3</span>
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">60초 안에 목표 점수를 돌파하면 시간 충전! 점진적 난이도와 누적 총점에 도전하세요.</p>
                                </div>
                            </button>

                            {/* 🌟 2. 클래식 프리셀 (FreeCell) - 전략 카드 솔리테어 */}
                            <button onClick={() => navigate('/game/freecell')} className="bg-white border-2 text-left border-emerald-200 rounded-2xl overflow-hidden hover:border-emerald-400 hover:shadow-xl transition-all group relative">
                                <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                                    CLASSIC
                                </div>
                                <div className="overflow-hidden bg-[#064e3b]"><FreeCellThumb /></div>
                                <div className="p-5">
                                    <h3 className="font-black text-xl text-emerald-700 mb-1 group-hover:text-emerald-800 transition-colors flex items-center gap-2">
                                        <span>클래식 프리셀 (FreeCell)</span>
                                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">정통 솔리테어</span>
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">4개의 프리셀을 전략적으로 활용해 52장 카드를 홈셀로 완벽 수집하세요!</p>
                                </div>
                            </button>

                            {/* 3. 클래식 테트리스 */}
                            <button onClick={() => navigate('/game/tetris')} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-emerald-300 hover:shadow-lg transition-all group">
                                <div className="overflow-hidden bg-[#065f46]"><TetrisThumb /></div>
                                <div className="p-5">
                                    <h3 className="font-extrabold text-xl text-emerald-700 mb-1 group-hover:text-emerald-800 transition-colors">클래식 테트리스</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">블록을 쌓아 줄을 제거하고 높은 점수를 달성하세요!</p>
                                </div>
                            </button>

                            {/* 4. 스도쿠 */}
                            <button onClick={() => navigate('/game/sudoku')} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-violet-300 hover:shadow-lg transition-all group">
                                <div className="overflow-hidden bg-[#ddd6fe]"><SudokuThumb /></div>
                                <div className="p-5">
                                    <h3 className="font-extrabold text-xl text-violet-700 mb-1 group-hover:text-violet-800 transition-colors">스도쿠</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">빈 칸에 숫자를 채워 9×9 퍼즐을 완성하세요!</p>
                                </div>
                            </button>

                            {/* 5. 2048 */}
                            <button onClick={() => navigate('/game/2048')} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-cyan-300 hover:shadow-lg transition-all group">
                                <div className="overflow-hidden bg-[#f3ebd9]"><Game2048Thumb /></div>
                                <div className="p-5">
                                    <h3 className="font-extrabold text-xl text-cyan-700 mb-1 group-hover:text-cyan-800 transition-colors">2048 챌린지</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">같은 숫자를 합쳐 2048 타일을 만들어보세요!</p>
                                </div>
                            </button>

                            {/* 6. 지뢰찾기 */}
                            <button onClick={() => navigate('/game/minesweeper')} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-red-300 hover:shadow-lg transition-all group">
                                <div className="overflow-hidden bg-[#e2e8f0]"><MinesweeperThumb /></div>
                                <div className="p-5">
                                    <h3 className="font-extrabold text-xl text-red-600 mb-1 group-hover:text-red-700 transition-colors">스피드 지뢰찾기</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">지뢰를 피해 모든 칸을 최대한 빨리 열어보세요!</p>
                                </div>
                            </button>
                        </div>
                    ) : genre === 'emulator' ? (

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <button onClick={() => navigate('/game/comboy')} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-slate-400 hover:shadow-lg transition-all group">
                                <div className="h-28 bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center text-white text-3xl transition-transform duration-500 group-hover:scale-105">
                                    <i className="fas fa-gamepad mr-2"></i> Vera Comboy
                                </div>
                                <div className="p-5">
                                    <h3 className="font-extrabold text-xl text-slate-700 mb-1 group-hover:text-slate-800 transition-colors">베라 컴보이 아케이드</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">추억의 8비트 패미콤 게임 에뮬레이터. 개인 소장 ROM 파일을 로드해 플레이해 보세요.</p>
                                </div>
                            </button>
                            <button onClick={() => navigate('/game/sfc')} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-slate-400 hover:shadow-lg transition-all group">
                                <div className="h-28 bg-gradient-to-r from-indigo-600 to-indigo-700 flex items-center justify-center text-white text-3xl transition-transform duration-500 group-hover:scale-105">
                                    <i className="fas fa-gamepad mr-2"></i> Super Comboy
                                </div>
                                <div className="p-5">
                                    <h3 className="font-extrabold text-xl text-indigo-600 mb-1 group-hover:text-indigo-700 transition-colors">베라 슈퍼컴보이</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">추억의 16비트 슈퍼패미콤 게임 에뮬레이터. 개인 소장 SNES ROM을 로드해 플레이해 보세요.</p>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                            <i className="fas fa-screwdriver-wrench text-4xl mb-4 text-slate-300"></i>
                            <p className="font-semibold text-slate-600">게임 준비중입니다.</p>
                            <p className="text-sm mt-1 text-slate-400">곧 새로운 {GENRES.find(g => g.id === genre)?.label}을(를) 만나보실 수 있어요!</p>
                        </div>
                    )}
                </div>

                {/* 구글 애드센스 및 검색 엔진(SEO)용 고밀도 미니게임 소개 & 가이드 (300~500자 이상) */}
                <section className="mt-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-slate-700 space-y-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 mb-3 flex items-center gap-2">
                            <i className="fas fa-gamepad text-purple-600"></i>
                            VERA 무설치 브라우저 미니게임 가이드 & 플레이 규칙
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            VERA 게임 센터는 별도의 프로그램 설치나 회원가입 절차 없이 크롬, 사파리, 웨일 등 모든 웹 브라우저에서 즉시 실행되는 고품질 무료 미니게임을 수록하고 있습니다.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <i className="fas fa-cubes text-emerald-600"></i> 테트리스 (Tetris) 게임 전략
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                하늘에서 떨어지는 7가지 모양의 블록(테트로미노)을 수평으로 빈틈없이 채워 라인을 삭제하는 고전 명작 퍼즐 게임입니다. 방향키로 이동 및 회전이 가능하며, 4줄을 한 번에 없애는 '테트리스' 기술과 'T-스핀'을 활용해 최고 득점에 도전하세요.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <i className="fas fa-grip-nine text-violet-600"></i> 스도쿠 (Sudoku) 규칙 및 해법
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                9×9 격자판의 가로줄, 세로줄, 그리고 3×3 소형 격자 안에 1부터 9까지의 숫자가 중복 없이 하나씩 들어가도록 빈칸을 채우는 두뇌 논리 퍼즐입니다. 소거법과 후보 숫자 메모 기능을 활용해 두뇌 회전과 집중력을 향상시켜보세요.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <i className="fas fa-layer-group text-cyan-600"></i> 2048 퍼즐 공략법
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                방향키나 슬라이드 조작을 통해 같은 숫자가 적힌 타일을 합쳐 마침내 '2048' 타일을 완성하는 숫자 퍼즐입니다. 가장 큰 숫자를 한쪽 구석(예: 좌측 하단)에 고정하고 계단식으로 배치하는 전략을 사용하면 성공률이 급격히 올라갑니다.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <i className="fas fa-bomb text-red-500"></i> 지뢰찾기 & 프리셀 솔리테어
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                숫자가 의미하는 주변 8칸의 지뢰 개수를 추론하여 안전한 칸을 여는 '지뢰찾기'와, 4개의 임시 저장소(Freecell)를 활용해 카드를 문양별로 수집하는 '프리셀'은 논리적 판단력과 몰입감을 제공하는 최고의 고전 솔리테어 게임입니다.
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="font-bold text-slate-900 text-lg mb-3">자주 묻는 질문 (FAQ)</h3>
                        <dl className="space-y-3 text-xs text-slate-600">
                            <div>
                                <dt className="font-bold text-slate-800">Q. 최고 점수 및 기록은 저장되나요?</dt>
                                <dd className="mt-1">A. 네, VERA 브라우저 게임은 플레이 기록과 최고 점수가 로컬 스토리지 및 계정에 자동 저장되어 언제든 랭킹 기록을 갱신하실 수 있습니다.</dd>
                            </div>
                            <div>
                                <dt className="font-bold text-slate-800">Q. 모바일 스마트폰 터치 조작이 지원되나요?</dt>
                                <dd className="mt-1">A. 모든 미니게임은 터치 스와이프 조작 및 모바일 가상 패드를 지원하여 스마트폰에서도 쾌적하게 플레이할 수 있습니다.</dd>
                            </div>
                        </dl>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
