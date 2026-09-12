// ============================================================================
// 16비트 정통 픽셀 리마스터 캐릭터 및 보스 도트 매트릭스 데이터
// 1px 다크 아웃라인 + 3단계 음영 셰이딩 + 3등신 인체 해부학 골격 (두부 8 : 상체 8 : 하체 8)
// 3/4 측면 시점(S-Curve) 정통 클래식 JRPG 스프라이트
// ============================================================================

export interface PixelSpriteDef {
  width: number;
  height: number;
  palette: Record<string, string>;
  rows: string[];
}

// ----------------------------------------------------------------------------
// 1. 몽크 (Monk - 렌) : 17x25 정통 무도가 인체 골격
// ----------------------------------------------------------------------------
const MONK_PAL: Record<string, string> = {
  '.': 'none',
  '#': '#09090b', // 외곽선
  'h': '#2e1305', // 헤어 딥다크
  'H': '#5c280e', // 헤어 미드
  'j': '#8a4019', // 헤어 하이라이트
  'r': '#881313', // 머리띠/도복 암적색
  'R': '#dc2626', // 머리띠/도복 크림슨
  'k': '#ef4444', // 도복 하이라이트
  's': '#fed7aa', // 피부 기본
  'S': '#fba876', // 피부 음영
  'd': '#ea580c', // 피부 깊은 음영
  'w': '#f8fafc', // 흰색 붕대 랩/띠
  'W': '#94a3b8', // 붕대 음영
  'b': '#450a0a', // 권법화
  'e': '#1c1917', // 눈동자
};

const MONK_IDLE = [
  ".....######......",
  "....#jHHHHH#.....",
  "...#jHjHHHHH#..#R",
  "..#RRRRRRRRRR##RR",
  "...#sssssss#..#R#",
  "..#ssseeees#...##",
  "..#ssssssss#.....",
  "...#ssSSSSS#.....",
  "....#sSSSS#......", // 목선
  "...#s##kRRk#.....", // 어깨
  "..#ss#kRRRR#.....", // 흉부
  ".#wws#kRssR#.....", // 가드 자세, 열린 도복
  ".#Wws##wwww#.....", // 흰색 허리띠
  "..##.#s#kRRk#....",
  "....#ss#kRRR#....", // 오른손
  "...#wws#kRRR#....",
  "...#Ww##RRRR#....", // 골반
  "....##.#RR#RR#...",
  "......#kR#.#Rk#..", // 벌린 기마자세 허벅지
  ".....#kR#...#Rk#.",
  "....#ww#.....#ww#", // 종아리 붕대
  "....#WW#.....#WW#",
  "...#bbb#.....#bbb", // 발
  "...####.......###"
];

const MONK_ATTACK = [
  ".....######......",
  "....#jHHHHH#.....",
  "...#jHjHHHHH#..#R",
  "..#RRRRRRRRRR##RR",
  "...#sssssss#..#R#",
  "..#ssseeees#...##",
  "..#ssssssss#.....",
  "...#ssSSSSS#..#w#",
  "....#sSSSS#..#Www", // 전방 펀치 팔 뻗기
  "...#s##kRRk#.#sWw",
  "..#ss#kRRRR##s##.",
  ".#wws#kRssR#.....",
  ".#Wws##wwww#.....",
  "..##.#s#kRRk#....",
  "....#ss#kRRR#....",
  ".....#s#kRRR#....",
  "......##RRRR#....",
  "......#kR#.#Rk#..",
  ".....#kR#...#Rk#.",
  "....#ww#.....#ww#",
  "....#WW#.....#WW#",
  "...#bbb#.....#bbb",
  "...####.......###"
];

const MONK_HURT = [
  "......######.....",
  ".....#jHHHHH#....",
  "....#jHjHHHHH#..#",
  "...#RRRRRRRRRR##R",
  "....#shhsss#..#R#",
  "...#sssssss#...##",
  "...#sssssss#.....",
  "....#ssSSSSS#....",
  ".....#sSSSS#.....",
  "....#s##kRRk#....",
  "...#ss#kRRRR#....",
  "..#wws#kRssR#....",
  "..#Wws##wwww#....",
  "...##.#s#kRRk#...",
  ".....#ss#kRRR#...",
  "....#wws#kRRR#...",
  "....#Ww##RRRR#...",
  ".....##.#RR#RR#..",
  ".......#kR#.#Rk#.",
  "......#ww#...#ww#",
  ".....#bbb#...#bbb",
  ".....####.....###"
];

const MONK_DANGER = [
  ".................",
  ".................",
  ".....######......",
  "....#jHHHHH#.....",
  "...#jHjHHHHH#..#R",
  "..#RRRRRRRRRR##RR",
  "...#shhssss#..#R#",
  "...#sssssss#...##",
  "....#ssSSSSS#....",
  ".....#sSSSS#.....",
  "...#s##kRRk#.....",
  "..#ss#kRRRR#.....",
  ".#wws#kRssR#.....",
  ".#Wws##wwww#.....",
  "..##.#s#kRRk#....",
  "....#ss#kRRR#....",
  ".....#ww##ww#....", // 꿇은 무릎
  "....#bbb##bbb#...",
  "....####..####...",
  "................."
];

