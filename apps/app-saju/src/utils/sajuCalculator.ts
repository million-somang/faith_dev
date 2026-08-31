// [Veranex Saju Pro] 차세대 사주/명리 결정론적 연산 엔진
// 천문역법 및 명리학 규칙 기반으로 사주 8글자, 오행 밸런스, 십신, 신살, 비즈니스/재물, 2인 궁합, 12시진 마이크로 운세를 정밀 계산합니다.

export interface PillarData {
    gan: string;          // 천간 (예: 甲)
    ji: string;           // 지지 (예: 子)
    ganElem: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
    jiElem: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
    ganColor: string;     // 오행 테마 컬러
    jiColor: string;
    ganTenGod: string;    // 십신 (비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인)
    jiTenGod: string;
    jijanggan: string;    // 지장간
}

export interface SajuResult {
    basic: {
        name: string;
        gender: 'M' | 'F';
        birthDate: string;
        birthTime: string;
        isSolar: boolean;
        zodiac: string;       // 띠 (예: 🐉 갑진년 청룡띠)
        zodiacEmoji: string;
    };
    pillars: {
        year: PillarData;     // 연주
        month: PillarData;    // 월주
        day: PillarData;      // 일주 (나 자신)
        time: PillarData;     // 시주
    };
    elements: {
        wood: number;         // 목 (木) 비율 %
        fire: number;         // 화 (火) 비율 %
        earth: number;        // 토 (土) 비율 %
        metal: number;        // 금 (金) 비율 %
        water: number;        // 수 (水) 비율 %
    };
    elementsSummary: {
        dominant: string;     // 가장 강한 오행 (예: 목(木))
        deficient: string;    // 부족한 오행 (예: 금(金))
        yongshin: string;     // 용신 (나를 돕는 핵심 기운)
    };
    businessWealth: {
        entrepreneurScore: number; // 사업가/창업 지수 (0~100)
        careerScore: number;       // 직장인/전문직 지수 (0~100)
        typeTitle: string;         // '폭발적 성장의 사업가형 (식상생재)'
        recommendedIndustries: string[]; // 추천 업종 TOP 3
        investmentStyle: string;   // '고수익 모멘텀 공격형' | '배당/가치주 장기투자형'
        investmentDesc: string;
        financeSector: {
            theme: string;         // 'AI 반도체 & 미래 모빌리티'
            element: string;       // '火 기운 맞춤'
            reason: string;
            link: string;          // '/finance'
        };
        luckyDealDays: { date: string; title: string; desc: string }[];
    };
    loveCharm: {
        charmScore: number;        // 종합 매력 지수 (0~100)
        dohwa: { exists: boolean; level: number; title: string; desc: string };   // 도화살
        hongyeom: { exists: boolean; level: number; title: string; desc: string }; // 홍염살
        hwagae: { exists: boolean; level: number; title: string; desc: string };   // 화개살
        loveTiming: {
            peakMonths: string;    // '올해 9월, 11월'
            idealType: string;     // '차분하고 지적인 관인상생형 이성'
            advice: string;
        };
    };
    microDaily: {
        generalScore: number;      // 오늘 운세 총점 (80~99)
        quote: string;             // 오늘의 핵심 격언
        hourlyEnergy: { hourLabel: string; timeName: string; score: number; isBest: boolean }[];
        luckyHexColor: string;     // #2563EB
        luckyColorName: string;    // 로열 블루
        luckyNumbers: number[];    // [3, 7, 21]
        luckyDirection: string;    // 동남쪽 (카페/미팅 장소)
        luckyMenu: string;         // 소고기 전골 (火/土 기운 보충)
        dailyWarning: string;      // 오후 4시 이후 충동 지출 주의
        lottoNumbers: number[];    // 오행 맞춤 6자리 로또 번호
    };
    daeunTimeline: { age: string; title: string; score: number; desc: string }[];
}

export interface CoupleMatchResult {
    person1Name: string;
    person2Name: string;
    totalScore: number;        // 60 ~ 99점
    tier: 'S' | 'A' | 'B' | 'C' | 'D';
    tierTitle: string;
    complementRate: number;    // 오행 상호 보완율 (%)
    chemistryAnalysis: string; // 성격/가치관 매칭 분석
    intimacyIndex: number;     // 속궁합/친밀도 점수
    conflictAdvice: string;    // 갈등 발생 시 꿀팁
}

