import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PROVINCES, KOREA_MAP_VIEWBOX, ProvinceMeta } from './koreaMapData';

export interface TravelSpot {
    id: number;
    title: string;
    destination: string;
    region: string;
    category: string;
    summary?: string | null;
    ai_summary?: string | null;
    thumbnail?: string | null;
    location_address?: string | null;
    metadata?: any;
}

interface InteractiveKoreaMapProps {
    articles: TravelSpot[];
    selectedProvince: string | null;
    selectedCity: string | null;
    onSelectLocation: (province: string | null, city: string | null) => void;
}

// 7대 대표 권역 그룹 정의 (상단 퀵 바용)
const REGION_GROUPS = [
    { label: '전국', id: 'all' },
    { label: '수도권', id: 'gyeonggi', provNames: ['서울특별시', '경기도', '인천광역시'] },
    { label: '강원권', id: 'gangwon', provNames: ['강원특별자치도'] },
    { label: '충청권', id: 'chungcheong', provNames: ['충청북도', '충청남도', '대전광역시', '세종특별자치시'] },
    { label: '호남권', id: 'honam', provNames: ['전북특별자치도', '전라남도', '광주광역시'] },
    { label: '영남권', id: 'yeongnam', provNames: ['경상북도', '경상남도', '대구광역시', '부산광역시', '울산광역시'] },
    { label: '제주권', id: 'jeju', provNames: ['제주특별자치도'] },
];