const MONK_VICTORY = [
  "....#ww#...#ww#..", // 주먹을 불끈 쥐고 번쩍 든 포즈
  "...#Www#...#wwW#.",
  "...#wWs#...#sWw#.",
  "....#s#######s#..",
  "....#jHHHHHHH#...",
  "...#jHjHHHHHHH#..",
  "..#RRRRRRRRRRRR#.",
  "..#RR#sssssss#RR#",
  "...#ssseeees#..#R",
  "...#ssssssss#...#",
  "....#ssSSSSS#....",
  ".....#sSSSS#.....", // 목선
  "....#ss#kRR#ss#..", // 넓은 어깨
  "...#ss#kRRRR#ss#.", // 편 가슴
  "....##kRRssRk##..",
  "......#wwwwww#...", // 허리띠
  "......#kRRRRk#...",
  ".....#kRR##RRk#..",
  "....#kR#....#Rk#.", // 넓게 벌린 다리
  "...#kR#......#Rk#",
  "..#ww#........#ww",
  "..#WW#........#WW",
  ".#bbb#........#bb",
  ".####..........##"
];

// ----------------------------------------------------------------------------
// 2. 전사 (Warrior - 아르반) : 17x25 정통 기사 인체 골격
// ----------------------------------------------------------------------------
const WAR_PAL: Record<string, string> = {
  '.': 'none',
  '#': '#09090b',
  'h': '#475569',
  'H': '#94a3b8',
  'k': '#f8fafc',
  'y': '#b45309',
  'Y': '#f59e0b',
  'j': '#fef08a',
  's': '#fed7aa',
  'S': '#fba876',
  'e': '#1d4ed8',
  'c': '#1e3a8a',
  'C': '#2563eb',
  'l': '#60a5fa',
  'r': '#991b1b',
  'R': '#dc2626',
  'p': '#f87171',
  'w': '#f8fafc',
  'W': '#94a3b8',
  'g': '#d97706',
  'b': '#1e293b',
  'B': '#334155',
  't': '#f8fafc',
  'T': '#cbd5e1',
};

const WAR_IDLE = [
  "....#####........",
  "..##hHHHHkh##....",
  ".#yjHHHHHHjyy#...",
  "#YYyjhhhhjjYY#...",
  ".#r#seEsh##r#....",
  ".#r#sssss#r#.....",
  "..#r#sSSS#r#.....",
  "...#r#SS#r#......", // 목
  "..#R##CCC##R#..#w", // 견갑
  ".#pRR#lCCl#RRp##w", // 흉갑
  "#sys##kCCk##sys#w", // 방패와 검
  "#YYy#r#CC#r#yYYgw",
  ".###.r#CC#r.###g#",
  ".....r#YgY#r...#s", // 황금 벨트
  "....#r#kk#r#.....",
  "....#R#tt#R#.....", // 타이즈
  "....#R#tt#R#.....",
  ".....#ktttk#.....", // 골반
  "....#tT#.#Tt#....", // 허벅지
  "...#tT#...#Tt#...",
  "...#bb#...#bb#...", // 부츠
  "..#BbB#...#BbB#..",
  "..#BBB#...#BBB#..",
  "...###.....###..."
];

const WAR_ATTACK = [
  "....#####........",
  "..##hHHHHkh##....",
  ".#yjHHHHHHjyy#...",
  "#YYyjhhhhjjYY#.##",
  ".#r#seEsh##r###ww", // 검을 전방으로 크게 찌르는 모션
  ".#r#sssss#r#wwww#",
  "..#r#sSSS#r##wW#.",
  "...#r#SS#r#.#gw#.",
  "..#R##CCC##R##s#.",
  ".#pRR#lCCl#RRp#..",
  "#sys##kCCk##sys#.",
  "#YYy#r#CC#r#yYY#.",
  ".###.r#CC#r.###..",
  ".....r#YgY#r.....",
  "....#r#kk#r#.....",
  "....#R#tt#R#.....",
  ".....#ktttk#.....",
  "....#tT#.#Tt#....",
  "...#tT#...#Tt#...",
  "...#bb#...#bb#...",
  "..#BbB#...#BbB#..",
  "...###.....###..."
];

const WAR_HURT = [
  ".....#####.......",
  "...##hHHHHkh##...",
  "..#yjHHHHHHjyy#..",
  ".#YYyjhhhhjjYY#..",
  "..#r#shhsh##r#...",
  "..#r#sssss#r#....",
  "...#r#sSSS#r#....",
  "....#r#SS#r#.....",
  "...#R##CCC##R#...",
  "..#pRR#lCCl#RRp..",
  ".#sys##kCCk##sys#",
  ".#YYy#r#CC#r#yYY#",
  "..###.r#CC#r.###.",
  "......r#YgY#r....",
  ".....#r#kk#r#....",
  ".....#R#tt#R#....",
  "......#ktttk#....",
  ".....#tT#.#Tt#...",
  "....#bb#...#bb#..",
  "...#BbB#...#BbB#.",
  "....###.....###.."
];

const WAR_DANGER = [
  ".................",
  ".................",
  "....#####........",
  "..##hHHHHkh##....",
  ".#yjHHHHHHjyy#...",
  "#YYyjhhhhjjYY#...",
  ".#r#shhsh##r#....",
  ".#r#sssss#r#.....",
  "..#r#sSSS#r#.....",
  "...#r#SS#r#......",
  "..#R##CCC##R#..#w",
  ".#pRR#lCCl#RRp##w",
  "#sys##kCCk##sys#w",
  "#YYy#r#YgY#r#yYYg",
  ".....#r#tt#r#..#s",
  "......#ktttk#..#w", // 꿇은 자세로 검 짚기
  ".....#tT##Tt#..#w",
  "....#bb####bb#.#w",
  "...#BbB#..#BbB###",
  "....###....###..."
];