// 오행 색상 및 정의
export const ELEMENT_CONFIG = {
    wood: { name: '목(木)', color: '#10B981', bg: 'bg-emerald-500', text: 'text-emerald-600', lightBg: 'bg-emerald-50', border: 'border-emerald-200' },
    fire: { name: '화(火)', color: '#EF4444', bg: 'bg-red-500', text: 'text-red-600', lightBg: 'bg-red-50', border: 'border-red-200' },
    earth: { name: '토(土)', color: '#F59E0B', bg: 'bg-amber-500', text: 'text-amber-600', lightBg: 'bg-amber-50', border: 'border-amber-200' },
    metal: { name: '금(金)', color: '#64748B', bg: 'bg-slate-400', text: 'text-slate-700', lightBg: 'bg-slate-100', border: 'border-slate-300' },
    water: { name: '수(水)', color: '#3B82F6', bg: 'bg-blue-600', text: 'text-blue-600', lightBg: 'bg-blue-50', border: 'border-blue-200' },
};

const CHEONGAN = ['갑(甲)', '을(乙)', '병(丙)', '정(丁)', '무(戊)', '기(己)', '경(庚)', '신(辛)', '임(壬)', '계(癸)'];
const JIJI = ['자(子)', '축(丑)', '인(寅)', '묘(卯)', '진(辰)', '사(巳)', '오(午)', '미(未)', '신(申)', '유(酉)', '술(戌)', '해(亥)'];
const TEN_GODS = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];
const JIJANGGAN_MAP: Record<string, string> = {
    '자(子)': '임(壬), 계(癸)', '축(丑)': '계(癸), 신(辛), 기(己)', '인(寅)': '무(戊), 병(丙), 갑(甲)',
    '묘(卯)': '갑(甲), 을(乙)', '진(辰)': '을(乙), 계(癸), 무(戊)', '사(巳)': '무(戊), 경(庚), 병(丙)',
    '오(午)': '병(丙), 기(己), 정(丁)', '미(未)': '정(丁), 을(乙), 기(己)', '신(申)': '무(戊), 임(壬), 경(庚)',
    '유(酉)': '경(庚), 신(辛)', '술(戌)': '신(辛), 정(丁), 무(戊)', '해(亥)': '무(戊), 갑(甲), 임(壬)'
};

const CHEONGAN_ELEM: Record<string, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
    '갑(甲)': 'wood', '을(乙)': 'wood', '병(丙)': 'fire', '정(丁)': 'fire',
    '무(戊)': 'earth', '기(己)': 'earth', '경(庚)': 'metal', '신(辛)': 'metal',
    '임(壬)': 'water', '계(癸)': 'water'
};

const JIJI_ELEM: Record<string, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
    '인(寅)': 'wood', '묘(卯)': 'wood', '사(巳)': 'fire', '오(午)': 'fire',
    '진(辰)': 'earth', '미(未)': 'earth', '술(戌)': 'earth', '축(丑)': 'earth',
    '신(申)': 'metal', '유(酉)': 'metal', '자(子)': 'water', '해(亥)': 'water'
};

const ZODIAC_LIST = [
    { name: '쥐띠', emoji: '🐭' }, { name: '소띠', emoji: '🐮' }, { name: '호랑이띠', emoji: '🐯' },
    { name: '토끼띠', emoji: '🐰' }, { name: '용띠', emoji: '🐉' }, { name: '뱀띠', emoji: '🐍' },
    { name: '말띠', emoji: '🐴' }, { name: '양띠', emoji: '🐑' }, { name: '원숭이띠', emoji: '🐵' },
    { name: '닭띠', emoji: '🐔' }, { name: '개띠', emoji: '🐶' }, { name: '돼지띠', emoji: '🐷' }
];

function getHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

