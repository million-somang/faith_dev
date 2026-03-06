import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { MiniAppLayout, useAuth, usePortalMessenger } from '@faithportal/mini-app-sdk';
import axios from 'axios';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import { useTetris } from './hooks/useTetris';
import GameBoard from './components/GameBoard';
import InfoPanel from './components/InfoPanel';
import MobileControls from './components/MobileControls';
import Leaderboard from './components/Leaderboard';
import NextPiecePreview from './components/NextPiecePreview';
function App() {
    const { user, isLoading } = useAuth();
    const { sendToPortal } = usePortalMessenger();
    const { board, currentPiece, nextPieceType, score, level, lines, isGameOver, isPaused, moveLeft, moveRight, moveDown, rotatePiece, dropPiece, startGame, togglePause } = useTetris();
    const [savingScore, setSavingScore] = useState(false);
    const [highScore, setHighScore] = useState(0);
    const [refreshBoardToggle, setRefreshBoardToggle] = useState(false);
    const gameOverHandled = useRef(false);
    // 모바일 디바이스 여부 판별 (단순 UA 체크)
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    // Initialize highest score if user exists
    useEffect(() => {
        if (user) {
            axios.get(`/api/tetris/highscore/${user.id}`)
                .then(res => {
                if (res.data.success) {
                    setHighScore(res.data.highScore || 0);
                }
            })
                .catch(err => console.error('Failed to load highscore:', err));
        }
    }, [user]);
    // Handle Game Over
    useEffect(() => {
        if (isGameOver && !gameOverHandled.current) {
            gameOverHandled.current = true;
            if (user && score >= 0) {
                setSavingScore(true);
                axios.post('/api/tetris/score', {
                    score,
                    lines,
                    level
                }, { withCredentials: true })
                    .then(res => {
                    console.log("Score saved:", res.data);
                    if (score > highScore) {
                        setHighScore(score);
                    }
                    // 리더보드 갱신 트리거
                    setRefreshBoardToggle(prev => !prev);
                    // Notify portal to update user points possibly
                    sendToPortal('MISSION_CLEAR');
                    // iframe 환경: 부모 페이지에 점수 업데이트 이벤트 알림 (리더보드 갱신용)
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage({ type: 'TETRIS_SCORE_UPDATED', score: score }, '*');
                    }
                })
                    .catch(err => console.error("Score save error:", err))
                    .finally(() => setSavingScore(false));
            }
        }
        else if (!isGameOver) {
            gameOverHandled.current = false;
        }
    }, [isGameOver, score, lines, level, user, highScore, sendToPortal]);
    // Key Bindings
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isGameOver || isPaused) {
                // Prevent default only if it's our game keys inside game
                return;
            }
            switch (e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    moveLeft();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    moveRight();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    moveDown();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    rotatePiece();
                    break;
                case 'Space':
                    e.preventDefault();
                    dropPiece();
                    break;
                case 'Escape':
                case 'KeyP':
                    e.preventDefault();
                    togglePause();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [moveLeft, moveRight, moveDown, rotatePiece, dropPiece, togglePause, isGameOver, isPaused]);
    if (isLoading)
        return _jsx("div", { className: "p-8 text-center text-slate-500 min-h-screen flex items-center justify-center", children: "Loading..." });
    return (_jsx(MiniAppLayout, { title: "\uB808\uD2B8\uB85C \uD14C\uD2B8\uB9AC\uC2A4", children: _jsx("div", { className: "min-h-[calc(100vh-56px)] bg-slate-900 overflow-y-auto overflow-x-hidden flex flex-col", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 py-3 flex flex-col items-center w-full", children: [_jsxs("div", { className: "w-full text-center mb-3", children: [_jsx("h1", { className: "text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-sm tracking-tighter", children: "TETRIS" }), user ? (_jsxs("p", { className: "text-slate-400 mt-1 text-xs md:text-sm", children: ["Welcome, ", _jsx("span", { className: "text-emerald-400 font-bold", children: user.name }), " | High Score: ", highScore.toLocaleString()] })) : (_jsx("p", { className: "text-amber-500 mt-1 text-[10px] md:text-sm italic", children: "You are playing as a guest. Log in to save scores!" }))] }), _jsxs("div", { className: "flex flex-col lg:flex-row gap-4 lg:gap-12 justify-center items-center lg:items-start w-full", children: [_jsx("div", { className: "hidden lg:block", children: _jsx(InfoPanel, { score: score, level: level, lines: lines, nextPieceType: nextPieceType, isPaused: isPaused, isGameOver: isGameOver, onPause: togglePause, onRestart: startGame }) }), _jsxs("div", { className: "relative flex flex-col items-center", children: [_jsxs("div", { className: "lg:hidden flex items-start justify-between w-full max-w-[240px] mb-3 text-white gap-2", children: [_jsxs("div", { className: "flex flex-col gap-2 flex-1", children: [_jsxs("div", { className: "bg-slate-800 px-3 py-1 flex-1 rounded-lg border border-slate-700 flex flex-col justify-center", children: [_jsx("span", { className: "text-[10px] text-slate-400 leading-none mb-1", children: "SCORE" }), _jsx("span", { className: "font-mono text-emerald-400 font-bold leading-none", children: score })] }), _jsxs("div", { className: "bg-slate-800 px-3 py-1 flex-1 rounded-lg border border-slate-700 flex flex-col justify-center", children: [_jsx("span", { className: "text-[10px] text-slate-400 leading-none mb-1", children: "LEVEL" }), _jsx("span", { className: "font-mono text-amber-400 font-bold leading-none", children: level })] })] }), _jsxs("div", { className: "bg-slate-800 p-2 rounded-lg border border-slate-700 flex flex-col items-center justify-center min-w-[70px] inner-shadow", children: [_jsx("span", { className: "text-[10px] text-slate-400 font-bold tracking-wider mb-2", children: "NEXT" }), _jsx(NextPiecePreview, { type: nextPieceType, blockSize: "w-3.5 h-3.5", borderWidth: "border-[2px]" })] })] }), _jsxs("div", { className: "relative", children: [_jsx(GameBoard, { board: board, currentPiece: currentPiece }), isPaused && !isGameOver && (_jsxs("div", { className: "absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border-4 border-transparent z-10 transition-all", children: [_jsx("h2", { className: "text-3xl font-bold text-white mb-2 tracking-widest", children: "PAUSED" }), _jsx("button", { onClick: togglePause, className: "mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-full transition-colors", children: "RESUME" })] })), isGameOver && (_jsxs("div", { className: "absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center rounded-xl border-4 border-red-500/50 z-20 transition-all", children: [_jsx("h2", { className: "text-4xl font-black text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]", children: "GAME OVER" }), _jsxs("p", { className: "text-slate-300 font-mono text-lg mb-6", children: ["FINAL SCORE: ", _jsx("span", { className: "text-white", children: score })] }), savingScore && _jsx("span", { className: "text-emerald-400 text-sm mb-4 animate-pulse", children: "Saving score..." }), !savingScore && score >= 0 && user && _jsx("span", { className: "text-emerald-400 text-sm mb-4 font-bold", children: "Score Saved! \u2713" }), _jsx("button", { onClick: startGame, className: "px-8 py-3 bg-white text-red-600 hover:bg-slate-200 font-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all", children: "PLAY AGAIN" })] }))] }), isMobileDevice && (_jsx(MobileControls, { onMoveLeft: moveLeft, onMoveRight: moveRight, onMoveDown: moveDown, onRotate: rotatePiece, onDrop: dropPiece, onPause: togglePause, onRestart: startGame, isPaused: isPaused, isGameOver: isGameOver }))] }), _jsx("div", { className: "hidden lg:block w-full lg:w-auto", children: _jsx(Leaderboard, { refreshTrigger: refreshBoardToggle }) })] })] }) }) }));
}
export default App;
