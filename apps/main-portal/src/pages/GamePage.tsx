import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';

const GENRES = [
    { id: 'mini', label: '미니게임', icon: 'fas fa-bolt' },
    { id: 'classic', label: '고전게임', icon: 'fas fa-ghost' },
    { id: 'rpg', label: 'RPG 게임', icon: 'fas fa-dragon' },
];

const thumbClass = 'w-full h-28 block transition-transform duration-500 group-hover:scale-105';

// 테트리스: 어두운 보드 위 컬러 테트로미노
function TetrisThumb() {
    return (
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" className={thumbClass}>
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
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" className={thumbClass}>
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
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" className={thumbClass}>
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
        <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" className={thumbClass}>
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

export default function GamePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [genre, setGenre] = useState('mini');

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PageSEO
                title="미니게임 - 테트리스, 스도쿠, 2048, 지뢰찾기"
                description="테트리스, 스도쿠, 2048, 지뢰찾기 등 재미있는 브라우저 미니게임을 설치 없이 무료로 즐겨보세요."
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
                            <i className="fas fa-bolt"></i> 미니게임
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                            틈날 때 가볍게, 무료로 즐기는 미니게임
                        </h1>
                        <p className="text-indigo-50 text-sm font-medium">
                            테트리스 · 스도쿠 · 2048 · 지뢰찾기 — 설치 없이 브라우저에서 바로 플레이하세요
                        </p>
                    </div>
                </section>

                {/* 게임 선택 */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-[20px] font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">게임 선택</h2>

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
                                {g.label}
                            </button>
                        ))}
                    </div>

                    {genre === 'mini' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <button onClick={() => navigate('/game/tetris')} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-emerald-300 hover:shadow-lg transition-all group">
                                <div className="overflow-hidden"><TetrisThumb /></div>
                                <div className="p-5">
                                    <h3 className="font-extrabold text-xl text-emerald-700 mb-1 group-hover:text-emerald-800 transition-colors">클래식 테트리스</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">블록을 쌓아 줄을 제거하고 높은 점수를 달성하세요!</p>
                                </div>
                            </button>

                            <button onClick={() => navigate('/game/sudoku')} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-violet-300 hover:shadow-lg transition-all group">
                                <div className="overflow-hidden"><SudokuThumb /></div>
                                <div className="p-5">
                                    <h3 className="font-extrabold text-xl text-violet-700 mb-1 group-hover:text-violet-800 transition-colors">스도쿠</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">빈 칸에 숫자를 채워 9×9 퍼즐을 완성하세요!</p>
                                </div>
                            </button>

                            <button onClick={() => navigate('/game/2048')} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-cyan-300 hover:shadow-lg transition-all group">
                                <div className="overflow-hidden"><Game2048Thumb /></div>
                                <div className="p-5">
                                    <h3 className="font-extrabold text-xl text-cyan-700 mb-1 group-hover:text-cyan-800 transition-colors">2048 챌린지</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">같은 숫자를 합쳐 2048 타일을 만들어보세요!</p>
                                </div>
                            </button>

                            <button onClick={() => navigate('/game/minesweeper')} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden hover:border-red-300 hover:shadow-lg transition-all group">
                                <div className="overflow-hidden"><MinesweeperThumb /></div>
                                <div className="p-5">
                                    <h3 className="font-extrabold text-xl text-red-600 mb-1 group-hover:text-red-700 transition-colors">스피드 지뢰찾기</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">지뢰를 피해 모든 칸을 최대한 빨리 열어보세요!</p>
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
            </main>
            <Footer />
        </div>
    );
}
