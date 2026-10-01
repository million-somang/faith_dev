const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// 대상 업로드 디렉토리 확보
const UPLOAD_DIRS = [
    path.resolve(__dirname, '../public/uploads/marketing/screenshots'),
    path.resolve(__dirname, '../apps/api-server/public/uploads/marketing/screenshots')
];

for (const dir of UPLOAD_DIRS) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// 1. 기존 calculator_key[1-3].png 가 있으면 step[1-3].png 로도 복사
const calcDir = UPLOAD_DIRS[0];
for (let i = 1; i <= 3; i++) {
    const keyFile = path.join(calcDir, `calculator_key${i}.png`);
    const stepFile = path.join(calcDir, `calculator_step${i}.png`);
    if (fs.existsSync(keyFile) && !fs.existsSync(stepFile)) {
        fs.copyFileSync(keyFile, stepFile);
        console.log(`[Copied] ${keyFile} -> ${stepFile}`);
    }
}

const APPS = [
    {
        slug: 'calculator',
        aliases: ['calculator'],
        name: '다기능 스마트 계산기',
        category: '금융 · 유틸리티',
        color: '#0284C7',
        icon: '🔢',
        description: '퍼센트·할인율·단위변환 올인원 무료 계산기',
        features: ['부가세/할인율 즉시 산출', '일반 수식 및 공학용 변환', '계산 내역 실시간 저장'],
        actionLabel: '실시간 수식 계산하기',
        resultTitle: '최종 계산 결과 리포트',
        resultMetric: '오차 없는 정밀 연산 100%'
    },
    {
        slug: 'webp-converter',
        aliases: ['webp', 'webp-converter'],
        name: 'WebP 이미지 초고속 압축기',
        category: '이미지 · 최적화',
        color: '#059669',
        icon: '🖼️',
        description: '화질 저하 없이 용량 최대 80% 압축 변환',
        features: ['서버 업로드 없는 브라우저 로컬 변환', 'WebP/PNG/JPG 상호 일괄 변환', '품질 조절 및 실시간 비교 뷰'],
        actionLabel: '무손실 WebP 변환 실행',
        resultTitle: '용량 78.4% 절감 완료',
        resultMetric: '2.4MB ➔ 520KB 압축 성공'
    },
    {
        slug: 'saju',
        aliases: ['saju', 'lotto'],
        name: '정밀 사주명리 & 운세 허브',
        category: '전통운세 · 행운도구',
        color: '#7E22CE',
        icon: '🔮',
        description: '8글자 사주원국 · 오행 밸런스 · 럭키 로또',
        features: ['정통 만세력 기반 4주 8자 정밀 분석', '오행 결핍 보완 맞춤 행운 처방', '매력 신살 지수 및 행운 로또 번호'],
        actionLabel: '나의 사주 원국 풀이하기',
        resultTitle: '오행 조화도 88점 · 황금운세',
        resultMetric: '올해 최고의 길신: 천을귀인(天乙)'
    },
    {
        slug: 'dday-calc',
        aliases: ['dday', 'dday-calc'],
        name: '감성 D-Day 매니저',
        category: '일정 · 카운트다운',
        color: '#E11D48',
        icon: '📅',
        description: '시험·기념일·목표 달성 완벽 카운트다운',
        features: ['디데이 & 기념일 일괄 자동 등록', '주요 일정 남은 날짜 실시간 카운트', '감성 테마 및 캘린더 연동'],
        actionLabel: '새로운 목표 D-Day 등록',
        resultTitle: 'D-35일 (목표 달성률 68%)',
        resultMetric: '남은 시간: 840시간 15분'
    },
    {
        slug: 'interest-calc',
        aliases: ['interest', 'interest-calc'],
        name: '예·적금 이자 복리 계산기',
        category: '재테크 · 금융',
        color: '#16A34A',
        icon: '💰',
        description: '단리/복리 및 비과세·세후 실수령액 정밀 비교',
        features: ['정기예금/적금 만기 수령액 3초 계산', '일반과세(15.4%) 및 비과세 세금 정밀 반영', '월별 이자 발생 시뮬레이션 표'],
        actionLabel: '만기 수령액 정밀 계산',
        resultTitle: '세후 실수령액: 10,380,500원',
        resultMetric: '세전 이자 +450,000원 (실수령률 98.4%)'
    },
    {
        slug: 'severance-calc',
        aliases: ['severance', 'severance-calc'],
        name: '퇴직금 & 실업급여 계산기',
        category: '직장인 · 노무',
        color: '#EA580C',
        icon: '💼',
        description: '최근 3개월 급여 기준 퇴직금 실수령액 3초 조회',
        features: ['최신 근로기준법 통상/평균임금 자동 반영', '근속연수 공제 및 퇴직소득세 자동 계산', '실업급여 예상 수급액 동시 산출'],
        actionLabel: '예상 퇴직금 3초 계산하기',
        resultTitle: '예상 퇴직 실수령액: 32,450,000원',
        resultMetric: '근속기간: 4년 8개월 (세금 48만원 공제)'
    },
    {
        slug: 'customs-calc',
        aliases: ['customs', 'customs-calc'],
        name: '해외직구 관·부가세 계산기',
        category: '쇼핑 · 관세',
        color: '#0284C7',
        icon: '✈️',
        description: '미국($200)/일반($150) 목록통관 기준 관세 실시간 계산',
        features: ['품목별 관세율(0~13%) 및 부가세(10%) 자동 적용', '실시간 고시 환율 기반 한화 환산', '합산과세 방지 면세 범위 체크'],
        actionLabel: '예상 관·부가세 산출하기',
        resultTitle: '최종 납부 예상세액: 38,200원',
        resultMetric: '목록통관 기준: 과세 대상 ($189.50)'
    },
    {
        slug: 'text-checker',
        aliases: ['text', 'text-checker'],
        name: '글자수 세기 & 맞춤법 검사기',
        category: '문서 · 작성',
        color: '#2563EB',
        icon: '📝',
        description: '공백 포함/제외 실시간 글자수 및 바이트 측정',
        features: ['공백 포함/제외 글자수 실시간 동시 집계', '자기소개서·이력서 맞춤법 자동 검사', '원고지 매수 및 읽기 소요 시간 예측'],
        actionLabel: '글자수 분석 및 맞춤법 검사',
        resultTitle: '총 1,420자 (공백제외 1,080자)',
        resultMetric: '한글 2,840 Bytes · 원고지 7.1매'
    },
    {
        slug: 'pyeong-calc',
        aliases: ['pyeong', 'pyeong-calc'],
        name: '아파트 평수·제곱미터 변환기',
        category: '부동산 · 생활',
        color: '#0D9488',
        icon: '📐',
        description: '공급·전용면적 및 실평수 양방향 즉시 환산',
        features: ['평(坪) ↔ 제곱미터(㎡) 0.1초 양방향 변환', '국민평형 84㎡(34평), 59㎡(24평) 원클릭 프리셋', '전용률 계산 및 실평수 비교 분석'],
        actionLabel: '면적 양방향 환산하기',
        resultTitle: '84.92㎡ ➔ 25.68평 (실평수 34평형)',
        resultMetric: '전용률 75.5% · 안심 주거 면적'
    },
    {
        slug: 'base64-converter',
        aliases: ['base64', 'base64-converter'],
        name: 'Base64 텍스트/이미지 변환기',
        category: '개발자 · 유틸리티',
        color: '#4F46E5',
        icon: '⚡',
        description: '텍스트 및 이미지 파일 Base64 상호 인코딩/디코딩',
        features: ['UTF-8 한글 완벽 지원 텍스트 인코딩', '이미지 드래그 앤 드롭 DataURL 즉시 추출', '클립보드 원클릭 복사 및 실시간 미리보기'],
        actionLabel: 'Base64 상호 변환 실행',
        resultTitle: '변환 완료: Data URI 100% 정상',
        resultMetric: '인코딩 크기: 4,820자 (UTF-8 OK)'
    },
    {
        slug: 'json-formatter',
        aliases: ['json', 'json-formatter'],
        name: 'JSON 포맷터 & 데이터 뷰어',
        category: '개발자 · 데이터',
        color: '#7C3AED',
        icon: '💻',
        description: '트리 뷰어 및 구문 오류 하이라이팅',
        features: ['지저분한 JSON 2탭/4탭 자동 정렬', '구문 에러 라인 실시간 감지', '트리 구조 확장/축소 및 미니파이'],
        actionLabel: 'JSON 정렬 및 유효성 검사',
        resultTitle: '유효한 JSON 포맷팅 완료',
        resultMetric: '유효성: 정상 (오류 없음 · 14개 노드)'
    },
    {
        slug: 'svg-converter',
        aliases: ['svg', 'svg-converter'],
        name: 'Vector Studio (SVG 변환기)',
        category: '디자인 · 벡터',
        color: '#9333EA',
        icon: '🎨',
        description: 'PNG/JPG 이미지의 초정밀 SVG 벡터화 및 최적화',
        features: ['비트맵 이미지를 깔끔한 벡터 패스로 변환', 'SVG 코드 용량 최적화 및 인라인 뷰어', '색상 팔레트 추출 및 React 컴포넌트 복사'],
        actionLabel: '벡터 SVG 변환 실행',
        resultTitle: '벡터 패스 128개 추출 완료',
        resultMetric: '용량 62% 최적화 · 무한 확대 무손실'
    },
    {
        slug: 'age-calc',
        aliases: ['age', 'age-calc'],
        name: '만 나이 & 띠 계산기',
        category: '생활 · 행정',
        color: '#D97706',
        icon: '🎂',
        description: '개정 만 나이 법안 기준 정확한 나이·생일 디데이',
        features: ['개정 만 나이 통일법 100% 정밀 적용', '12간지 띠 및 탄생 별자리 즉시 확인', '다음 생일까지 남은 일수 디데이 카운트'],
        actionLabel: '만 나이 및 생일 확인하기',
        resultTitle: '현재 만 29세 (소띠 · 처녀자리)',
        resultMetric: '다음 생일까지 앞으로 D-112일'
    },
    {
        slug: 'ocr',
        aliases: ['ocr'],
        name: '이미지 글자 추출기 (OCR)',
        category: '문서 · AI도구',
        color: '#0891B2',
        icon: '📄',
        description: '이미지 속 텍스트를 브라우저에서 즉시 추출',
        features: ['스크린샷·영수증·서류 이미지 텍스트 인식', '한국어/영어 고정밀 Tesseract 엔진 탑재', '추출된 텍스트 텍스트파일 즉시 다운로드'],
        actionLabel: '이미지 글자 추출 실행',
        resultTitle: '텍스트 18줄 인식 완료 (정확도 99.2%)',
        resultMetric: '인식 글자수: 480자 · 즉시 복사 가능'
    },
    {
        slug: '2048',
        aliases: ['2048', 'game-2048'],
        name: '베라 2048 퍼즐',
        category: '게임 · 두뇌퍼즐',
        color: '#EAB308',
        icon: '🎮',
        description: '숫자 블록을 합쳐 2048을 완성하는 두뇌 게임',
        features: ['부드러운 타일 슬라이딩 애니메이션', '최고 점수 및 명예의 전당 로컬 저장', '실행 취소(Undo) 및 다양한 보드 크기'],
        actionLabel: '새로운 2048 게임 시작',
        resultTitle: '현재 스코어: 4,096점 갱신!',
        resultMetric: '최대 블록: 1024 완성 (상위 5%)'
    },
    {
        slug: 'sudoku',
        aliases: ['sudoku'],
        name: '베라 프리미엄 스도쿠',
        category: '게임 · 두뇌퍼즐',
        color: '#4338CA',
        icon: '🧩',
        description: '초급부터 전문가까지 매일 즐기는 정통 스도쿠',
        features: ['난이도별 무제한 퍼즐 자동 생성', '후보 숫자 메모 기능 및 자동 오류 체크', '타이머 및 클리어 통계 관리'],
        actionLabel: '스도쿠 퍼즐 시작하기',
        resultTitle: '스도쿠 클리어! (소요시간 4분 12초)',
        resultMetric: '실수 횟수: 0회 · 완벽한 논리 클리어'
    },
    {
        slug: 'minesweeper',
        aliases: ['minesweeper'],
        name: '베라 지뢰찾기 클래식',
        category: '게임 · 클래식',
        color: '#DC2626',
        icon: '💣',
        description: '긴장감 넘치는 윈도우 감성 명작 지뢰찾기',
        features: ['첫 클릭 지뢰 방지 100% 안심 시스템', '초급/중급/고급 및 커스텀 보드 설정', '깃발 꽂기 햅틱 및 실시간 타이머'],
        actionLabel: '지뢰찾기 보드 생성하기',
        resultTitle: '작전 성공! 지뢰 10개 완벽 탐지',
        resultMetric: '클리어 타임: 28초 (신기록 달성)'
    },
    {
        slug: 'baseball',
        aliases: ['baseball'],
        name: '베라 숫자야구 게임',
        category: '게임 · 심리추리',
        color: '#2563EB',
        icon: '⚾',
        description: '스트라이크 & 볼 카운트로 찾는 3자리/4자리 숫자',
        features: ['컴퓨터 비밀 숫자 3자리/4자리 모드', '이닝별 스트라이크/볼 히스토리 보드', '최적의 추리 알고리즘 힌트 제공'],
        actionLabel: '첫 번째 투구 예측 입력',
        resultTitle: '3 Strike! 홈런 클리어 (5이닝 승리)',
        resultMetric: '정답: [7, 2, 9] · 탁월한 추리력'
    },
    {
        slug: 'omok',
        aliases: ['omok'],
        name: '베라 오목 (AI & 대전)',
        category: '게임 · 전략보드',
        color: '#1E293B',
        icon: '⚫',
        description: '스마트 AI 대전 및 2인 대전 정통 15줄 오목',
        features: ['삼삼(3-3) 금수 룰 완벽 판정', '스마트 미니맥스 AI 대전 모드', '착수 효과음 및 명경기 기보 복기'],
        actionLabel: '오목 대국 시작하기',
        resultTitle: '흑(Black) 5목 완성 승리!',
        resultMetric: '총 착수: 32수 · 완벽한 승리 전략'
    }
];

