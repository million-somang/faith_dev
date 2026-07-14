import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MiniAppLayout, useAuth } from '@faithportal/mini-app-sdk';
import axios from 'axios';
import { ShieldAlert, Save, RotateCcw, X, RefreshCw, Copy, Check } from 'lucide-react';
import '@faithportal/mini-app-sdk/src/mini-app.css';



export interface CachedRom {
    name: string;
    type: 'nes' | 'sfc';
    data: string | ArrayBuffer | Blob;
    lastPlayed: number;
}

const DB_NAME = 'RomCacheDB';
const DB_VERSION = 1;
const STORE_NAME = 'roms';

export function openRomDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'name' });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('lastPlayed', 'lastPlayed', { unique: false });
            }
        };
    });
}

export function saveRomToDB(name: string, type: 'nes' | 'sfc', data: string | ArrayBuffer | Blob): Promise<void> {
    return openRomDB().then((db) => {
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            let savedData = data;
            if (data instanceof ArrayBuffer) {
                savedData = new Blob([data], { type: 'application/octet-stream' });
            }
            const romRecord: CachedRom = {
                name,
                type,
                data: savedData,
                lastPlayed: Date.now()
            };
            const request = store.put(romRecord);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    });
}

export function getRecentRoms(type: 'nes' | 'sfc'): Promise<CachedRom[]> {
    return openRomDB().then((db) => {
        return new Promise<CachedRom[]>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const typeIndex = store.index('type');
            const request = typeIndex.getAll(type);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const results = request.result as CachedRom[];
                results.sort((a, b) => b.lastPlayed - a.lastPlayed);
                resolve(results);
            };
        });
    });
}

export function deleteRomFromDB(name: string): Promise<void> {
    return openRomDB().then((db) => {
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(name);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    });
}

function getArrayBuffer(data: unknown): ArrayBuffer {
    if (data instanceof ArrayBuffer) {
        return data.slice(0);
    }
    if (ArrayBuffer.isView(data)) {
        return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }
    if (Array.isArray(data)) {
        return new Uint8Array(data).buffer;
    }
    if (typeof data === 'string') {
        const len = data.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = data.charCodeAt(i);
        }
        return bytes.buffer;
    }
    return new ArrayBuffer(0);
}

