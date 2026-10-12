export interface GameItem {
  slug: string;
  name: string;
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

export const GAMES_DATA: Record<string, GameItem> = {
  'flight': {
    slug: 'flight',
    name: '베라 플라이트 (1942 비행슈팅)',
    categoryLabel: '아케이드 슈팅',
    icon: 'fas fa-plane',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    summary: '1942 스타일 정통 레트로 공중전, 360도 공중제비 롤링과 호위기 편대 슈팅',
    description: '오락실 황금기의 전설적인 1942를 오마주한 웹 브라우저 기반 정통 비행기 슈팅 게임입니다. 360도 공중제비 롤링(무적 회피)과 메가 폭탄, 4단계 주무기 파워업, 좌우 호위기 시스템을 탑재하여 거대 보스 전함과 박진감 넘치는 공중전을 펼칩니다.',
    keywords: ['1942게임', '비행기슈팅', '레트로슈팅', '오락실비행기', '베라플라이트', '무료웹게임'],
    howToSteps: [
      { name: '1단계: 이동 및 사격', text: '방향키 또는 WASD(모바일: 화면 드래그)로 기체를 이동하며 자동 연사되는 탄환으로 적기를 격추합니다.' },
      { name: '2단계: 위기 탈출 (롤링 & 폭탄)', text: 'Z키로 360도 공중제비(1.5초 완전 무적)를 돌고, X키(모바일: BOMB 버튼)로 화면 전체 탄환을 소거하는 메가 폭탄을 투하합니다.' },
      { name: '3단계: 아이템 획득 및 편대 강화', text: '빨간색 편대기를 전멸시키면 드롭되는 파워업(P), 호위기(L), 폭탄(B) 아이템을 획득하여 화력을 극대화합니다.' }
    ],
    faqs: [
      { question: '모바일에서도 조작이 가능한가요?', answer: '네, 화면 어디든 손가락으로 드래그하면 손가락이 기체를 가리지 않는 상대 조작 방식으로 정밀하게 기동할 수 있습니다.' },
      { question: '점수가 높아지면 난이도가 어떻게 변하나요?', answer: '스코어가 올라갈수록 적 탄환 속도, 보스 체력, 잡몹 편대 생성 주기가 실시간으로 정밀 스케일링되어 긴장감 넘치는 난이도를 제공합니다.' }
    ],
    legacyAppUrl: '/app/flight/'
  },
  'sudoku': {
    slug: 'sudoku',
    name: '스마트 스도쿠 (Sudoku)',
    categoryLabel: '두뇌 퍼즐',
    icon: 'fas fa-th',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    summary: '쉬움부터 전문가 난이도까지 지원하는 정통 9x9 스도쿠 퍼즐',
    description: '가로, 세로, 3x3 박스에 1부터 9까지의 숫자를 겹치지 않게 채우는 무료 온라인 스도쿠 게임입니다. 메모(후보수) 기능, 오류 검사, 힌트 및 물리 키보드 타건을 지원합니다.',
    keywords: ['스도쿠', '온라인스도쿠', '무료스도쿠', '두뇌퍼즐', '스도쿠게임'],
    howToSteps: [
      { name: '1단계: 빈 칸 선택', text: '마우스 클릭 또는 키보드 방향키로 채우고자 하는 스도쿠 그리드 칸을 선택합니다.' },
      { name: '2단계: 숫자 입력', text: '1~9 키를 눌러 숫자를 기입하거나, N 키를 눌러 메모(후보수) 모드로 전환합니다.' },
      { name: '3단계: 81칸 완성', text: '모든 줄과 박스의 규칙을 만족하도록 빈 칸을 모두 채워 퍼즐을 클리어합니다.' }
    ],
    faqs: [
      { question: '힌트 기능은 어떻게 쓰나요?', answer: '힌트 버튼을 클릭하면 현재 선택된 칸의 확정 숫자를 한 칸 확인하실 수 있습니다.' }
    ],
    legacyAppUrl: '/app/sudoku/'
  },
  '2048': {
    slug: '2048',
    name: '2048 퍼즐 게임',
    categoryLabel: '두뇌 퍼즐',
    icon: 'fas fa-shapes',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    summary: '같은 숫자의 블록을 슬라이드하여 합쳐서 2048 타일을 만드는 중독성 퍼즐',
    description: '상하좌우 방향키나 스와이프로 4x4 타일을 이동시키며 같은 숫자를 병합해 2048 타일을 달성하는 인기 웹 퍼즐 게임입니다. 부드러운 애니메이션과 최고 점수 저장 기능을 제공합니다.',
    keywords: ['2048', '2048게임', '숫자퍼즐', '무료퍼즐', '온라인2048'],
    howToSteps: [
      { name: '1단계: 타일 슬라이드', text: '키보드 방향키(↑, ↓, ←, →) 또는 모바일 화면 스와이프로 타일을 한 방향으로 밉니다.' },
      { name: '2단계: 숫자 병합', text: '숫자가 같은 두 타일이 충돌하면 2+2=4, 4+4=8과 같이 두 배 숫자의 타일로 합쳐집니다.' },
      { name: '3단계: 2048 타일 달성', text: '판이 가득 차기 전에 2048 타일을 완성하고 최고 점수 랭킹에 도전합니다.' }
    ],
    faqs: [
      { question: '2048을 만든 후에도 계속할 수 있나요?', answer: '네, 2048 타일을 만든 이후에도 4096, 8192 타일까지 계속해서 고득점을 노릴 수 있습니다.' }
    ],
    legacyAppUrl: '/app/2048/'
  },
  'minesweeper': {
    slug: 'minesweeper',
    name: '지뢰찾기 클래식',
    categoryLabel: '클래식 보드',
    icon: 'fas fa-bomb',
    iconBg: 'bg-slate-50',
    iconColor: 'text-slate-600',
    summary: '초급부터 고급까지 논리적으로 지뢰를 탐지하고 깃발을 꽂는 클래식 지뢰찾기',
    description: '윈도우 정통 지뢰찾기의 손맛과 규칙을 그대로 구현한 웹 지뢰찾기입니다. 좌클릭 칸 열기, 우클릭 깃발 꽂기, 더블클릭 주변 열기(Chord) 및 타이머 기능을 제공합니다.',
    keywords: ['지뢰찾기', '무료지뢰찾기', '클래식지뢰찾기', '지뢰게임'],
    howToSteps: [
      { name: '1단계: 첫 번째 칸 클릭', text: '첫 클릭은 절대 지뢰가 나오지 않으므로 안전하게 시작할 수 있습니다.' },
      { name: '2단계: 숫자 힌트 분석', text: '공개된 칸의 숫자는 인접한 8개 칸에 숨겨진 지뢰의 개수를 의미합니다.' },
      { name: '3단계: 깃발 표시 및 클리어', text: '지뢰로 확실시되는 칸에 우클릭으로 깃발을 꽂고 모든 안전한 칸을 열어 승리합니다.' }
    ],
    faqs: [
      { question: '모바일에서도 깃발을 꽂을 수 있나요?', answer: '네, 모바일에서는 길게 터치(Long-press)하거나 모드 전환 버튼을 눌러 깃발을 꽂을 수 있습니다.' }
    ],
    legacyAppUrl: '/app/minesweeper/'
  },
  'baseball': {
    slug: 'baseball',
    name: '베라 9이닝 야구게임 (숫자야구)',
    categoryLabel: '스포츠 퍼즐',
    icon: 'fas fa-baseball-ball',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    summary: '9이닝 스코어보드와 스트라이크/볼 판정 기반의 3자리 숫자야구 두뇌 게임',
    description: '상대방의 3자리 비밀 숫자를 추리하는 클래식 숫자야구 게임을 9이닝 정규 경기 스코어보드와 다이아몬드 베이스 러닝 시스템으로 재해석한 프리미엄 야구 게임입니다.',
    keywords: ['숫자야구', '야구게임', '9이닝야구', '두뇌게임', '온라인숫자야구'],
    howToSteps: [
      { name: '1단계: 3자리 중복 없는 숫자 예측', text: '0부터 9까지 서로 다른 세 자리 숫자를 입력합니다.' },
      { name: '2단계: 스트라이크 & 볼 결과 판정', text: '숫자와 자리가 모두 맞으면 스트라이크(S), 숫자는 맞지만 자리가 다르면 볼(B)로 카운트됩니다.' },
      { name: '3단계: 3스트라이크 득점', text: '9이닝 내에 3스트라이크를 달성하여 득점하고 승리를 거두세요.' }
    ],
    faqs: [
      { question: '숫자에 중복이 허용되나요?', answer: '아닙니다. 정통 숫자야구 룰에 따라 각 자릿수는 서로 다른 0~9 숫자로 구성됩니다.' }
    ],
    legacyAppUrl: '/app/baseball/'
  },
  'omok': {
    slug: 'omok',
    name: '온라인 오목 (Gomoku)',
    categoryLabel: '전통 보드',
    icon: 'fas fa-circle',
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-800',
    summary: '흑돌과 백돌을 교대로 놓아 먼저 5목을 완성하는 15x15 정통 오목 보드게임',
    description: '깔끔한 바둑판 그래픽에서 즐기는 오목 게임입니다. 인공지능(AI) 대전 및 2인 로컬 대전을 지원하며 렌주룰(금수) 가이드를 제공합니다.',
    keywords: ['오목', '온라인오목', '무료오목', '인공지능오목', '바둑판오목'],
    howToSteps: [
      { name: '1단계: 착수 위치 선정', text: '바둑판의 교차점에 마우스로 클릭하여 돌을 놓습니다.' },
      { name: '2단계: 공격과 방어', text: '상대방의 3목과 4목을 차단하면서 자신의 연속 5목 연결을 계획합니다.' },
      { name: '3단계: 5목 완성 승리', text: '가로, 세로, 대각선 중 한 방향으로 자신의 돌 5개를 먼저 연속 배치하면 승리합니다.' }
    ],
    faqs: [
      { question: '흑돌 33 금수가 적용되나요?', answer: '설정에서 렌주룰(33, 44 금수) 활성화 여부를 선택하실 수 있습니다.' }
    ],
    legacyAppUrl: '/app/omok/'
  },
  'freecell': {
    slug: 'freecell',
    name: '프리셀 솔리테어 (FreeCell)',
    categoryLabel: '카드 솔리테어',
    icon: 'fas fa-clone',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-700',
    summary: '4개의 프리셀과 빈 열을 전략적으로 활용하여 52장 카드를 홈셀로 수집하는 정통 솔리테어',
    description: '운이 아닌 순수 실력과 전략으로 99.9% 이상 풀 수 있는 정통 프리셀(FreeCell) 카드 솔리테어입니다. 슈퍼무브 계산 공식과 무제한 되돌리기(Undo), 힌트 기능을 지원합니다.',
    keywords: ['프리셀', '프리셀게임', '무료프리셀', '윈도우프리셀', '카드게임', '솔리테어'],
    howToSteps: [
      { name: '1단계: 열(Column) 카드 이동', text: '색상이 교차(빨강/검정)되고 숫자가 1 작은 카드를 다른 열의 카드 아래로 이동합니다.' },
      { name: '2단계: 4개의 프리셀 버퍼 활용', text: '좌측 상단 4개의 프리셀 임시 보관소에 카드를 임시로 옮겨 막힌 카드를 꺼냅니다.' },
      { name: '3단계: 홈셀에 A부터 K까지 수집', text: '우측 상단 4개의 홈셀에 각 무늬(스페이드, 하트, 다이아, 클로버)별로 에이스(A)부터 킹(K)까지 순서대로 완성합니다.' }
    ],
    faqs: [
      { question: '슈퍼무브(Supermove)는 어떻게 작동하나요?', answer: '비어 있는 프리셀 개수와 빈 열 개수에 비례하여 여러 장의 정렬된 카드를 한 번에 이동시킬 수 있는 자동 다중 이동 기능입니다.' }
    ],
    legacyAppUrl: '/app/freecell/'
  },
  'janggi': {
    slug: 'janggi',
    name: '베라 장기 (정통 9×10 한국 장기)',
    categoryLabel: '전통 보드',
    icon: 'fas fa-chess-rook',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-800',
    summary: '마상상마·상마상마 4대 상차림과 73.5점 점수제, 3단계 AI 대전 및 1일 1외통수 묘수풀이',
    description: '설치 없이 웹 브라우저에서 바로 즐기는 정통 9×10 한국 장기입니다. 마상상마·상마상마·원앙마·양귀마 4대 정통 상차림과 한국 공식 73.5점 점수제 덤 규정을 완벽 적용하였으며, 3단계 AI 대진과 묘수풀이를 지원합니다.',
    keywords: ['한국장기', '장기게임', '온라인장기', '장기두기', '1일1외통수', '장기묘수풀이', '장기AI'],
    howToSteps: [
      { name: '1단계: 상차림 선택', text: '게임 시작 전 마상상마, 상마상마, 원앙마, 양귀마 중 원하는 진형을 선택합니다.' },
      { name: '2단계: 기물 기동 및 전술 전개', text: '차, 포, 마, 상, 사, 졸/한의 행마법을 살려 궁성을 공략하고 상대 기물을 제압합니다.' },
      { name: '3단계: 외통수 또는 점수승', text: '상대방의 궁을 더 이상 피할 수 없게 외통(Checkmate)을 치거나 73.5점 점수 승부를 가릅니다.' }
    ],
    faqs: [
      { question: '한(후수)의 1.5점 덤이 적용되나요?', answer: '네, 한국기원 공식 규정에 맞춰 후수(한나라)에게 1.5점의 덤이 부여되어 무승부 없이 점수 판정이 이루어집니다.' }
    ],
    legacyAppUrl: '/app/janggi/'
  },
  'vera-pop': {
    slug: 'vera-pop',
    name: 'Vera Pop (베라 팝 - 60초 매치3)',
    categoryLabel: '스피드 퍼즐',
    icon: 'fas fa-gem',
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-600',
    summary: '60초 타임어택 네온 보석 매치-3, 라인 레이저와 5초간 2배 점수의 하이퍼 피버 모드',
    description: '60초 제한 시간 동안 5가지 네온 보석을 맞추는 초경량 스피드 매치-3 아케이드 퍼즐입니다. 4매칭 라인 레이저와 5매칭 하이퍼 노바 폭탄, 빠른 콤보로 발동되는 5초간 2배 점수 하이퍼 피버(Hyper Fever) 모드를 즐겨보세요.',
    keywords: ['베라팝', '매치3게임', '보석맞추기', '스피드퍼즐', '하이퍼피버', '웹게임'],
    howToSteps: [
      { name: '1단계: 보석 스와이프', text: '마우스 드래그 또는 터치로 인접한 보석의 위치를 바꿉니다.' },
      { name: '2단계: 특수 블록 생성', text: '4개 매치 시 라인 레이저, 5개 매치 시 화면 내 단일 보석을 일괄 제거하는 하이퍼 노바가 생성됩니다.' },
      { name: '3단계: 하이퍼 피버 진입', text: '끊기지 않고 콤보를 누적하여 5초 동안 모든 점수가 2배가 되는 피버 모드로 최고 점수를 경신하세요.' }
    ],
    faqs: [
      { question: '게임 시간이 끝나면 점수는 저장되나요?', answer: '네, 로컬스토리지에 기기별 최고 점수가 자동 저장되어 언제든 기록 경신에 도전하실 수 있습니다.' }
    ],
    legacyAppUrl: '/app/vera-pop/'
  }
};