const WAR_VICTORY = [
  ".#sys#......#sys#", // 참조 이미지 2번째 기사 환호 만세!
  "#YYyys#....#syYYY",
  "#yyyy#..##..#yyyy",
  ".#yy##hHHHHkh#yy#",
  "..#s#yjHHHHjy#s#.",
  "....#YYjhhjYY#...",
  "....#r#seEsh#r#..",
  "....#r#sssss#r#..",
  ".....#r#sSSS#r#..",
  "......#r#SS#r#...", // 목선
  ".....#R##CCC##R#.", // 어깨
  "....#pRR#lCCl#RRp", // 흉갑
  "...#pRRR#kCCk#RRR", // 망토 펼쳐짐
  "...#RRRR#r#C#rRRR",
  "...#RRRR#r#Y#rRRR",
  "....###.r#tt#r###",
  "........r#tt#r...",
  ".......#ktttk#...", // 골반
  "......#tT#.#Tt#..", // 도약 다리
  ".....#tT#...#Tt#.",
  ".....#bb#...#bb#.",
  "....#BbB#...#BbB#",
  "....#BBB#...#BBB#",
  ".....###.....###."
];

// ----------------------------------------------------------------------------
// 3. 백마도사 (White Mage - 세레나) : 17x25 슬림형 사제 인체 골격
// ----------------------------------------------------------------------------
const WM_PAL: Record<string, string> = {
  '.': 'none',
  '#': '#09090b',
  'w': '#f8fafc',
  'W': '#ffffff',
  'g': '#cbd5e1',
  'G': '#94a3b8',
  'r': '#991b1b',
  'R': '#dc2626',
  's': '#fed7aa',
  'S': '#fba876',
  'h': '#5c280e',
  'H': '#8a4019',
  'e': '#1d4ed8',
  'o': '#78350f',
  'm': '#059669',
  'M': '#34d399',
  'b': '#451a03',
};

const WM_IDLE = [
  ".....######......",
  "...##WWWWWWg#....",
  "..#WWWhhhhWWg#...",
  ".#WWWhsehhWWg#...", // 부드러운 얼굴 옆선
  ".#WWWhssssWWg#...",
  "..#WWWhhshWWg#...",
  "...#WWWsssWWg#...",
  "....#WWsSSWWg#...", // 가녀린 목선
  ".....#r#WW#r#....", // 붉은 셰브론 칼라
  "....#gWWWWWWg#...", // 슬림한 어깨선 (8px)
  "...#gWWWWWWWWg#..#mM", // 지팡이
  "..#gWWWWWWWWWWg##mmm",
  "..#gWW#r##r#WWg###o#", // 손목과 지팡이 쥠
  "..#gWW#R##R#WWg##so#",
  "...#gWWWWWWWWg#..#o#", // 잘록한 허리 (8px)
  "...#gWWWWWWWWg#..#o#",
  "...#gW#r#WW#rW#..#o#", // 붉은 삼각 지그재그 밑단
  "...#gW#R#WW#RW#..#o#",
  "....#GGGGGGGG#...#o#",
  ".....#bb##bb#....#o#", // 부츠
  ".....#bb##bb#...###.",
  "......##..##....."
];

const WM_ATTACK = [
  ".....######...#mM",
  "...##WWWWWWg##mmm",
  "..#WWWhhhhWWg##o#",
  ".#WWWhsehhWWg##o#", // 지팡이를 전방으로 들어 영창
  ".#WWWhssssWWg#so#",
  "..#WWWhhshWWg##o#",
  "...#WWWsssWWg###.",
  "....#WWsSSWWg#...",
  ".....#r#WW#r#....",
  "....#gWWWWWWg#...",
  "...#gWWWWWWWWg#..",
  "..#gWWWWWWWWWWg#.",
  "..#gWW#r##r#WWg#.",
  "..#gWW#R##R#WWg#.",
  "...#gWWWWWWWWg#..",
  "...#gW#r#WW#rW#..",
  "...#gW#R#WW#RW#..",
  "....#GGGGGGGG#...",
  ".....#bb##bb#....",
  "......##..##....."
];

const WM_HURT = [
  "......######.....",
  "....##WWWWWWg#...",
  "...#WWWhhhhWWg#..",
  "..#WWWhshhshWWg#.",
  "..#WWWhsssssWWg#.",
  "...#WWWhhshhWWg#.",
  "....#WWWssssWWg#.",
  ".....#WWsSSWWg#..",
  "......#r#WW#r#...",
  ".....#gWWWWWWg#..",
  "....#gWWWWWWWWg#.",
  "...#gWWWWWWWWWWg#",
  "...#gWW#r##r#WWg#",
  "....#gWWWWWWWWg#.",
  "....#gW#r#WW#rW#.",
  ".....#GGGGGGGG#..",
  "......#bb##bb#...",
  ".......##..##...."
];

const WM_DANGER = [
  ".................",
  ".................",
  ".....######......",
  "...##WWWWWWg#....",
  "..#WWWhhhhWWg#...",
  ".#WWWhshhshWWg#..",
  ".#WWWhsssssWWg#..",
  "..#WWWhhshhWWg#..",
  "...#WWWssssWWg#..",
  "....#WWsSSWWg#...",
  ".....#r#WW#r#....",
  "....#gWWWWWWg#..#mM",
  "...#gWWWWWWWWg##mmm",
  "...#gWW#r##r#WWg#o#", // 무릎 꿇고 지팡이 짚기
  "...#gWW#R##R#WWgso#",
  "....#GGGGGGGG#..###",
  ".....#bb##bb#....",
  "......##..##....."
];

