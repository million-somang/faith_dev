import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface User {
    id: string;
    email: string;
    name: string;
}

export interface UseGamePlayReturn {
    highScore: number;
    savingScore: boolean;
    refreshBoardToggle: boolean;
    scaleValue: number;
    baseHeight: number;
    handleBack: () => void;
    handleGoHome: () => void;
    handleGameOver: (score: number, lines: number, level: number) => Promise<void>;
}

export function useGamePlay(user: User | null): UseGamePlayReturn {
    const navigate = useNavigate();
    const [highScore, setHighScore] = useState<number>(0);
    const [savingScore, setSavingScore] = useState<boolean>(false);
    const [refreshBoardToggle, setRefreshBoardToggle] = useState<boolean>(false);
    const [scaleValue, setScaleValue] = useState<number>(1);
    const [baseHeight, setBaseHeight] = useState<number>(700);

    const updateScale = useCallback(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // 상단 헤더, 타이틀바, 하단 여백 및 패딩의 총 높이 합산 제외 (220px)
        const headerFooterHeight = 220;
        const availableHeight = height - headerFooterHeight;
        // 좌우 패딩을 제외한 가용 너비
        const availableWidth = width - 48;

        let gameWidth = 1040;
        let gameHeight = 700;

        if (width < 1024) {
            // lg 미만 모바일 레이아웃
            gameWidth = 320;
            gameHeight = 620;
        }

        setBaseHeight(gameHeight);

        const ratioW = availableWidth / gameWidth;
        const ratioH = availableHeight / gameHeight;
        
        // 가로, 세로 가용비율 중 더 작은 값으로 스케일을 맞춥니다.
        let scale = Math.min(ratioW, ratioH);
        
        // 모바일에서는 스케일 최소 비율을 0.45, 데스크톱은 0.55 정도로 설정하여 가독성을 유지합니다.
        const minScale = width < 1024 ? 0.45 : 0.55;
        const maxScale = 1.4; // 최대 1.4배까지 스케일업(Scale-up) 지원

        scale = Math.max(minScale, Math.min(maxScale, scale));
        setScaleValue(scale);
    }, []);

    useEffect(() => {
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [updateScale]);


    // Initialize highest score if user exists
    // user 객체는 매 렌더링 시 새로 생성될 수 있으므로 primitive 값인 user?.id를 의존성으로 삼음
    const userId = user?.id;
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
    }, [userId]);

    const handleBack = useCallback(() => {
        navigate('/game');
    }, [navigate]);

    const handleGoHome = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const handleGameOver = useCallback(async (score: number, lines: number, level: number) => {
        if (!user) {
            console.warn("[Tetris] User is guest or auth failed. Score will not be saved.");
            return;
        }
        
        if (score >= 0) {
            setSavingScore(true);
            try {
                const res = await axios.post('/api/tetris/score', {
                    score,
                    lines,
                    level
                }, { withCredentials: true });
                
                console.log("[Tetris] Score saved successfully:", res.data);
                if (score > highScore) {
                    setHighScore(score);
                }
                setRefreshBoardToggle(prev => !prev);
            } catch (err: any) {
                console.error("[Tetris] Score save error:", err.response?.data || err.message);
            } finally {
                setSavingScore(false);
            }
        }
    }, [user, highScore]);

    return {
        highScore,
        savingScore,
        refreshBoardToggle,
        scaleValue,
        baseHeight,
        handleBack,
        handleGoHome,
        handleGameOver
    };
}