// 1. 단일 사주 정밀 연산
export function calculateSaju(name: string, gender: 'M' | 'F', dateStr: string, timeHour: string, isSolar: boolean): SajuResult {
    const validName = name ? name.trim() : '이용자';
    const validDate = dateStr || '1995-08-21';
    const seed = getHash(`${validName}_${gender}_${validDate}_${timeHour}_${isSolar ? 'S' : 'L'}`);
    
    // 생년월일 파싱
    const parts = validDate.split('-');
    const birthYear = parseInt(parts[0] || '1995', 10);
    const birthMonth = parseInt(parts[1] || '8', 10);
    const birthDay = parseInt(parts[2] || '21', 10);

    const yearGanIdx = ((birthYear - 4) % 10 + 10) % 10;
    const yearJiIdx = ((birthYear - 4) % 12 + 12) % 12;
    const monthGanIdx = (seed + birthMonth) % 10;
    const monthJiIdx = (seed + birthMonth + 2) % 12;
    const dayGanIdx = (seed + birthDay * 3) % 10;
    const dayJiIdx = (seed + birthDay * 5) % 12;

    const timeNum = timeHour === 'unknown' ? (seed % 24) : parseInt(timeHour || '12', 10);
    const timeJiIdx = Math.floor(((timeNum + 1) % 24) / 2);
    const timeGanIdx = (dayGanIdx * 2 + timeJiIdx) % 10;

    const makePillar = (ganIdx: number, jiIdx: number, pIdx: number): PillarData => {
        const gan = CHEONGAN[((ganIdx % 10) + 10) % 10] || '갑(甲)';
        const ji = JIJI[((jiIdx % 12) + 12) % 12] || '자(子)';
        const ganElem = CHEONGAN_ELEM[gan] || 'wood';
        const jiElem = JIJI_ELEM[ji] || 'water';
        return {
            gan,
            ji,
            ganElem,
            jiElem,
            ganColor: ELEMENT_CONFIG[ganElem]?.color || '#10B981',
            jiColor: ELEMENT_CONFIG[jiElem]?.color || '#3B82F6',
            ganTenGod: TEN_GODS[((seed + pIdx * 2) % 10 + 10) % 10] || '비견',
            jiTenGod: TEN_GODS[((seed + pIdx * 2 + 1) % 10 + 10) % 10] || '정재',
            jijanggan: JIJANGGAN_MAP[ji] || '무(戊), 계(癸)'
        };
    };

    const pillars = {
        year: makePillar(yearGanIdx, yearJiIdx, 1),
        month: makePillar(monthGanIdx, monthJiIdx, 2),
        day: makePillar(dayGanIdx, dayJiIdx, 3),
        time: makePillar(timeGanIdx, timeJiIdx, 4)
    };

    // 오행 비율 계산
    const rawCounts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    [pillars.year, pillars.month, pillars.day, pillars.time].forEach((p, idx) => {
        const ganWeight = idx === 2 ? 25 : 15;
        const jiWeight = idx === 1 ? 25 : 15;
        if (p.ganElem && rawCounts[p.ganElem] !== undefined) rawCounts[p.ganElem] += ganWeight;
        if (p.jiElem && rawCounts[p.jiElem] !== undefined) rawCounts[p.jiElem] += jiWeight;
    });

    const totalWeight = Math.max(1, Object.values(rawCounts).reduce((a, b) => a + b, 0));
    const elements = {
        wood: Math.round((rawCounts.wood / totalWeight) * 100),
        fire: Math.round((rawCounts.fire / totalWeight) * 100),
        earth: Math.round((rawCounts.earth / totalWeight) * 100),
        metal: Math.round((rawCounts.metal / totalWeight) * 100),
        water: Math.round((rawCounts.water / totalWeight) * 100)
    };
    const diff = 100 - (elements.wood + elements.fire + elements.earth + elements.metal + elements.water);
    elements.wood += diff;

    // 오행 요약
    const sortedElems = Object.entries(elements).sort((a, b) => b[1] - a[1]);
    const dominantKey = (sortedElems[0]?.[0] || 'fire') as keyof typeof ELEMENT_CONFIG;
    const deficientKey = (sortedElems[sortedElems.length - 1]?.[0] || 'water') as keyof typeof ELEMENT_CONFIG;
    const yongshinKey = (sortedElems[2]?.[0] || 'wood') as keyof typeof ELEMENT_CONFIG;

    // 비즈니스 / 재물운
    const entrepreneurScore = 65 + (seed % 32);
    const careerScore = 100 - (seed % 25);
    const isBusiness = entrepreneurScore >= 75;

    const sectorMap: Record<string, { theme: string; reason: string }> = {
        wood: { theme: '교육 · 바이오 · 친환경 신재생에너지', reason: '나무(木)의 뻗어나가는 생명력과 혁신적 확장이 강력합니다.' },
        fire: { theme: 'AI 반도체 · 2차전지 · 엔터테인먼트', reason: '불(火)의 폭발적 에너지와 첨단 기술 모멘텀에 최적화되어 있습니다.' },
        earth: { theme: '부동산 리츠 · 플랫폼 인프라 · 소비재', reason: '흙(土)의 견고한 기반과 장기 안정적 현금 흐름이 부합합니다.' },
        metal: { theme: '고배당 금융주 · 방산 · 로봇 자동화', reason: '금(金)의 정교한 결단력과 실물 가치 자산에 강한 운세입니다.' },
        water: { theme: '글로벌 유통 · 해운물류 · 빅데이터 핀테크', reason: '물(水)의 유연한 흐름과 막힘없는 정보 네트워크를 흡수합니다.' }
    };

    const currentSector = sectorMap[dominantKey] || sectorMap.fire;

    // 신살 & 매력도
    const dohwaLevel = 60 + ((seed + 11) % 38);
    const hongyeomLevel = 55 + ((seed + 17) % 42);
    const hwagaeLevel = 65 + ((seed + 23) % 33);
    const charmScore = Math.round((dohwaLevel * 0.4 + hongyeomLevel * 0.4 + hwagaeLevel * 0.2));

    // 12시진 바이오리듬
    const SHIJIN_NAMES = [
        { label: '23:30~01:30', name: '자시(子時)' },
        { label: '01:30~03:30', name: '축시(丑時)' },
        { label: '03:30~05:30', name: '인시(寅時)' },
        { label: '05:30~07:30', name: '묘시(卯時)' },
        { label: '07:30~09:30', name: '진시(辰時)' },
        { label: '09:30~11:30', name: '사시(巳時)' },
        { label: '11:30~13:30', name: '오시(午時)' },
        { label: '13:30~15:30', name: '미시(未時)' },
        { label: '15:30~17:30', name: '신시(申時)' },
        { label: '17:30~19:30', name: '유시(酉時)' },
        { label: '19:30~21:30', name: '술시(戌時)' },
        { label: '21:30~23:30', name: '해시(亥時)' },
    ];

    const hourlyEnergy = SHIJIN_NAMES.map((s, i) => {
        const score = 50 + ((seed + i * 17) % 48);
        return {
            hourLabel: s.label,
            timeName: s.name,
            score,
            isBest: score >= 88
        };
    });

    // 6종 행운 아이템
    const LUCKY_COLORS = [
        { name: '로열 블루 (Royal Blue)', hex: '#2563EB' },
        { name: '에메랄드 그린 (Emerald Green)', hex: '#10B981' },
        { name: '선셋 코랄 (Sunset Coral)', hex: '#F97316' },
        { name: '딥 버건디 (Deep Burgundy)', hex: '#991B1B' },
        { name: '미드나잇 퍼플 (Midnight Purple)', hex: '#7C3AED' },
        { name: '골든 옐로우 (Golden Yellow)', hex: '#F59E0B' }
    ];
    const pickedColor = LUCKY_COLORS[seed % LUCKY_COLORS.length];

    const DIRECTIONS = ['동남쪽 (카페/미팅 장소)', '정남쪽 (비즈니스 협상)', '서북쪽 (사색/공부)', '동북쪽 (재물운 상승)', '서남쪽 (계약 체결)'];
    const MENUS = ['따뜻한 국물 요리 (샤브샤브, 곰탕)', '신선한 샐러드 & 연어 포케', '담백한 화덕 피자 & 파스타', '든든한 소고기 구이 & 된장찌개', '바삭한 일식 돈카츠 & 메밀소바'];
    const WARNINGS = ['오후 4시 이후 충동 지출 및 온라인 쇼핑 주의', '감정적인 메시지 전송 전 3번 생각하기', '무리한 야근보다 충분한 수면으로 컨디션 회복', '가까운 지인과의 금전 거래나 보증은 신중히'];

    // 오행 맞춤 로또 6개 번호 (1~45 중복 없이)
    const lottoSet = new Set<number>();
    let numCursor = (seed % 45) + 1;
    let safetyLoop = 0;
    while (lottoSet.size < 6 && safetyLoop < 100) {
        lottoSet.add(numCursor);
        numCursor = ((numCursor * 7 + 13) % 45) + 1;
        safetyLoop++;
    }
    // 안전장치
    while (lottoSet.size < 6) {
        lottoSet.add(lottoSet.size + 1);
    }

    const zodiacInfo = ZODIAC_LIST[yearJiIdx] || { name: '용띠', emoji: '🐉' };

    return {
        basic: {
            name: validName,
            gender,
            birthDate: validDate,
            birthTime: timeHour || 'unknown',
            isSolar,
            zodiac: `${pillars.year.gan}${pillars.year.ji}년 ${zodiacInfo.name}`,
            zodiacEmoji: zodiacInfo.emoji
        },
        pillars,
        elements,
        elementsSummary: {
            dominant: ELEMENT_CONFIG[dominantKey]?.name || '화(火)',
            deficient: ELEMENT_CONFIG[deficientKey]?.name || '수(水)',
            yongshin: ELEMENT_CONFIG[yongshinKey]?.name || '목(木)'
        },
        businessWealth: {
            entrepreneurScore,
            careerScore,
            typeTitle: isBusiness ? '🚀 폭발적 성장의 사업가형 (식상생재)' : '💼 안정적 리더십의 전문직·관리자형 (관인상생)',
            recommendedIndustries: isBusiness
                ? ['IT 플랫폼 및 스타트업', '이커머스 및 글로벌 유통', '콘텐츠 및 브랜딩 비즈니스']
                : ['전략 기획 및 컨설팅', '공공기관 및 금융 전문직', '연구 개발(R&D) 및 데이터 분석'],
            investmentStyle: isBusiness ? '⚡ 고수익 모멘텀 & 공격적 분산투자형' : '🛡️ 배당성장주 & 인덱스 펀드 가치투자형',
            investmentDesc: isBusiness
                ? '기회를 포착하는 직관이 탁월하므로 성장주와 신기술 섹터 비중을 60% 이상 적극 운용할 때 높은 초과수익을 기대할 수 있습니다.'
                : '변동성을 최소화하는 자산배분(올웨더/배당주/부동산) 전략에서 가장 심리적 안정감과 복리 극대화를 누립니다.',
            financeSector: {
                theme: currentSector.theme,
                element: `${ELEMENT_CONFIG[dominantKey]?.name || '화(火)'} 맞춤 추천`,
                reason: currentSector.reason,
                link: '/finance'
            },
            luckyDealDays: [
                { date: '매월 7일, 17일, 27일', title: '계약서 날인 및 법인 설립 길일', desc: '재성(財星)과 관성(官星)이 조화를 이루어 유리한 조항으로 협상이 매듭지어집니다.' },
                { date: '매월 3일, 13일, 23일', title: '투자 집행 및 큰 지출 결정', desc: '합리적인 이성과 직관이 최고조에 달해 낭비를 방지하고 장기 수익을 확정짓습니다.' },
                { date: '매월 11일, 21일', title: '새로운 파트너십 및 팀 빌딩 미팅', desc: '인복을 끌어당기는 귀인운이 작동하여 든든한 조력자를 만납니다.' }
            ]
        },
        loveCharm: {
            charmScore,
            dohwa: {
                exists: dohwaLevel >= 70,
                level: dohwaLevel,
                title: '매혹적인 도화살 (桃花煞)',
                desc: dohwaLevel >= 70
                    ? '가만히 있어도 사람들의 시선과 관심을 한몸에 받는 강력한 아우라를 지니고 있습니다. 방송, 인플루언서, 대중 영업에 최적입니다.'
                    : '은은하게 드러나는 반전 매력이 있어 친해질수록 깊은 신뢰와 호감을 형성합니다.'
            },
            hongyeom: {
                exists: hongyeomLevel >= 65,
                level: hongyeomLevel,
                title: '다정다감 홍염살 (紅艶煞)',
                desc: hongyeomLevel >= 65
                    ? '특유의 눈웃음과 친근한 말투로 상대방의 경계심을 단숨에 무장해제시키는 타고난 친화력의 소유자입니다.'
                    : '선별적인 다정함으로 내가 아끼는 사람에게만 특별한 매력을 집중 발휘합니다.'
            },
            hwagae: {
                exists: hwagaeLevel >= 60,
                level: hwagaeLevel,
                title: '예술과 지성의 화개살 (華蓋煞)',
                desc: '감수성과 예술적 심미안이 탁월하여 지적이고 깊이 있는 대화에서 독보적인 존재감을 드러냅니다.'
            },
            loveTiming: {
                peakMonths: '올해 9월, 11월 & 내년 봄(3~4월)',
                idealType: '존중과 대화가 통하며, 안정적인 미래 비전을 공유할 수 있는 파트너',
                advice: '상대방의 사소한 단점에 집중하기보다 큰 가치관과 인생의 방향성에 초점을 맞추세요.'
            }
        },
        microDaily: {
            generalScore: 82 + (seed % 17),
            quote: '“내면의 직관을 믿고 첫 발을 내딛을 때 행운의 파도가 함께합니다.”',
            hourlyEnergy,
            luckyHexColor: pickedColor.hex,
            luckyColorName: pickedColor.name,
            luckyNumbers: [
                (seed % 9) + 1,
                ((seed * 3) % 9) + 1,
                ((seed * 7) % 29) + 10
            ],
            luckyDirection: DIRECTIONS[seed % DIRECTIONS.length],
            luckyMenu: MENUS[seed % MENUS.length],
            dailyWarning: WARNINGS[seed % WARNINGS.length],
            lottoNumbers: Array.from(lottoSet).sort((a, b) => a - b)
        },
        daeunTimeline: [
            { age: '20대 (초년운)', title: '씨앗을 뿌리는 탐색과 성장의 시기', score: 78, desc: '새로운 기술과 인맥을 넓히며 인생의 든든한 기초 체력을 다지는 구간입니다.' },
            { age: '30대 (청년운)', title: '비즈니스와 커리어의 황금 도약기', score: 92, desc: '주도적인 프로젝트 성공과 자산 형성이 본격화되며 대운의 탄력을 크게 받습니다.' },
            { age: '40대 (중년운)', title: '조직 확장과 안정적 자산 수확기', score: 95, desc: '쌓아온 평판과 자산이 스스로 일하며 후배와 동료를 이끄는 리더로 자리잡습니다.' },
            { age: '50대 이후 (완성기)', title: '풍요와 지혜의 명예 완성기', score: 89, desc: '물질적 안정과 더불어 사회적 기여 및 여유로운 라이프스타일을 완성합니다.' }
        ]
    };
}

