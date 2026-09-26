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
    const [hoveredCity, setHoveredCity] = useState<string | null>(null);
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

    // 동적 뷰박스 (도 선택 시 부드러운 줌인 효과 지원)
    const activeViewBox = useMemo(() => {
        if (!activeProvinceMeta || !isZoomed || !activeProvinceMeta.bbox) {
            return KOREA_MAP_VIEWBOX;
        }
        const [minX, minY, maxX, maxY] = activeProvinceMeta.bbox;
        const padX = Math.max((maxX - minX) * 0.28, 45);
        const padY = Math.max((maxY - minY) * 0.28, 45);
        const w = Math.max((maxX - minX) + padX * 2, 240);
        const h = Math.max((maxY - minY) + padY * 2, 220);
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        return `${Math.round(cx - w / 2)} ${Math.round(cy - h / 2)} ${Math.round(w)} ${Math.round(h)}`;
    }, [activeProvinceMeta, isZoomed]);

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

                        {/* 메인 SVG 인터랙티브 지도 */}
                        <svg
                            viewBox={activeViewBox}
                            className="w-full h-auto max-h-[560px] mx-auto transition-all duration-500 ease-out"
                            style={{ filter: 'drop-shadow(0 6px 14px rgba(15, 23, 42, 0.08))' }}
                        >
                            <defs>
                                {/* 선택된 도 그라데이션 */}
                                <linearGradient id="selected-province-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#059669" />
                                    <stop offset="100%" stopColor="#047857" />
                                </linearGradient>
                                {/* 호버된 도 그라데이션 */}
                                <linearGradient id="hover-province-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#6ee7b7" />
                                    <stop offset="100%" stopColor="#34d399" />
                                </linearGradient>
                                {/* 부드러운 그림자 필터 */}
                                <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#059669" floodOpacity="0.35" />
                                </filter>
                                <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.25" />
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

                            {/* 각 도별 중심 뱃지 (전국 시점이거나 호버 시 표시) */}
                            {(!selectedProvince || !isZoomed) && (
                                <g id="province-badges">
                                    {PROVINCES.map((prov) => {
                                        const count = provinceCounts[prov.name] || 0;
                                        const isSelected = selectedProvince === prov.name;
                                        const isHovered = hoveredProvince === prov.name;
                                        const cx = prov.centerX;
                                        const cy = prov.centerY;

                                        return (
                                            <g
                                                key={`badge-${prov.id}`}
                                                transform={`translate(${cx}, ${cy})`}
                                                onClick={() => handleProvinceClick(prov)}
                                                onMouseEnter={() => setHoveredProvince(prov.name)}
                                                onMouseLeave={() => setHoveredProvince(null)}
                                                className="cursor-pointer"
                                            >
                                                {/* 뱃지 배경 필 */}
                                                <rect
                                                    x={count > 0 ? -32 : -22}
                                                    y={-14}
                                                    width={count > 0 ? 64 : 44}
                                                    height={24}
                                                    rx={12}
                                                    fill={isSelected ? '#064e3b' : isHovered ? '#059669' : count > 0 ? '#ffffff' : '#f1f5f9'}
                                                    stroke={isSelected ? '#ffffff' : isHovered ? '#ffffff' : count > 0 ? '#059669' : '#cbd5e1'}
                                                    strokeWidth={isSelected || isHovered ? 2 : 1.2}
                                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}
                                                />
                                                {/* 지역명 */}
                                                <text
                                                    x={count > 0 ? -6 : 0}
                                                    y={2}
                                                    textAnchor="middle"
                                                    fontSize="11"
                                                    fontWeight="900"
                                                    fill={isSelected || isHovered ? '#ffffff' : '#1e293b'}
                                                >
                                                    {prov.shortName}
                                                </text>
                                                {/* 개수 뱃지 (여행지가 1개 이상 있는 경우) */}
                                                {count > 0 && (
                                                    <g transform="translate(18, 0)">
                                                        <circle
                                                            cx="0"
                                                            cy="-2"
                                                            r="8"
                                                            fill={isSelected || isHovered ? '#ffffff' : '#10b981'}
                                                        />
                                                        <text
                                                            x="0"
                                                            y="1"
                                                            textAnchor="middle"
                                                            fontSize="9"
                                                            fontWeight="900"
                                                            fill={isSelected || isHovered ? '#064e3b' : '#ffffff'}
                                                        >
                                                            {count > 99 ? '99+' : count}
                                                        </text>
                                                    </g>
                                                )}
                                            </g>
                                        );
                                    })}
                                </g>
                            )}

                            {/* 도 선택 시: 해당 도의 세부 시·군 핀 렌더링 */}
                            {activeProvinceMeta && (
                                <g id="city-pins" className="animate-fadeIn">
                                    {availableCitiesInProvince.map((city) => {
                                        const isCitySelected = selectedCity === city.name;
                                        const isCityHovered = hoveredCity === city.name;
                                        const hasSpots = city.count > 0;

                                        return (
                                            <g
                                                key={`pin-${city.name}`}
                                                transform={`translate(${city.x}, ${city.y})`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCityClick(city.name);
                                                }}
                                                onMouseEnter={() => setHoveredCity(city.name)}
                                                onMouseLeave={() => setHoveredCity(null)}
                                                className="cursor-pointer"
                                                style={{
                                                    filter: isCityHovered || isCitySelected ? 'url(#glow-selected)' : 'url(#pin-shadow)',
                                                    transition: 'filter 0.15s ease',
                                                }}
                                            >
                                                {/* 안정적인 고정 투명 히트박스 (크기/위치 불변으로 튕김 현상 원천 방지) */}
                                                <circle cx="0" cy="0" r={isZoomed ? 16 : 20} fill="transparent" />

                                                {/* 펄스 애니메이션 링 (마우스 이벤트 간섭 차단) */}
                                                {hasSpots && (
                                                    <circle
                                                        cx="0"
                                                        cy="0"
                                                        r={isZoomed ? 11 : 14}
                                                        fill="#10b981"
                                                        fillOpacity="0.45"
                                                        className="animate-ping pointer-events-none"
                                                    />
                                                )}

                                                {/* 핀 바깥 원 (줌 레벨에 맞춘 비율 최적화) */}
                                                <circle
                                                    cx="0"
                                                    cy="0"
                                                    r={isCitySelected ? (isZoomed ? 9.5 : 12) : isCityHovered ? (isZoomed ? 9 : 11.5) : (isZoomed ? 7.5 : 10)}
                                                    fill={isCitySelected ? '#047857' : isCityHovered ? '#10b981' : hasSpots ? '#059669' : '#ffffff'}
                                                    stroke="#ffffff"
                                                    strokeWidth={isCityHovered ? 2.5 : 2}
                                                    className="pointer-events-none transition-all duration-150"
                                                />

                                                {/* 핀 아이콘/이모지 */}
                                                <text
                                                    x="0"
                                                    y={isZoomed ? 2.5 : 3.5}
                                                    textAnchor="middle"
                                                    fontSize={isZoomed ? 7 : 9}
                                                    className="pointer-events-none select-none"
                                                >
                                                    {city.icon}
                                                </text>

                                                {/* 시/군 라벨 캡슐 (줌인 시 알맞게 축소되어 이웃 시/군과 겹치지 않음) */}
                                                <g transform={`translate(0, ${isZoomed ? 13 : 18})`} className="pointer-events-none select-none">
                                                    <rect
                                                        x={isZoomed ? -22 : -28}
                                                        y={isZoomed ? -7 : -9}
                                                        width={isZoomed ? 44 : 56}
                                                        height={isZoomed ? 14 : 18}
                                                        rx={isZoomed ? 7 : 9}
                                                        fill={isCitySelected ? '#0f172a' : isCityHovered ? '#047857' : '#ffffff'}
                                                        stroke={isCitySelected ? '#38bdf8' : isCityHovered ? '#10b981' : '#94a3b8'}
                                                        strokeWidth={isCityHovered || isCitySelected ? 1.5 : 1}
                                                        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))' }}
                                                    />
                                                    <text
                                                        x="0"
                                                        y={isZoomed ? 2.5 : 3.5}
                                                        textAnchor="middle"
                                                        fontSize={isZoomed ? 7.5 : 9}
                                                        fontWeight="900"
                                                        fill={isCitySelected || isCityHovered ? '#ffffff' : '#0f172a'}
                                                    >
                                                        {city.name.replace(/(시|군|구)$/, '')} {city.count > 0 ? `(${city.count})` : ''}
                                                    </text>
                                                </g>
                                            </g>
                                        );
                                    })}
                                </g>
                            )}
                        </svg>

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
