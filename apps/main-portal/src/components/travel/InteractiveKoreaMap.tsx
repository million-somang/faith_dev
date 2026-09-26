import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

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

interface ProvinceMeta {
    id: string;
    name: string; // 공식 풀네임
    shortName: string; // 2글자 약칭
    centerX: number;
    centerY: number;
    path: string;
    cities: Array<{ name: string; icon: string; x: number; y: number }>;
}

// 대한민국 8대 핵심 권역 SVG 경로 데이터 (500x650 뷰박스 기준)
const PROVINCES: ProvinceMeta[] = [
    {
        id: 'gangwon',
        name: '강원특별자치도',
        shortName: '강원',
        centerX: 285,
        centerY: 125,
        // 강원도 외곽선 (철원-고성-강릉-태백-영월-춘천)
        path: 'M 205 78 L 265 52 L 315 58 L 345 88 L 368 142 L 362 188 L 332 212 L 290 205 L 255 190 L 225 180 L 205 130 Z',
        cities: [
            { name: '속초시', icon: '🌊', x: 330, y: 85 },
            { name: '인제군', icon: '🏎️', x: 265, y: 105 },
            { name: '강릉시', icon: '☕', x: 350, y: 145 },
            { name: '춘천시', icon: '🛶', x: 235, y: 120 },
            { name: '평창군', icon: '⛷️', x: 295, y: 165 },
        ]
    },
    {
        id: 'gyeonggi',
        name: '경기도',
        shortName: '경기·서울',
        centerX: 165,
        centerY: 140,
        // 경기도 및 서울/인천 외곽선
        path: 'M 140 75 L 205 78 L 205 130 L 225 180 L 195 210 L 155 215 L 125 185 L 115 135 L 130 95 Z',
        cities: [
            { name: '파주시', icon: '📚', x: 150, y: 88 },
            { name: '가평군', icon: '🏕️', x: 195, y: 110 },
            { name: '수원시', icon: '🏰', x: 162, y: 175 },
            { name: '양평군', icon: '🌿', x: 195, y: 155 },
        ]
    },
    {
        id: 'chungnam',
        name: '충청남도',
        shortName: '충남·대전',
        centerX: 140,
        centerY: 265,
        // 충남 외곽선 (태안-당진-천안-금산-서천-보령)
        path: 'M 125 185 L 155 215 L 195 210 L 190 265 L 195 310 L 145 320 L 115 310 L 92 270 L 98 215 Z',
        cities: [
            { name: '보령시', icon: '🏖️', x: 115, y: 285 },
            { name: '태안군', icon: '🌅', x: 95, y: 235 },
            { name: '천안시', icon: '🌰', x: 175, y: 230 },
            { name: '공주시', icon: '👑', x: 160, y: 275 },
        ]
    },
    {
        id: 'chungbuk',
        name: '충청북도',
        shortName: '충북',
        centerX: 235,
        centerY: 245,
        // 충북 외곽선 (제천-단양-충주-청주-영동)
        path: 'M 225 180 L 255 190 L 290 205 L 285 240 L 260 285 L 225 315 L 190 265 L 195 210 Z',
        cities: [
            { name: '청주시', icon: '🏛️', x: 215, y: 265 },
            { name: '단양군', icon: '🪨', x: 270, y: 210 },
            { name: '충주시', icon: '🍎', x: 245, y: 225 },
        ]
    },
    {
        id: 'gyeongbuk',
        name: '경상북도',
        shortName: '경북·대구',
        centerX: 335,
        centerY: 275,
        // 경북 외곽선 (울진-포항-경주-청도-문경-영주)
        path: 'M 290 205 L 332 212 L 372 235 L 388 285 L 380 345 L 335 365 L 295 345 L 260 285 L 285 240 Z',
        cities: [
            { name: '포항시', icon: '🌅', x: 375, y: 310 },
            { name: '경주시', icon: '⛩️', x: 365, y: 345 },
            { name: '안동시', icon: '🎭', x: 325, y: 250 },
            { name: '문경시', icon: '⛰️', x: 280, y: 255 },
        ]
    },
    {
        id: 'jeonbuk',
        name: '전북특별자치도',
        shortName: '전북',
        centerX: 160,
        centerY: 360,
        // 전북 외곽선 (군산-익산-무주-남원-고창-부안)
        path: 'M 115 310 L 145 320 L 195 310 L 225 315 L 228 385 L 175 410 L 120 405 L 105 355 Z',
        cities: [
            { name: '완주군', icon: '🌿', x: 180, y: 350 },
            { name: '전주시', icon: '🏮', x: 155, y: 365 },
            { name: '군산시', icon: '🚂', x: 120, y: 335 },
            { name: '남원시', icon: '🌙', x: 195, y: 395 },
        ]
    },
    {
        id: 'gyeongnam',
        name: '경상남도',
        shortName: '경남·부산',
        centerX: 300,
        centerY: 425,
        // 경남 외곽선 (합천-밀양-양산-부산-거제-남해-하동)
        path: 'M 228 385 L 260 380 L 295 345 L 335 365 L 368 405 L 350 450 L 315 480 L 255 470 L 225 435 Z',
        cities: [
            { name: '거제시', icon: '⛵', x: 315, y: 468 },
            { name: '통영시', icon: '🦪', x: 285, y: 465 },
            { name: '남해군', icon: '🏝️', x: 245, y: 468 },
            { name: '부산광역시', icon: '🌊', x: 355, y: 435 },
        ]
    },
    {
        id: 'jeonnam',
        name: '전라남도',
        shortName: '전남·광주',
        centerX: 145,
        centerY: 465,
        // 전남 외곽선 (영광-담양-구례-여수-완도-목포)
        path: 'M 120 405 L 175 410 L 228 385 L 225 435 L 255 470 L 210 520 L 155 525 L 95 490 L 98 440 Z',
        cities: [
            { name: '여수시', icon: '🌉', x: 220, y: 485 },
            { name: '순천시', icon: '🌾', x: 195, y: 460 },
            { name: '목포시', icon: '⚓', x: 110, y: 480 },
            { name: '담양군', icon: '🎋', x: 155, y: 430 },
        ]
    },
    {
        id: 'jeju',
        name: '제주특별자치도',
        shortName: '제주',
        centerX: 135,
        centerY: 585,
        // 제주도 타원 외곽선
        path: 'M 85 585 C 85 565, 185 565, 185 585 C 185 605, 85 605, 85 585 Z',
        cities: [
            { name: '서귀포시', icon: '🍊', x: 135, y: 593 },
            { name: '제주시', icon: '✈️', x: 135, y: 575 },
        ]
    },
    {
        id: 'ulleung',
        name: '경상북도 울릉군',
        shortName: '울릉·독도',
        centerX: 435,
        centerY: 185,
        // 울릉도 / 독도 미니 섬
        path: 'M 425 185 C 425 178, 445 178, 445 185 C 445 192, 425 192, 425 185 Z M 460 190 C 460 186, 468 186, 468 190 C 468 194, 460 194, 460 190 Z',
        cities: [
            { name: '울릉군', icon: '🦑', x: 435, y: 185 }
        ]
    }
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

    // 각 도별 등록된 실제 여행지 개수 계산
    const provinceCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const prov of PROVINCES) {
            counts[prov.name] = 0;
        }

        articles.forEach(article => {
            const addr = article.location_address || article.destination || '';
            PROVINCES.forEach(prov => {
                if (addr.includes(prov.shortName) || addr.includes(prov.name)) {
                    counts[prov.name] = (counts[prov.name] || 0) + 1;
                }
            });
        });

        return counts;
    }, [articles]);

    // 현재 선택된 도 객체
    const activeProvinceMeta = useMemo(() => {
        if (!selectedProvince) return null;
        return PROVINCES.find(p => p.name === selectedProvince || p.shortName === selectedProvince) || null;
    }, [selectedProvince]);

    // 현재 선택된 도/시에 속한 여행지 목록
    const filteredSpots = useMemo(() => {
        if (!selectedProvince) return [];
        return articles.filter(a => {
            const addr = a.location_address || a.destination || '';
            const matchProvince = activeProvinceMeta 
                ? addr.includes(activeProvinceMeta.shortName) || addr.includes(activeProvinceMeta.name)
                : false;
            
            if (!matchProvince) return false;
            if (selectedCity && selectedCity !== 'all') {
                return addr.includes(selectedCity);
            }
            return true;
        });
    }, [articles, selectedProvince, selectedCity, activeProvinceMeta]);

    // 해당 도에 실제 데이터가 존재하는 시/군 목록 추출
    const availableCitiesInProvince = useMemo(() => {
        if (!activeProvinceMeta) return [];
        const cityCountMap: Record<string, number> = {};

        articles.forEach(a => {
            const addr = a.location_address || a.destination || '';
            if (addr.includes(activeProvinceMeta.shortName) || addr.includes(activeProvinceMeta.name)) {
                // 주소 두 번째 단어 추출 (예: '강원특별자치도 속초시 ...' -> '속초시')
                const parts = addr.split(' ');
                if (parts.length >= 2) {
                    const cityName = parts[1];
                    if (cityName.endsWith('시') || cityName.endsWith('군') || cityName.endsWith('구')) {
                        cityCountMap[cityName] = (cityCountMap[cityName] || 0) + 1;
                    }
                }
            }
        });

        const list = Object.entries(cityCountMap).map(([name, count]) => {
            const foundPreset = activeProvinceMeta.cities.find(c => c.name === name);
            return {
                name,
                count,
                icon: foundPreset?.icon || '📍',
                x: foundPreset?.x || activeProvinceMeta.centerX,
                y: foundPreset?.y || activeProvinceMeta.centerY
            };
        });

        // 등록된 스팟 수가 많은 순으로 정렬
        return list.sort((a, b) => b.count - a.count);
    }, [articles, activeProvinceMeta]);

    // 도 클릭 핸들러
    const handleProvinceClick = (province: ProvinceMeta) => {
        setSelectedSpot(null);
        if (selectedProvince === province.name) {
            // 이미 선택된 도를 다시 누르면 전체 지도로 복귀
            onSelectLocation(null, null);
        } else {
            onSelectLocation(province.name, null);
        }
    };

    // 시/군 클릭 핸들러
    const handleCityClick = (cityName: string | null) => {
        setSelectedSpot(null);
        onSelectLocation(selectedProvince, cityName);
    };

    // 전체 리셋
    const handleReset = () => {
        setSelectedSpot(null);
        onSelectLocation(null, null);
    };

    return (
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
            {/* 1. 상단 컨트롤 헤더 */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-sm">
                        <i className="fas fa-map-location-dot"></i>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                대한민국 감성 여행 탐색기
                            </h2>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                                Interactive Map
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                            {selectedProvince 
                                ? `${selectedProvince}의 숨겨진 명소를 탐색 중입니다.`
                                : '지도의 도/광역시를 클릭하면 해당 지역의 세부 시·군과 여행지가 나타납니다.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* 브레드크럼 & 리셋 버튼 */}
                    {selectedProvince && (
                        <button
                            onClick={handleReset}
                            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-black border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                            <i className="fas fa-arrow-rotate-left text-emerald-600 text-[11px]"></i>
                            <span>전국 지도로 보기</span>
                        </button>
                    )}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                        title={isCollapsed ? '지도 펼치기' : '지도 접기'}
                    >
                        <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
                    </button>
                </div>
            </div>

            {/* 2. 지도 본체 영역 (접기/펼치기 가능) */}
            {!isCollapsed && (
                <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* 좌측: SVG 벡터 지도 캔버스 */}
                    <div className="lg:col-span-7 flex flex-col items-center justify-center relative bg-slate-50/80 rounded-2xl border border-slate-200/70 p-3 sm:p-6 min-h-[460px]">
                        
                        {/* 지도 상단 권역 안내 배지 */}
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            <span className="text-xs font-extrabold text-slate-700 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                                {selectedProvince ? (
                                    <>
                                        <span className="text-slate-400">지역: </span>
                                        <strong className="text-emerald-700">{selectedProvince}</strong>
                                        {selectedCity && <span className="text-slate-800"> · {selectedCity}</span>}
                                    </>
                                ) : (
                                    '전국 8대 권역 (도 클릭 시 확대)'
                                )}
                            </span>
                        </div>

                        {/* 대한민국 SVG 벡터 지도 */}
                        <svg
                            viewBox="70 40 410 580"
                            className="w-full max-w-[400px] h-auto drop-shadow-md select-none transition-all duration-500"
                        >
                            {/* 바다/배경 그리드 느낌 */}
                            <defs>
                                <linearGradient id="mapGradientDefault" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#e2e8f0" />
                                    <stop offset="100%" stopColor="#cbd5e1" />
                                </linearGradient>
                                <linearGradient id="mapGradientActive" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#059669" />
                                    <stop offset="100%" stopColor="#0d9488" />
                                </linearGradient>
                                <linearGradient id="mapGradientHover" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#a7f3d0" />
                                    <stop offset="100%" stopColor="#6ee7b7" />
                                </linearGradient>
                                <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
                                </filter>
                            </defs>

                            {/* 1. 도(Province) 영역 패스 렌더링 */}
                            {PROVINCES.map((prov) => {
                                const count = provinceCounts[prov.name] || 0;
                                const isSelected = selectedProvince === prov.name;
                                const isHovered = hoveredProvince === prov.id;
                                const hasData = count > 0;

                                let fill = 'url(#mapGradientDefault)';
                                if (isSelected) fill = 'url(#mapGradientActive)';
                                else if (isHovered) fill = 'url(#mapGradientHover)';
                                else if (hasData) fill = '#e6f4ea'; // 스팟이 있는 지역은 연한 초록빛 강조

                                return (
                                    <g key={prov.id} className="cursor-pointer transition-all duration-300">
                                        <path
                                            d={prov.path}
                                            fill={fill}
                                            stroke={isSelected ? '#047857' : isHovered ? '#10b981' : '#94a3b8'}
                                            strokeWidth={isSelected ? '3.5' : '1.5'}
                                            strokeLinejoin="round"
                                            className="transition-colors duration-200"
                                            onMouseEnter={() => setHoveredProvince(prov.id)}
                                            onMouseLeave={() => setHoveredProvince(null)}
                                            onClick={() => handleProvinceClick(prov)}
                                        />

                                        {/* 도 이름 레이블 */}
                                        <text
                                            x={prov.centerX}
                                            y={prov.centerY - 6}
                                            textAnchor="middle"
                                            className={`text-[12px] font-black select-none pointer-events-none transition-colors ${
                                                isSelected ? 'fill-white' : 'fill-slate-700'
                                            }`}
                                        >
                                            {prov.shortName}
                                        </text>

                                        {/* 여행지 개수 뱃지 (스팟이 1개 이상 있을 때) */}
                                        {count > 0 && (
                                            <g
                                                transform={`translate(${prov.centerX}, ${prov.centerY + 12})`}
                                                className="select-none pointer-events-none"
                                            >
                                                <rect
                                                    x="-18"
                                                    y="-9"
                                                    width="36"
                                                    height="18"
                                                    rx="9"
                                                    fill={isSelected ? '#ffffff' : '#059669'}
                                                    className="shadow-sm"
                                                />
                                                <text
                                                    x="0"
                                                    y="4"
                                                    textAnchor="middle"
                                                    className={`text-[10px] font-extrabold ${
                                                        isSelected ? 'fill-emerald-800' : 'fill-white'
                                                    }`}
                                                >
                                                    {count}곳
                                                </text>
                                            </g>
                                        )}
                                    </g>
                                );
                            })}

                            {/* 2. 도가 선택되었을 때: 해당 권역 내 시/군 핀 마커 표시 */}
                            {activeProvinceMeta && availableCitiesInProvince.map((city) => {
                                const isCitySelected = selectedCity === city.name;
                                return (
                                    <g
                                        key={city.name}
                                        transform={`translate(${city.x}, ${city.y})`}
                                        className="cursor-pointer transition-transform duration-300 hover:scale-125"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCityClick(isCitySelected ? null : city.name);
                                        }}
                                        filter="url(#pinShadow)"
                                    >
                                        {/* 펄스 링 */}
                                        {isCitySelected && (
                                            <circle r="14" fill="#10b981" opacity="0.35" className="animate-ping" />
                                        )}

                                        {/* 핀 헤드 */}
                                        <circle
                                            r="10"
                                            fill={isCitySelected ? '#f59e0b' : '#047857'}
                                            stroke="#ffffff"
                                            strokeWidth="2"
                                        />
                                        <text
                                            x="0"
                                            y="3.5"
                                            textAnchor="middle"
                                            className="text-[9px] font-black fill-white pointer-events-none"
                                        >
                                            {city.count}
                                        </text>

                                        {/* 시/군 명칭 텍스트 */}
                                        <text
                                            x="0"
                                            y="22"
                                            textAnchor="middle"
                                            className="text-[10px] font-extrabold fill-slate-900 drop-shadow-sm pointer-events-none bg-white"
                                        >
                                            {city.name}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>

                        {/* 지도 하단 간단 도움말 */}
                        <div className="mt-2 text-center text-[11px] text-slate-500 font-medium">
                            <i className="fas fa-hand-pointer text-emerald-600 mr-1"></i>
                            도 또는 시·군 핀을 클릭하면 아래 목록이 실시간으로 동기화됩니다.
                        </div>
                    </div>

                    {/* 우측: 시/군 필터 및 퀵 여행지 카드 패널 */}
                    <div className="lg:col-span-5 flex flex-col space-y-4">
                        {/* 권역 요약 타이틀 바 */}
                        <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200/80">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-black text-emerald-700 tracking-wider uppercase">
                                        REGION EXPLORER
                                    </span>
                                    <h3 className="text-lg font-black text-slate-900 mt-0.5">
                                        {selectedProvince || '전국 여행 명소 전체'}
                                    </h3>
                                </div>
                                <span className="px-3 py-1 rounded-xl bg-white text-slate-800 text-xs font-black border border-slate-200 shadow-2xs">
                                    총 {selectedProvince ? filteredSpots.length : articles.length}곳
                                </span>
                            </div>

                            {/* 해당 도의 시/군 칩 목록 */}
                            {activeProvinceMeta && availableCitiesInProvince.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-200/70">
                                    <p className="text-[11px] font-bold text-slate-500 mb-2">세부 시·군 선택:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            onClick={() => handleCityClick(null)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                                !selectedCity
                                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
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
                                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
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

                        {/* 선택된 스팟 팝오버 프리뷰 또는 추천 리스트 */}
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
                            {filteredSpots.length > 0 ? (
                                filteredSpots.slice(0, 4).map(spot => (
                                    <div
                                        key={spot.id}
                                        onClick={() => setSelectedSpot(spot)}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer group flex gap-3 items-center ${
                                            selectedSpot?.id === spot.id
                                                ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200'
                                                : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50/50'
                                        }`}
                                    >
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                                            <img
                                                src={spot.thumbnail || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80'}
                                                alt={spot.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
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
                                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-extrabold shrink-0 transition-colors shadow-2xs"
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
                                        지도의 도/광역시를 클릭해 보세요!
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        지역별 명소 핀과 추천 여행 코스를 바로 확인할 수 있습니다.
                                    </p>
                                </div>
                            )}

                            {filteredSpots.length > 4 && (
                                <p className="text-center text-[11px] text-slate-400 font-medium">
                                    외 {filteredSpots.length - 4}개의 명소가 하단 리스트에 정렬되어 있습니다 ↓
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
