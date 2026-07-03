// 사주팔자 및 음양오행 계산 결정론적 알고리즘 모듈
// 생년월일시 데이터를 해싱하여 동일 인물 입력 시 언제나 동일한 사주 결과가 나오도록 설계되었습니다.

export interface SajuResult {
    ganji: {
        year: string;  // 연주 (예: 甲子)
        month: string; // 월주 (예: 丙寅)
        day: string;   // 일주 (예: 戊辰)
        time: string;  // 시주 (예: 庚午)
    };
    elements: {
        wood: number;  // 목 (木) 비율 %
        fire: number;  // 화 (火) 비율 %
        earth: number; // 토 (土) 비율 %
        metal: number; // 금 (金) 비율 %
        water: number; // 수 (水) 비율 %
    };
    elementsCount: {
        wood: number;
        fire: number;
        earth: number;
        metal: number;
        water: number;
    };
    analysis: {
        nature: string;    // 본질 및 성향 총평
        wealth: string;    // 재물운
        love: string;      // 애정운/대인관계
        health: string;    // 건강 및 조언
    };
    mbti: {
        type: string;      // 사주 MBTI 성향 (예: INFP)
        character: string; // 한글 매칭 타이틀 (예: 겨울에 태어난 굳건한 소나무 🌲)
        description: string;
    };
    investment: {
        style: string;     // 투자 성향 (예: 공격적인 불꽃 투자)
        sector: string;    // 추천 섹터 (예: IT/반도체)
        description: string;
    };
    business: {
        title: string;     // 비즈니스 한줄 요약 (예: 중요한 계약 성사 주간)
        desc: string;      // 상세 묘사
    };
    generalScore: number;  // 오늘의 총점 (80 ~ 98점 범위)
    luckyTime: string;     // 행운의 시간대
    luckyColor: string;    // 행운의 컬러 영문/한글
    zodiac: string;        // 띠 이름 (예: 🐉 청룡띠)
}

const CHEONGAN = ['갑(甲)', '을(을)', '병(丙)', '정(丁)', '무(戊)', '기(己)', '경(庚)', '신(辛)', '임(壬)', '계(癸)'];
const JIJI = ['자(子)', '축(丑)', '인(寅)', '묘(卯)', '진(辰)', '사(巳)', '오(午)', '미(未)', '신(申)', '유(酉)', '술(戌)', '해(亥)'];
const ZODIAC_EMOJIS = ['🐭', '🐮', '🐯', '🐰', '🐉', '🐍', '🐴', '🐑', '🐵', '🐔', '🐶', '🐷'];
const ZODIAC_NAMES = ['쥐띠', '소띠', '호랑이띠', '토끼띠', '용띠', '뱀띠', '말띠', '양띠', '원숭이띠', '닭띠', '개띠', '돼지띠'];

// 천간별 오행 매핑
const CHEONGAN_ELEMENT: Record<string, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
    '갑(甲)': 'wood', '을(을)': 'wood',
    '병(丙)': 'fire', '정(丁)': 'fire',
    '무(戊)': 'earth', '기(己)': 'earth',
    '경(庚)': 'metal', '신(辛)': 'metal',
    '임(壬)': 'water', '계(癸)': 'water'
};

// 지지별 오행 매핑
const JIJI_ELEMENT: Record<string, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
    '인(寅)': 'wood', '묘(卯)': 'wood',
    '사(巳)': 'fire', '오(午)': 'fire',
    '진(辰)': 'earth', '미(未)': 'earth', '술(戌)': 'earth', '축(丑)': 'earth',
    '신(申)': 'metal', '유(酉)': 'metal',
    '자(子)': 'water', '해(亥)': 'water'
};

// 심플 해시 함수 (시드 고정용)
function getSeedHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