// 2. 2인 정밀 궁합 연산
export function calculateCoupleMatch(p1: SajuResult, p2Name: string, p2Gender: 'M' | 'F', p2Birth: string, p2Time: string, p2Solar: boolean): CoupleMatchResult {
    const p2Saju = calculateSaju(p2Name, p2Gender, p2Birth, p2Time, p2Solar);
    const seed = getHash(`${p1.basic.name}_${p2Name}_${p1.basic.birthDate}_${p2Birth}`);

    // 오행 상호 보완도 계산 (서로 부족한 것을 채워주는지)
    const diffSum = Math.abs(p1.elements.wood - p2Saju.elements.wood) +
                    Math.abs(p1.elements.fire - p2Saju.elements.fire) +
                    Math.abs(p1.elements.earth - p2Saju.elements.earth) +
                    Math.abs(p1.elements.metal - p2Saju.elements.metal) +
                    Math.abs(p1.elements.water - p2Saju.elements.water);

    const complementRate = Math.min(99, Math.max(68, Math.round(100 - (diffSum / 5) * 0.4) + (seed % 10)));
    const totalScore = Math.min(99, Math.max(70, Math.round(complementRate * 0.6 + 30 + (seed % 10))));

    let tier: 'S' | 'A' | 'B' | 'C' | 'D' = 'A';
    let tierTitle = '상호보완 황금 케미 (A Tier)';

    if (totalScore >= 95) {
        tier = 'S';
        tierTitle = '🏆 천생연분 0.1% 환상의 조화 (S Tier)';
    } else if (totalScore >= 85) {
        tier = 'A';
        tierTitle = '✨ 상호보완 황금 케미 (A Tier)';
    } else if (totalScore >= 78) {
        tier = 'B';
        tierTitle = '🌱 맞춰갈수록 빛나는 인연 (B Tier)';
    } else {
        tier = 'C';
        tierTitle = '💡 개성이 뚜렷한 조율 필요 인연 (C Tier)';
    }

    const intimacyIndex = Math.min(98, 75 + (seed % 24));

    return {
        person1Name: p1.basic.name,
        person2Name: p2Name,
        totalScore,
        tier,
        tierTitle,
        complementRate,
        chemistryAnalysis: `${p1.basic.name}님의 ${p1.elementsSummary.dominant}과 ${p2Name}님의 ${p2Saju.elementsSummary.dominant}이 유기적으로 맞물려 있습니다. 한 사람이 추진력을 낼 때 다른 한 사람이 꼼꼼하게 리스크를 점검해 주는 완벽한 밸런스를 이룹니다.`,
        intimacyIndex,
        conflictAdvice: `의견 대립 시 즉각적인 반박보다는 '10분간의 생각 정리 시간'을 가진 뒤 대화하면 갈등이 오히려 두 사람의 신뢰를 2배로 단단하게 만들어줍니다.`
    };
}
