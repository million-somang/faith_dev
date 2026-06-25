import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { useAppLauncher } from '../hooks/useAppLauncher';
import { PageSEO } from '../components/PageSEO';
import GameLeaderboard from '../components/games/GameLeaderboard';

interface GameConfig {
    label: string;
    icon: string;
    /** 아이콘 배경 그라데이션 (tailwind from-/to-) */
    gradient: string;
    /** 게임 시작 버튼 그라데이션 */
    buttonGradient: string;
    tagline: string;
    description: string;
    controls: { keys: string; desc: string }[];
    appUrl: string;
    appName: string;
    leaderboardUrl: string;
}

// 테트리스는 별도 페이지(TetrisInfoPage)에서 처리. 여기서는 나머지 미니게임을 다룬다.
const GAME_CONFIGS: Record<string, GameConfig> = {
    sudoku: {
        label: '스도쿠',
        icon: 'fas fa-table-cells',
        gradient: 'from-violet-500 to-violet-600',
        buttonGradient: 'from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700',
        tagline: '빈 칸에 숫자를 채워 9×9 퍼즐을 완성하세요!',
        description: '가로·세로 한 줄과 3×3 박스 안에 1부터 9까지의 숫자가 겹치지 않도록 빈 칸을 채우는 두뇌 퍼즐입니다. 논리적으로 칸을 하나씩 좁혀가며 퍼즐을 완성해 보세요.',
        controls: [
            { keys: '칸 선택', desc: '빈 칸을 클릭/터치해 선택' },
            { keys: '1 ~ 9', desc: '선택한 칸에 숫자 입력' },
            { keys: '지우기', desc: '잘못 입력한 숫자 삭제' },
        ],
        appUrl: '/app/sudoku/',
        appName: 'app-sudoku',
        leaderboardUrl: '/api/games/sudoku/leaderboard',
    },
    '2048': {
        label: '2048',
        icon: 'fas fa-grip',
        gradient: 'from-cyan-500 to-cyan-600',
        buttonGradient: 'from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700',
        tagline: '같은 숫자를 합쳐 2048 타일을 만들어보세요!',
        description: '타일을 한 방향으로 밀어 같은 숫자끼리 합치는 중독성 있는 퍼즐 게임입니다. 합칠 때마다 숫자가 두 배로 커지며, 2048 타일을 만들면 성공! 더 높은 점수에 도전하세요.',
        controls: [
            { keys: '← → ↑ ↓', desc: '타일을 해당 방향으로 이동' },
            { keys: '스와이프', desc: '모바일에서 손가락으로 밀기' },
        ],
        appUrl: '/app/2048/',
        appName: 'app-2048',
        leaderboardUrl: '/api/games/2048/leaderboard',
    },
    minesweeper: {
        label: '지뢰찾기',
        icon: 'fas fa-bomb',
        gradient: 'from-red-500 to-red-600',
        buttonGradient: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
        tagline: '지뢰를 피해 모든 칸을 최대한 빨리 열어보세요!',
        description: '숫자 힌트를 단서로 지뢰가 없는 칸을 모두 열면 승리하는 고전 게임입니다. 숫자는 주변 8칸에 숨은 지뢰의 개수를 뜻합니다. 지뢰가 의심되는 칸엔 깃발을 꽂아 표시하세요.',
        controls: [
            { keys: '클릭', desc: '칸 열기' },
            { keys: '우클릭', desc: '깃발 표시 / 해제' },
            { keys: '길게 누르기', desc: '모바일에서 깃발 표시' },
        ],
        appUrl: '/app/minesweeper/',
        appName: 'app-minesweeper',
        leaderboardUrl: '/api/games/minesweeper/leaderboard',
    },
    comboy: {
        label: 'NES 에뮬레이터',
        icon: 'fas fa-gamepad',
        gradient: 'from-gray-600 to-gray-700',
        buttonGradient: 'from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
        tagline: '8비트 고전 패미콤/NES 게임을 웹에서 가볍게 즐겨보세요!',
        description: 'Vera Comboy는 브라우저 내부 메모리에서 유저 소장 .nes 파일을 실행하는 하드웨어 구동 엔진만 제공하며, 어떠한 ROM 파일도 서버에 보관하거나 유포하지 않습니다.',
        controls: [
            { keys: 'ROM 파일 업로드', desc: '개인 소장 .nes 파일을 플레이어 화면에 드래그 앤 드롭' },
            { keys: '방향키 (← → ↑ ↓)', desc: '방향키 (D-Pad)' },
            { keys: 'Z / X', desc: 'A / B 버튼' },
            { keys: 'Space / Enter', desc: 'Select / Start 버튼' },
            { keys: '모바일 컨트롤러', desc: '모바일 환경 감지 시 가상 컨트롤러 화면 오버레이 및 진동(햅틱) 지원' },
            { keys: '클라우드 세이브', desc: '언제 어디서든 [Save State] 버튼으로 원격 DB에 내 게임 상태 백업 가능' },
        ],
        appUrl: '/app/comboy/',
        appName: 'app-comboy',
        leaderboardUrl: '',
    },
    sfc: {
        label: 'SNES 에뮬레이터',
        icon: 'fas fa-gamepad',
        gradient: 'from-indigo-600 to-indigo-700',
        buttonGradient: 'from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800',
        tagline: '16비트 슈퍼패미콤/SNES 게임을 웹에서 가볍게 즐겨보세요!',
        description: 'Vera Super Comboy는 브라우저 내부 메모리에서 유저 소장 .sfc/.smc 파일을 실행하는 하드웨어 구동 엔진만 제공하며, 어떠한 ROM 파일도 서버에 보관하거나 유포하지 않습니다.',
        controls: [
            { keys: 'ROM 파일 업로드', desc: '개인 소장 .sfc/.smc 파일을 플레이어 화면에 드래그 앤 드롭' },
            { keys: '방향키 (← → ↑ ↓)', desc: '방향키 (D-Pad)' },
            { keys: 'Z / X', desc: 'A / B 버튼' },
            { keys: 'A / Y', desc: 'X / Y 버튼' },
            { keys: 'Q / W', desc: 'L / R 버튼' },
            { keys: 'Shift / Enter', desc: 'Select / Start 버튼' },
            { keys: '게임패드', desc: 'USB/블루투스 게임패드 자동 감지 지원' },
        ],
        appUrl: '/app/sfc/',
        appName: 'app-sfc',
        leaderboardUrl: '',
    },
};

