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
  }
};
