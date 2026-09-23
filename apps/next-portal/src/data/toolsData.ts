export interface ToolItem {
  slug: string;
  name: string;
  category: 'calc' | 'finance' | 'text' | 'dev' | 'game';
  categoryLabel: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  summary: string;
  description: string;
  keywords: string[];
  howToSteps: { name: string; text: string }[];
  faqs: { question: string; answer: string }[];
  legacyAppUrl: string;
}

export const TOOLS_DATA: Record<string, ToolItem> = {
  'calculator': {
    slug: 'calculator',
    name: '스마트 다기능 계산기',
    category: 'calc',
    categoryLabel: '계산기',
    icon: 'fas fa-calculator',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    summary: '사칙연산부터 할인율, 부가세, 공학 계산까지 지원하는 스마트 웹 계산기',
    description: '스마트 다기능 계산기는 일상 사칙연산, 할인율(세일가), 백분율(%), 부가세(VAT), 진법 변환을 브라우저에서 즉시 연산하는 무료 온라인 계산기입니다. 물리 키보드 타건 완벽 지원 및 계산 히스토리 저장을 지원합니다.',
    keywords: ['온라인계산기', '스마트계산기', '웹계산기', '할인율계산기', '부가세계산기', '공학계산기'],
    howToSteps: [
      { name: '1단계: 숫자 및 연산자 입력', text: '화면의 키패드를 마우스로 클릭하거나 PC 키보드의 숫자패드 및 연산 기호(+,-,*,/)를 직접 타건합니다.' },
      { name: '2단계: 기능 모드 선택', text: '일반 연산, 할인율 계산, 부가세(VAT) 포함/제외 계산 탭을 선택하여 필요한 수식을 지정합니다.' },
      { name: '3단계: 결과 확인 및 복사', text: '등호(=) 또는 엔터키를 눌러 계산 결과를 도출하고, 히스토리에서 이전 연산 기록을 확인하거나 복사합니다.' }
    ],
    faqs: [
      { question: 'PC 키보드로 바로 입력할 수 있나요?', answer: '네, 숫자패드(0~9), 사칙연산자(+,-,*,/), 엔터(=), 백스페이스, ESC(초기화) 등 모든 물리 키보드 타건을 지원합니다.' },
      { question: '계산 기록(히스토리)은 어디에 저장되나요?', answer: '브라우저 로컬 저장소에 안전하게 보관되므로 서버로 유출되지 않으며, 브라우저를 닫았다가 다시 열어도 기록이 유지됩니다.' }
    ],
    legacyAppUrl: '/app/calculator/'
  },
  'text-checker': {
    slug: 'text-checker',
    name: '글자수 세기 & 자소서 검사기',
    category: 'text',
    categoryLabel: '텍스트',
    icon: 'fas fa-spell-check',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    summary: '공백 포함/제외 글자수, 바이트(Byte), 단어수 실시간 측정 및 자기소개서 글자수 분석 도구',
    description: '자기소개서, 리포트, 공문서 작성 시 필수적인 공백 포함/제외 글자수와 EUC-KR 및 UTF-8 바이트(Byte) 수를 실시간 정밀 연산합니다. 맞춤법 검사 바로가기 및 원클릭 복사 기능을 제공합니다.',
    keywords: ['글자수세기', '자소서글자수', '바이트수계산', '공백제외글자수', '글자수검사기'],
    howToSteps: [
      { name: '1단계: 텍스트 입력 또는 붙여넣기', text: '작성 중인 자기소개서나 문서 텍스트를 입력창에 직접 타이핑하거나 Ctrl+V로 붙여넣습니다.' },
      { name: '2단계: 실시간 지표 분석', text: '공백 포함 글자수, 공백 제외 글자수, 단어수, 2바이트(EUC-KR) 및 3바이트(UTF-8) 기준 지표를 확인합니다.' },
      { name: '3단계: 서식 정리 및 복사', text: '연속 공백 정리, 줄바꿈 제거 등 필요한 편의 기능을 적용한 후 결과 텍스트를 복사합니다.' }
    ],
    faqs: [
      { question: '취업 포털(사람인, 잡코리아) 자소서 기준과 일치하나요?', answer: '네, 한글 2바이트(EUC-KR) 및 한글 3바이트(UTF-8) 규격을 모두 제공하여 대기업 채용 사이트 및 포털의 기준에 정확히 맞출 수 있습니다.' },
      { question: '입력한 내용이 서버로 전송되나요?', answer: '아닙니다. 100% 브라우저 클라이언트 메모리 내에서만 실시간 연산되므로 개인정보나 자소서 내용 유출 걱정 없이 안전합니다.' }
    ],
    legacyAppUrl: '/app/text-checker/'
  },
  'pyeong-calc': {
    slug: 'pyeong-calc',
    name: '부동산 평수 · ㎡ 단위 변환기',
    category: 'calc',
    categoryLabel: '계산기',
    icon: 'fas fa-vector-square',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    summary: '부동산 아파트 평수와 제곱미터(㎡) 양방향 정밀 환산 및 공급·전용면적 가이드',
    description: '1평 = 약 3.305785㎡ 기준을 적용하여 아파트, 오피스텔, 토지 면적을 평수에서 ㎡로, ㎡에서 평수로 실시간 상호 변환합니다. 전용면적(59㎡, 84㎡)별 통상 평형 정보를 함께 제공합니다.',
    keywords: ['평수계산기', '제곱미터변환', '평수변환기', '아파트평수', '59제곱미터평수', '84제곱미터평수'],
    howToSteps: [
      { name: '1단계: 변환 방향 선택', text: '평 → ㎡ 또는 ㎡ → 평 중 원하는 변환 기준을 선택합니다.' },
      { name: '2단계: 수치 입력', text: '면적 수치를 입력하면 3.305785 계수를 적용한 변환 결과가 소수점 단위까지 실시간 표시됩니다.' },
      { name: '3단계: 대표 평형 비교', text: '25평형(전용 59㎡), 34평형(전용 84㎡) 등 인기 국민 평형 규격 가이드를 대조 확인합니다.' }
    ],
    faqs: [
      { question: '84㎡는 몇 평인가요?', answer: '전용면적 84㎡는 약 25.4평이며, 아파트 공급면적(공용면적 포함) 기준으로는 통상 32평~34평형에 해당합니다.' }
    ],
    legacyAppUrl: '/app/pyeong-calc/'
  },
  'interest-calc': {
    slug: 'interest-calc',
    name: '예·적금 이자 & 비과세 계산기',
    category: 'finance',
    categoryLabel: '금융',
    icon: 'fas fa-piggy-bank',
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    summary: '정기예금·적금 단리/복리 이자 및 일반과세·세금우대·비과세 실수령액 비교',
    description: '예금과 적금 상품의 기본 이자율, 우대 이자율, 저축 기간에 따른 단리 및 월복리 만기 수령액을 정밀 산출합니다. 일반과세(15.4%), 세금우대(9.5%), 비과세(0%) 적용에 따른 최종 실수령액 비교 차트를 제공합니다.',
    keywords: ['이자계산기', '예금이자계산기', '적금이자계산기', '비과세계산기', '복리이자계산기'],
    howToSteps: [
      { name: '1단계: 상품 유형 선택', text: '목돈을 한번에 예치하는 [정기예금] 또는 매월 일정액을 모으는 [정기적금]을 선택합니다.' },
      { name: '2단계: 예치금액 및 금리 입력', text: '가입 금액, 기간(월 단위), 연이자율(%) 및 단리/복리 여부를 입력합니다.' },
      { name: '3단계: 과세 조건별 실수령액 비교', text: '일반과세 15.4%, 세금우대 9.5%, 비과세 0% 적용 시의 만기 실수령액과 세후 이자를 확인합니다.' }
    ],
    faqs: [
      { question: '적금 단리 계산 공식은 어떻게 되나요?', answer: '적금 단리는 매월 납입 회차마다 남은 예치 기간이 줄어들므로, [월납입액 × (연이율/12) × n(n+1)/2] 산식으로 정밀 계산됩니다.' }
    ],
    legacyAppUrl: '/app/interest-calc/'
  },
  'severance-calc': {
    slug: 'severance-calc',
    name: '2026 퇴직금 & 실업급여 계산기',
    category: 'finance',
    categoryLabel: '금융',
    icon: 'fas fa-file-invoice-dollar',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    summary: '고용노동부 법정 산식 기준 퇴직금 및 실업급여(구직급여) 세후 수령액 산출',
    description: '입사일과 퇴사일, 최근 3개월 기본급과 상여금·연차수당(3/12 가산)을 반영하여 1일 평균임금과 법정 퇴직금을 자동 계산합니다. 2026년 소득세법 개정 근속연수 공제가 반영된 세후 실수령액 및 실업급여 수급일수와 금액을 제공합니다.',
    keywords: ['퇴직금계산기', '실업급여계산기', '퇴직소득세계산', '평균임금산정', '2026퇴직금'],
    howToSteps: [
      { name: '1단계: 재직 기간 입력', text: '입사일자와 퇴사(예정)일자를 선택하여 총 재직일수를 확인합니다.' },
      { name: '2단계: 최근 3개월 급여 입력', text: '퇴사 직전 3개월 동안 지급받은 기본급 총액과 연간 상여금/연차수당을 입력합니다.' },
      { name: '3단계: 퇴직금 및 세금 확인', text: '1일 평균임금 기반의 세전 퇴직금과 근속연수 공제가 적용된 퇴직소득세 차감 후 실수령액을 확인합니다.' }
    ],
    faqs: [
      { question: '재직 기간이 1년 미만이어도 퇴직금이 나오나요?', answer: '근로기준법상 1주 15시간 이상, 1년 이상 계속 근로한 근로자에게 법정 퇴직금 지급 의무가 발생합니다.' }
    ],
    legacyAppUrl: '/app/severance-calc/'
  },
  'age-calc': {
    slug: 'age-calc',
    name: '만 나이 · 연 나이 계산기',
    category: 'calc',
    categoryLabel: '계산기',
    icon: 'fas fa-birthday-cake',
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-600',
    summary: '2023년 통일된 대한민국 법적 만 나이, 연 나이, 띠, 다음 생일 디데이 산출',
    description: '생년월일을 입력하면 현행 대한민국 행정·민법 기준인 만 나이와 청소년보호법/병역법상 연 나이를 즉시 계산합니다. 태어난 날로부터 총 경과일수와 다가오는 생일까지 남은 D-Day를 함께 안내합니다.',
    keywords: ['만나이계산기', '만나이통일법', '연나이계산기', '띠계산기', '생일디데이'],
    howToSteps: [
      { name: '1단계: 생년월일 입력', text: '본인의 출생 연도, 월, 일을 선택하거나 입력합니다.' },
      { name: '2단계: 기준일자 지정', text: '오늘 날짜 또는 특정 미래/과거 기준일자를 지정합니다.' },
      { name: '3단계: 만 나이 및 법적 권리 확인', text: '정확한 만 나이와 함께 투표 가능 여부, 운전면허 취득 가능 여부 등 법적 기준을 확인합니다.' }
    ],
    faqs: [
      { question: '생일 당일에는 만 나이가 몇 살인가요?', answer: '만 나이는 생일 당일 자정(00시)을 기점으로 1살이 늘어납니다.' }
    ],
    legacyAppUrl: '/app/age-calc/'
  },
  'dday-calc': {
    slug: 'dday-calc',
    name: 'D-Day 및 기념일 날짜 계산기',
    category: 'calc',
    categoryLabel: '계산기',
    icon: 'fas fa-calendar-alt',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    summary: '수능, 시험, 연애 기념일, 출산예정일 D-Day 및 100일/1000일 계산 도구',
    description: '목표 날짜까지 남은 일수(D-) 또는 시작일로부터 지난 일수(D+)를 계산합니다. 당일 포함(1일째 시작) 여부 선택 옵션과 함께 100일, 200일, 1주년, 1000일 등 주요 기념일 날짜를 자동으로 산출합니다.',
    keywords: ['디데이계산기', 'DDay계산', '기념일계산기', '수능디데이', '커플100일계산'],
    howToSteps: [
      { name: '1단계: 시작일 또는 목표일 선택', text: '사건이 시작된 날 또는 앞으로 다가올 목표 날짜를 달력에서 선택합니다.' },
      { name: '2단계: 당일 포함 여부 설정', text: '만난 날 첫날을 1일로 칠지(당일 포함), 0일로 칠지 옵션을 선택합니다.' },
      { name: '3단계: D-Day 및 기념일 리스트 확인', text: '현재 기준 D-Day 수치와 100일 단위 미래 기념일 일정을 확인합니다.' }
    ],
    faqs: [
      { question: '당일 포함과 미포함의 차이는 무엇인가요?', answer: '연애 100일 등 기념일은 시작일을 1일로 치는 당일 포함을 주로 쓰고, 시험 D-Day 등 남은 기간은 당일을 뺀 D- 기준을 사용합니다.' }
    ],
    legacyAppUrl: '/app/dday-calc/'
  },
  'customs-calc': {
    slug: 'customs-calc',
    name: '해외직구 관·부가세 계산기',
    category: 'calc',
    categoryLabel: '계산기',
    icon: 'fas fa-plane-arrival',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    summary: '미국 $200 / 타국가 $150 면세 판별 및 품목별 관세·부가세 원스톱 계산',
    description: '미국 목록통관 $200 이하, 일반국가 $150 이하 면세 기준을 적용하여 해외 직구 시 발생하는 관세와 부가가치세(10%)를 자동 산출합니다. 전자기기, 의류, 영양제 등 주요 11개 품목별 관세율을 반영합니다.',
    keywords: ['관세계산기', '해외직구관세', '부가세계산기', '목록통관면세', '직구세금계산'],
    howToSteps: [
      { name: '1단계: 구입 국가 및 품목 선택', text: '미국(목록통관 $200 한도) 또는 일반 국가($150 한도)를 고르고 물품 카테고리를 선택합니다.' },
      { name: '2단계: 물품 가격 및 배송비 입력', text: '현지 통화(달러, 엔화, 유로, 위안 등)로 결제 금액을 입력합니다.' },
      { name: '3단계: 관세 면세 판정 및 세액 확인', text: '면세 범위 충족 여부와 과세 대상일 경우의 예상 관세 및 부가세를 확인합니다.' }
    ],
    faqs: [
      { question: '영양제는 $200까지 면세인가요?', answer: '아닙니다. 건강기능식품(영양제)은 일반통관 품목으로 미국 직구여도 $150 이하(최대 6병)까지만 면세됩니다.' }
    ],
    legacyAppUrl: '/app/customs-calc/'
  }
};