export function calculateSaju(name: string, gender: 'M' | 'F', dateStr: string, timeHour: string, isSolar: boolean): SajuResult {
    // 시드 키 생성 (이름 + 생년월일 + 시간 + 양음력) -> 결과 결정론적 고정
    const seedKey = `${name}_${gender}_${dateStr}_${timeHour}_${isSolar ? 'solar' : 'lunar'}`;
    const seed = getSeedHash(seedKey);

    // 1. 천간 지지 추출 (시드 기반)
    const yearIndex = (seed % 10);
    const yearJijiIndex = ((seed + 2) % 12);

    const monthIndex = ((seed + 3) % 10);
    const monthJijiIndex = ((seed + 5) % 12);

    const dayIndex = ((seed + 7) % 10);
    const dayJijiIndex = ((seed + 1) % 12);

    // 시간 입력에 따른 인덱스
    const timeNum = timeHour === 'unknown' ? (seed % 24) : parseInt(timeHour, 10);
    const timeJijiIndex = Math.floor(((timeNum + 1) % 24) / 2); // 12시진
    const timeIndex = ((seed + timeJijiIndex) % 10);

    const yearGan = CHEONGAN[yearIndex];
    const yearJi = JIJI[yearJijiIndex];

    const monthGan = CHEONGAN[monthIndex];
    const monthJi = JIJI[monthJijiIndex];

    const dayGan = CHEONGAN[dayIndex];
    const dayJi = JIJI[dayJijiIndex];

    const timeGan = CHEONGAN[timeIndex];
    const timeJi = JIJI[timeJijiIndex];

    // 8글자 셋업
    const eightCharacters = [
        { type: 'gan', val: yearGan, elem: CHEONGAN_ELEMENT[yearGan] },
        { type: 'ji', val: yearJi, elem: JIJI_ELEMENT[yearJi] },
        { type: 'gan', val: monthGan, elem: CHEONGAN_ELEMENT[monthGan] },
        { type: 'ji', val: monthJi, elem: JIJI_ELEMENT[monthJi] },
        { type: 'gan', val: dayGan, elem: CHEONGAN_ELEMENT[dayGan] },
        { type: 'ji', val: dayJi, elem: JIJI_ELEMENT[dayJi] },
        { type: 'gan', val: timeGan, elem: CHEONGAN_ELEMENT[timeGan] },
        { type: 'ji', val: timeJi, elem: JIJI_ELEMENT[timeJi] }
    ];

    // 2. 오행 카운팅 및 가중치 분배
    const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    
    eightCharacters.forEach((char, idx) => {
        let weight = 10;
        if (char.type === 'ji') weight = 15;
        if (idx === 4) weight = 20; // 일주 천간
        
        counts[char.elem] += weight;
    });

    const totalWeight = Object.values(counts).reduce((a, b) => a + b, 0);
    
    const elements = {
        wood: Math.round((counts.wood / totalWeight) * 100),
        fire: Math.round((counts.fire / totalWeight) * 100),
        earth: Math.round((counts.earth / totalWeight) * 100),
        metal: Math.round((counts.metal / totalWeight) * 100),
        water: Math.round((counts.water / totalWeight) * 100)
    };

    const sum = elements.wood + elements.fire + elements.earth + elements.metal + elements.water;
    if (sum !== 100) {
        const diff = 100 - sum;
        const maxKey = Object.keys(elements).reduce((a, b) => 
            elements[a as keyof typeof elements] > elements[b as keyof typeof elements] ? a : b
        ) as keyof typeof elements;
        elements[maxKey] += diff;
    }

    const elementsCount = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    eightCharacters.forEach(c => {
        elementsCount[c.elem]++;
    });

    const dayElement = CHEONGAN_ELEMENT[dayGan];

    let natureText = '';
    let wealthText = '';
    let loveText = '';
    let healthText = '';

    // 본질 성향 분석
    if (dayElement === 'wood') {
        natureText = `${name}님은 자비롭고 진취적인 목(木)의 성질을 타고나셨습니다. 봄에 돋아나는 새싹처럼 호기심이 많고 새로운 일을 기획하고 밀고 나가는 선구자적 역량이 강합니다.`;
        wealthText = `목 기운의 재물은 대지(토)에 깊이 내리는 신뢰의 뿌리에서 나옵니다. 단기 성향의 테마주 투자보다 적금이나 안전 자산에 오랫동안 묶어두는 편이 유리합니다.`;
        loveText = `정이 많고 다정한 편으로 관계의 신뢰를 중시합니다. 자존심 고집만 다스리면 상대에게 큰 안정감을 주어 영구적인 사랑을 이루기에 안성맞춤입니다.`;
        healthText = `목의 기운은 간(肝)과 신경계를 지배합니다. 피로 누적이 간으로 쏠릴 수 있으니 평소 붉은 육류를 줄이고 충분한 취침과 녹색 채소를 가까이 하십시오.`;
    } else if (dayElement === 'fire') {
        natureText = `${name}님은 밝고 열정적인 화(火)의 성질을 타고나셨습니다. 등불이나 태양처럼 명랑하고 직관력이 뛰어나며 대인관계에서 엄청난 흡입력과 친화력을 뿜어냅니다.`;
        wealthText = `화 기운의 재테크는 강렬한 포착력이 매력적입니다. 트렌드 변화에 아주 민감하여 숏텀 기회에 강합니다. 다만 계획성 없는 충동적 과소비를 차단해야 합니다.`;
        loveText = `불꽃처럼 뜨겁게 타오르는 낭만주의자입니다. 단기간에 몰입해 연인에게 감동을 선사하나, 일정한 주기마다 다가오는 관계의 정체기를 극복하는 인내가 필요합니다.`;
        healthText = `화의 기운은 심장(心)과 혈액순환을 나타냅니다. 열이 상체로 차오르는 혈압 변화를 조심하시고 족욕과 명상으로 화기를 식히는 것이 유용합니다.`;
    } else if (dayElement === 'earth') {
        natureText = `${name}님은 듬직하고 조화로운 토(土)의 성질을 타고나셨습니다. 만물을 포용하는 대지처럼 포용력과 성실함이 뛰어나며 약속과 신의를 무엇보다 소중히 여깁니다.`;
        wealthText = `흙은 귀금속을 안전히 담는 비밀 금고입니다. 꾸준하게 모으는 안정적인 연금형 포트폴리오가 최고의 효율을 내며, 복리 효과를 누릴수록 큰 부를 움켜쥐게 됩니다.`;
        loveText = `첫눈에 타오르기보단 서서히 스며드는 연애에 강합니다. 오래 알고 지낸 사이에서 운명적인 만남을 가질 확률이 높으며 결혼 상대로 최고의 든든함을 줍니다.`;
        healthText = `토의 기운은 위장과 소화기계를 나타냅니다. 자극적이거나 급히 먹는 습관은 탈을 부르기 쉬우니 한식 위주로 소식하며 위를 보호하는 웰빙 식단이 어울립니다.`;
    } else if (dayElement === 'metal') {
        natureText = `${name}님은 결단력 있고 뚝심 있는 금(金)의 성질을 타고나셨습니다. 날카로운 칼날처럼 시시비비를 날카롭게 가리고 결정을 내린 뒤에는 거침없이 나아갑니다.`;
        wealthText = `금융과 숫자에 천부적인 직관을 지녔습니다. 2차전지나 자동차 등 견고한 제조 산업 섹터의 정밀한 가치분석형 장기 투자에 특히 소질이 뛰어납니다.`;
        loveText = `자존심이 다소 강해 서툴러 보일 수 있지만 내 사람에겐 한없이 퍼주는 든든한 소나무형 연애를 합니다. 연인에게 지나친 솔직함을 덜어내면 완벽합니다.`;
        healthText = `금의 기운은 폐(호흡기)와 대장 계통을 관장합니다. 환절기 면역 관리에 유의하시고, 유산균이나 도라지차를 가까이해 장과 기관지를 보호하십시오.`;
    } else {
        natureText = `${name}님은 지혜롭고 유연한 수(水)의 성질을 타고나셨습니다. 잔잔하게 흐르는 강물처럼 환경 적응력이 뛰어나며 참모로서 남을 지휘하는 통찰과 지모가 깊습니다.`;
        wealthText = `물이 모여 바다를 만들듯 보이지 않는 무형의 자산을 흐르게 하는 재물 흐름이 우수합니다. 배당주, 이커머스, 지식 콘텐츠 분야에서 높은 성취를 냅니다.`;
        loveText = `상대의 마음에 자연스레 스며들어 마음의 위안을 제공합니다. 다만 가끔 속내를 숨겨 상대에게 오해를 불러일으킬 수 있으니 가벼운 의사 표현을 늘리십시오.`;
        healthText = `수의 기운은 신장, 방광 및 호르몬계를 관장합니다. 몸의 온기를 불어넣는 반신욕이나 유산소 운동이 잘 어울리며 과도한 염분 섭취를 피해 신장을 조절하십시오.`;
    }

    // 3. VERA 고유 크로스 링킹용 데이터 결정론적 매핑 (API 비용 절감)
    // 띠 계산
    const birthYear = parseInt(dateStr.split('-')[0], 10) || 1995;
    const zodiacIndex = (birthYear - 4) % 12;
    const zodiac = `${ZODIAC_EMOJIS[zodiacIndex]} ${ZODIAC_NAMES[zodiacIndex]}`;

    // 오늘의 총점 (82 ~ 99점 사이 해싱)
    const generalScore = 80 + (seed % 20);

    // 행운의 시간대
    const luckyTimeHour = (seed + 7) % 12 + 8; // 아침 8시 ~ 저녁 8시 사이
    const luckyTime = `${String(luckyTimeHour).padStart(2, '0')}:00 ~ ${String(luckyTimeHour + 2).padStart(2, '0')}:00`;

    // 행운의 컬러
    const colors = [
        { name: 'Classic Navy (네이비)', hex: '#1e3a8a' },
        { name: 'Aurora Purple (퍼플)', hex: '#7c3aed' },
        { name: 'Forest Green (그린)', hex: '#10b981' },
        { name: 'Sunset Orange (오렌지)', hex: '#f97316' },
        { name: 'Carbon Gold (골드)', hex: '#eab308' }
    ];
    const luckyColorObj = colors[seed % colors.length];
    const luckyColor = luckyColorObj.name;

    // ① AI 투자운 연동 모델
    const investStyles: Record<string, { style: string; sector: string; description: string }> = {
        wood: {
            style: '차분한 스노우볼 적립 투자 🌳',
            sector: '친환경/농업테크/바이오헬스',
            description: '오늘은 성장의 에너지가 차오르는 타이밍! 바이오헬스나 농업테크와 같은 장기 성장이 예고된 가치 섹터에 적립식으로 탑승해보세요.'
        },
        fire: {
            style: '공격적인 하이 리턴 모멘텀 투자 🔥',
            sector: 'IT/반도체/AI 소프트웨어',
            description: '뜨거운 불(火)의 추진력이 폭발하는 날! 변동성이 크더라도 강한 상승세를 보이는 대장주 IT/반도체 섹터의 모멘텀 투자가 행운을 줍니다.'
        },
        earth: {
            style: '안정적인 인컴 배당 투자 ⛰️',
            sector: '고배당 주식/부동산 리츠/원자재',
            description: '안정의 흙(土) 기운이 자산을 단단히 붙잡아주는 투자일. 변동성이 낮고 든든한 방어력의 전통 인프라 배당주로 포트폴리오 안전핀을 꽂으세요.'
        },
        metal: {
            style: '날카로운 정밀 분석 가치 투자 ⚙️',
            sector: '이차전지/자동차/조선 금융',
            description: '차가운 쇠(金)의 기운이 냉철한 판단력을 선물하는 날입니다. 2차전지나 자동차 등 정밀 분석 기반의 저평가 우량주를 발굴하는 데 최고의 날입니다.'
        },
        water: {
            style: '유연한 자금 현금화 대기 투자 💧',
            sector: '채권/안전자산(금)/보안기술',
            description: '유동성이 넘치는 수(水)의 기운. 무리하게 풀매수하기보다는 현금 비중을 높여 관망하다가 금이나 채권 등 안전자산으로 유연하게 조율하십시오.'
        }
    };
    const investment = investStyles[dayElement];

    // ② 사주 MBTI 모델
    const mbtiModels: Record<string, { type: string; character: string; description: string }> = {
        wood: {
            type: 'ENFJ - 따뜻한 숲의 조율가',
            character: '겨울을 이겨내고 굳건히 자란 소나무 🌲',
            description: '풍부한 호기심과 강한 성장의 의지로 주위 사람들을 든든하게 보듬으며 성장을 이끄는 목(木) 기운의 대표적 선구자입니다.'
        },
        fire: {
            type: 'ENFP - 열정의 불꽃 활력가',
            character: '축제의 한가운데에서 빛나는 열정 불꽃 🎇',
            description: '지루한 일상을 거부하고 매 순간 새로운 즐거움과 영감을 뿜어내며 주위 사람들에게 엄청난 에너지를 선사하는 불(火)의 아티스트입니다.'
        },
        earth: {
            type: 'ISFJ - 신의를 품은 대지의 수호자',
            character: '만물에게 생명을 베푸는 조화로운 대지 ⛰️',
            description: '타인의 이야기를 누구보다 깊게 경청해주고 신의를 지키며, 보이지 않는 곳에서 묵묵히 버팀목이 되는 안정과 평화의 수호자입니다.'
        },
        metal: {
            type: 'ISTJ - 결단력 있는 강철 분석가',
            character: '어두운 바위를 깨부수는 은빛 칼날 ⚔️',
            description: '한 번 시작한 계약이나 약속은 뼈를 깎아서라도 지켜내며, 칼같이 예리한 안목과 결단력으로 최고의 아웃풋을 뽑아내는 승부사입니다.'
        },
        water: {
            type: 'INTP - 세상을 통찰하는 현명한 책사',
            character: '밤하늘 아래 유유히 흐르는 깊은 바다 🌊',
            description: '임기응변과 상황 판단 속도가 전 오행 중 가장 뛰어납니다. 환경에 따라 유연하게 카멜레온처럼 변모하며 솔루션을 만드는 지혜로운 책사입니다.'
        }
    };
    const mbti = mbtiModels[dayElement];

    // ③ B2B 비즈니스 운세 모델
    const businessModels: Record<string, { title: string; desc: string }> = {
        wood: {
            title: '창의적인 제안 및 신사업 수립운',
            desc: '새싹이 땅을 뚫고 솟아오르는 형국입니다. 기존 사업에 새로운 아이디어나 파트너십 제안서를 작성해 미팅을 전개하기에 최고의 일주일입니다.'
        },
        fire: {
            title: '화려한 성과 홍보 및 대외 PT 마케팅운',
            desc: '브랜드와 실적을 만천하에 드러낼 때입니다. 광고 캠페인을 전개하거나, 중요한 바이어를 대상으로 마케팅 프레젠테이션을 전개하면 성사율이 극대화됩니다.'
        },
        earth: {
            title: '복잡한 이권 타협 및 단가 협상 조율운',
            desc: '단단한 대지가 중재하는 화평의 기간입니다. 거래처와의 이견 대립이나 단가 계약 등의 조율 문제를 든든한 신뢰 관계로 타결하기 매우 좋습니다.'
        },
        metal: {
            title: '문서 서명 및 신규 계약 도장운',
            desc: '금속 인장이 단단하게 계약서에 찍히는 문서 운입니다. 미뤄왔던 법인 임대차 계약, 정식 파트너십 문서 서명 등 공식 날짜를 결정하기 아주 좋습니다.'
        },
        water: {
            title: '자금 회수 및 유동성 채널 재조정운',
            desc: '물이 고여 웅덩이를 메우는 재정 길운입니다. 막혀있던 미수금이 돌아오거나, 새로운 투자 유치 자금 활로가 열리며 자금 순환계가 깨끗이 개방됩니다.'
        }
    };
    const business = businessModels[dayElement];

    return {
        ganji: {
            year: `${yearGan.substring(0, 1)}${yearJi.substring(0, 1)}`,
            month: `${monthGan.substring(0, 1)}${monthJi.substring(0, 1)}`,
            day: `${dayGan.substring(0, 1)}${dayJi.substring(0, 1)}`,
            time: `${timeGan.substring(0, 1)}${timeJi.substring(0, 1)}`
        },
        elements,
        elementsCount,
        analysis: {
            nature: natureText,
            wealth: wealthText,
            love: loveText,
            health: healthText
        },
        mbti,
        investment,
        business,
        generalScore,
        luckyTime,
        luckyColor,
        zodiac
    };
}
