import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MiniAppLayout, useAuth } from '@faithportal/mini-app-sdk';
import axios from 'axios';
import { ShieldAlert, Save, RotateCcw, X, RefreshCw } from 'lucide-react';
import '@faithportal/mini-app-sdk/src/mini-app.css';

const EMULATORJS_CDN = 'https://cdn.emulatorjs.org/stable/data/';

export default function App() {
    const { user, isLoading: isAuthLoading } = useAuth();
    
    const [romLoaded, setRomLoaded] = useState(false);
    const [gameName, setGameName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [saveMessage, setSaveMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingState, setIsLoadingState] = useState(false);
    const [activeTab, setActiveTab] = useState<'play' | 'guide' | 'faq'>('play');

    const emulatorContainerRef = useRef<HTMLDivElement | null>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const romBlobUrlRef = useRef<string | null>(null);

    // cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (romBlobUrlRef.current) {
                URL.revokeObjectURL(romBlobUrlRef.current);
            }
        };
    }, []);

    const initEmulator = useCallback((file: File) => {
        // EmulatorJS를 iframe 내부에서 구동 (React SPA 충돌 방지)
        // iframe은 postMessage로 ROM 바이너리를 수신한 뒤 자체 blob URL을 생성
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body, html { width:100%; height:100%; overflow:hidden; background:#000; }
        #game { width:100%; height:100%; }
    </style>
</head>
<body>
    <div id="game"></div>
    <script>
        window.addEventListener('message', function(e) {
            if (!e.data) return;

            if (e.data.type === 'load-rom') {
                var blob = new Blob([e.data.romData]);
                var url = URL.createObjectURL(blob);

                EJS_player = "#game";
                EJS_core = "snes";
                EJS_gameUrl = url;
                EJS_gameID = e.data.gameName || "sfc-game";
                EJS_language = "en-US";
                EJS_pathtodata = "${EMULATORJS_CDN}";

                var s = document.createElement('script');
                s.src = "${EMULATORJS_CDN}loader.js";
                document.body.appendChild(s);
            }

            if (e.data.type === 'save-state') {
                try {
                    var emu = window.EJS_emulator;
                    if (!emu) { window.parent.postMessage({ type: 'save-state-result', success: false, error: 'EJS_emulator not found' }, '*'); return; }
                    
                    var gm = emu.gameManager;
                    var state = null;
                    
                    // EmulatorJS API 탐색 - 여러 버전 호환
                    if (gm && typeof gm.getState === 'function') {
                        state = gm.getState();
                    } else if (typeof emu.getState === 'function') {
                        state = emu.getState();
                    }
                    
                    if (!state) {
                        var available = gm ? Object.getOwnPropertyNames(Object.getPrototypeOf(gm)).join(', ') : 'no gameManager';
                        window.parent.postMessage({ type: 'save-state-result', success: false, error: 'getState not found. Methods: ' + available }, '*');
                        return;
                    }
                    
                    // Uint8Array → base64 (청크 방식으로 대용량 처리)
                    var bytes = new Uint8Array(state);
                    var CHUNK = 0x8000;
                    var parts = [];
                    for (var i = 0; i < bytes.length; i += CHUNK) {
                        parts.push(String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK)));
                    }
                    var base64 = btoa(parts.join(''));
                    
                    window.parent.postMessage({ type: 'save-state-result', success: true, data: base64, size: bytes.length }, '*');
                } catch(err) {
                    window.parent.postMessage({ type: 'save-state-result', success: false, error: String(err.message || err) }, '*');
                }
            }

            if (e.data.type === 'load-state') {
                try {
                    var emu = window.EJS_emulator;
                    if (!emu) { window.parent.postMessage({ type: 'load-state-result', success: false, error: 'EJS_emulator not found' }, '*'); return; }
                    if (!e.data.stateData) { window.parent.postMessage({ type: 'load-state-result', success: false, error: 'No state data received' }, '*'); return; }
                    
                    // base64 → Uint8Array 복원
                    var binary = atob(e.data.stateData);
                    var bytes = new Uint8Array(binary.length);
                    for (var i = 0; i < binary.length; i++) {
                        bytes[i] = binary.charCodeAt(i);
                    }
                    
                    var gm = emu.gameManager;
                    var loaded = false;
                    
                    // EmulatorJS API 탐색 - 여러 메서드명/인자 타입 시도
                    if (gm) {
                        if (typeof gm.loadState === 'function') {
                            try { gm.loadState(bytes); loaded = true; } catch(e1) {
                                try { gm.loadState(bytes.buffer); loaded = true; } catch(e2) {}
                            }
                        }
                        if (!loaded && typeof gm.setState === 'function') {
                            try { gm.setState(bytes); loaded = true; } catch(e1) {
                                try { gm.setState(bytes.buffer); loaded = true; } catch(e2) {}
                            }
                        }
                    }
                    if (!loaded && typeof emu.loadState === 'function') {
                        try { emu.loadState(bytes); loaded = true; } catch(e1) {
                            try { emu.loadState(bytes.buffer); loaded = true; } catch(e2) {}
                        }
                    }
                    
                    if (loaded) {
                        window.parent.postMessage({ type: 'load-state-result', success: true }, '*');
                    } else {
                        var available = gm ? Object.getOwnPropertyNames(Object.getPrototypeOf(gm)).join(', ') : 'no gameManager';
                        window.parent.postMessage({ type: 'load-state-result', success: false, error: 'loadState/setState not found. Methods: ' + available }, '*');
                    }
                } catch(err) {
                    window.parent.postMessage({ type: 'load-state-result', success: false, error: String(err.message || err) }, '*');
                }
            }
        });
    </script>
</body>
</html>`;

        const htmlBlob = new Blob([html], { type: 'text/html' });
        const iframeUrl = URL.createObjectURL(htmlBlob);

        if (iframeRef.current) {
            const iframe = iframeRef.current;
            iframe.onload = () => {
                // ROM 파일을 ArrayBuffer로 읽어서 iframe에 전송
                const reader = new FileReader();
                reader.onload = (re) => {
                    const arrayBuffer = re.target?.result as ArrayBuffer;
                    if (arrayBuffer && iframe.contentWindow) {
                        iframe.contentWindow.postMessage(
                            { type: 'load-rom', romData: arrayBuffer, gameName: file.name.replace(/\.[^.]+$/, '') },
                            '*',
                            [arrayBuffer]  // transferable - 복사 없이 소유권 이전
                        );
                    }
                };
                reader.readAsArrayBuffer(file);
            };
            iframe.src = iframeUrl;
        }
    }, []);

    // ROM 파일 업로드 처리
    const handleRomUpload = (file: File) => {
        const ext = file.name.toLowerCase();
        if (!ext.endsWith('.sfc') && !ext.endsWith('.smc') && !ext.endsWith('.fig') && !ext.endsWith('.swc')) {
            setErrorMessage('올바른 SNES ROM 파일이 아닙니다. (.sfc, .smc, .fig, .swc 확장자만 지원)');
            return;
        }
        setErrorMessage('');
        setGameName(file.name);

        try {
            initEmulator(file);
            setRomLoaded(true);
        } catch (err: any) {
            console.error('[SFC] ROM 로딩 에러:', err);
            setErrorMessage(`에뮬레이터 초기화 실패: ${err?.message || '알 수 없는 오류'}`);
        }
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

    // 게임 종료
    const handleExit = () => {
        if (iframeRef.current) {
            iframeRef.current.src = 'about:blank';
        }
        if (romBlobUrlRef.current) {
            URL.revokeObjectURL(romBlobUrlRef.current);
            romBlobUrlRef.current = null;
        }
        setRomLoaded(false);
        setGameName('');
        setSaveMessage('');
    };

    // iframe으로부터 postMessage 응답을 Promise로 받는 헬퍼
    const waitForIframeResponse = (type: string, timeoutMs = 5000): Promise<any> => {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                window.removeEventListener('message', handler);
                reject(new Error('응답 시간 초과'));
            }, timeoutMs);

            function handler(e: MessageEvent) {
                if (e.data && e.data.type === type) {
                    clearTimeout(timer);
                    window.removeEventListener('message', handler);
                    resolve(e.data);
                }
            }
            window.addEventListener('message', handler);
        });
    };

    // 클라우드 세이브 - EmulatorJS에서 실제 세이브 상태를 추출하여 서버에 저장
    const handleCloudSave = async () => {
        if (!user || !gameName) return;
        setIsSaving(true);
        setSaveMessage('');
        try {
            // 1. iframe에 세이브 상태 요청
            iframeRef.current?.contentWindow?.postMessage({ type: 'save-state' }, '*');
            
            // 2. iframe 응답 대기
            const response = await waitForIframeResponse('save-state-result');
            
            if (!response.success) {
                setSaveMessage('세이브 실패: ' + (response.error || '에뮬레이터가 준비되지 않았습니다.'));
                return;
            }

            // 3. 서버에 저장
            await axios.post('/api/sfc/save', {
                gameName,
                saveData: response.data,  // base64 인코딩된 세이브 상태
            }, { withCredentials: true });

            setSaveMessage('✅ 클라우드 세이브 완료!');
        } catch (e: any) {
            setSaveMessage('세이브 중 오류: ' + (e.message || '알 수 없는 오류'));
        } finally {
            setIsSaving(false);
        }
    };

    // 클라우드 로드 - 서버에서 세이브 상태를 받아 EmulatorJS에 주입
    const handleCloudLoad = async () => {
        if (!user || !gameName) return;
        setIsLoadingState(true);
        setSaveMessage('');
        try {
            // 1. 서버에서 세이브 데이터 로드
            const { data } = await axios.get(`/api/sfc/load?gameName=${encodeURIComponent(gameName)}`, { withCredentials: true });
            
            if (!data.success || !data.data?.saveData) {
                setSaveMessage('저장된 세이브 파일이 존재하지 않습니다.');
                return;
            }

            // 2. iframe에 로드 상태 전송
            iframeRef.current?.contentWindow?.postMessage({ 
                type: 'load-state', 
                stateData: data.data.saveData  // base64 인코딩된 세이브 상태
            }, '*');

            // 3. iframe 응답 대기
            const response = await waitForIframeResponse('load-state-result');

            if (response.success) {
                setSaveMessage('✅ 클라우드 세이브를 불러왔습니다!');
            } else {
                setSaveMessage('로드 실패: ' + (response.error || '알 수 없는 오류'));
            }
        } catch (e: any) {
            if (e.response?.status === 404) {
                setSaveMessage('저장된 세이브 파일이 존재하지 않습니다.');
            } else {
                setSaveMessage('로드 중 오류: ' + (e.message || '알 수 없는 오류'));
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
        <MiniAppLayout title="베라 슈퍼컴보이">
            <div className="bg-neutral-900 min-h-screen text-slate-100 flex flex-col font-sans select-none">
                
                {/* 탭 네비게이션 */}
                <div className="flex bg-neutral-950 border-b border-neutral-800">
                    <button 
                        onClick={() => setActiveTab('play')}
                        className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'play' ? 'border-indigo-500 text-slate-50' : 'border-transparent text-neutral-500'
                        }`}
                    >
                        아케이드 플레이
                    </button>
                    <button 
                        onClick={() => setActiveTab('guide')}
                        className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'guide' ? 'border-indigo-500 text-slate-50' : 'border-transparent text-neutral-500'
                        }`}
                    >
                        사용 방법
                    </button>
                    <button 
                        onClick={() => setActiveTab('faq')}
                        className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'faq' ? 'border-indigo-500 text-slate-50' : 'border-transparent text-neutral-500'
                        }`}
                    >
                        자주 묻는 질문
                    </button>
                </div>

                {/* 탭 콘텐츠 영역 */}
                <div className="flex-1 overflow-y-auto pb-6">
                    {activeTab === 'play' && (
                        <div className="p-4 flex flex-col items-center">
                            
                            {/* 드롭존 */}
                            <div style={{ display: romLoaded ? 'none' : undefined }} className="w-full max-w-md mt-6 flex flex-col gap-6">
                                <label 
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    className="h-64 border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-2xl flex flex-col items-center justify-center bg-neutral-950 p-6 text-center cursor-pointer transition-all hover:bg-neutral-900/50"
                                >
                                    <input 
                                        type="file" 
                                        accept=".sfc,.smc,.fig,.swc" 
                                        onChange={handleFileInputChange} 
                                        className="hidden" 
                                    />
                                    <i className="fas fa-file-arrow-up text-5xl text-neutral-600 mb-4 animate-bounce"></i>
                                    <h3 className="font-extrabold text-lg text-slate-200">SNES 롬파일 드래그 & 드롭</h3>
                                    <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                                        이곳에 .sfc / .smc 카트리지 파일을 끌어다 놓거나 클릭하여 로컬 기기에서 선택해 주세요.
                                    </p>
                                </label>

                                {errorMessage && (
                                    <div className="bg-red-950 border border-red-800 text-red-400 p-3.5 rounded-xl text-xs text-center font-medium">
                                        {errorMessage}
                                    </div>
                                )}

                                {/* 보안 경고 약관 */}
                                <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 shadow-sm">
                                    <div className="flex gap-2.5 items-start mb-3 text-indigo-400">
                                        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                                        <h4 className="font-bold text-sm">보안 및 개인소장 파일 사용 약관</h4>
                                    </div>
                                    <div className="text-[11px] text-neutral-400 leading-relaxed space-y-3 font-sans">
                                        <p>
                                            <strong>[국문]</strong> Vera Super Comboy는 브라우저 내부 가상 에뮬레이터 엔진만 제공하며, 어떠한 ROM 파일도 서버에 보관하거나 배포하지 않습니다. 유저가 적법하게 개인 소장한 파일만 안전하게 로컬 메모리(Web Sandbox)에서 100% 구동됩니다.
                                        </p>
                                        <p>
                                            <strong>[English]</strong> Vera Super Comboy only provides a client-side emulation engine. We do not host or distribute any game ROMs. Files are executed 100% inside your local browser memory.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 에뮬레이터 구동 영역 - 항상 DOM에 존재 */}
                            <div style={{ display: romLoaded ? undefined : 'none' }} className="w-full max-w-2xl mt-2 flex flex-col items-center">
                                
                                {/* 상단 컨트롤 헤더 */}
                                <div className="w-full flex items-center justify-between bg-neutral-950 px-4 py-2.5 rounded-t-2xl border-t border-x border-neutral-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                        <span className="text-xs font-bold text-neutral-300 truncate max-w-[160px] sm:max-w-[280px]">
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
                                            onClick={handleExit}
                                            className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-950/60 active:scale-95 transition-all cursor-pointer"
                                            title="게임 종료"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* 에뮬레이터 iframe */}
                                <div className="w-full aspect-[4/3] bg-black border-x border-b border-neutral-800 shadow-2xl relative" ref={emulatorContainerRef}>
                                    <iframe
                                        ref={iframeRef}
                                        className="w-full h-full border-0"
                                        allow="gamepad; autoplay; fullscreen"
                                        title="SNES Emulator"
                                    />
                                </div>

                                {/* 세이브/로드 알림 */}
                                {saveMessage && (
                                    <div className="w-full mt-3 bg-neutral-950 border border-neutral-800 text-[11px] font-bold text-center text-slate-300 py-2 px-3 rounded-xl">
                                        {saveMessage}
                                    </div>
                                )}

                                {/* EmulatorJS 안내 */}
                                <div className="w-full mt-3 bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-center text-indigo-300 py-2 px-3 rounded-xl">
                                    💡 EmulatorJS 내장 UI: 화면 하단 메뉴에서 Save/Load State, 전체화면, 게임패드 설정 등을 이용하세요.
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'guide' && (
                        <div className="p-5 max-w-md mx-auto font-sans leading-relaxed text-sm text-neutral-300 space-y-4">
                            <h3 className="text-base font-extrabold text-slate-100 border-b border-neutral-800 pb-2 flex items-center gap-2">
                                <i className="fas fa-circle-info text-indigo-500"></i>
                                베라 슈퍼컴보이 이용법
                            </h3>
                            <div className="space-y-3">
                                <p>
                                    <strong className="text-slate-200">1. ROM 파일 준비</strong><br />
                                    개인 소장 중인 .sfc 또는 .smc 확장자의 슈퍼패미콤/SNES 카트리지 이미지 파일을 준비합니다.
                                </p>
                                <p>
                                    <strong className="text-slate-200">2. 파일 업로드</strong><br />
                                    플레이 탭의 드롭존에 파일을 끌어다 놓거나, 클릭하여 직접 선택합니다.
                                </p>
                                <p>
                                    <strong className="text-slate-200">3. 게임 플레이</strong><br />
                                    EmulatorJS(Snes9x 코어 기반)가 자동으로 ROM을 로드하여 즉시 플레이가 시작됩니다.
                                </p>
                                <p>
                                    <strong className="text-slate-200">4. Save/Load State</strong><br />
                                    에뮬레이터 화면 하단 메뉴 바에서 Save State / Load State 기능을 사용할 수 있습니다.
                                </p>
                            </div>

                            <h3 className="text-base font-extrabold text-slate-100 border-b border-neutral-800 pb-2 mt-6 flex items-center gap-2">
                                <i className="fas fa-keyboard text-indigo-500"></i>
                                키보드 조작법
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400">
                                <div>
                                    <span className="font-bold text-slate-300 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 font-mono mr-1">← → ↑ ↓</span>
                                    방향키
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
                                    <span className="font-bold text-slate-300 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 font-mono mr-1">A</span>
                                    X 버튼
                                </div>
                                <div>
                                    <span className="font-bold text-slate-300 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 font-mono mr-1">Y</span>
                                    Y 버튼
                                </div>
                                <div>
                                    <span className="font-bold text-slate-300 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 font-mono mr-1">Q / W</span>
                                    L / R 버튼
                                </div>
                                <div>
                                    <span className="font-bold text-slate-300 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 font-mono mr-1">Shift</span>
                                    Select
                                </div>
                                <div>
                                    <span className="font-bold text-slate-300 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 font-mono mr-1">Enter</span>
                                    Start
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'faq' && (
                        <div className="p-5 max-w-md mx-auto font-sans leading-relaxed text-sm text-neutral-300 space-y-5">
                            <h3 className="text-base font-extrabold text-slate-100 border-b border-neutral-800 pb-2">
                                자주 묻는 질문 (FAQ)
                            </h3>
                            <div>
                                <p className="font-bold text-slate-200 mb-1">Q. ROM 파일은 어디서 구하나요?</p>
                                <p className="text-xs text-neutral-400">합법적으로 개인이 소유한 카트리지의 백업 파일만 사용하셔야 합니다. 본 서비스는 ROM을 제공하지 않습니다.</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-200 mb-1">Q. 어떤 파일 형식을 지원하나요?</p>
                                <p className="text-xs text-neutral-400">.sfc, .smc, .fig, .swc 확장자의 SNES/슈퍼패미콤 ROM 파일을 지원합니다.</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-200 mb-1">Q. 게임패드를 사용할 수 있나요?</p>
                                <p className="text-xs text-neutral-400">네, EmulatorJS가 브라우저 Gamepad API를 지원합니다. USB 또는 블루투스 게임패드를 연결하면 자동 감지됩니다.</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-200 mb-1">Q. 모바일에서도 작동하나요?</p>
                                <p className="text-xs text-neutral-400">네, EmulatorJS가 모바일 환경에서 자동으로 터치 컨트롤러를 표시합니다.</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-200 mb-1">Q. 세이브가 되나요?</p>
                                <p className="text-xs text-neutral-400">EmulatorJS 내장 Save State 기능으로 브라우저 로컬 저장소에 세이브할 수 있습니다. 에뮬레이터 하단 메뉴를 이용하세요.</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </MiniAppLayout>
    );
}