const WM_VICTORY = [
  "...............#mM", // 지팡이 번쩍 치켜든 만세 환호
  "....#so#......#mmm",
  ".....#o#.......#o#",
  "......######...#o#",
  "....##WWWWWWg##so#",
  "...#WWWhhhhWWg#o#.",
  "..#WWWhseEhhWWg##.",
  "..#WWWhsssssWWg#..",
  "...#WWWhhshhWWg#..",
  "....#WWWssssWWg#..",
  ".....#WWsSSWWg#...",
  "......#r#WW#r#....",
  ".....#rR#WW#Rr#...",
  "....#gWWWWWWWWg#..",
  "...#gWWWWWWWWWWg#.",
  "..#gWWWWWWWWWWWWg#",
  "..#gWW#r#WW#r#WWg#",
  "..#gWW#R#WW#R#WWg#",
  "...#gWW#r##r#WWg#.",
  "....#GGGGGGGGGG#..",
  ".....#bb#..#bb#...",
  ".....#bb#..#bb#...",
  "......##....##...."
];

// ----------------------------------------------------------------------------
// 4. 흑마도사 (Black Mage - 발렌) : 17x25 정통 마도사 인체 골격
// ----------------------------------------------------------------------------
const BM_PAL: Record<string, string> = {
  '.': 'none',
  '#': '#09090b',
  'o': '#451a03',
  'y': '#78350f',
  'Y': '#9a3412',
  'h': '#c2410c',
  'H': '#f97316',
  'f': '#050508',
  'e': '#eab308',
  'E': '#fef08a',
  'b': '#1e3a8a',
  'B': '#2563eb',
  'l': '#3b82f6',
  'g': '#d97706',
  'w': '#78350f',
  'c': '#06b6d4',
  'C': '#a5f3fc',
  's': '#18181b',
};

const BM_IDLE = [
  ".....####........",
  "....#HhYy#.......",
  "...#HHhYYy#......",
  "..#HHhYYYYy#.....",
  ".#HHhYYYYYYyo#...", // 꺾인 고깔 모자
  "################.",
  "..#ffffffffff#...", // 얼굴 암흑
  "..#fEE#ffffEE#...", // 황금 발광 눈
  "..#fee#ffffee#...",
  "...#ffffffff#....", // 턱선
  "....##BBBB##...#c",
  "...#lBBBBBBb#.#cCc", // 슬림한 어깨선 (8px)
  "..#lBBBBBBBBb##ccc",
  "..#lBB#gg#BBb##w#", // 가죽 장갑과 지팡이
  "...#BBBBBBBBb#gw#",
  "...#BBBBBBBBb##w#", // 잘록한 허리 (8px)
  "...#bBBBBBBb#..#w#",
  "...#bBBBBBBb#..#w#",
  "...#bbbbbbbb#..###", // 로브 밑단 (8px)
  "....#bb##bb#.....",
  "....#ss##ss#.....", // 부츠
  "....#ss##ss#.....",
  ".....##..##......"
];

const BM_ATTACK = [
  ".....####........",
  "....#HhYy#....#c#",
  "...#HHhYYy#..#cCc",
  "..#HHhYYYYy#.#ccc",
  ".#HHhYYYYYYyo##w#",
  "################w", // 지팡이를 전방으로 찌르며 마법 영창
  "..#ffffffffff#gw#",
  "..#fEE#ffffEE##w#",
  "..#fee#ffffee##w#",
  "...#ffffffff#..##",
  "....##BBBB##.....",
  "...#lBBBBBBb#....",
  "..#lBBBBBBBBb#...",
  "..#lBBBBBBBBb#...",
  "...#BBBBBBBBb#...",
  "...#bBBBBBBb#....",
  "...#bbbbbbbb#....",
  "....#bb##bb#.....",
  "....#ss##ss#.....",
  ".....##..##......"
];

const BM_HURT = [
  "......####.......",
  ".....#HhYy#......",
  "....#HHhYYy#.....",
  "...#HHhYYYYy#....",
  "..#HHhYYYYYYyo#..",
  ".################",
  "...#ffffffffff#..",
  "...#ffffffffff#..",
  "...#ffffffffff#..",
  "....#ffffffff#...",
  ".....##BBBB##....",
  "....#lBBBBBBb#...",
  "...#lBBBBBBBBb#..",
  "...#lBBBBBBBBb#..",
  "....#BBBBBBBBb#..",
  "....#bBBBBBBb#...",
  "....#bbbbbbbb#...",
  ".....#bb##bb#....",
  ".....#ss##ss#....",
  "......##..##....."
];

const BM_DANGER = [
  ".................",
  ".................",
  ".....####........",
  "....#HhYy#.......",
  "...#HHhYYy#......",
  "..#HHhYYYYy#.....",
  ".#HHhYYYYYYyo#...",
  "################.",
  "..#ffffffffff#...",
  "..#fEE#ffffEE#...",
  "...#ffffffff#..#c",
  "....##BBBB##..#cCc",
  "...#lBBBBBBb#.#ccc",
  "..#lBBBBBBBBb##w#",
  "...#bBBBBBBb##gw#", // 꿇은 자세로 지팡이 짚기
  "...#bbbbbbbb#..##",
  "....#bb##bb#.....",
  "....#ss##ss#.....",
  ".....##..##......"
];

