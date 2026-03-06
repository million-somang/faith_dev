export interface SpellRule {
    regex: RegExp;
    replacement: string;
    type: string;
    example?: string;
}

export interface SpellError {
    wrong: string;
    correct: string;
    type: string;
    desc: string;
}

export const spellRules: SpellRule[] = [
    // === 띄어쓰기 오류 ===
    { regex: /([가-힣])수(있|없|도있|도없)/g, replacement: '$1 수 $2', type: '띄어쓰기', example: '할수있 → 할 수 있' },
    { regex: /(못|안)할수/g, replacement: '$1 할 수', type: '띄어쓰기' },
    { regex: /([가-힣])것(같|이|을|도)/g, replacement: '$1 것 $2', type: '띄어쓰기', example: '하는것 → 하는 것' },
    { regex: /([가-힣])만(하|큼)/g, replacement: '$1 만$2', type: '띄어쓰기' },
    { regex: /(하지|되지|오지|가지)않/g, replacement: '$1 않', type: '띄어쓰기' },
    { regex: /([가-힣])뿐(이|만)/g, replacement: '$1 뿐$2', type: '띄어쓰기' },
    { regex: /(이|그|저)런게/g, replacement: '$1런 게', type: '띄어쓰기' },
    { regex: /(한|하는|할|된|될|되는)게/g, replacement: '$1 게', type: '띄어쓰기' },
    { regex: /([가-힣])(할|하는|한|될|되는|된|쓸|쓰는|쓴)게(?![가-힣])/g, replacement: '$1$2 게', type: '띄어쓰기' },
    { regex: /(?<![가-힣])(쓸|쓰는|쓴|할|하는|한|될|되는|된)게(?![가-힣])/g, replacement: '$1 게', type: '띄어쓰기' },
    { regex: /(이럴|저럴|그럴)수가/g, replacement: '$1 수가', type: '띄어쓰기' },
    { regex: /([.?!])([가-힣])/g, replacement: '$1 $2', type: '띄어쓰기', example: '모르겠네요.방가와요 -> 모르겠네요. 방가와요' },

    // === 구두점 중복 ===
    { regex: /,,+/g, replacement: ',', type: '맞춤법', example: '껀데,, -> 껀데,' },

    // === 의존 명사 및 어미 오류 ===
    { regex: /([가-힣])(할|하는|한|될|되는|된|쓸|쓰는|쓴)껀데(?![가-힣])/g, replacement: '$1$2 건데', type: '맞춤법' },
    { regex: /(?<![가-힣])(할|하는|한|될|되는|된|쓸|쓰는|쓴)껀데(?![가-힣])/g, replacement: '$1 건데', type: '맞춤법' },
    { regex: /([가-힣])(할|하는|한|될|되는|된|쓸|쓰는|쓴)껄(?![가-힣])/g, replacement: '$1$2 걸', type: '맞춤법' },
    { regex: /(?<![가-힣])(할|하는|한|될|되는|된|쓸|쓰는|쓴)껄(?![가-힣])/g, replacement: '$1 걸', type: '맞춤법' },

    // === 맞춤법 오류: 되/돼 ===
    { regex: /(?<![가-힣])되요(?![가-힣])/g, replacement: '돼요', type: '맞춤법', example: '되요 → 돼요' },
    { regex: /(?<![가-힣])안돼(?![가-힣])/g, replacement: '안 돼', type: '띄어쓰기+맞춤법' },
    { regex: /(?<![가-힣])안되(?![가-힣])/g, replacement: '안 돼', type: '띄어쓰기+맞춤법' },
    { regex: /(?<![가-힣])됬([어|다|습니다|네요])/g, replacement: '됐$1', type: '맞춤법', example: '됬어 → 됐어' },
    { regex: /(?<![가-힣])되여(?![가-힣])/g, replacement: '돼', type: '맞춤법' },

    // === 맞춤법 오류: 웬/왠 ===
    { regex: /(?<![가-힣])웬지(?![가-힣])/g, replacement: '왠지', type: '맞춤법', example: '웬지 → 왠지' },
    { regex: /(?<![가-힣])왠만하면(?![가-힣])/g, replacement: '웬만하면', type: '맞춤법', example: '왠만하면 → 웬만하면' },
    { regex: /(?<![가-힣])왠일(?![가-힣])/g, replacement: '웬일', type: '맞춤법' },

    // === 맞춤법 오류: 자주 틀리는 단어 ===
    { regex: /(?<![가-힣])어떻해(?![가-힣])/g, replacement: '어떡해', type: '맞춤법', example: '어떻해 → 어떡해' },
    { regex: /(?<![가-힣])어떻케(?![가-힣])/g, replacement: '어떻게', type: '맞춤법' },
    { regex: /(?<![가-힣])몇일(?![가-힣])/g, replacement: '며칠', type: '맞춤법', example: '몇일 → 며칠' },
    { regex: /(?<![가-힣])금새(?![가-힣])/g, replacement: '금세', type: '맞춤법' },
    { regex: /(?<![가-힣])곰방(?![가-힣])/g, replacement: '금방', type: '맞춤법' },
    { regex: /(?<![가-힣])있따가(?![가-힣])/g, replacement: '이따가', type: '맞춤법' },
    { regex: /(?<![가-힣])넓이다(?![가-힣])/g, replacement: '넓히다', type: '맞춤법' },
    { regex: /(?<![가-힣])급자기(?![가-힣])/g, replacement: '갑자기', type: '맞춤법' },
    { regex: /(?<![가-힣])갑작기(?![가-힣])/g, replacement: '갑자기', type: '맞춤법' },
    { regex: /(?<![가-힣])설레임(?![가-힣])/g, replacement: '설렘', type: '맞춤법', example: '설레임 → 설렘' },
    { regex: /(?<![가-힣])방가와요(?![가-힣])/g, replacement: '반가워요', type: '맞춤법', example: '방가와요 → 반가워요' },
    { regex: /(?<![가-힣])방가워요(?![가-힣])/g, replacement: '반가워요', type: '맞춤법' },

    // === 맞춤법 오류: ~든지/~던지 ===
    { regex: /(?<![가-힣])([가-힣]+)던지\s+([가-힣]+)던지(?![가-힣])/g, replacement: '$1든지 $2든지', type: '맞춤법', example: '가던지 오던지 → 가든지 오든지' },

    // === 맞춤법 오류: 로서/로써 ===
    { regex: /(자격|입장|역할|신분)([으]?)로써(?![가-힣])/g, replacement: '$1$2로서', type: '맞춤법', example: '학생으로써 → 학생으로서' },
    { regex: /(수단|도구|방법)([으]?)로서(?![가-힣])/g, replacement: '$1$2로써', type: '맞춤법', example: '도구로서 → 도구로써' }
];

export function findSimpleErrors(text: string): SpellError[] {
    const errors: SpellError[] = [];
    const foundErrors = new Set<string>();

    spellRules.forEach(pattern => {
        const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
        let match;

        while ((match = regex.exec(text)) !== null) {
            const wrongText = match[0];
            let correctText = pattern.replacement;

            // $1, $2 등 그룹 치환
            for (let i = 1; i < match.length; i++) {
                correctText = correctText.replace(new RegExp('\\$' + i, 'g'), match[i]);
            }

            const key = wrongText + '_' + correctText;
            if (!foundErrors.has(key) && wrongText !== correctText) {
                errors.push({
                    wrong: wrongText,
                    correct: correctText,
                    type: pattern.type,
                    desc: pattern.example || ''
                });
                foundErrors.add(key);
            }
        }
    });

    return errors;
}

export function applyAllCorrections(text: string, errors: SpellError[]): string {
    let newText = text;
    errors.forEach(err => {
        // 단어 경계를 정확하게 지정하기 어렵지만 일괄 치환을 사용
        // 완벽하지 않을 수 있으나 간단한 오류 수정에 적합
        const regex = new RegExp(err.wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        newText = newText.replace(regex, err.correct);
    });
    return newText;
}
