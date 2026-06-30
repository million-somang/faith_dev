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
}

const CHEONGAN = ['갑(甲)', '을(을)', '병(丙)', '정(丁)', '무(戊)', '기(己)', '경(庚)', '신(辛)', '임(壬)', '계(癸)'];
const JIJI = ['자(子)', '축(丑)', '인(寅)', '묘(卯)', '진(辰)', '사(巳)', '오(午)', '미(未)', '신(申)', '유(酉)', '술(戌)', '해(亥)'];

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
    // 지지(Ji)와 일주(Day) 천간에 가중치를 주는 정밀 가중치 시스템
    const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    
    eightCharacters.forEach((char, idx) => {
        let weight = 10; // 기본 가중치
        if (char.type === 'ji') weight = 15; // 지지에 가중치
        if (idx === 4) weight = 20; // 본인을 상징하는 일간(日干)에 큰 가중치
        
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

    // 가끔 반올림 오차로 100% 안 맞을 때 보정
    const sum = elements.wood + elements.fire + elements.earth + elements.metal + elements.water;
    if (sum !== 100) {
        const diff = 100 - sum;
        // 가장 큰 기운에 차이 분배
        const maxKey = Object.keys(elements).reduce((a, b) => 
            elements[a as keyof typeof elements] > elements[b as keyof typeof elements] ? a : b
        ) as keyof typeof elements;
        elements[maxKey] += diff;
    }

    // 오행 개수
    const elementsCount = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    eightCharacters.forEach(c => {
        elementsCount[c.elem]++;
    });

    // 3. 가장 강한 기운(일간 및 최다 오행)에 따른 운세 텍스트 제안
    const mainElement = Object.keys(elements).reduce((a, b) => 
        elements[a as keyof typeof elements] > elements[b as keyof typeof elements] ? a : b
    ) as 'wood' | 'fire' | 'earth' | 'metal' | 'water';

    const dayStem = dayGan.replace(/\(.*?\)/g, ''); // 한글만 추출
    const dayElement = CHEONGAN_ELEMENT[dayGan];

    let natureText = '';
    let wealthText = '';
    let loveText = '';
    let healthText = '';

    // 본질 성향 분석 데이터베이스
    if (dayElement === 'wood') {
        natureText = `${name}님은 자비롭고 진취적인 목(木)의 성질을 타고나셨습니다. 마치 봄에 돋아나는 새싹이나 꿋꿋하게 뻗어나가는 나무와 같이 호기심이 많고 늘 새로운 일을 기획하고 추진하는 선구자적 역량이 강합니다. 다만, 굳은 신념이 고집으로 바뀔 수 있으므로 융통성을 발휘하는 연습이 필요합니다.`;
        wealthText = `나무가 흙에 뿌리를 내리고 영양분을 흡수하듯, 목 기운의 재물은 안정적인 터전(토)에서 나옵니다. 충동적인 투자보다는 부동산이나 적금처럼 확실한 실물 자산으로 묶어두는 재테크가 유리하며, 장기적인 안목을 가질 때 큰 재물이 형성됩니다.`;
        loveText = `정이 많고 다정한 편이라 대인관계에서 신망을 얻습니다. 연애에서는 한 사람에게 깊은 충성을 보이지만, 연인이 본인의 굳은 기준에 맞추어 주기를 바라는 통제 성향을 조심해야 평탄하고 오랜 애정선을 유지할 수 있습니다.`;
        healthText = `목의 기운은 한의학적으로 간(肝)과 신경계를 관장합니다. 스트레스나 피로가 간에 누적되기 쉬우니 과로를 피하고 휴식을 취해야 합니다. 초록색 채소 섭취와 가벼운 산책이 개운에 큰 도움을 줍니다.`;
    } else if (dayElement === 'fire') {
        natureText = `${name}님은 밝고 열정적인 화(火)의 성질을 타고나셨습니다. 어둠을 밝히는 등불이나 대지를 비추는 태양처럼 명랑하고 직관력이 뛰어나며 자기표현과 사교성이 아주 풍부합니다. 불의를 보면 참지 못하는 정의로움도 지니고 있습니다. 급한 성정과 불같이 일어났다 식는 끈기를 다스리는 편이 좋습니다.`;
        wealthText = `화 기운의 재물은 금(金)을 녹여 기물로 만드는 화련(火鍊)의 속성을 지닙니다. 두뇌 회전이 빠르고 트렌드 캐치 능력이 좋아 단기적인 기회 포착에 강합니다. 다만, 지출 장벽이 다소 낮으므로 신용카드 한도를 조절하는 등의 강제 저축 수단이 필요합니다.`;
        loveText = `사랑을 할 때도 불꽃처럼 뜨겁게 달아오르는 타입입니다. 첫눈에 반하는 연애를 선호하며 상대방에게 자신의 열정을 아낌없이 쏟아붓습니다. 단, 연애 초기의 뜨거움이 조금 식었을 때 쉽게 권태로움을 느끼지 않도록 주의해야 합니다.`;
        healthText = `화의 기운은 심장(心)과 혈액순환계를 관장합니다. 혈압 관리 및 만성 안구건조에 주의해야 하며, 열이 상체로 쏠릴 때는 냉수마찰이나 족욕이 좋습니다. 붉은색 토마토나 베리류가 잘 맞습니다.`;
    } else if (dayElement === 'earth') {
        natureText = `${name}님은 듬직하고 조화로운 토(土)의 성질을 타고나셨습니다. 만물을 포용하고 길러내는 대지와 같이 중립적이며 포용력과 신용이 매우 높습니다. 타인의 비밀을 잘 지켜주고 묵묵히 자신의 역할을 수행해 주위의 든든한 버팀목 역할을 해냅니다. 다만 지나친 중립 고수로 우유부단해지거나 고집이 단단해질 우려가 있습니다.`;
        wealthText = `흙은 보물을 품는 창고의 역할을 합니다. 타고난 재물운이 안정적인 편에 속하며 차곡차곡 모으는 저축형 재물 형성에 강합니다. 급격한 일확천금을 노리는 도박성 투자보다는 안정적인 토지, 건물 등의 안전 자산 위주의 축적이 부를 가져다줍니다.`;
        loveText = `첫인상이 불같이 뜨겁진 않지만 갈수록 진국이라는 소리를 듣는 편입니다. 오래 알고 지낸 친구나 동료에서 연인으로 발전할 확률이 높고, 듬직하게 상대방을 감싸주어 결혼 상대로 인기가 매우 높습니다.`;
        healthText = `토의 기운은 소화기계(脾胃)를 나타냅니다. 위염이나 소화불량에 취약하므로 규칙적인 식사 습관이 핵심이며, 속이 답답할 때는 자극적인 음식을 피하고 따뜻한 차를 가까이하는 것이 개운을 돕습니다.`;
    } else if (dayElement === 'metal') {
        natureText = `${name}님은 결단력 있고 날카로운 금(金)의 성질을 타고나셨습니다. 제련된 칼날이나 가을의 서리처럼 정의감이 넘치고 시시비비를 명확히 가리며, 한 번 뱉은 말은 반드시 실천하는 강한 의지와 결단력이 돋보입니다. 매사에 빈틈없이 추진하나, 차갑고 맺고 끊음이 너무 냉정하여 주변 사람들에게 서운함을 살 수 있습니다.`;
        wealthText = `칼날처럼 정확한 분석을 통해 기회를 포착합니다. 금(金)은 자체로 화폐나 가치 자산을 의미하므로 수리와 금융 감각이 발달한 분이 많습니다. 회계나 분석을 통한 정밀 투자가 어울리며, 지인과의 돈거래는 칼같이 거절해야 재물을 지킵니다.`;
        loveText = `호불호가 명확하고 한 번 마음을 닫으면 뒤돌아보지 않는 냉철함이 있습니다. 하지만 내 사람이라고 판단하면 뼈를 묻을 정도로 헌신하는 의리가 있습니다. 자존심 대립을 피하고 부드러운 화법을 쓰는 것이 좋습니다.`;
        healthText = `금의 기운은 호흡기계(肺)와 대장을 관장합니다. 미세먼지나 환절기 기관지 질환에 취약하므로 도라지차나 물을 자주 마시고 대장 건강(유산균)을 챙기는 것이 체력 유지와 운을 여는 열쇠입니다.`;
    } else {
        natureText = `${name}님은 유연하고 지혜로운 수(水)의 성질을 타고나셨습니다. 흐르는 물이나 넓은 바다와 같이 임기응변에 능하고, 지혜로우며, 담는 그릇에 따라 모습을 바꾸듯 환경 적응력이 매우 뛰어납니다. 보이지 않는 곳에서 상황을 조율하는 참모나 지략가 성향이 짙습니다. 단, 생각이 너무 많아 실행력이 늦어지거나 소극적으로 변할 수 있습니다.`;
        wealthText = `물이 흘러내려 모이듯 재물이 보이지 않게 스며드는 구조입니다. 정보와 지식을 가공하여 부를 창출하는 유통업, 지식 정보 산업 투자 등에 두각을 보입니다. 단, 유동성이 강한 자산이므로 쉽게 빠져나가지 않도록 묶어두는 금융 봉인이 필수적입니다.`;
        loveText = `물처럼 상대방에게 스며드는 자연스러운 연애를 합니다. 상대의 감정을 잘 이해하고 맞춰주어 편안함을 줍니다. 다만 자신의 속마음을 투명하게 표현하지 않고 쌓아두었다가 갑자기 이별을 통보하는 잠수 성향을 지양해야 합니다.`;
        healthText = `수의 기운은 신장(腎) 및 자궁, 비뇨기계를 관장합니다. 하체가 차가워지기 쉬우니 반신욕이나 유산소 운동으로 열 순환을 돕고 짠 음식을 피하는 것이 건강과 활력적인 사주 개운에 좋습니다.`;
    }

    // 오행 극단적 쏠림에 따른 한마디 조언 추가 (가장 큰 오행 가치 분석)
    let extraAdvice = '';
    if (elements[mainElement] >= 45) {
        const elemName = { wood: '목(나무)', fire: '화(불)', earth: '토(흙)', metal: '금(쇠)', water: '수(물)' }[mainElement];
        extraAdvice = ` (참고로 사주 오행 중 ${elemName}의 기운이 ${elements[mainElement]}%로 다소 강하게 쏠려 있어 해당 오행의 단점이 도드라질 수 있으니, 상극이 되는 기운의 옷이나 인테리어 컬러로 균형을 맞추시면 좋습니다.)`;
        natureText += extraAdvice;
    }

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
        }
    };
}