const BM_VICTORY = [
  "..#cCc#..........", // 지팡이와 마법을 양손으로 번쩍 든 만세 환호
  ".#cCCc#..####....",
  ".#ccc#..#HhYy#...",
  "..#w#..#HHhYYy#..",
  "..#w#.#HHhYYYYy#.",
  ".#gw##HHhYYYYYYyo",
  ".#w##ffffffffff##",
  "..##fEE#ffffEE#..",
  "...#fee#ffffee#..",
  "...#ffffffffff#..",
  "....##BBBBBB##...",
  "...#lBBBBBBBBb#..",
  "..#lBBBBBBBBBBb#.",
  ".#lBBBBBBBBBBBBb#",
  ".#lBBBBBBBBBBBBb#",
  "..#BBBBBBBBBBBBb#",
  "..#bBBBBBBBBb#...",
  "..#bBBBBBBBBb#...",
  "..#bbbbbbbbbb#...",
  "...#bb#..#bb#....",
  "...#ss#..#ss#....",
  "...#ss#..#ss#....",
  "....##....##....."
];

// ----------------------------------------------------------------------------
// 5. 보스 1: 유적 수호 골렘 (Golem) - 48x48
// ----------------------------------------------------------------------------
const GOL_PAL: Record<string, string> = {
  '.': 'none',
  '#': '#1c1917',
  'k': '#292524',
  's': '#44403c',
  'g': '#78716c',
  'l': '#a8a29e',
  'L': '#d6d3d1',
  'c': '#06b6d4',
  'C': '#22d3ee',
  'w': '#a5f3fc',
};

const GOLEM_ROWS = [
  "................####....####....................",
  "...............#lLL#....#LLl#...................",
  "..............#glLL#....#LLlg#..................",
  "..............#ggll######llgg#..................",
  ".............#gggssssssssssggg#.................",
  "............#ggss#cccccccc#ssgg#................",
  "...........#ggs##cCwwwwwCcc##sgg#...............",
  "..........#gls#cCwccccccwCcc#slg#...............",
  ".........#gls#cCwcsssssswcCcc#slg#..............",
  ".........#gls#cCs#sggggs#scCcc#slg#.............",
  "........#glls#cc#ggLLLLgg#ccCc#sllg#............",
  "........#glls###gLL####LLg###cc#sllg#...........",
  ".......#glllss#gL#ssCCss#Lg#sccsslllg#..........",
  ".......#glllss#gL#sCwwCs#Lg#sccsslllg#..........",
  "......#gglllss#gL#ssCCss#Lg#sccsslllgg#.........",
  ".....#ggglllss#ggL######Lgg#sccsslllggg#........",
  ".....#ggssllss##gLLLLLLLLg##sccssllssgg#........",
  "....#ggs#ssllsss#gggggggg#sssccssllss#sgg#......",
  "...#ggs#..#sslllsssssssssslllccss#..#s#sgg#.....",
  "..#gls#....#sssllllllllllllllccss#....#s#slg#....",
  ".#glls#.....##sssllllllllllccss##.....#ss#llg#...",
  "#glllss#......###ssssssssscc###......#sss#lllg#..",
  "#glllss#.........#########..........#ssss#lllg#..",
  "#gglllss#..........................#sssss#lllgg#.",
  ".#ggllss#..........................#ssss#llgg#...",
  "..#ggllss#....###cc######cc###....#ssss#llgg#....",
  "...##glls#...#ccCwwccccccwwCcc#...#sss#llg##.....",
  ".....##llss##cCwcsssssssssswcCc##ssll##ll##......",
  ".......##ll#cCwcsssggggsssswcCc#ll##..##........",
  ".........###cCs#sggggggggs#scCc###..............",
  "...........#cc#gLLLLLLLLLLg#cc#.................",
  "...........#c#gL##########Lg#c#.................",
  "...........#c#gL#sCCCCCCs#Lg#c#.................",
  "...........#c#gL#CwwwwwwC#Lg#c#.................",
  "...........#c#gL#sCCCCCCs#Lg#c#.................",
  "...........###gL##########Lg###.................",
  ".............#ggL########Lgg#...................",
  ".............#gggLLLLLLLLggg#...................",
  "............#ggggssssssssgggg#..................",
  "...........#ggggs#cccccc#sgggg#.................",
  "..........#ggggs#..#cc#..#sgggg#................",
  ".........#ggsss#...#cc#...#sssgg#...............",
  "........#ggss##....#cc#....##ssgg#..............",
  ".......#ggss#......#cc#......#ssgg#.............",
  "......#ggss#.......#cc#.......#ssgg#............",
  ".....#ggss#........#cc#........#ssgg#...........",
  ".....#ssss#........####........#ssss#...........",
  "......####......................####............"
];

// ----------------------------------------------------------------------------
// 6. 보스 2: 네더 크라켄 (Kraken) - 48x48
// ----------------------------------------------------------------------------
const KRAK_PAL: Record<string, string> = {
  '.': 'none',
  '#': '#09090b',
  'p': '#312e81',
  'P': '#4338ca',
  'l': '#6366f1',
  'r': '#991b1b',
  'R': '#ef4444',
  'c': '#06b6d4',
  'C': '#67e8f9',
  'w': '#f8fafc',
};

