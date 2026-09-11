import React, { useState, useEffect, useCallback } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import type { ActiveTab, ViewMode, ImageFileItem, ConversionSettings } from './types/index';
import { convertImageToWebP } from './utils/webpConverter';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import DropZone from './components/DropZone';
import SettingsBar from './components/SettingsBar';
import ResultReport from './components/ResultReport';
import HowToGuide from './components/HowToGuide';
import FaqSection from './components/FaqSection';

// ── SEO 메타데이터 동적 주입 ──
function PageSEO() {
    useEffect(() => {
        document.title = 'WebP 이미지 변환기 & 무손실 압축기 (2026 웹 표준) | FaithPortal';
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute(
            'content',
            'JPG, PNG 이미지를 차세대 포맷인 WebP로 변환하고 용량을 최대 80% 무손실 압축. 서버 전송 없는 100% 로컬 보안 보장.'
        );
    }, []);
    return null;
}

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('converter');
    const [viewMode, setViewMode] = useState<ViewMode>('input');

    const [items, setItems] = useState<ImageFileItem[]>([]);
    const [settings, setSettings] = useState<ConversionSettings>({
        quality: 0.8,
        maxWidth: 0,
        lossless: false,
    });
    const [isConverting, setIsConverting] = useState(false);

    // ⏳ 3초 필수 로딩 스크린 (디자인 스펙 준수)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    // 파일 선택 처리
    const handleFilesSelected = useCallback((files: File[]) => {
        const newItems: ImageFileItem[] = files.map((file) => ({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            file,
            name: file.name,
            originalSize: file.size,
            previewUrl: URL.createObjectURL(file),
            status: 'idle',
        }));

        setItems((prev) => [...prev, ...newItems]);
    }, []);

    // 아이템 삭제
    const handleRemoveItem = useCallback((id: string) => {
        setItems((prev) => {
            const target = prev.find((item) => item.id === id);
            if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
            if (target?.convertedUrl) URL.revokeObjectURL(target.convertedUrl);
            return prev.filter((item) => item.id !== id);
        });
    }, []);

    // 원클릭 샘플 이미지 생성 및 로드 (마케팅 캡처 및 즉시 테스트 지원)
    const handleLoadSample = useCallback(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 화려한 그라데이션 샘플 그래픽 생성
        const grad = ctx.createLinearGradient(0, 0, 1200, 800);
        grad.addColorStop(0, '#4f46e5');
        grad.addColorStop(0.5, '#06b6d4');
        grad.addColorStop(1, '#10b981');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 800);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 54px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FaithPortal High-Resolution Sample', 600, 380);
        ctx.font = '32px sans-serif';
        ctx.fillText('WebP Conversion & 80% Lossless Compression', 600, 450);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], 'sample_banner_high_res.png', { type: 'image/png' });
            handleFilesSelected([file]);
        }, 'image/png');
    }, [handleFilesSelected]);

    // 전체 이미지 변환 실행
    const handleConvert = async () => {
        if (items.length === 0) {
            handleLoadSample();
            return;
        }

        setIsConverting(true);

        const updated = await Promise.all(
            items.map(async (item) => {
                try {
                    const res = await convertImageToWebP(item.file, settings);
                    const convertedUrl = URL.createObjectURL(res.blob);
                    return {
                        ...item,
                        status: 'done' as const,
                        convertedBlob: res.blob,
                        convertedUrl,
                        convertedSize: res.size,
                        convertedDimensions: { width: res.width, height: res.height },
                        reductionPercent: res.reductionPercent,
                    };
                } catch (err: any) {
                    return {
                        ...item,
                        status: 'error' as const,
                        errorMessage: err.message || '변환 실패',
                    };
                }
            })
        );

        setItems(updated);
        setIsConverting(false);
        setViewMode('result');
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    // 재설정
    const handleResetAll = () => {
        items.forEach((item) => {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
            if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
        });
        setItems([]);
        setViewMode('input');
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    if (isLoading) {
        return (
            <MiniAppLayout title="">
                <PageSEO />
                <SplashScreen />
            </MiniAppLayout>
        );
    }

    return (
        <MiniAppLayout title="">
            <PageSEO />
            <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-8 antialiased">
                <Header activeTab={activeTab} setActiveTab={setActiveTab} />

                <main className="p-3 sm:p-4 flex-1">
                    {activeTab === 'converter' && (
                        <>
                            {viewMode === 'input' ? (
                                <div className="min-h-[calc(850px-140px)] flex flex-col justify-between space-y-4 animate-fade-in">
                                    <div className="space-y-4">
                                        {/* 상단 안내 배너 */}
                                        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border border-indigo-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                                <i className="fas fa-shield-alt text-xs"></i>
                                            </div>
                                            <div className="text-xs text-slate-700 leading-relaxed text-left">
                                                <p className="font-extrabold text-indigo-950 mb-0.5">
                                                    서버 전송 없는 100% 로컬 메모리 처리
                                                </p>
                                                <p className="text-slate-600 text-[11px]">
                                                    JPG, PNG 이미지를 차세대 <strong>WebP</strong>로 변환하여 화질 저하 없이 <strong>용량을 최대 80% 절감</strong>합니다.
                                                </p>
                                            </div>
                                        </div>

                                        {/* 파일 드롭존 */}
                                        <DropZone
                                            items={items}
                                            onFilesSelected={handleFilesSelected}
                                            onRemoveItem={handleRemoveItem}
                                            onLoadSample={handleLoadSample}
                                        />

                                        {/* 압축 및 리사이즈 설정 패널 */}
                                        <SettingsBar
                                            settings={settings}
                                            onChangeSettings={setSettings}
                                            onConvert={handleConvert}
                                            isConverting={isConverting}
                                            disabled={items.length === 0}
                                        />

                                        {/* 850px 화면 가득 채우는 포맷 비교 & 장점 카드 (하단 빈칸 제로) */}
                                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2 text-left">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                                <i className="fas fa-check-circle text-emerald-500"></i>
                                                <span>WebP 포맷 비교 및 기대 효과</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                    <div className="text-[10px] font-bold text-slate-400">JPEG 대비</div>
                                                    <div className="text-xs font-black text-indigo-600">35% 경량화</div>
                                                </div>
                                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                    <div className="text-[10px] font-bold text-slate-400">PNG 대비</div>
                                                    <div className="text-xs font-black text-emerald-600">80% 경량화</div>
                                                </div>
                                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                    <div className="text-[10px] font-bold text-slate-400">알파 채널</div>
                                                    <div className="text-xs font-black text-blue-600">투명도 완벽유지</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 하단 푸터 안내 */}
                                    <div className="pt-2 text-center">
                                        <p className="text-[11px] text-slate-400">
                                            2026 W3C 웹 그래픽스 표준 권고안 준수 · HTML5 Canvas 2D
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <ResultReport
                                    items={items}
                                    onBackToInput={() => {
                                        setViewMode('input');
                                        window.scrollTo({ top: 0, behavior: 'instant' });
                                    }}
                                    onResetAll={handleResetAll}
                                />
                            )}
                        </>
                    )}

                    {activeTab === 'howto' && <HowToGuide />}
                    {activeTab === 'faq' && <FaqSection />}
                </main>
            </div>
        </MiniAppLayout>
    );
}
