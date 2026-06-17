import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { useAppLauncher } from '../hooks/useAppLauncher';
import { PageSEO } from '../components/PageSEO';
import Leaderboard from '../components/tetris/Leaderboard';

const CONTROLS = [
    { keys: '←  →', desc: '블록 좌우 이동' },
    { keys: '↑', desc: '블록 회전' },
    { keys: '↓', desc: '한 칸 빠르게 내리기' },
    { keys: 'Space', desc: '바닥까지 즉시 떨어뜨리기' },
    { keys: 'P / Esc', desc: '일시정지' },
];

/**
 * 테트리스 정보 + 점수 페이지.
 * "게임 시작" 버튼을 누르면 다른 미니게임과 동일하게 팝업(standalone 미니앱)으로 게임을 연다.
 */
export default function TetrisInfoPage() {
    const { user, logout } = useAuth();
    const { launchApp } = useAppLauncher();
    const navigate = useNavigate();

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Game',
        name: '클래식 테트리스',
        description: '블록을 쌓아 줄을 제거하고 높은 점수를 기록하는 클래식 테트리스 게임입니다.',
        url: 'https://faithlink.my/game/tetris',
        genre: 'Puzzle',
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            <PageSEO
                title="클래식 테트리스 - 게임 정보 및 랭킹"
                description="클래식 테트리스 게임 정보와 명예의 전당 랭킹을 확인하고, 게임 시작 버튼으로 바로 플레이하세요."
                path="/game/tetris"
                jsonLd={jsonLd}
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-6xl mx-auto px-1 sm:px-4 py-10 w-full">
                {/* 상단: 뒤로가기 */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/game')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-sm shadow-sm"
                    >
                        <i className="fas fa-arrow-left"></i> 게임 목록으로
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* 왼쪽: 게임 정보 + 게임 시작 */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* 히어로 정보 카드 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full -translate-y-1/3 translate-x-1/4"></div>
                            <div className="relative flex items-start gap-4 mb-5">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0">
                                    <i className="fas fa-th text-white text-2xl"></i>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">클래식 테트리스</h1>
                                    <p className="text-slate-500 text-sm mt-1">블록을 쌓아 줄을 제거하고 높은 점수에 도전하세요!</p>
                                </div>
                            </div>

                            <p className="relative text-slate-600 text-sm leading-relaxed mb-6">
                                떨어지는 블록을 좌우로 옮기고 회전시켜 빈틈 없이 한 줄을 채우면 그 줄이 사라지고 점수를 얻습니다.
                                레벨이 오를수록 블록이 빨라지니, 침착하게 더 높은 점수를 기록해 명예의 전당에 이름을 올려보세요.
                                {!user && (
                                    <span className="block mt-2 text-amber-500 italic text-xs">
                                        비회원도 플레이할 수 있지만, 로그인하면 점수가 랭킹에 기록됩니다.
                                    </span>
                                )}
                            </p>

                            {/* 게임 시작 버튼 (팝업 실행) */}
                            <button
                                onClick={() => launchApp('/app/tetris/', 'app-tetris')}
                                className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-lg shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-emerald-700 active:scale-95 transition-all"
                            >
                                <i className="fas fa-play"></i>
                                게임 시작
                            </button>
                            <p className="relative text-[11px] text-slate-400 mt-2">
                                게임 시작을 누르면 새 팝업 창에서 게임이 열립니다. (팝업 차단을 해제해 주세요)
                            </p>
                        </div>

                        {/* 조작법 카드 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">
                            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2.5">
                                <i className="fas fa-keyboard text-slate-400"></i>
                                조작 방법
                            </h2>
                            <div className="flex flex-col gap-3">
                                {CONTROLS.map((c) => (
                                    <div key={c.keys} className="flex items-center justify-between gap-4 py-1">
                                        <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 rounded-lg px-3 py-1.5 min-w-[88px] text-center">
                                            {c.keys}
                                        </span>
                                        <span className="text-sm text-slate-500 flex-1 text-right">{c.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 점수(명예의 전당) */}
                    <div className="lg:col-span-1 flex flex-col items-center lg:items-stretch">
                        <Leaderboard />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