const KRAKEN_ROWS = [
  "....................########....................",
  "..................##ppPPPPpp##..................",
  "................#ppPPPPPPllPpp#.................",
  "...............#pPPPPPPlllllllp#................",
  "..............#pPPPPllllCCCCCCllp#..............",
  ".............#pPPPlllCCCCccccCCCllp#............",
  "............#pPPllCCCcc########ccCllp#..........",
  "...........#pPllCCcc##RRRRRRRR##ccCllp#.........",
  "..........#pPlCCc##RRRRRrrrrRRRRR##cClp#........",
  ".........#pPlCc##RRRrrrrr##rrrrrRRR##clp#.......",
  "........#pPlCc#RRrrrrr####..####rrrrrR#clp#.....",
  "........#pPlCc#Rrrrrr#ww##..##ww#rrrrr#clp#.....",
  ".......#pPlCc#Rrrrrr##ww#....#ww##rrrrr#clp#....",
  ".......#pPlCc#Rrrrrr#wwww#..#wwww#rrrrr#clp#....",
  "......#pPllCc#Rrrrrrr####....####rrrrrr#cllp#...",
  "......#pPllCC##Rrrrrrrrrrrrrrrrrrrrrrr##Cllp#...",
  ".....#pPPlllCC##RRrrrrrrrrrrrrrrrrrrRR##CClllp#..",
  ".....#pPPPllllCC###RRRRRRRRRRRRRRRR###CCllllp#..",
  "....#pPPPPPPllllCCCC##############CCCCllllpp#...",
  "...#pPPpp#PPPPlllllCCCCCCCCCCCCCCCClllll#pp#....",
  "..#pPpp#..#pPPPPPllllllllllllllllllPPPp#..#.....",
  "..#ppp#....#pPPPPPPPPPPPPPPPPPPPPPPPPp#.........",
  ".#pp#..#c#..#ppPPPPPPPPPPPPPPPPPPPPpp#..#c#.....",
  ".#p#..#Ccc#..##ppPPPPPPPPPPPPPPPPpp##..#Ccc#....",
  "#p#..#CCcC#....###pppppppppppppp###....#CCcC#...",
  "#p#..#CccC#.......##############.......#CccC#...",
  "#p#...#CcC#.....##cCCCCCCCCCCCCc##.....#CcC#....",
  ".#p#...#c#.....#cCCcCcccccccCccCcc#.....#c#.....",
  "..#p#........#cCCcCcc#######ccCccCcc#...........",
  "...#p#......#cCCcCcc#.......#ccCccCcc#..........",
  "....#p#....#cCCcCc#...........#cCCcCcc#.........",
  ".....#p#..#cCCcCc#.............#cCCcCc#.........",
  "......##.#cCCcCc#...............#cCCcCc#........",
  "........#cCCcCc#.................#cCCcCc#.......",
  ".......#cCCcCc#...................#cCCcCc#......",
  "......#cCCcCc#.....................#cCCcCc#.....",
  ".....#cCCcCc#.......................#cCCcCc#....",
  "....#cCCcCc#.........................#cCCcCc#...",
  "...#cCCcCc#...........................#cCCcCc#..",
  "..#cCCcCc#.............................#cCCcCc#.",
  ".#cCCcCc#...............................#cCCcCc#",
  "#cCCcCc#.................................#cCCcCc",
  "#CccC##...................................##CccC",
  "#CcC#.......................................#CcC",
  ".#c#.........................................#c#",
  "................................................",
  "................................................",
  "................................................"
];

// ----------------------------------------------------------------------------
// 7. 보스 3: 바하무트의 허상 (Bahamut) - 48x48
// ----------------------------------------------------------------------------
const BAH_PAL: Record<string, string> = {
  '.': 'none',
  '#': '#09090b',
  'k': '#1e1b4b',
  'p': '#2e1065',
  'P': '#581c87',
  'v': '#7e22ce',
  'V': '#a855f7',
  'e': '#06b6d4',
  'E': '#67e8f9',
  'w': '#f8fafc',
  'W': '#cbd5e1',
  'f': '#0284c7',
  'F': '#38bdf8',
};