export default function App() {
    const { user, isLoading: isAuthLoading } = useAuth();
    
    const [romLoaded, setRomLoaded] = useState(false);
    const [gameName, setGameName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [saveMessage, setSaveMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingState, setIsLoadingState] = useState(false);
    const [activeTab, setActiveTab] = useState<'play' | 'guide' | 'faq'>('play');
    const [recentRoms, setRecentRoms] = useState<CachedRom[]>([]);
    const [webglSupported, setWebglSupported] = useState(true);
    const [copiedText, setCopiedText] = useState('');

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopiedText(text);
                setTimeout(() => setCopiedText(''), 2000);
            })
            .catch((err) => {
                console.error('클립보드 복사 실패:', err);
            });
    };

    const loadRecentRoms = () => {
        getRecentRoms('sfc')
            .then((roms) => {
                setRecentRoms(roms);
            })
            .catch((err) => {
                console.error('[IndexedDB] 최근 롬 로드 실패:', err);
            });
    };

    useEffect(() => {
        loadRecentRoms();
    }, []);

    const emulatorContainerRef = useRef<HTMLDivElement | null>(null);
    const gameContainerRef = useRef<HTMLDivElement | null>(null);
    const loaderScriptRef = useRef<HTMLScriptElement | null>(null);

    const EMULATORJS_CDN = 'https://cdn.emulatorjs.org/stable/data/';

    // 에뮬레이터 초기화 - iframe 없이 직접 페이지에 로드
    const initEmulator = useCallback((fileOrBuffer: File | ArrayBuffer, fileName?: string) => {
        // 이전 에뮬레이터 인스턴스 정리
        if ((window as any).EJS_emulator) {
            try { (window as any).EJS_emulator.callEvent('exit'); } catch (_) {}
        }
        // 이전 loader script 제거
        if (loaderScriptRef.current) {
            loaderScriptRef.current.remove();
            loaderScriptRef.current = null;
        }
        // game div 초기화
        if (gameContainerRef.current) {
            gameContainerRef.current.innerHTML = '';
        }

        // WebGL 지원 상태 초기화
        setWebglSupported(true);

        const doInit = (arrayBuffer: ArrayBuffer, name: string) => {
            const romBlob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
            const romUrl = URL.createObjectURL(romBlob);

            // WebGL 선제적 진단
            const testCanvas = document.createElement('canvas');
            const gl2 = testCanvas.getContext('webgl2');
            const gl1 = gl2 ? null : testCanvas.getContext('webgl');
            const gl = gl2 || gl1;

            if (!gl) {
                console.warn('[SFC] WebGL context is disabled. Aborting EmulatorJS injection.');
                setWebglSupported(false);
                return; // ⛔ 스크립트를 로드하지 않고 중단하여 크래시 방지
            }

            // EmulatorJS 전역 설정
            (window as any).EJS_player = '#ejs-game';
            (window as any).EJS_core = 'snes';
            (window as any).EJS_gameUrl = romUrl;
            (window as any).EJS_gameID = name.replace(/[^a-zA-Z0-9]/g, '_');
            (window as any).EJS_gameName = name;
            (window as any).EJS_language = 'en-US';
            (window as any).EJS_pathtodata = EMULATORJS_CDN;
            (window as any).EJS_startOnLoaded = true;

            // 브라우저 reflow 후 로드
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const script = document.createElement('script');
                    script.src = EMULATORJS_CDN + 'loader.js';
                    loaderScriptRef.current = script;
                    document.body.appendChild(script);
                });
            });
        };

        if (fileOrBuffer instanceof ArrayBuffer) {
            doInit(fileOrBuffer.slice(0), fileName || 'sfc-game');
        } else {
            const reader = new FileReader();
            reader.onload = (re) => {
                const arrayBuffer = re.target?.result as ArrayBuffer;
                if (arrayBuffer) {
                    doInit(arrayBuffer, fileOrBuffer.name.replace(/\.[^.]+$/, ''));
                }
            };
            reader.readAsArrayBuffer(fileOrBuffer);
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
            setRomLoaded(true);  // 컨테이너를 먼저 보이게 한 뒤
            initEmulator(file);  // EmulatorJS 로드 (내부에서 reflow 대기 후 실행)

            // IndexedDB에 백그라운드 저장
            const reader = new FileReader();
            reader.onload = (e) => {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                if (arrayBuffer) {
                    saveRomToDB(file.name, 'sfc', arrayBuffer)
                        .then(() => loadRecentRoms())
                        .catch((dbErr) => console.error('[IndexedDB] SFC ROM 저장 실패:', dbErr));
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (err) {
            const errorObj = err as Error;
            console.error('[SFC] ROM 로딩 에러:', errorObj);
            setErrorMessage(`에뮬레이터 초기화 실패: ${errorObj.message || '알 수 없는 오류'}`);
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
        // EmulatorJS 인스턴스 정리
        if ((window as any).EJS_emulator) {
            try { (window as any).EJS_emulator.callEvent('exit'); } catch (_) {}
        }
        // loader script 제거
        if (loaderScriptRef.current) {
            loaderScriptRef.current.remove();
            loaderScriptRef.current = null;
        }
        // game div 초기화
        if (gameContainerRef.current) {
            gameContainerRef.current.innerHTML = '';
        }
        // 전역 EJS 변수 정리
        delete (window as any).EJS_player;
        delete (window as any).EJS_core;
        delete (window as any).EJS_gameUrl;
        delete (window as any).EJS_emulator;
        delete (window as any).EJS_startOnLoaded;

        setRomLoaded(false);
        setGameName('');
        setSaveMessage('');
    };

    // 클라우드 세이브 - EJS_emulator API 직접 호출
    const handleCloudSave = async () => {
        if (!user || !gameName) return;
        setIsSaving(true);
        setSaveMessage('');
        try {
            const emu = (window as any).EJS_emulator;
            if (!emu) {
                setSaveMessage('세이브 실패: 에뮬레이터가 준비되지 않았습니다.');
                return;
            }

            const gm = emu.gameManager;
            let state = null;
            if (gm && typeof gm.getState === 'function') {
                state = gm.getState();
            } else if (typeof emu.getState === 'function') {
                state = emu.getState();
            }

            if (!state) {
                setSaveMessage('세이브 실패: getState를 찾을 수 없습니다.');
                return;
            }

            // Uint8Array → base64
            const bytes = new Uint8Array(state);
            const CHUNK = 0x8000;
            const parts: string[] = [];
            for (let i = 0; i < bytes.length; i += CHUNK) {
                parts.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK))));
            }
            const base64 = btoa(parts.join(''));

            await axios.post('/api/sfc/save', {
                gameName,
                saveData: base64,
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
            const { data } = await axios.get(`/api/sfc/load?gameName=${encodeURIComponent(gameName)}`, { withCredentials: true });
            
            if (!data.success || !data.data?.saveData) {
                setSaveMessage('저장된 세이브 파일이 존재하지 않습니다.');
                return;
            }

            const emu = (window as any).EJS_emulator;
            if (!emu) {
                setSaveMessage('로드 실패: 에뮬레이터가 준비되지 않았습니다.');
                return;
            }

            // base64 → Uint8Array
            const binary = atob(data.data.saveData);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }

            const gm = emu.gameManager;
            let loaded = false;
            if (gm) {
                if (typeof gm.loadState === 'function') {
                    try { gm.loadState(bytes); loaded = true; } catch (_) {
                        try { gm.loadState(bytes.buffer); loaded = true; } catch (_2) {}
                    }
                }
                if (!loaded && typeof gm.setState === 'function') {
                    try { gm.setState(bytes); loaded = true; } catch (_) {
                        try { gm.setState(bytes.buffer); loaded = true; } catch (_2) {}
                    }
                }
            }
            if (!loaded && typeof emu.loadState === 'function') {
                try { emu.loadState(bytes); loaded = true; } catch (_) {
                    try { emu.loadState(bytes.buffer); loaded = true; } catch (_2) {}
                }
            }

            if (loaded) {
                setSaveMessage('✅ 클라우드 세이브를 불러왔습니다!');
            } else {
                setSaveMessage('로드 실패: loadState를 찾을 수 없습니다.');
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

                                {recentRoms.length > 0 && (
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                                        <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                                            <i className="fas fa-history text-indigo-500"></i>
                                            최근 플레이한 SFC 게임
                                        </h4>
                                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                                            {recentRoms.slice(0, 5).map((rom) => (
                                                <div 
                                                    key={rom.name} 
                                                    onClick={() => {
                                                        try {
                                                            if (rom.data instanceof Blob) {
                                                                const reader = new FileReader();
                                                                reader.onload = (re) => {
                                                                    const arrayBuffer = re.target?.result as ArrayBuffer;
                                                                    if (arrayBuffer) {
                                                                        setGameName(rom.name);
                                                                        setRomLoaded(true);
                                                                        initEmulator(arrayBuffer, rom.name);
                                                                        saveRomToDB(rom.name, 'sfc', rom.data)
                                                                            .then(() => loadRecentRoms())
                                                                            .catch((err) => console.error(err));
                                                                    }
                                                                };
                                                                reader.readAsArrayBuffer(rom.data);
                                                            } else {
                                                                const romBuffer = getArrayBuffer(rom.data);
                                                                setGameName(rom.name);
                                                                setRomLoaded(true);
                                                                initEmulator(romBuffer, rom.name);
                                                                saveRomToDB(rom.name, 'sfc', romBuffer)
                                                                    .then(() => loadRecentRoms())
                                                                    .catch((err) => console.error(err));
                                                            }
                                                        } catch (err) {
                                                            const errorObj = err as Error;
                                                            console.error('[SFC] 캐시 롬 로딩 에러:', errorObj);
                                                            setErrorMessage(`에뮬레이터 초기화 실패: ${errorObj.message || '알 수 없는 오류'}`);
                                                        }
                                                    }}
                                                    className="flex items-center justify-between bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl p-3 transition-all cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <i className="fas fa-gamepad text-neutral-500 group-hover:text-indigo-500 transition-colors"></i>
                                                        <span className="text-xs font-semibold text-slate-300 truncate max-w-[200px]">
                                                            {rom.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-[10px] text-neutral-500">
                                                            {new Date(rom.lastPlayed).toLocaleDateString()}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteRomFromDB(rom.name)
                                                                        .then(() => loadRecentRoms())
                                                                        .catch((err) => console.error('[IndexedDB] 롬 삭제 실패:', err));
                                                            }}
                                                            className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-red-950/20 active:scale-95 transition-all"
                                                            title="삭제"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

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

                                {/* 에뮬레이터 게임 영역 - iframe 없이 직접 렌더링 */}
                                <div className="w-full aspect-[4/3] bg-black border-x border-b border-neutral-800 shadow-2xl relative" ref={emulatorContainerRef}>
                                    {!webglSupported ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-neutral-950/95 text-center font-sans">
                                            <ShieldAlert className="w-12 h-12 text-rose-500 mb-3 animate-pulse" />
                                            <h4 className="text-sm font-extrabold text-slate-100 mb-2">하드웨어 가속(WebGL) 활성화 필요</h4>
                                            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed mb-4">
                                                슈퍼컴보이 에뮬레이터 구동을 위해서는 브라우저의 3D 그래픽(WebGL) 가속 기능이 반드시 켜져 있어야 합니다.
                                            </p>
                                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-left text-[11px] text-neutral-300 max-w-sm space-y-3.5 leading-relaxed overflow-y-auto max-h-[220px]">
                                                {/* 방법 1 */}
                                                <div className="flex gap-1.5 items-start">
                                                    <span className="text-indigo-400 font-bold mt-0.5">방법 A.</span>
                                                    <div className="flex flex-col gap-1 w-full">
                                                        <span>크롬 설정에서 가속 활성화:</span>
                                                        <button
                                                            onClick={() => handleCopy('chrome://settings/system')}
                                                            className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 active:scale-95 border border-neutral-700 text-slate-100 font-mono text-[9px] w-full text-left transition-all cursor-pointer group"
                                                        >
                                                            <span className="truncate">chrome://settings/system</span>
                                                            {copiedText === 'chrome://settings/system' ? (
                                                                <span className="text-emerald-400 flex items-center gap-0.5 font-bold shrink-0">
                                                                    <Check className="w-3 h-3" /> 복사됨
                                                                </span>
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-400 shrink-0 transition-colors" />
                                                            )}
                                                        </button>
                                                        <span><strong>'가능한 경우 그래픽 가속 사용'</strong> 옵션을 활성화하고 브라우저 재시작</span>
                                                    </div>
                                                </div>

                                                <hr className="border-neutral-850" />

                                                <div className="flex gap-1.5 items-start">
                                                    <span className="text-indigo-400 font-bold mt-0.5">방법 B.</span>
                                                    <div className="flex flex-col gap-1 w-full">
                                                        <span className="text-amber-400 font-semibold">설정이 이미 켜져 있는데도 안 될 때:</span>
                                                        <span>블랙리스트 우회 설정 주소 복사:</span>
                                                        <button
                                                            onClick={() => handleCopy('chrome://flags')}
                                                            className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-750 active:scale-95 border border-neutral-700 text-slate-100 font-mono text-[9px] w-full text-left transition-all cursor-pointer group"
                                                        >
                                                            <span className="truncate">chrome://flags</span>
                                                            {copiedText === 'chrome://flags' ? (
                                                                <span className="text-emerald-400 flex items-center gap-0.5 font-bold shrink-0">
                                                                    <Check className="w-3 h-3" /> 복사됨
                                                                </span>
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-400 shrink-0 transition-colors" />
                                                            )}
                                                        </button>
                                                        <span>검색창에 <code className="bg-neutral-800 text-slate-200 px-1 rounded">Override software rendering list</code> 입력 후 <strong>Enabled</strong>로 변경 후 재시작</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            id="ejs-game"
                                            ref={gameContainerRef}
                                            className="w-full h-full"
                                        />
                                    )}
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
