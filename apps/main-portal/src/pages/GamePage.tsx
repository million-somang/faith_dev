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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => navigate('/game/tetris')} className="bg-slate-50 border text-left border-slate-200 rounded-xl p-5 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-500"></div>
                                <i className="fas fa-th text-3xl mb-3 text-emerald-500 group-hover:rotate-12 transition-transform"></i>
                                <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors">클래식 테트리스</h3>
                                <p className="text-slate-500 text-xs leading-relaxed">블록을 쌓아 줄을 제거하고 높은 점수를 달성하세요!</p>
                            </button>

                            <button onClick={() => navigate('/game/sudoku')} className="bg-slate-50 border text-left border-slate-200 rounded-xl p-5 hover:bg-violet-50 hover:border-violet-200 hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-500"></div>
                                <i className="fas fa-table-cells text-3xl mb-3 text-violet-500 group-hover:rotate-12 transition-transform"></i>
                                <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-violet-700 transition-colors">스도쿠</h3>
                                <p className="text-slate-500 text-xs leading-relaxed">빈 칸에 숫자를 채워 9×9 퍼즐을 완성하세요!</p>
                            </button>

                            <button onClick={() => navigate('/game/2048')} className="bg-slate-50 border text-left border-slate-200 rounded-xl p-5 hover:bg-cyan-50 hover:border-cyan-200 hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-500"></div>
                                <i className="fas fa-grip text-3xl mb-3 text-cyan-500 group-hover:rotate-12 transition-transform"></i>
                                <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-cyan-700 transition-colors">2048 챌린지</h3>
                                <p className="text-slate-500 text-xs leading-relaxed">같은 숫자를 합쳐 2048 타일을 만들어보세요!</p>
                            </button>

                            <button onClick={() => navigate('/game/minesweeper')} className="bg-slate-50 border text-left border-slate-200 rounded-xl p-5 hover:bg-red-50 hover:border-red-200 hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-500"></div>
                                <i className="fas fa-bomb text-3xl mb-3 text-red-500 group-hover:rotate-12 transition-transform"></i>
                                <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-red-700 transition-colors">스피드 지뢰찾기</h3>
                                <p className="text-slate-500 text-xs leading-relaxed">지뢰를 피해 모든 칸을 최대한 빨리 열어보세요!</p>
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