const BAHAMUT_ROWS = [
  "................####............####............",
  "...............#WwwW#..........#WwwW#...........",
  "..............#WwwwwW#........#WwwwwW#..........",
  ".............#WwwwwwwW#......#WwwwwwwW#.........",
  "............#WwwwwwwwwW#....#WwwwwwwwwW#........",
  "............#WWwwwwwwWW#....#WWwwwwwwWW#........",
  ".............#WWWwwWWW#......#WWWwwWWW#.........",
  "..............#WWWWWW#........#WWWWWW#..........",
  "...............#kPPk#..........#kPPk#...........",
  "..............#kPPPPk##########kPPPPk#..........",
  ".............#kPPvvPPPPPPPPPPPPPPvvPPk#.........",
  "............#kPPvVVvvvvvvvvvvvvvvVVvPPk#........",
  "...........#kPPvVVVVVVVVVVVVVVVVVVVVvPPk#.......",
  "..........#kPPvVVvvvvvvvvvvvvvvvvvvVVvPPk#......",
  ".........#kPPvVVv##eEEe######eEEe##vVVvPPk#.....",
  "........#kPPvVVv#EEe##eEE##EEe##eEE#vVVvPPk#....",
  "........#kPPvVVv#EEe##eEE##EEe##eEE#vVVvPPk#....",
  ".......#kPPvVVv#eEEe##eEE##EEe##eEEe#vVVvPPk#...",
  "......#kPPvvVVv######################vVVvvPPk#..",
  ".....#kPPPPvvVv#ww#wwww#wwww#wwww#ww#vVvvPPPPk#.",
  "....#kPPvvvvVVv#ww#wwww#wwww#wwww#ww#vVVvvvvPPk#",
  "...#kPPvVVvvvVv######################vVvvvVVvPPk",
  "..#kPPvVVVVvvvvv#fFFFFFffffFFFFFf#vvvvvvVVVVvPPk",
  ".#kPPvVVVVvvvvvv#FFFFffffffffFFFF#vvvvvvvVVVVvPP",
  "#kPPvVVVVvvvvvvv#fFFFFFffffFFFFFf#vvvvvvvvVVVVvP",
  "#kPPvVVVvvvvvvvvv################vvvvvvvvvvVVVvP",
  ".#kPPvVVvvvvvvvv#WwwwwwwwwwwwwwwW#vvvvvvvvvVVvPP",
  "..#kPPvVVvvvvvv#WwwwwwwwwwwwwwwwwW#vvvvvvvVVvPPk",
  "...#kPPvVvvvvv#WwwwwwwwwwwwwwwwwwwW#vvvvvvVvPPk#",
  "....#kPPvvvvv#WwwwwwwwwwwwwwwwwwwwwW#vvvvvvPPk#.",
  ".....#kPPvvv#WWwwwwwwwwwwwwwwwwwwwwWW#vvvvPPk#..",
  "......#kPPvv#WWWwwwwwwwwwwwwwwwwwwWWW#vvvPPk#...",
  ".......#kPPv#WWWWwwwwwwwwwwwwwwwwWWWW#vvPPk#....",
  "........#kPPv#WWWWWwwwwwwwwwwwwWWWWW#vvPPk#.....",
  ".........#kPPv#WWWWWWwwwwwwwwWWWWWW#vvPPk#......",
  "..........#kPPv#WWWWWWWwwwwWWWWWWW#vvPPk#.......",
  "...........#kPPv#WWWWWWWWWWWWWWWW#vvPPk#........",
  "............#kPPv#WWWWWWWWWWWWWW#vvPPk#.........",
  ".............#kPPv#WWWWWWWWWWWW#vvPPk#..........",
  "..............#kPPv#WWWWWWWWWW#vvPPk#...........",
  "...............#kPPv#WWWWWWWW#vvPPk#............",
  "................#kPPv#WWWWWW#vvPPk#.............",
  ".................#kPPv#WWWW#vvPPk#..............",
  "..................#kPPv#WW#vvPPk#...............",
  "...................#kPPv##vvPPk#................",
  "....................#kPPvvPPk#..................",
  ".....................#kPPPPk#...................",
  "......................######...................."
];

// ----------------------------------------------------------------------------
// 8. 보스 4: 대사제 에제키엘 (Ezekiel) - 48x48
// ----------------------------------------------------------------------------
const EZ_PAL: Record<string, string> = {
  '.': 'none',
  '#': '#09090b',
  'Y': '#f59e0b',
  'j': '#fef08a',
  'p': '#2e1065',
  'P': '#581c87',
  'v': '#7e22ce',
  'w': '#f8fafc',
  'W': '#ffffff',
  'c': '#06b6d4',
  'C': '#67e8f9',
  's': '#fed7aa',
  'S': '#fba876',
  'e': '#ffffff',
};

