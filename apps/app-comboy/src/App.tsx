import React, { useState, useRef, useEffect } from 'react';
import { MiniAppLayout, useAuth } from '@faithportal/mini-app-sdk';
import * as jsnesModule from 'jsnes';
import axios from 'axios';
import { ShieldAlert, Save, RotateCcw, ArrowLeft, RefreshCw, X } from 'lucide-react';
import '@faithportal/mini-app-sdk/src/mini-app.css';

// CJS/ESM 호환 안전 처리
const jsnesLib = (jsnesModule as any).default || jsnesModule;
const NES = jsnesLib.NES;
const Controller = jsnesLib.Controller;

// 키보드 키 매핑 설정
const KEY_MAP: Record<string, number> = {
    'ArrowUp': Controller.BUTTON_UP,
    'ArrowDown': Controller.BUTTON_DOWN,
    'ArrowLeft': Controller.BUTTON_LEFT,
    'ArrowRight': Controller.BUTTON_RIGHT,
    'Enter': Controller.BUTTON_START,
    ' ': Controller.BUTTON_SELECT,
    'z': Controller.BUTTON_A,
    'x': Controller.BUTTON_B,
    'Z': Controller.BUTTON_A,
    'X': Controller.BUTTON_B
};

const AUDIO_BUFFER_SIZE = 4096;