export default function InteractiveKoreaMap({
    articles,
    selectedProvince,
    selectedCity,
    onSelectLocation
}: InteractiveKoreaMapProps) {
    const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
    const [selectedSpot, setSelectedSpot] = useState<TravelSpot | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isZoomed, setIsZoomed] = useState(true);

    // 기사 - 도 매칭 헬퍼 함수
    const isArticleInProvince = (article: TravelSpot, prov: ProvinceMeta): boolean => {
        const text = `${article.location_address || ''} ${article.destination || ''} ${article.region || ''}`;
        if (text.includes(prov.name) || text.includes(prov.shortName)) return true;
        if (prov.id === 'jeonbuk' && (text.includes('전라북도') || text.includes('전북'))) return true;
        if (prov.id === 'gangwon' && (text.includes('강원도') || text.includes('강원'))) return true;
        if (prov.id === 'gyeonggi' && (text.includes('경기도') || text.includes('경기'))) return true;
        if (prov.id === 'seoul' && (text.includes('서울특별시') || text.includes('서울'))) return true;
        if (prov.id === 'jeju' && (text.includes('제주특별자치도') || text.includes('제주'))) return true;
        return false;
    };

    // 각 도별 등록된 실제 여행지 개수 계산
    const provinceCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const prov of PROVINCES) {
            counts[prov.name] = articles.filter(a => isArticleInProvince(a, prov)).length;
        }
        return counts;
    }, [articles]);

    // 현재 선택된 도 객체
    const activeProvinceMeta = useMemo(() => {
        if (!selectedProvince) return null;
        return PROVINCES.find(p => p.name === selectedProvince || p.shortName === selectedProvince) || null;
    }, [selectedProvince]);

    // 동적 뷰박스 (각 시·도의 실제 지형 크기에 꼭 맞게 밀착 줌인)
    const activeViewBox = useMemo(() => {
        if (!activeProvinceMeta || !isZoomed || !activeProvinceMeta.bbox) {
            return KOREA_MAP_VIEWBOX;
        }
        const [minX, minY, maxX, maxY] = activeProvinceMeta.bbox;
        const width = maxX - minX;
        const height = maxY - minY;

        // 크기에 비례하는 자연스러운 패딩 (최소 6, 최대 30)
        const padX = Math.max(Math.min(width * 0.18, 30), 6);
        const padY = Math.max(Math.min(height * 0.18, 30), 6);

        let w = width + padX * 2;
        let h = height + padY * 2;

        // 800:759 (약 1.054) 캔버스 종횡비 유지
        const targetAspect = 800 / 759;
        if (w / h > targetAspect) {
            h = w / targetAspect;
        } else {
            w = h * targetAspect;
        }

        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        return `${Math.round(cx - w / 2)} ${Math.round(cy - h / 2)} ${Math.round(w)} ${Math.round(h)}`;
    }, [activeProvinceMeta, isZoomed]);

    // 뷰박스 분해 좌표 [vbX, vbY, vbW, vbH] (HTML 오버레이 핀 백분율 매핑용)
    const [vbX, vbY, vbW, vbH] = useMemo(() => {
        const parts = activeViewBox.split(' ').map(Number);
        return [parts[0] || 0, parts[1] || 0, parts[2] || 800, parts[3] || 759];
    }, [activeViewBox]);

    // 현재 선택된 도/시에 속한 여행지 목록
    const filteredSpots = useMemo(() => {
        if (!activeProvinceMeta) return articles;
        return articles.filter(a => {
            if (!isArticleInProvince(a, activeProvinceMeta)) return false;
            if (selectedCity && selectedCity !== 'all') {
                const addr = `${a.location_address || ''} ${a.destination || ''}`;
                return addr.includes(selectedCity);
            }
            return true;
        });
    }, [articles, activeProvinceMeta, selectedCity]);

    // 해당 도에 실제 데이터가 존재하는 시/군 목록 추출
    const availableCitiesInProvince = useMemo(() => {
        if (!activeProvinceMeta) return [];
        const cityCountMap: Record<string, number> = {};

        articles.forEach(a => {
            if (isArticleInProvince(a, activeProvinceMeta)) {
                const addr = a.location_address || a.destination || '';
                const parts = addr.split(' ');
                if (parts.length >= 2) {
                    const cityName = parts[1];
                    if (cityName.endsWith('시') || cityName.endsWith('군') || cityName.endsWith('구')) {
                        cityCountMap[cityName] = (cityCountMap[cityName] || 0) + 1;
                    }
                }
            }
        });

        // 메타데이터에 등록된 기본 시/군 목록과 DB 실제 카운트 결합
        const result = activeProvinceMeta.cities.map(c => ({
            ...c,
            count: cityCountMap[c.name] || 0
        }));

        // DB에만 존재하는 추가 시/군도 목록에 포함
        Object.entries(cityCountMap).forEach(([cityName, count]) => {
            if (!result.find(r => r.name === cityName)) {
                result.push({
                    name: cityName,
                    icon: '📍',
                    x: activeProvinceMeta.centerX,
                    y: activeProvinceMeta.centerY,
                    count
                });
            }
        });

        return result.sort((a, b) => b.count - a.count);
    }, [articles, activeProvinceMeta]);

    // 도 클릭 핸들러
    const handleProvinceClick = (prov: ProvinceMeta) => {
        if (selectedProvince === prov.name) {
            // 이미 선택된 상태에서 클릭 시 전체 시점으로 전환
            onSelectLocation(null, null);
        } else {
            onSelectLocation(prov.name, null);
        }
        setSelectedSpot(null);
    };

    // 시/군 클릭 핸들러
    const handleCityClick = (cityName: string | null) => {
        onSelectLocation(selectedProvince, cityName);
        setSelectedSpot(null);
    };

    // 권역 퀵 바 클릭 핸들러
    const handleRegionGroupClick = (group: typeof REGION_GROUPS[0]) => {
        if (group.id === 'all') {
            onSelectLocation(null, null);
        } else if (group.provNames && group.provNames.length > 0) {
            // 해당 권역의 첫 번째 대표 도 선택
            onSelectLocation(group.provNames[0], null);
        }
        setSelectedSpot(null);
    };

    return (
        <section className="my-8 rounded-3xl bg-gradient-to-b from-slate-50 via-white to-slate-50 border border-slate-200/90 shadow-xl overflow-hidden transition-all duration-300">
            {/* 상단 컨트롤 헤더 */}
            <div className="px-6 py-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 text-lg">
                        <i className="fas fa-map-marked-alt"></i>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                대한민국 인터랙티브 여행 지도
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                SGIS 공공 행정구역 기반
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                            지도의 도/시를 클릭하여 가고 싶은 지역의 명소를 한눈에 찾아보세요.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* 전국 지도로 보기 리셋 버튼 */}
                    {selectedProvince && (
                        <button
                            onClick={() => onSelectLocation(null, null)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                            <i className="fas fa-undo-alt text-[10px]"></i>
                            <span>전국 지도로 보기</span>
                        </button>
                    )}

                    {/* 확대/전체 토글 버튼 (도 선택 시 노출) */}
                    {selectedProvince && (
                        <button
                            onClick={() => setIsZoomed(!isZoomed)}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title={isZoomed ? "전국 시점으로 보기" : "지역 확대 보기"}
                        >
                            <i className={`fas ${isZoomed ? 'fa-compress-arrows-alt' : 'fa-expand-arrows-alt'} text-slate-500`}></i>
                            <span>{isZoomed ? "전국 시점" : "지역 확대"}</span>
                        </button>
                    )}

                    {/* 지도 접기/펼치기 토글 */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title={isCollapsed ? '지도 펼치기' : '지도 접기'}
                    >
                        <i className={`fas ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-[11px]`}></i>
                        <span>{isCollapsed ? '지도 펼치기' : '지도 접기'}</span>
                    </button>
                </div>
            </div>

            {/* 권역 퀵 선택 바 (빠른 내비게이션) */}
            {!isCollapsed && (
                <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-200/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    <span className="text-[11px] font-extrabold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
                        <i className="fas fa-location-arrow text-[10px] text-emerald-600"></i>
                        빠른 탐색:
                    </span>
                    {REGION_GROUPS.map(group => {
                        const isGroupActive = group.id === 'all'
                            ? !selectedProvince
                            : group.provNames?.includes(selectedProvince || '');
                        return (
                            <button
                                key={group.id}
                                onClick={() => handleRegionGroupClick(group)}
                                className={`px-3 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                                    isGroupActive
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200/80'
                                }`}
                            >
                                {group.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {!isCollapsed && (
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* 좌측: 대한민국 정밀 벡터 지도 캔버스 */}
                    <div className="lg:col-span-7 bg-gradient-to-b from-[#f0fdf4]/50 via-white to-[#f8fafc] rounded-2xl border border-slate-200/90 p-4 relative shadow-inner overflow-hidden select-none">
                        {/* 현재 선택 브레드크럼 배너 */}
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                            <span className="px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md text-xs font-extrabold text-slate-800 shadow-sm border border-slate-200 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${selectedProvince ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                {selectedProvince ? (
                                    <>
                                        <span className="text-slate-500">전국</span>
                                        <i className="fas fa-chevron-right text-[9px] text-slate-400"></i>
                                        <span className="text-emerald-700">{selectedProvince}</span>
                                        {selectedCity && (
                                            <>
                                                <i className="fas fa-chevron-right text-[9px] text-slate-400"></i>
                                                <span className="text-slate-900 font-black">{selectedCity}</span>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <span>전국 전체 (총 {articles.length}곳)</span>
                                )}
                            </span>
                        </div>

                        {/* 해양 라벨 워터마크 */}
                        <div className="absolute top-12 right-6 text-right pointer-events-none opacity-40 select-none">
                            <div className="text-[12px] font-black text-slate-400 tracking-widest">동 해</div>
                            <div className="text-[9px] font-medium text-slate-400">East Sea</div>
                        </div>
                        <div className="absolute top-1/2 left-6 pointer-events-none opacity-40 select-none">
                            <div className="text-[12px] font-black text-slate-400 tracking-widest">서 해</div>
                            <div className="text-[9px] font-medium text-slate-400">Yellow Sea</div>
                        </div>
                        <div className="absolute bottom-6 right-16 pointer-events-none opacity-40 select-none">
                            <div className="text-[12px] font-black text-slate-400 tracking-widest">남 해</div>
                            <div className="text-[9px] font-medium text-slate-400">South Sea</div>
                        </div>

                        {/* 나침반 아이콘 */}
                        <div className="absolute bottom-4 left-4 pointer-events-none opacity-30 flex flex-col items-center">
                            <i className="fas fa-compass text-2xl text-slate-600"></i>
                            <span className="text-[8px] font-black text-slate-500">N</span>
                        </div>

                        {/* 지도 및 HTML 오버레이 래퍼 */}
                        <div className="relative w-full max-w-[620px] mx-auto">
                            {/* 메인 SVG 인터랙티브 지도 (순수 벡터 지형 캔버스) */}
                            <svg
                                viewBox={activeViewBox}
                                className="w-full h-auto block transition-all duration-500 ease-out"
                                style={{ filter: 'drop-shadow(0 6px 14px rgba(15, 23, 42, 0.08))' }}
                            >
                                <defs>
                                    <linearGradient id="selected-province-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#059669" />
                                        <stop offset="100%" stopColor="#047857" />
                                    </linearGradient>
                                    <linearGradient id="hover-province-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6ee7b7" />
                                        <stop offset="100%" stopColor="#34d399" />
                                    </linearGradient>
                                    <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
                                        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#059669" floodOpacity="0.35" />
                                    </filter>
                                </defs>

                                {/* 17개 광역시·도 실제 통계청 SGIS 정밀 패스 렌더링 */}
                                <g id="korea-provinces" className="transition-all duration-300">
                                    {PROVINCES.map((prov) => {
                                        const isSelected = selectedProvince === prov.name;
                                        const isHovered = hoveredProvince === prov.name;
                                        const count = provinceCounts[prov.name] || 0;
                                        const hasSelectedOther = selectedProvince !== null && !isSelected;

                                        return (
                                            <path
                                                key={prov.id}
                                                d={prov.path}
                                                onClick={() => handleProvinceClick(prov)}
                                                onMouseEnter={() => setHoveredProvince(prov.name)}
                                                onMouseLeave={() => setHoveredProvince(null)}
                                                className="transition-all duration-200 cursor-pointer"
                                                style={{
                                                    fill: isSelected
                                                        ? 'url(#selected-province-grad)'
                                                        : isHovered
                                                        ? 'url(#hover-province-grad)'
                                                        : count > 0
                                                        ? '#ecfdf5' // 데이터 있는 도: 산뜻한 민트 연녹색
                                                        : '#f8fafc', // 데이터 없는 도: 소프트 슬레이트
                                                    stroke: isSelected
                                                        ? '#064e3b'
                                                        : isHovered
                                                        ? '#059669'
                                                        : count > 0
                                                        ? '#a7f3d0'
                                                        : '#cbd5e1',
                                                    strokeWidth: isSelected ? 3 : isHovered ? 2.2 : 1.2,
                                                    opacity: hasSelectedOther && !isHovered ? 0.35 : 1,
                                                    filter: isSelected ? 'url(#glow-selected)' : undefined,
                                                }}
                                            >
                                                <title>{prov.name} ({count}곳 등록됨)</title>
                                            </path>
                                        );
                                    })}
                                </g>

                                {/* 울릉도·독도 특별 주석 라벨 */}
                                {(!selectedProvince || selectedProvince === '경상북도') && (
                                    <g transform="translate(635, 190)" className="pointer-events-none select-none">
                                        <rect x="-8" y="-14" width="70" height="20" rx="6" fill="white" fillOpacity="0.9" stroke="#94a3b8" strokeWidth="0.8" />
                                        <text x="27" y="0" textAnchor="middle" fontSize="9" fontWeight="800" fill="#334155">
                                            울릉·독도 🏝️
                                        </text>
                                    </g>
                                )}
                            </svg>

                            {/* 고선명 HTML 오버레이 레이어 (어느 확대 비율에서도 12px 표준 가독성 완벽 보장) */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {/* 1. 도 선택 시: 해당 도의 세부 시·군 핀 (HTML 캡슐) */}
                                {activeProvinceMeta && availableCitiesInProvince.map((city) => {
                                    const isCitySelected = selectedCity === city.name;
                                    const hasSpots = city.count > 0;

                                    const leftPct = ((city.x - vbX) / vbW) * 100;
                                    const topPct = ((city.y - vbY) / vbH) * 100;

                                    if (leftPct < 3 || leftPct > 97 || topPct < 3 || topPct > 97) return null;

                                    return (
                                        <div
                                            key={`html-city-${city.name}`}
                                            style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCityClick(city.name);
                                            }}
                                            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group select-none transition-transform duration-150 hover:scale-110 active:scale-95 z-20 hover:z-30"
                                        >
                                            {/* 펄스 링 */}
                                            {hasSpots && (
                                                <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-60 animate-ping pointer-events-none" />
                                            )}

                                            <div
                                                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-md text-xs font-black transition-all ${
                                                    isCitySelected
                                                        ? 'bg-slate-900 text-white ring-2 ring-emerald-400 shadow-emerald-500/20 shadow-lg'
                                                        : hasSpots
                                                        ? 'bg-white text-slate-800 hover:bg-emerald-600 hover:text-white border border-emerald-400 shadow-sm'
                                                        : 'bg-white/95 text-slate-600 hover:bg-slate-800 hover:text-white border border-slate-200/90 shadow-2xs'
                                                }`}
                                            >
                                                <span className="text-sm shrink-0 leading-none">{city.icon}</span>
                                                <span className="whitespace-nowrap tracking-tight">
                                                    {city.name.replace(/(시|군|구)$/, '')}
                                                </span>
                                                {city.count > 0 && (
                                                    <span
                                                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 ${
                                                            isCitySelected
                                                                ? 'bg-emerald-500 text-slate-950'
                                                                : 'bg-emerald-600 text-white group-hover:bg-white group-hover:text-emerald-800'
                                                        }`}
                                                    >
                                                        {city.count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* 2. 전국 시점: 17개 광역시·도 대표 뱃지 (HTML 캡슐) */}
                                {(!selectedProvince || !isZoomed) && PROVINCES.map((prov) => {
                                    const count = provinceCounts[prov.name] || 0;
                                    const isSelected = selectedProvince === prov.name;

                                    const leftPct = ((prov.centerX - vbX) / vbW) * 100;
                                    const topPct = ((prov.centerY - vbY) / vbH) * 100;

                                    if (leftPct < 3 || leftPct > 97 || topPct < 3 || topPct > 97) return null;

                                    return (
                                        <div
                                            key={`html-prov-${prov.id}`}
                                            style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                                            onClick={() => handleProvinceClick(prov)}
                                            onMouseEnter={() => setHoveredProvince(prov.name)}
                                            onMouseLeave={() => setHoveredProvince(null)}
                                            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer select-none transition-transform duration-150 hover:scale-110 active:scale-95 z-10 hover:z-25"
                                        >
                                            <div
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-md text-xs font-black border transition-all ${
                                                    isSelected
                                                        ? 'bg-emerald-800 text-white border-white shadow-emerald-800/30'
                                                        : count > 0
                                                        ? 'bg-white text-slate-800 border-emerald-400 hover:bg-emerald-600 hover:text-white'
                                                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                                }`}
                                            >
                                                <span>{prov.shortName}</span>
                                                {count > 0 && (
                                                    <span
                                                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                                            isSelected ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'
                                                        }`}
                                                    >
                                                        {count > 99 ? '99+' : count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 지도 하단 가이드 문구 */}
                        <div className="mt-3 text-center text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1.5">
                            <i className="fas fa-hand-pointer text-emerald-600 animate-bounce"></i>
                            <span>도 또는 시·군 핀을 클릭하면 아래 목록이 실시간으로 동기화됩니다.</span>
                        </div>
                    </div>

                    {/* 우측: 시/군 필터 및 퀵 여행지 카드 패널 */}
                    <div className="lg:col-span-5 flex flex-col space-y-4">
                        {/* 권역 요약 타이틀 바 */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black text-emerald-400 tracking-wider uppercase flex items-center gap-1">
                                        <i className="fas fa-compass"></i> REGION EXPLORER
                                    </span>
                                    <h3 className="text-xl font-black text-white mt-1">
                                        {selectedProvince || '전국 여행 명소 전체'}
                                    </h3>
                                </div>
                                <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-400/30">
                                    총 {filteredSpots.length}곳
                                </span>
                            </div>

                            {/* 해당 도의 시/군 칩 목록 */}
                            {activeProvinceMeta && availableCitiesInProvince.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-slate-700/80">
                                    <p className="text-[11px] font-extrabold text-slate-300 mb-2.5 flex items-center gap-1">
                                        <i className="fas fa-filter text-emerald-400"></i>
                                        세부 시·군 선택:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
                                        <button
                                            onClick={() => handleCityClick(null)}
                                            className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                                !selectedCity
                                                    ? 'bg-emerald-500 text-white shadow-md'
                                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                            }`}
                                        >
                                            전체 ({filteredSpots.length})
                                        </button>
                                        {availableCitiesInProvince.map(city => (
                                            <button
                                                key={city.name}
                                                onClick={() => handleCityClick(city.name)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                                    selectedCity === city.name
                                                        ? 'bg-emerald-500 text-white shadow-md'
                                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                                }`}
                                            >
                                                <span>{city.icon}</span>
                                                <span>{city.name}</span>
                                                <span className="text-[10px] opacity-80">({city.count})</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 추천 스팟 퀵 카드 리스트 */}
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1 scrollbar-thin">
                            {filteredSpots.length > 0 ? (
                                filteredSpots.slice(0, 5).map(spot => (
                                    <div
                                        key={spot.id}
                                        onClick={() => setSelectedSpot(spot)}
                                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex gap-3.5 items-center ${
                                            selectedSpot?.id === spot.id
                                                ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-300'
                                                : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:bg-slate-50/60 shadow-xs'
                                        }`}
                                    >
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative shadow-inner">
                                            <img
                                                src={spot.thumbnail || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80'}
                                                alt={spot.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    📍 {spot.destination.split(' ').slice(0, 2).join(' ')}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                                                {spot.title.replace(/^\[[^\]]+\]\s*/, '')}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 line-clamp-1">
                                                {spot.summary || spot.ai_summary || '감성 가득한 추천 여행지'}
                                            </p>
                                        </div>
                                        <Link
                                            to={`/entertainment/travel/${spot.id}`}
                                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-extrabold shrink-0 transition-colors shadow-sm"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            보기
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                                    <i className="fas fa-map-pin text-2xl text-slate-300"></i>
                                    <p className="text-xs font-bold text-slate-600">
                                        지도의 도/시를 클릭해 보세요!
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        지역별 명소 핀과 추천 여행 코스를 바로 확인할 수 있습니다.
                                    </p>
                                </div>
                            )}

                            {filteredSpots.length > 5 && (
                                <p className="text-center text-[11px] text-slate-400 font-semibold py-1">
                                    외 {filteredSpots.length - 5}개의 명소가 하단 리스트에 정렬되어 있습니다 ↓
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