const EZEKIEL_ROWS = [
  "....................########....................",
  "..................##jjYYYYjj##..................",
  "........#C#.....#jjYYYYYYYYYYjj#.....#C#........",
  ".......#CcC#...#jYYYYYYYYYYYYYYj#...#CcC#.......",
  "........#C#...#jYYYYYY####YYYYYYj#...#C#........",
  ".............#jYYYYY#ssssss#YYYYYj#.............",
  "............#jYYYYY#seeeeess#YYYYYj#............",
  "....#C#.....#jYYYY#seeeeeeees#YYYYj#.....#C#....",
  "...#CcC#....#jYYY#seeeeeeeeee#sYYYj#....#CcC#...",
  "....#C#......#jYY#seWWeeeeWWe#sYYj#......#C#....",
  ".............#jYY#seWWeeeeWWe#sYYj#.............",
  "..............#jY#seeeeeeeees#Yj#...............",
  "...............#Y#seeeeeeeees#Y#................",
  "................#j#sssssssss#j#.................",
  ".................##SSSSSSSSS##..................",
  "................#jjjYYYYYYYjjj#.................",
  "...............#jYYYYYYYYYYYYYj#................",
  "..............#jYYYYjjjjjjjYYYYj#...............",
  ".............#jYYYjjvvvvvvvjjYYYj#..............",
  "............#jYYjjvPPPPPPPPPvjjYYj#.............",
  "...........#jYYjvPPpppppppppPPvjYYj#............",
  "..........#jYYjvPPp#########pPPvjYYj#...........",
  ".........#jYYjvPPp#WWWWWWWWW#pPPvjYYj#..........",
  "........#jYYjvPPp#WWcCCCCCcWW#pPPvjYYj#.........",
  ".......#jYYjvPPp#WWcCCCCCCCcWW#pPPvjYYj#........",
  "......#jYYjvPPp#WWcCCCCCCCCCcWW#pPPvjYYj#.......",
  ".....#jYYjvPPp#WWcCCCCCCCCCCCcWW#pPPvjYYj#......",
  "....#jYYjvPPp#WWcCCCCCCCCCCCCCcWW#pPPvjYYj#.....",
  "...#jYYjvPPp#WWcCCCCCCCCCCCCCCccWW#pPPvjYYj#....",
  "..#jYYjvPPp#WWcCCCC####CCCC#####cWW#pPPvjYYj#...",
  ".#jYYjvPPp#WWcCCCC#jjjj#CC#jjjjj#cWW#pPPvjYYj#..",
  "#jYYjvPPp#WWcCCCC#jYYYYj##jYYYYYj#cWW#pPPvjYYj#.",
  "#jYYjvPPp#WWcCCC#jYYYYYYjjYYYYYYj#cWW#pPPvjYYj#.",
  "#jYYjvPPp#WWcCC#jYYYYYYYYYYYYYYYYj#cWW#pPPvjYYj#",
  "#jYYjvPPp#WWcCC#jYYYYYYYYYYYYYYYYj#cWW#pPPvjYYj#",
  "#jYYjvPPp#WWcCCC#jYYYYYYYYYYYYYYj#cWW#pPPvjYYj#.",
  ".#jYYjvPPp#WWcCCC#jYYYYYYYYYYYYj#cWW#pPPvjYYj#..",
  "..#jYYjvPPp#WWcCCC#jYYYYYYYYYYj#cWW#pPPvjYYj#...",
  "...#jYYjvPPp#WWcCCC#jYYYYYYYYj#cWW#pPPvjYYj#....",
  "....#jYYjvPPp#WWcCCC#jYYYYYYj#cWW#pPPvjYYj#.....",
  ".....#jYYjvPPp#WWcCCC#jYYYYj#cWW#pPPvjYYj#......",
  "......#jYYjvPPp#WWcCCC#jYYj#cWW#pPPvjYYj#.......",
  ".......#jYYjvPPp#WWcCCC#jj#cWW#pPPvjYYj#........",
  "........#jYYjvPPp#WWcCCC##cWW#pPPvjYYj#.........",
  ".........#jYYjvPPp#WWcCCcWW#pPPvjYYj#...........",
  "..........#jYYjvPPp#WWcWW#pPPvjYYj#.............",
  "...........#jjjvvPPp#WWW#pPPvvjjj#..............",
  "............########.###.########..............."
];

// ============================================================================
// 전체 스프라이트 데이터 인덱스 (17x25 영웅 및 48x48 보스)
// ============================================================================
export const PIXEL_SPRITES: Record<string, PixelSpriteDef> = {
  // 전사 (Warrior)
  hero_warrior_idle: { width: 17, height: 25, palette: WAR_PAL, rows: WAR_IDLE },
  hero_warrior_attack: { width: 17, height: 25, palette: WAR_PAL, rows: WAR_ATTACK },
  hero_warrior_hurt: { width: 17, height: 25, palette: WAR_PAL, rows: WAR_HURT },
  hero_warrior_danger: { width: 17, height: 25, palette: WAR_PAL, rows: WAR_DANGER },
  hero_warrior_victory: { width: 17, height: 25, palette: WAR_PAL, rows: WAR_VICTORY },

  // 백마도사 (White Mage)
  hero_white_mage_idle: { width: 17, height: 25, palette: WM_PAL, rows: WM_IDLE },
  hero_white_mage_attack: { width: 17, height: 25, palette: WM_PAL, rows: WM_ATTACK },
  hero_white_mage_hurt: { width: 17, height: 25, palette: WM_PAL, rows: WM_HURT },
  hero_white_mage_danger: { width: 17, height: 25, palette: WM_PAL, rows: WM_DANGER },
  hero_white_mage_victory: { width: 17, height: 25, palette: WM_PAL, rows: WM_VICTORY },

  // 흑마도사 (Black Mage)
  hero_black_mage_idle: { width: 17, height: 25, palette: BM_PAL, rows: BM_IDLE },
  hero_black_mage_attack: { width: 17, height: 25, palette: BM_PAL, rows: BM_ATTACK },
  hero_black_mage_hurt: { width: 17, height: 25, palette: BM_PAL, rows: BM_HURT },
  hero_black_mage_danger: { width: 17, height: 25, palette: BM_PAL, rows: BM_DANGER },
  hero_black_mage_victory: { width: 17, height: 25, palette: BM_PAL, rows: BM_VICTORY },

  // 몽크 (Monk)
  hero_monk_idle: { width: 17, height: 25, palette: MONK_PAL, rows: MONK_IDLE },
  hero_monk_attack: { width: 17, height: 25, palette: MONK_PAL, rows: MONK_ATTACK },
  hero_monk_hurt: { width: 17, height: 25, palette: MONK_PAL, rows: MONK_HURT },
  hero_monk_danger: { width: 17, height: 25, palette: MONK_PAL, rows: MONK_DANGER },
  hero_monk_victory: { width: 17, height: 25, palette: MONK_PAL, rows: MONK_VICTORY },

  // 4대 보스
  boss_golem: { width: 48, height: 48, palette: GOL_PAL, rows: GOLEM_ROWS },
  boss_kraken: { width: 48, height: 48, palette: KRAK_PAL, rows: KRAKEN_ROWS },
  boss_bahamut: { width: 48, height: 48, palette: BAH_PAL, rows: BAHAMUT_ROWS },
  boss_ezekiel: { width: 48, height: 48, palette: EZ_PAL, rows: EZEKIEL_ROWS },
};