function buildSvg(app, step) {
    const stepTitles = [
        '1단계: 진입 화면 (Entry)',
        '2단계: 메인 조작 (Action)',
        '3단계: 결과 리포트 (Result)'
    ];
    const stepSubtitle = [
        '무료 접속 직후 시작 화면',
        '주요 파라미터 조작 및 입력',
        '최종 산출 결과 및 분석 리포트'
    ];
    const stepBadges = ['INTRO · ENTRY', 'INTERACTION · ACTION', 'FINAL REPORT · RESULT'];
    const currentStepTitle = stepTitles[step - 1];
    const currentStepSub = stepSubtitle[step - 1];
    const currentBadge = stepBadges[step - 1];

    let contentBodySvg = '';

    if (step === 1) {
        contentBodySvg = `
  <g filter="url(#cardShadow)">
    <rect x="20" y="210" width="390" height="230" rx="24" fill="#FFFFFF" />
    <circle cx="68" cy="268" r="32" fill="${app.color}" opacity="0.12" />
    <text x="68" y="278" font-size="30" text-anchor="middle">${app.icon}</text>
    <text x="114" y="260" font-family="-apple-system, sans-serif" font-size="20" font-weight="900" fill="#0F172A">${app.name}</text>
    <rect x="114" y="272" width="130" height="22" rx="6" fill="#F1F5F9" />
    <text x="122" y="287" font-family="-apple-system, sans-serif" font-size="11" font-weight="700" fill="#64748B">${app.category}</text>
    <text x="40" y="335" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#334155">${app.description}</text>
    <line x1="40" y1="365" x2="390" y2="365" stroke="#F1F5F9" stroke-width="1.5" />
    <circle cx="52" cy="395" r="4" fill="#10B981" />
    <text x="66" y="399" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#10B981">로그인 불필요 · 100% 무료 즉시 사용 가능</text>
  </g>

  <g filter="url(#cardShadow)">
    <rect x="20" y="460" width="390" height="210" rx="20" fill="#FFFFFF" />
    <text x="40" y="495" font-family="-apple-system, sans-serif" font-size="14" font-weight="800" fill="#0F172A">핵심 특장점 &amp; 기능</text>
    
    <rect x="36" y="515" width="358" height="38" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
    <text x="52" y="539" font-family="-apple-system, sans-serif" font-size="13" font-weight="700" fill="${app.color}">✓</text>
    <text x="74" y="539" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#1E293B">${app.features[0] || '초고속 실행'}</text>

    <rect x="36" y="563" width="358" height="38" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
    <text x="52" y="587" font-family="-apple-system, sans-serif" font-size="13" font-weight="700" fill="${app.color}">✓</text>
    <text x="74" y="587" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#1E293B">${app.features[1] || '안심 보안'}</text>

    <rect x="36" y="611" width="358" height="38" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
    <text x="52" y="635" font-family="-apple-system, sans-serif" font-size="13" font-weight="700" fill="${app.color}">✓</text>
    <text x="74" y="635" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#1E293B">${app.features[2] || '반응형 UI'}</text>
  </g>

  <g filter="url(#cardShadow)">
    <rect x="20" y="690" width="390" height="58" rx="16" fill="${app.color}" />
    <text x="215" y="726" font-family="-apple-system, sans-serif" font-size="16" font-weight="800" fill="#FFFFFF" text-anchor="middle">🚀 지금 바로 무료 시작하기</text>
  </g>`;
    } else if (step === 2) {
        contentBodySvg = `
  <g filter="url(#cardShadow)">
    <rect x="20" y="210" width="390" height="240" rx="24" fill="#FFFFFF" />
    <text x="40" y="248" font-family="-apple-system, sans-serif" font-size="15" font-weight="800" fill="#0F172A">입력 파라미터 및 옵션 설정</text>

    <rect x="38" y="268" width="354" height="48" rx="12" fill="#F8FAFC" stroke="${app.color}" stroke-width="1.8" />
    <text x="56" y="298" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#0F172A">테스트 데이터 자동 입력됨</text>
    <circle cx="366" cy="292" r="10" fill="${app.color}" opacity="0.2" />
    <text x="366" y="296" font-size="11" font-weight="900" fill="${app.color}" text-anchor="middle">✓</text>

    <rect x="38" y="332" width="76" height="30" rx="8" fill="${app.color}" opacity="0.12" />
    <text x="76" y="352" font-family="-apple-system, sans-serif" font-size="11" font-weight="800" fill="${app.color}" text-anchor="middle">기본값 A</text>

    <rect x="122" y="332" width="76" height="30" rx="8" fill="#F1F5F9" />
    <text x="160" y="352" font-family="-apple-system, sans-serif" font-size="11" font-weight="700" fill="#64748B" text-anchor="middle">옵션 B</text>

    <rect x="206" y="332" width="76" height="30" rx="8" fill="#F1F5F9" />
    <text x="244" y="352" font-family="-apple-system, sans-serif" font-size="11" font-weight="700" fill="#64748B" text-anchor="middle">옵션 C</text>

    <text x="40" y="396" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#64748B">정밀도 조절: 100% 최적화</text>
    <rect x="38" y="408" width="354" height="8" rx="4" fill="#E2E8F0" />
    <rect x="38" y="408" width="280" height="8" rx="4" fill="${app.color}" />
    <circle cx="318" cy="412" r="10" fill="${app.color}" stroke="#FFFFFF" stroke-width="2.5" />
  </g>

  <g filter="url(#cardShadow)">
    <rect x="20" y="470" width="390" height="150" rx="20" fill="#FFFFFF" />
    <text x="40" y="505" font-family="-apple-system, sans-serif" font-size="14" font-weight="800" fill="#0F172A">실시간 프리뷰 &amp; 조작</text>
    <rect x="38" y="525" width="354" height="74" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-dasharray="4 4" />
    <text x="215" y="567" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#64748B" text-anchor="middle">설정값에 따른 실시간 변환 감지 중...</text>
  </g>

  <g filter="url(#cardShadow)">
    <rect x="20" y="640" width="390" height="58" rx="16" fill="${app.color}" />
    <text x="215" y="676" font-family="-apple-system, sans-serif" font-size="16" font-weight="800" fill="#FFFFFF" text-anchor="middle">⚡ ${app.actionLabel}</text>
  </g>`;
    } else {
        contentBodySvg = `
  <g filter="url(#cardShadow)">
    <rect x="20" y="210" width="390" height="260" rx="24" fill="#FFFFFF" />
    
    <rect x="40" y="235" width="124" height="28" rx="14" fill="#ECFDF5" />
    <circle cx="54" cy="249" r="6" fill="#10B981" />
    <text x="68" y="254" font-family="-apple-system, sans-serif" font-size="12" font-weight="800" fill="#059669">분석 · 산출 완료</text>

    <text x="40" y="302" font-family="-apple-system, sans-serif" font-size="20" font-weight="900" fill="#0F172A">${app.resultTitle}</text>
    <text x="40" y="328" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="${app.color}">★ ${app.resultMetric}</text>

    <line x1="40" y1="350" x2="390" y2="350" stroke="#F1F5F9" stroke-width="1.5" />

    <rect x="40" y="366" width="168" height="80" rx="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
    <text x="56" y="394" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#64748B">신뢰도 &amp; 정확도</text>
    <text x="56" y="426" font-family="-apple-system, sans-serif" font-size="22" font-weight="900" fill="#10B981">99.9%</text>

    <rect x="222" y="366" width="168" height="80" rx="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
    <text x="238" y="394" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#64748B">처리 소요 시간</text>
    <text x="238" y="426" font-family="-apple-system, sans-serif" font-size="22" font-weight="900" fill="#0284C7">0.12초</text>
  </g>

  <g filter="url(#cardShadow)">
    <rect x="20" y="490" width="390" height="150" rx="20" fill="#FFFFFF" />
    <text x="40" y="525" font-family="-apple-system, sans-serif" font-size="14" font-weight="800" fill="#0F172A">결과 활용 &amp; 공유</text>
    
    <rect x="38" y="545" width="172" height="46" rx="12" fill="${app.color}" />
    <text x="124" y="574" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#FFFFFF" text-anchor="middle">📋 결과값 복사</text>

    <rect x="220" y="545" width="172" height="46" rx="12" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1" />
    <text x="306" y="574" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#334155" text-anchor="middle">🔗 링크 공유하기</text>

    <text x="215" y="622" font-family="-apple-system, sans-serif" font-size="12" font-weight="600" fill="#94A3B8" text-anchor="middle">결과는 브라우저 로컬에 안전하게 보관됩니다.</text>
  </g>

  <g filter="url(#cardShadow)">
    <rect x="20" y="660" width="390" height="52" rx="14" fill="#0F172A" />
    <text x="215" y="692" font-family="-apple-system, sans-serif" font-size="14" font-weight="800" fill="#FFFFFF" text-anchor="middle">🔄 다른 조건으로 다시 실행하기</text>
  </g>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="430" height="860" viewBox="0 0 430 860">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#EDF2F7" />
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0F172A" flood-opacity="0.07" />
    </filter>
  </defs>
  <rect width="430" height="860" fill="url(#bg)" />

  <rect x="0" y="0" width="430" height="44" fill="#FFFFFF" opacity="0.9" />
  <text x="32" y="28" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#0F172A">9:41</text>
  <circle cx="390" cy="22" r="4" fill="#0F172A" />
  <circle cx="376" cy="22" r="4" fill="#0F172A" />

  <rect x="20" y="58" width="390" height="64" rx="18" fill="#FFFFFF" filter="url(#cardShadow)" />
  <circle cx="54" cy="90" r="18" fill="${app.color}" />
  <text x="54" y="96" font-size="16" text-anchor="middle">${app.icon}</text>
  <text x="84" y="93" font-family="-apple-system, sans-serif" font-size="16" font-weight="800" fill="#0F172A">${app.name}</text>
  <rect x="84" y="99" width="60" height="15" rx="4" fill="#F1F5F9" />
  <text x="88" y="110" font-family="-apple-system, sans-serif" font-size="9" font-weight="700" fill="#64748B">${app.category}</text>
  <text x="382" y="96" font-size="18" fill="#94A3B8" text-anchor="end">✕</text>

  <rect x="20" y="134" width="390" height="60" rx="16" fill="#FFFFFF" filter="url(#cardShadow)" />
  <rect x="34" y="146" width="134" height="22" rx="6" fill="${app.color}" opacity="0.12" />
  <text x="42" y="161" font-family="-apple-system, sans-serif" font-size="10" font-weight="900" fill="${app.color}">${currentBadge}</text>
  <text x="34" y="184" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#0F172A">${currentStepTitle}</text>
  <text x="390" y="184" font-family="-apple-system, sans-serif" font-size="11" font-weight="600" fill="#94A3B8" text-anchor="end">${currentStepSub}</text>

  ${contentBodySvg}

  <rect x="20" y="792" width="390" height="44" rx="22" fill="#0F172A" />
  <circle cx="44" cy="814" r="8" fill="#10B981" />
  <text x="62" y="819" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#FFFFFF">VeraNex Mini App Standard</text>
  <text x="386" y="819" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#94A3B8" text-anchor="end">veranex.app</text>
</svg>`;
}

async function main() {
    console.log('[Puppeteer] Launching headless browser for rendering...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 430, height: 860, deviceScaleFactor: 2 });

    let count = 0;
    for (const app of APPS) {
        for (let step = 1; step <= 3; step++) {
            const svgContent = buildSvg(app, step);
            const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F8FAFC;">${svgContent}</body></html>`;
            await page.setContent(html);
            const buf = await page.screenshot({ type: 'png' });

            // 지원하는 모든 별칭 및 파일명 패턴으로 디스크에 저장
            for (const alias of app.aliases) {
                const filenames = [
                    `${alias}_step${step}.png`,
                    `${alias}_key${step}.png`
                ];
                if (step === 1) filenames.push(`${alias}.png`);

                for (const fn of filenames) {
                    for (const dir of UPLOAD_DIRS) {
                        const targetPath = path.join(dir, fn);
                        // calculator 의 실제 기존 캡처본은 보존
                        if (alias === 'calculator' && fs.existsSync(targetPath) && fs.statSync(targetPath).size > 100000) {
                            continue;
                        }
                        fs.writeFileSync(targetPath, buf);
                    }
                }
            }
            count++;
        }
    }

    await browser.close();
    console.log(`[Success] Rendered and stored ${count} high-resolution PNG sets into upload directories!`);
}

main().catch(err => {
    console.error('Generation failed:', err);
    process.exit(1);
});