export default function App() {
    const { user, isLoading: isAuthLoading } = useAuth();
    
    // 상태 정의
    const [romLoaded, setRomLoaded] = useState(false);
    const [gameName, setGameName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingState, setIsLoadingState] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [activeTab, setActiveTab] = useState<'play' | 'guide' | 'faq'>('play');

    // Refs
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const nesRef = useRef<NES | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    
    // 오디오 샘플 버퍼
    const audioBufferRef = useRef<number[]>([]);

    // 모바일 뷰포트 감지
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 햅틱 진동 피드백 유틸리티
    const triggerHaptic = () => {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(10);
            } catch (e) {
                // 진동 에러 무시
            }
        }
    };

    // 에뮬레이터 초기화 및 구동
    const initEmulator = (romData: string) => {
        // 기존 루프 및 오디오 해제
        cleanUpEmulator();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.createImageData(256, 240);
        const buf = new ArrayBuffer(imageData.data.length);
        const buf8 = new Uint8ClampedArray(buf);
        const buf32 = new Uint32Array(buf);

        // 32비트 프레임 버퍼 생성
        const frameBuffer32 = new Uint32Array(256 * 240);

        // 오디오 컨텍스트 설정
        let audioCtx: AudioContext | null = null;
        let scriptNode: ScriptProcessorNode | null = null;

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioCtx = new AudioContextClass({ sampleRate: 44100 });
            audioCtxRef.current = audioCtx;

            scriptNode = audioCtx.createScriptProcessor(AUDIO_BUFFER_SIZE, 0, 2);
            audioProcessorRef.current = scriptNode;

            scriptNode.onaudioprocess = (e) => {
                const left = e.outputBuffer.getChannelData(0);
                const right = e.outputBuffer.getChannelData(1);
                const sampleBuffer = audioBufferRef.current;

                for (let i = 0; i < left.length; i++) {
                    left[i] = sampleBuffer.shift() || 0;
                    right[i] = sampleBuffer.shift() || 0;
                }
            };

            scriptNode.connect(audioCtx.destination);
        } catch (audioError) {
            console.warn('[Audio] Failed to initialize AudioContext:', audioError);
        }

        // JSNES 인스턴스 생성
        const nes = new NES({
            onFrame: (buffer) => {
                for (let i = 0; i < 256 * 240; i++) {
                    frameBuffer32[i] = buffer[i] | 0xFF000000; // Alpha 255
                }
            },
            onAudioSample: (l, r) => {
                const sampleBuffer = audioBufferRef.current;
                sampleBuffer.push(l, r);
                if (sampleBuffer.length > AUDIO_BUFFER_SIZE * 4) {
                    // 버퍼가 과도하게 쌓이면 앞부분을 밀어냄
                    sampleBuffer.splice(0, sampleBuffer.length - AUDIO_BUFFER_SIZE * 4);
                }
            },
            sampleRate: 44100
        });

        nesRef.current = nes;
        nes.loadROM(romData);

        // 오디오 첫 터치 자동재생 해제 대응
        if (audioCtx && audioCtx.state === 'suspended') {
            const resumeAudio = () => {
                audioCtx?.resume();
                window.removeEventListener('click', resumeAudio);
                window.removeEventListener('touchstart', resumeAudio);
            };
            window.addEventListener('click', resumeAudio);
            window.addEventListener('touchstart', resumeAudio);
        }

        // 게임 루프 실행
        const updateFrame = () => {
            nes.frame();
            
            // Canvas에 렌더링
            buf32.set(frameBuffer32);
            imageData.data.set(buf8);
            ctx.putImageData(imageData, 0, 0);

            animationFrameIdRef.current = requestAnimationFrame(updateFrame);
        };
        animationFrameIdRef.current = requestAnimationFrame(updateFrame);
    };

    // 기존 리소스 해제
    const cleanUpEmulator = () => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        if (audioProcessorRef.current) {
            audioProcessorRef.current.disconnect();
            audioProcessorRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
        }
        nesRef.current = null;
        audioBufferRef.current = [];
    };

    useEffect(() => {
        return () => cleanUpEmulator();
    }, []);

    // 키보드 조작 바인딩
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!nesRef.current) return;
            const buttonCode = KEY_MAP[e.key];
            if (buttonCode !== undefined) {
                e.preventDefault();
                nesRef.current.buttonDown(1, buttonCode);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (!nesRef.current) return;
            const buttonCode = KEY_MAP[e.key];
            if (buttonCode !== undefined) {
                e.preventDefault();
                nesRef.current.buttonUp(1, buttonCode);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // ROM 파일 파싱 처리
    const handleRomUpload = (file: File) => {
        if (!file.name.endsWith('.nes')) {
            setErrorMessage('올바른 .nes 확장자 롬 파일이 아닙니다.');
            return;
        }
        setErrorMessage('');
        setGameName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
                try {
                    initEmulator(result);
                    setRomLoaded(true);
                } catch (err: any) {
                    console.error('[Comboy] ROM 로딩 에러:', err);
                    setErrorMessage(`에뮬레이터 초기화 실패: ${err?.message || '알 수 없는 오류'}`);
                }
            } else {
                setErrorMessage('파일 읽기에 실패했습니다. 다른 ROM 파일을 시도해 주세요.');
            }
        };
        reader.onerror = () => {
            setErrorMessage('파일을 읽는 중 오류가 발생했습니다.');
        };
        reader.readAsBinaryString(file);
    };

    // 드래그 앤 드롭
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleRomUpload(file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleRomUpload(file);
    };

    // 모바일 가상 컨트롤러 키 입력 처리
    const handleVirtualPress = (btn: NESButton) => {
        if (!nesRef.current) return;
        triggerHaptic();
        let code: number | null = null;
        switch (btn) {
            case 'UP': code = Controller.BUTTON_UP; break;
            case 'DOWN': code = Controller.BUTTON_DOWN; break;
            case 'LEFT': code = Controller.BUTTON_LEFT; break;
            case 'RIGHT': code = Controller.BUTTON_RIGHT; break;
            case 'START': code = Controller.BUTTON_START; break;
            case 'SELECT': code = Controller.BUTTON_SELECT; break;
            case 'A': code = Controller.BUTTON_A; break;
            case 'B': code = Controller.BUTTON_B; break;
        }
        if (code !== null) nesRef.current.buttonDown(1, code);
    };

    const handleVirtualRelease = (btn: NESButton) => {
        if (!nesRef.current) return;
        let code: number | null = null;
        switch (btn) {
            case 'UP': code = Controller.BUTTON_UP; break;
            case 'DOWN': code = Controller.BUTTON_DOWN; break;
            case 'LEFT': code = Controller.BUTTON_LEFT; break;
            case 'RIGHT': code = Controller.BUTTON_RIGHT; break;
            case 'START': code = Controller.BUTTON_START; break;
            case 'SELECT': code = Controller.BUTTON_SELECT; break;
            case 'A': code = Controller.BUTTON_A; break;
            case 'B': code = Controller.BUTTON_B; break;
        }
        if (code !== null) nesRef.current.buttonUp(1, code);
    };

    // 클라우드 세이브 (Cloud Save)
    const handleCloudSave = async () => {
        if (!nesRef.current) return;
        if (!user) {
            setSaveMessage('로그인이 필요한 기능입니다.');
            return;
        }
        setIsSaving(true);
        setSaveMessage('');
        
        try {
            // JSNES의 메모리 상태(JSON 포맷) 획득
            const rawState = nesRef.current.toJSON();
            const jsonStr = JSON.stringify(rawState);
            // 텍스트 바이너리를 Base64 인코딩
            const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));

            const res = await axios.post('/api/comboy/save', {
                gameName,
                saveData: base64Data
            });

            if (res.data.success) {
                setSaveMessage('게임 진행 상태가 성공적으로 세이브되었습니다.');
            } else {
                setSaveMessage('세이브 실패: ' + (res.data.error?.message || '알 수 없는 에러'));
            }
        } catch (e: any) {
            console.error(e);
            setSaveMessage('세이브 중 네트워크 오류 발생: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    // 클라우드 로드 (Cloud Load)
    const handleCloudLoad = async () => {
        if (!nesRef.current) return;
        if (!user) {
            setSaveMessage('로그인이 필요한 기능입니다.');
            return;
        }
        setIsLoadingState(true);
        setSaveMessage('');
        
        try {
            const res = await axios.get(`/api/comboy/load?gameName=${encodeURIComponent(gameName)}`);

            if (res.data.success && res.data.data?.saveData) {
                // Base64 디코딩
                const jsonStr = decodeURIComponent(escape(atob(res.data.data.saveData)));
                const parsedState = JSON.parse(jsonStr);

                // JSNES 상태 복구
                nesRef.current.fromJSON(parsedState);
                setSaveMessage('마지막 저장 위치에서 성공적으로 로드되었습니다.');
            } else {
                setSaveMessage('저장된 데이터를 찾을 수 없습니다.');
            }
        } catch (e: any) {
            console.error(e);
            if (e.response?.status === 404) {
                setSaveMessage('저장된 세이브 파일이 존재하지 않습니다.');
            } else {
                setSaveMessage('로드 중 네트워크 오류 발생: ' + e.message);
            }
        } finally {
            setIsLoadingState(false);
        }
    };

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-white font-sans">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-400"></div>
                <span className="ml-3 text-sm">유저 인증 세션 연동 중...</span>
            </div>
        );
    }

    return (
        <MiniAppLayout title="베라 컴보이 아케이드">
            <div className="bg-neutral-900 min-h-screen text-slate-100 flex flex-col font-sans select-none touch-none">
                
                {/* 탭 네비게이션 - SEO 보완용 */}
                <div className="flex bg-neutral-950 border-b border-neutral-800">
                    <button 
                        onClick={() => setActiveTab('play')}
                        className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'play' ? 'border-red-500 text-slate-50' : 'border-transparent text-neutral-500'
                        }`}
                    >
                        아케이드 플레이
                    </button>
                    <button 
                        onClick={() => setActiveTab('guide')}
                        className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'guide' ? 'border-red-500 text-slate-50' : 'border-transparent text-neutral-500'
                        }`}
                    >
                        사용 방법
                    </button>
                    <button 
                        onClick={() => setActiveTab('faq')}
                        className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'faq' ? 'border-red-500 text-slate-50' : 'border-transparent text-neutral-500'
                        }`}
                    >
                        자주 묻는 질문
                    </button>
                </div>

                {/* 탭 콘텐츠 영역 */}
                <div className="flex-1 overflow-y-auto pb-6">
                    {activeTab === 'play' && (
                        <div className="p-4 flex flex-col items-center">
                            
                            {/* 에뮬레이터 로드 이전: 드롭존 및 보안 약관 화면 */}
                            <div style={{ display: romLoaded ? 'none' : undefined }} className="w-full max-w-md mt-6 flex flex-col gap-6">
                                    <label 
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        className="h-64 border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-2xl flex flex-col items-center justify-center bg-neutral-950 p-6 text-center cursor-pointer transition-all hover:bg-neutral-900/50"
                                    >
                                        <input 
                                            type="file" 
                                            accept=".nes" 
                                            onChange={handleFileInputChange} 
                                            className="hidden" 
                                        />
                                        <i className="fas fa-file-arrow-up text-5xl text-neutral-600 mb-4 animate-bounce"></i>
                                        <h3 className="font-extrabold text-lg text-slate-200">NES 롬파일 드래그 & 드롭</h3>
                                        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                                            이곳에 .nes 카트리지 파일을 끌어다 놓거나 클릭하여 로컬 기기에서 선택해 주세요.
                                        </p>
                                    </label>

                                    {errorMessage && (
                                        <div className="bg-red-950 border border-red-800 text-red-400 p-3.5 rounded-xl text-xs text-center font-medium">
                                            {errorMessage}
                                        </div>
                                    )}

                                    {/* 보안 경고 약관 (국/영문 필수 명시) */}
                                    <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 shadow-sm">
                                        <div className="flex gap-2.5 items-start mb-3 text-red-400">
                                            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                                            <h4 className="font-bold text-sm">보안 및 개인소장 파일 사용 약관</h4>
                                        </div>
                                        <div className="text-[11px] text-neutral-400 leading-relaxed space-y-3 font-sans">
                                            <p>
                                                <strong>[국문]</strong> Vera Comboy는 브라우저 내부 가상 에뮬레이터 엔진만 제공하며, 어떠한 ROM 파일도 서버에 보관하거나 배포하지 않습니다. 유저가 적법하게 개인 소장한 파일만 안전하게 로컬 메모리(Web Sandbox)에서 100% 구동됩니다.
                                            </p>
                                            <p>
                                                <strong>[English]</strong> Vera Comboy only provides a client-side emulation engine. We do not host or distribute any game ROMs. Files are executed 100% inside your local browser memory.
                                            </p>
                                        </div>
                                    </div>
                            </div>

                                {/* 에뮬레이터 구동 상태 - 항상 DOM에 존재, romLoaded에 따라 표시/숨김 */}
                                <div style={{ display: romLoaded ? undefined : 'none' }} className="w-full max-w-lg mt-2 flex flex-col items-center">
                                    
                                    {/* 상단 컨트롤 및 세이브 상태 헤더 */}
                                    <div className="w-full flex items-center justify-between bg-neutral-950 px-4 py-2.5 rounded-t-2xl border-t border-x border-neutral-800">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                                            <span className="text-xs font-bold text-neutral-300 truncate max-w-[160px] sm:max-w-[240px]">
                                                {gameName}
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {user ? (
                                                <>
                                                    <button 
                                                        onClick={handleCloudSave} 
                                                        disabled={isSaving}
                                                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-slate-200 text-xs font-extrabold flex items-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                                    >
                                                        {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                        세이브
                                                    </button>
                                                    <button 
                                                        onClick={handleCloudLoad}
                                                        disabled={isLoadingState}
                                                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-slate-200 text-xs font-extrabold flex items-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                                    >
                                                        {isLoadingState ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                                        로드
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-[10px] text-neutral-500 italic">로그인 시 클라우드 세이브 지원</span>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    cleanUpEmulator();
                                                    setRomLoaded(false);
                                                    setGameName('');
                                                    setSaveMessage('');
                                                }}
                                                className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-950/60 active:scale-95 transition-all cursor-pointer"
                                                title="게임 종료"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 에뮬레이터 캔버스 화면 (CRT 프레임 데코) */}
                                    <div className="w-full aspect-[256/240] crt-screen crt-blur bg-black border-x border-b border-neutral-800 shadow-2xl relative">
                                        <canvas 
                                            ref={canvasRef} 
                                            width="256" 
                                            height="240"
                                            className="w-full h-full block object-contain"
                                        />
                                    </div>

                                    {/* 세이브/로드 알림 피드백 메시지 */}
                                    {saveMessage && (
                                        <div className="w-full mt-3 bg-neutral-950 border border-neutral-800 text-[11px] font-bold text-center text-slate-300 py-2 px-3 rounded-xl">
                                            {saveMessage}
                                        </div>
                                    )}

                                    {/* 모바일 가상 패드 컨트롤러 (현대 컴보이 스타일) */}
                                    {isMobile && (
                                        <div className="w-full bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 mt-4 flex flex-col gap-6 shadow-md select-none">
                                            
                                            {/* D-Pad & Action Buttons */}
                                            <div className="flex justify-between items-center px-2">
                                                
                                                {/* Left Side: D-Pad */}
                                                <div className="relative w-36 h-36">
                                                    {/* D-Pad background cross */}
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-10 bg-neutral-800 rounded-md"></div>
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-32 bg-neutral-800 rounded-md"></div>
                                                    
                                                    {/* Up */}
                                                    <button
                                                        onTouchStart={() => handleVirtualPress('UP')}
                                                        onTouchEnd={() => handleVirtualRelease('UP')}
                                                        className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-neutral-700 active:bg-neutral-600 rounded-t-lg flex items-center justify-center border-t border-x border-neutral-600 active:scale-95"
                                                    >
                                                        <i className="fas fa-caret-up text-slate-300 text-lg"></i>
                                                    </button>
                                                    {/* Down */}
                                                    <button
                                                        onTouchStart={() => handleVirtualPress('DOWN')}
                                                        onTouchEnd={() => handleVirtualRelease('DOWN')}
                                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-neutral-700 active:bg-neutral-600 rounded-b-lg flex items-center justify-center border-b border-x border-neutral-600 active:scale-95"
                                                    >
                                                        <i className="fas fa-caret-down text-slate-300 text-lg"></i>
                                                    </button>
                                                    {/* Left */}
                                                    <button
                                                        onTouchStart={() => handleVirtualPress('LEFT')}
                                                        onTouchEnd={() => handleVirtualRelease('LEFT')}
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-neutral-700 active:bg-neutral-600 rounded-l-lg flex items-center justify-center border-l border-y border-neutral-600 active:scale-95"
                                                    >
                                                        <i className="fas fa-caret-left text-slate-300 text-lg"></i>
                                                    </button>
                                                    {/* Right */}
                                                    <button
                                                        onTouchStart={() => handleVirtualPress('RIGHT')}
                                                        onTouchEnd={() => handleVirtualRelease('RIGHT')}
                                                        className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-neutral-700 active:bg-neutral-600 rounded-r-lg flex items-center justify-center border-r border-y border-neutral-600 active:scale-95"
                                                    >
                                                        <i className="fas fa-caret-right text-slate-300 text-lg"></i>
                                                    </button>
                                                    
                                                    {/* D-Pad Center Cap */}
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-neutral-800 rounded-full"></div>
                                                </div>

                                                {/* Right Side: Red Round A/B Buttons */}
                                                <div className="flex gap-4">
                                                    {/* B Button */}
                                                    <div className="flex flex-col items-center gap-1">
                                                        <button
                                                            onTouchStart={() => handleVirtualPress('B')}
                                                            onTouchEnd={() => handleVirtualRelease('B')}
                                                            className="w-16 h-16 rounded-full bg-red-600 border-4 border-neutral-800 active:bg-red-700 flex items-center justify-center text-white font-black text-xl shadow-lg active:scale-95"
                                                        >
                                                            B
                                                        </button>
                                                        <span className="text-[10px] text-neutral-500 font-bold">CHARCOAL</span>
                                                    </div>

                                                    {/* A Button */}
                                                    <div className="flex flex-col items-center gap-1">
                                                        <button
                                                            onTouchStart={() => handleVirtualPress('A')}
                                                            onTouchEnd={() => handleVirtualRelease('A')}
                                                            className="w-16 h-16 rounded-full bg-red-600 border-4 border-neutral-800 active:bg-red-700 flex items-center justify-center text-white font-black text-xl shadow-lg active:scale-95"
                                                        >
                                                            A
                                                        </button>
                                                        <span className="text-[10px] text-neutral-500 font-bold">RED</span>
                                                    </div>
                                                </div>

                                            </div>

                                            {/* Select & Start Buttons */}
                                            <div className="flex justify-center gap-8 mt-2">
                                                <div className="flex flex-col items-center gap-1">
                                                    <button
                                                        onTouchStart={() => handleVirtualPress('SELECT')}
                                                        onTouchEnd={() => handleVirtualRelease('SELECT')}
                                                        className="w-16 h-4 bg-neutral-700 hover:bg-neutral-600 rounded-full active:scale-95 transition-all"
                                                        aria-label="Select"
                                                    />
                                                    <span className="text-[9px] font-bold text-neutral-500">SELECT</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-1">
                                                    <button
                                                        onTouchStart={() => handleVirtualPress('START')}
                                                        onTouchEnd={() => handleVirtualRelease('START')}
                                                        className="w-16 h-4 bg-neutral-700 hover:bg-neutral-600 rounded-full active:scale-95 transition-all"
                                                        aria-label="Start"
                                                    />
                                                    <span className="text-[9px] font-bold text-neutral-500">START</span>
                                                </div>
                                            </div>

                                        </div>
                                    )}

                                    {/* PC 키보드 단축 조작 가이드 안내 */}
                                    {!isMobile && (
                                        <div className="w-full mt-4 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex justify-around text-center text-xs text-neutral-400 font-sans">
                                            <div>
                                                <span className="font-bold text-slate-300 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 font-mono mr-1">방향키</span>
                                                D-Pad (이동)
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-300 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 font-mono mr-1">Z</span>
                                                A 버튼
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-300 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 font-mono mr-1">X</span>
                                                B 버튼
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-300 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 font-mono mr-1">Space</span>
                                                Select
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-300 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 font-mono mr-1">Enter</span>
                                                Start
                                            </div>
                                        </div>
                                    )}

                                </div>

                        </div>
                    )}

                    {activeTab === 'guide' && (
                        <div className="p-5 max-w-md mx-auto font-sans leading-relaxed text-sm text-neutral-300 space-y-4">
                            <h3 className="text-base font-extrabold text-slate-100 border-b border-neutral-800 pb-2 flex items-center gap-2">
                                <i className="fas fa-circle-info text-red-500"></i>
                                베라 컴보이 아케이드 이용법
                            </h3>
                            <div className="space-y-3">
                                <p>
                                    <strong>1. 롬파일 준비:</strong><br />
                                    본 서비스는 하드웨어 연산 에뮬레이터 코어만 탑재되어 있으며 게임을 제공하지 않습니다. 유저가 개인 소장 중인 8비트 NES (.nes) 롬 카트리지 백업 파일을 로드해 주십시오.
                                </p>
                                <p>
                                    <strong>2. 조작 키 설명 (PC):</strong>
                                </p>
                                <table className="w-full text-xs text-left bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800">
                                    <thead>
                                        <tr className="bg-neutral-900 text-neutral-400">
                                            <th className="p-2.5">입력 기기</th>
                                            <th className="p-2.5">키보드 키</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800 text-slate-300">
                                        <tr>
                                            <td className="p-2.5 font-bold">D-Pad (방향 제어)</td>
                                            <td className="p-2.5">화살표 키 (↑ ↓ ← →)</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2.5 font-bold">A 버튼 (점프/확인)</td>
                                            <td className="p-2.5">Z 키</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2.5 font-bold">B 버튼 (공격/취소)</td>
                                            <td className="p-2.5">X 키</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2.5 font-bold">SELECT 버튼</td>
                                            <td className="p-2.5">스페이스바 (Space)</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2.5 font-bold">START 버튼</td>
                                            <td className="p-2.5">엔터 키 (Enter)</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <p>
                                    <strong>3. 모바일 구동:</strong><br />
                                    모바일로 접속할 경우 화면 하단에 가상 레트로 컴보이 컨트롤 패드가 자동으로 출력됩니다. 조작 버튼 입력 시 진동 햅틱 피드백을 지원합니다.
                                </p>
                                <p>
                                    <strong>4. 클라우드 연동:</strong><br />
                                    로그인 상태로 구동 시 상단의 <strong>[세이브]</strong> 및 <strong>[로드]</strong> 버튼을 통해 게임 현재 상태(RAM)를 플랫폼의 원격 클라우드 DB에 백업하여, 모바일과 PC 등 서로 다른 기기에서 이어서 실행할 수 있습니다.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'faq' && (
                        <div className="p-5 max-w-md mx-auto font-sans leading-relaxed text-sm text-neutral-300 space-y-4">
                            <h3 className="text-base font-extrabold text-slate-100 border-b border-neutral-800 pb-2 flex items-center gap-2">
                                <i className="fas fa-circle-question text-red-500"></i>
                                자주 묻는 질문 (FAQ)
                            </h3>
                            <div className="space-y-4 divide-y divide-neutral-800">
                                <div className="pt-0">
                                    <h4 className="font-extrabold text-slate-200 flex gap-2">
                                        <span className="text-red-500 font-black">Q.</span>
                                        소리가 나지 않습니다. 어떻게 해야 하나요?
                                    </h4>
                                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed pl-5">
                                        모바일 브라우저나 일부 PC 크롬에서는 자동 재생 방지 정책으로 인해 초기 무음 처리될 수 있습니다. 에뮬레이터 화면을 한번 클릭(터치)하면 사운드가 정상 활성화됩니다.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <h4 className="font-extrabold text-slate-200 flex gap-2">
                                        <span className="text-red-500 font-black">Q.</span>
                                        게임 속도가 너무 느리거나 화면이 찢어집니다.
                                    </h4>
                                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed pl-5">
                                        사용 중인 기기의 브라우저 하드웨어 가속이 꺼져있을 경우 CPU 에뮬레이션 속도가 지연될 수 있습니다. 브라우저 설정에서 하드웨어 가속 사용 설정을 활성화해 주십시오.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <h4 className="font-extrabold text-slate-200 flex gap-2">
                                        <span className="text-red-500 font-black">Q.</span>
                                        클라우드 세이브 데이터 보관 정책은 어떻게 되나요?
                                    </h4>
                                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed pl-5">
                                        저장된 데이터는 회원의 브라우저 세션과 연동되어 있으며, 계정 탈퇴 혹은 에뮬레이터 데이터 강제 해제 전까지 무기한 저장됩니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </MiniAppLayout>
    );
}

// 햅틱 버튼 전용 타입 가드 대응용
type NESButton = 'A' | 'B' | 'START' | 'SELECT' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