/**
 * 미니게임 정보 + 점수 페이지 (테트리스 제외).
 * "게임 시작" 버튼은 기존 팝업 실행 방식(launchApp)을 그대로 사용한다.
 */
export default function GameInfoPage() {
    const { user, logout } = useAuth();
    const { launchApp } = useAppLauncher();
    const navigate = useNavigate();
    const { gameId } = useParams<{ gameId: string }>();

    const config = gameId ? GAME_CONFIGS[gameId] : undefined;

    // 알 수 없는 게임이면 게임 목록으로 돌려보냄
    useEffect(() => {
        if (gameId && !config) {
            navigate('/game', { replace: true });
        }
    }, [gameId, config, navigate]);

    if (!config) return null;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Game',
        name: config.label,
        description: config.description,
        url: `https://faithlink.my/game/${gameId}`,
        genre: 'Puzzle',
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            <PageSEO
                title={`${config.label} - 게임 정보 및 랭킹`}
                description={`${config.label} 게임 정보와 명예의 전당 랭킹을 확인하고, 게임 시작 버튼으로 바로 플레이하세요.`}
                path={`/game/${gameId}`}
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
                            <div className="absolute top-0 right-0 w-40 h-40 bg-slate-500/5 rounded-full -translate-y-1/3 translate-x-1/4"></div>
                            <div className="relative flex items-start gap-4 mb-5">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0`}>
                                    <i className={`${config.icon} text-white text-2xl`}></i>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">{config.label}</h1>
                                    <p className="text-slate-500 text-sm mt-1">{config.tagline}</p>
                                </div>
                            </div>

                            <p className="relative text-slate-600 text-sm leading-relaxed mb-6">
                                {config.description}
                                {!user && (
                                    <span className="block mt-2 text-amber-500 italic text-xs">
                                        비회원도 플레이할 수 있지만, 로그인하면 점수가 랭킹에 기록됩니다.
                                    </span>
                                )}
                            </p>

                            {/* 게임 시작 버튼 (기존 팝업 실행 방식 그대로 사용) */}
                            <button
                                onClick={() => launchApp(config.appUrl, config.appName)}
                                className={`relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r ${config.buttonGradient} text-white font-extrabold text-lg shadow-md hover:shadow-lg active:scale-95 transition-all`}
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
                                <i className="fas fa-gamepad text-slate-400"></i>
                                플레이 방법
                            </h2>
                            <div className="flex flex-col gap-3">
                                {config.controls.map((c) => (
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
                        {(gameId === 'comboy' || gameId === 'sfc') ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <i className="fas fa-shield-halved text-slate-500"></i>
                                    보안 및 개인정보 보호정책
                                </h3>
                                <div className="text-xs text-slate-500 leading-relaxed space-y-2">
                                    <p>
                                        <strong>1. 100% 로컬 구동</strong><br />
                                        {gameId === 'sfc' ? 'Vera Super Comboy' : 'Vera Comboy'}는 웹 어셈블리/자바스크립트 엔진 기반으로 동작하여, 사용자가 올린 게임 ROM 파일을 서버로 절대 업로드하지 않고 사용자 브라우저 메모리상에서만 구동합니다.
                                    </p>
                                    <p>
                                        <strong>2. 클라우드 세이브 보안</strong><br />
                                        저장(Save State) 시, 게임 데이터 자체가 아닌 현재 에뮬레이터의 일시적인 램 상태(바이너리 텍스트)만 추출하여 포털 데이터베이스에 암호화하여 백업합니다.
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 p-2 rounded border border-slate-100 font-sans">
                                        ※ {gameId === 'sfc' ? 'Vera Super Comboy' : 'Vera Comboy'}는 저작권을 준수하며 어떠한 ROM 파일도 서버에 보관하거나 배포하지 않습니다. 유저가 합법적으로 소유한 파일만 실행할 수 있습니다.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <GameLeaderboard apiUrl={config.leaderboardUrl} />
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
