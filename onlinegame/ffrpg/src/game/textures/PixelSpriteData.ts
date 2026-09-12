// ============================================================================
// 16비트 정통 픽셀 리마스터 캐릭터 및 보스 도트 매트릭스 데이터
// 1px 다크 아웃라인 + 3단계 음영 셰이딩 + 3/4 좌측 응시 정통 사이드뷰 JRPG
// ============================================================================

export interface PixelSpriteDef {
  width: number;
  height: number;
  palette: Record<string, string>;
  rows: string[];
}

// ----------------------------------------------------------------------------
// 1. 전사 (Warrior - 아르반)
// ----------------------------------------------------------------------------
const WAR_PAL: Record<string, string> = {
  '.': 'none',
  '#': '#09090b', // 외곽선
  'h': '#64748b', // 투구 은빛 음영
  'H': '#94a3b8', // 투구 기본
  'k': '#f8fafc', // 투구 하이라이트
  'y': '#b45309', // 황금 날개 음영
  'Y': '#f59e0b', // 황금 날개 기본
  'j': '#fef08a', // 황금 하이라이트
  's': '#fed7aa', // 피부톤
  'S': '#fba876', // 피부 음영
  'e': '#1d4ed8', // 푸른 눈
  'E': '#60a5fa', // 눈 광채
  'c': '#1e3a8a', // 코발트 갑옷 음영
  'C': '#2563eb', // 코발트 갑옷 기본
  'l': '#60a5fa', // 코발트 하이라이트
  'r': '#991b1b', // 망토 딥레드
  'R': '#dc2626', // 망토 크림슨
  'p': '#f87171', // 망토 하이라이트
  'w': '#f8fafc', // 검신 강철
  'g': '#d97706', // 황금 손잡이
  'b': '#334155', // 판금 부츠
  'B': '#475569', // 부츠 하이라이트
};

// 20x24 전사 Idle (검과 방패, 흩날리는 붉은 망토)
const WAR_IDLE = [
  ".....######.........",
  "...##hHHHHkh##......",
  "..#yjHHHHHHjyy#.....",
  ".#YYyjhhhhjjYY#.....",
  "..#r#seEsh#r#.......",
  "..#r#sssss#r#.......",
  "..#r#SSSSS#r#.......",
  "..#R##CCC##R#..#w#..",
  ".#pRR#lCCl#RRp##w#..",
  ".#pRR#lCCl#RRp##w#..",
  "#sys##kCCk##sysw#...",
  "#YYy#r#CC#r#yYYgw#..",
  ".###.r#CC#r.###g#...",
  ".....r#CC#r....#s#..",
  "....#r#kk#r#........",
  "....#R#CC#R#........",
  "....#R#CC#R#........",
  ".....#kCCk#.........",
  "....#kC##Ck#........",
  "....#kC##Ck#........",
  "....#bb##bb#........",
  "...#BbB##BbB#.......",
  "...#BBB##BBB#.......",
  "....###..###........"
];

// 20x24 전사 Attack (전방 대각선 검기 일격)
const WAR_ATTACK = [
  ".......######.......",
  ".....##hHHHHkh##....",
  "....#yjHHHHHHjyy#...",
  "...#YYyjhhhhjjYY#...",
  "....#r#seEsh#r#.#w#.",
  "....#r#sssss#r###w#.",
  "....#r#SSSSS#r#ww#..",
  "....#R##CCC##R#ww#..",
  "...#pRR#lCCl#RRp#w#.",
  "...#pRR#lCCl#RRp#gw#",
  "..#sys##kCCk##sys#g#",
  "..#YYy#r#CC#r#yYY#s#",
  "...###.r#CC#r.###...",
  ".......r#CC#r.......",
  "......#r#kk#r#......",
  "......#R#CC#R#......",
  "......#R#CC#R#......",
  ".......#kCCk#.......",
  "......#kC##Ck#......",
  "......#kC##Ck#......",
  "......#bb##bb#......",
  ".....#BbB##BbB#.....",
  ".....#BBB##BBB#.....",
  "......###..###......"
];

// 20x24 전사 Hurt (피격 반동 자세)
const WAR_HURT = [
  ".......######.......",
  ".....##hHHHHkh##....",
  "....#yjHHHHHHjyy#...",
  "...#YYyjhhhhjjYY#...",
  "....#r#shhsh#r#.....",
  "....#r#sssss#r#.....",
  "....#r#SSSSS#r#.....",
  "....#R##CCC##R#.....",
  "...#pRR#lCCl#RRp#...",
  "...#pRR#lCCl#RRp#...",
  "..#sys##kCCk##sys#..",
  "..#YYy#r#CC#r#yYY#..",
  "...###.r#CC#r.###...",
  ".......r#CC#r.......",
  "......#r#kk#r#......",
  "......#R#CC#R#......",
  "......#R#CC#R#......",
  ".......#kCCk#.......",
  "......#kC##Ck#......",
  "......#kC##Ck#......",
  "......#bb##bb#......",
  ".....#BbB##BbB#.....",
  ".....#BBB##BBB#.....",
  "......###..###......"
];

// 20x24 전사 Danger (빈사: 한쪽 무릎 꿇기)
const WAR_DANGER = [
  "....................",
  ".....######.........",
  "...##hHHHHkh##......",
  "..#yjHHHHHHjyy#.....",
  ".#YYyjhhhhjjYY#.....",
  "..#r#shhsh#r#.......",
  "..#r#sssss#r#.......",
  "..#r#SSSSS#r#.......",
  "..#R##CCC##R#..#w#..",
  ".#pRR#lCCl#RRp##w#..",
  "#sys##kCCk##sysw#...",
  "#YYy#r#CC#r#yYYgw#..",
  ".###.r#CC#r.###g#...",
  ".....r#CC#r....#s#..",
  "....#r#kk#r#........",
  "....#R#CC#R#........",
  "....#kC##Ck#........",
  "....#bb##bb#........",
  "...#BbB##BbB#.......",
  "....###..###........",
  "....................",
  "....................",
  "....................",
  "...................."
];

// 20x24 전사 Victory (양손 번쩍 치켜든 챔피언 환호 점프!)
const WAR_VICTORY = [
  ".#sys#....#sys#.....",
  "#YYyys#..#syYYY#....",
  "#yyyyy#..#yyyyy#....",
  ".#yyy#.##.#yyy#.....",
  "..#s##hHHkh##s#.....",
  "....#yjHHHHjy#......",
  "...#YYyjhhjjYY#.....",
  "...#r#seEsh#r#......",
  "...#r#sssss#r#......",
  "...#r#SSSSS#r#......",
  "...#R##CCC##R#......",
  "..#pRR#lCCl#RRp#....",
  "..#pRR#lCCl#RRp#....",
  ".#pRRR#kCCk#RRRp....",
  ".#RRRR#r#C#rRRRR....",
  ".#RRRR#r#C#rRRRR....",
  "..###.r#CC#r.###....",
  "......r#CC#r........",
  ".....#kC##Ck#.......",
  ".....#kC##Ck#.......",
  ".....#bb##bb#.......",
  "....#BbB##BbB#......",
  "....#BBB##BBB#......",
  ".....###..###......."
];

// ----------------------------------------------------------------------------
// 2. 백마도사 (White Mage - 세레나)
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
  'k': '#ef4444',
  's': '#fed7aa',
  'S': '#fba876',
  'h': '#653118',
  'H': '#8a4724',
  'e': '#1d4ed8',
  'E': '#60a5fa',
  'o': '#92400e',
  'm': '#059669',
  'M': '#34d399',
  'b': '#582f0e',
};

// 20x24 백마도사 Idle
const WM_IDLE = [
  ".....######.........",
  "...##WWWWWWg#.......",
  "..#WWWhhhhWWg#......",
  ".#WWWhseEhhWWg#.....",
  ".#WWWhsssssWWg#.....",
  "..#WWWhhhhhWWg#.....",
  "...#WWWWWWWWg#......",
  "....#r#WW#r#........",
  "...#rR#WW#Rr#.......",
  "..#WWWWWWWWWW#......",
  ".#gWWWWWWWWWWg#.#mM#",
  ".#gWWWWWWWWWWg##mmm#",
  "#gWWWWWWWWWWWWg##o#.",
  "#gWW#r#WW#r#WWg##so#",
  "#gWW#R#WW#R#WWg##o#.",
  ".#gWW#r##r#WWg#.#o#.",
  "..#GGGGGGGGGG#..#o#.",
  "...#bb#..#bb#...#o#.",
  "...#bb#..#bb#...###.",
  "....##....##........",
  "....................",
  "....................",
  "....................",
  "...................."
];

// 20x24 백마도사 Attack (지팡이 들어 영창)
const WM_ATTACK = [
  ".....######.....#mM#",
  "...##WWWWWWg#..#mmm#",
  "..#WWWhhhhWWg#..#o#.",
  ".#WWWhseEhhWWg#.#o#.",
  ".#WWWhsssssWWg##so#.",
  "..#WWWhhhhhWWg##o#..",
  "...#WWWWWWWWg###....",
  "....#r#WW#r#........",
  "...#rR#WW#Rr#.......",
  "..#WWWWWWWWWW#......",
  ".#gWWWWWWWWWWg#.....",
  ".#gWWWWWWWWWWg#.....",
  "#gWWWWWWWWWWWWg#....",
  "#gWW#r#WW#r#WWg#....",
  "#gWW#R#WW#R#WWg#....",
  ".#gWW#r##r#WWg#.....",
  "..#GGGGGGGGGG#......",
  "...#bb#..#bb#.......",
  "...#bb#..#bb#.......",
  "....##....##........",
  "....................",
  "....................",
  "....................",
  "...................."
];

// 20x24 백마도사 Hurt
const WM_HURT = [
  "......######........",
  "....##WWWWWWg#......",
  "...#WWWhhhhWWg#.....",
  "..#WWWhshhshWWg#....",
  "..#WWWhsssssWWg#....",
  "...#WWWhhhhhWWg#....",
  "....#WWWWWWWWg#.....",
  ".....#r#WW#r#.......",
  "....#rR#WW#Rr#......",
  "...#WWWWWWWWWW#.....",
  "..#gWWWWWWWWWWg#....",
  "..#gWWWWWWWWWWg#....",
  ".#gWWWWWWWWWWWWg....",
  ".#gWW#r#WW#r#WWg....",
  ".#gWW#R#WW#R#WWg....",
  "..#gWW#r##r#WWg#....",
  "...#GGGGGGGGGG#.....",
  "....#bb#..#bb#......",
  "....#bb#..#bb#......",
  ".....##....##.......",
  "....................",
  "....................",
  "....................",
  "...................."
];

// 20x24 백마도사 Danger (무릎 꿇기)
const WM_DANGER = [
  "....................",
  "....................",
  ".....######.........",
  "...##WWWWWWg#.......",
  "..#WWWhhhhWWg#......",
  ".#WWWhshhshWWg#.....",
  ".#WWWhsssssWWg#.....",
  "..#WWWhhhhhWWg#.....",
  "...#WWWWWWWWg#......",
  "....#r#WW#r#........",
  "...#rR#WW#Rr#.......",
  "..#WWWWWWWWWW#..#mM#",
  ".#gWWWWWWWWWWg##mmm#",
  "#gWWWWWWWWWWWWg##o#.",
  "#gWW#r#WW#r#WWg##so#",
  ".#gWW#r##r#WWg#.#o#.",
  "..#GGGGGGGGGG#..#o#.",
  "...#bb#..#bb#...###.",
  "....##....##........",
  "....................",
  "....................",
  "....................",
  "....................",
  "...................."
];

// 20x24 백마도사 Victory (양손 만세 지팡이 환호!)
const WM_VICTORY = [
  "................#mM#",
  "....#so#.......#mmm#",
  ".....#o#........#o#.",
  "......######....#o#.",
  "....##WWWWWWg#..#so#",
  "...#WWWhhhhWWg#.#o#.",
  "..#WWWhseEhhWWg#.#o#",
  "..#WWWhsssssWWg#....",
  "...#WWWhhhhhWWg#....",
  "....#WWWWWWWWg#.....",
  ".....#r#WW#r#.......",
  "....#rR#WW#Rr#......",
  "...#WWWWWWWWWW#.....",
  "..#gWWWWWWWWWWg#....",
  "..#gWWWWWWWWWWg#....",
  ".#gWW#r#WW#r#WWg....",
  ".#gWW#R#WW#R#WWg....",
  "..#gWW#r##r#WWg#....",
  "...#GGGGGGGGGG#.....",
  "....#bb#..#bb#......",
  "....#bb#..#bb#......",
  ".....##....##.......",
  "....................",
  "...................."
];

// ----------------------------------------------------------------------------
// 3. 흑마도사 (Black Mage - 발렌)
// ----------------------------------------------------------------------------
const BM_PAL: Record<string, string> = {
  '.': 'none',
  '#': '#09090b',
  'o': '#5c3614',
  'y': '#854d0e',
  'Y': '#a16207',
  'h': '#ca8a04',
  'H': '#eab308',
  'f': '#050508',
  'e': '#eab308',
  'E': '#fef08a',
  'b': '#1e3a8a',
  'B': '#2563eb',
  'l': '#3b82f6',
  'L': '#93c5fd',
  'g': '#d97706',
  'w': '#78350f',
  'c': '#06b6d4',
  'C': '#a5f3fc',
  's': '#27272a',
};

// 20x24 흑마도사 Idle
const BM_IDLE = [
  ".....####...........",
  "....#HhYy#..........",
  "...#HHhYYy#.........",
  "..#HHhYYYYy#........",
  ".#HHhYYYYYYyo#......",
  "################....",
  "..#ffffffff#........",
  "..#fEE#ffEE#........",
  "..#fee#ffee#........",
  "..#ffffffff#....#c#.",
  "...##BBBB##....#cCc#",
  "..#lBBBBBBb#...#ccc#",
  ".#lBBBBBBBBb#...#w#.",
  "#lBBBBBBBBBBb#..#w#.",
  "#lBBBBBBBBBBb#.#gw#.",
  ".#BBBBBBBBBBb#..#w#.",
  "..#bBBBBBBb#....#w#.",
  "..#bBBBBBBb#....#w#.",
  "..#bbbbbbbb#....#w#.",
  "...#bb##bb#.....###.",
  "...#ss##ss#.........",
  "...#ss##ss#.........",
  "....##..##..........",
  "...................."
];

// 20x24 흑마도사 Attack (지팡이 전방 돌출)
const BM_ATTACK = [
  ".....####...........",
  "....#HhYy#......#c#.",
  "...#HHhYYy#....#cCc#",
  "..#HHhYYYYy#...#ccc#",
  ".#HHhYYYYYYyo#..#w#.",
  "#################w#.",
  "..#ffffffff#...#gw#.",
  "..#fEE#ffEE#....#w#.",
  "..#fee#ffee#....#w#.",
  "..#ffffffff#....#w#.",
  "...##BBBB##.....###.",
  "..#lBBBBBBb#........",
  ".#lBBBBBBBBb#.......",
  "#lBBBBBBBBBBb#......",
  "#lBBBBBBBBBBb#......",
  ".#BBBBBBBBBBb#......",
  "..#bBBBBBBb#........",
  "..#bBBBBBBb#........",
  "..#bbbbbbbb#........",
  "...#bb##bb#.........",
  "...#ss##ss#.........",
  "...#ss##ss#.........",
  "....##..##..........",
  "...................."
];

// 20x24 흑마도사 Hurt
const BM_HURT = [
  "......####..........",
  ".....#HhYy#.........",
  "....#HHhYYy#........",
  "...#HHhYYYYy#.......",
  "..#HHhYYYYYYyo#.....",
  ".################...",
  "...#ffffffff#.......",
  "...#ffffffff#.......",
  "...#ffffffff#.......",
  "...#ffffffff#.......",
  "....##BBBB##........",
  "...#lBBBBBBb#.......",
  "..#lBBBBBBBBb#......",
  ".#lBBBBBBBBBBb#.....",
  ".#lBBBBBBBBBBb#.....",
  "..#BBBBBBBBBBb#.....",
  "...#bBBBBBBb#.......",
  "...#bBBBBBBb#.......",
  "...#bbbbbbbb#.......",
  "....#bb##bb#........",
  "....#ss##ss#........",
  "....#ss##ss#........",
  ".....##..##.........",
  "...................."
];

// 20x24 흑마도사 Danger
const BM_DANGER = [
  "....................",
  "....................",
  ".....####...........",
  "....#HhYy#..........",
  "...#HHhYYy#.........",
  "..#HHhYYYYy#........",
  ".#HHhYYYYYYyo#......",
  "################....",
  "..#ffffffff#........",
  "..#fEE#ffEE#....#c#.",
  "..#fee#ffee#...#cCc#",
  "..#ffffffff#...#ccc#",
  "...##BBBB##.....#w#.",
  "..#lBBBBBBb#...#gw#.",
  ".#lBBBBBBBBb#...#w#.",
  "..#BBBBBBBBBBb#.#w#.",
  "...#bbbbbbbb#...###.",
  "....#bb##bb#........",
  "....#ss##ss#........",
  ".....##..##.........",
  "....................",
  "....................",
  "....................",
  "...................."
];

// 20x24 흑마도사 Victory (양손 지팡이 만세!)
const BM_VICTORY = [
  "..#cCc#.............",
  ".#cCCc#..####.......",
  ".#ccc#..#HhYy#......",
  "..#w#..#HHhYYy#.....",
  "..#w#.#HHhYYYYy#....",
  ".#gw##HHhYYYYYYyo#..",
  ".#w##ffffffff##.....",
  "..##fEE#ffEE#.......",
  "...#fee#ffee#.......",
  "...#ffffffff#.......",
  "....##BBBB##........",
  "...#lBBBBBBb#.......",
  "..#lBBBBBBBBb#......",
  ".#lBBBBBBBBBBb#.....",
  ".#lBBBBBBBBBBb#.....",
  "..#BBBBBBBBBBb#.....",
  "..#bBBBBBBb#........",
  "..#bBBBBBBb#........",
  "..#bbbbbbbb#........",
  "...#bb##bb#.........",
  "...#ss##ss#.........",
  "...#ss##ss#.........",
  "....##..##..........",
  "...................."
];

// ----------------------------------------------------------------------------
// 4. 몽크 (Monk - 렌)
// ----------------------------------------------------------------------------
const MONK_PAL: Record<string, string> = {
  '.': 'none',
  '#': '#09090b',
  'h': '#271206',
  'H': '#4e250f',
  'j': '#7a3e1d',
  'r': '#881313',
  'R': '#dc2626',
  'k': '#ef4444',
  's': '#fed7aa',
  'S': '#fba876',
  'd': '#ea580c',
  'w': '#f8fafc',
  'W': '#94a3b8',
  'b': '#450a0a',
  'e': '#09090b',
  'E': '#ffffff',
};

// 20x24 몽크 Idle
const MONK_IDLE = [
  ".....######.........",
  "....#jHHHHH#........",
  "...#jHjHHHHH#..#R#..",
  "..#RRRRRRRRRR##RR#..",
  "...#sssssss#..#RR#..",
  "...#seEssss#...##...",
  "....#ssssss#........",
  ".....#SSSS#.........",
  "...#s##kRRk#........",
  "..#ss#kRRRR#........",
  ".#wws#kRRRR#........",
  ".#Wws##wwww#........",
  "..##.#s#RR#.........",
  "....#ss#RR#.........",
  "...#wws#kR#.........",
  "...#Ww##RR#.........",
  "....##.#RR#.........",
  "......#kR##Rk#......",
  "......#RR##RR#......",
  ".....#kR#..#Rk#.....",
  "....#ww#....#ww#....",
  "....#WW#....#WW#....",
  "...#bb#......#bb#...",
  "...####......####..."
];

// 20x24 몽크 Attack (전방 정권 지르기)
const MONK_ATTACK = [
  ".....######.........",
  "....#jHHHHH#........",
  "...#jHjHHHHH#..#R#..",
  "..#RRRRRRRRRR##RR#..",
  "...#sssssss#..#RR#..",
  "...#seEssss#...##...",
  "....#ssssss#........",
  ".....#SSSS#...##....",
  "...#s##kRRk#.#ww#...",
  "..#ss#kRRRR##Www#...",
  ".#wws#kRRRR#sWw#....",
  ".#Wws##wwww#s##.....",
  "..##.#s#RR#.........",
  "....#ss#RR#.........",
  ".....#s#kR#.........",
  "......##RR#.........",
  "......#kR##Rk#......",
  "......#RR##RR#......",
  ".....#kR#..#Rk#.....",
  "....#ww#....#ww#....",
  "....#WW#....#WW#....",
  "...#bb#......#bb#...",
  "...####......####...",
  "...................."
];

// 20x24 몽크 Hurt
const MONK_HURT = [
  "......######........",
  ".....#jHHHHH#.......",
  "....#jHjHHHHH#..#R#.",
  "...#RRRRRRRRRR##RR#.",
  "....#shhsss#..#RR#..",
  "....#ssssss#...##...",
  ".....#ssssss#.......",
  "......#SSSS#........",
  "....#s##kRRk#.......",
  "...#ss#kRRRR#.......",
  "..#wws#kRRRR#.......",
  "..#Wws##wwww#.......",
  "...##.#s#RR#........",
  ".....#ss#RR#........",
  "......#s#kR#........",
  ".......##RR#........",
  ".......#kR##Rk#.....",
  ".......#RR##RR#.....",
  "......#kR#..#Rk#....",
  ".....#ww#....#ww#...",
  ".....#WW#....#WW#...",
  "....#bb#......#bb#..",
  "....####......####..",
  "...................."
];

// 20x24 몽크 Danger
const MONK_DANGER = [
  "....................",
  "....................",
  ".....######.........",
  "....#jHHHHH#........",
  "...#jHjHHHHH#..#R#..",
  "..#RRRRRRRRRR##RR#..",
  "...#shhssss#..#RR#..",
  "....#ssssss#...##...",
  ".....#SSSS#.........",
  "...#s##kRRk#........",
  "..#ss#kRRRR#........",
  ".#wws#kRRRR#........",
  ".#Wws##wwww#........",
  "..##.#s#RR#.........",
  "....#ss#RR#.........",
  ".....#s#kR#.........",
  "......#kR##Rk#......",
  ".....#ww#..#ww#.....",
  "....#bb#....#bb#....",
  "....####....####....",
  "....................",
  "....................",
  "....................",
  "...................."
];

// 20x24 몽크 Victory (양손 만세 더블 바이셉스 환호!)
const MONK_VICTORY = [
  ".....######.........",
  "....#jHHHHH#........",
  "...#jHjHHHHH#..#R#..",
  "..#RRRRRRRRRR##RR#..",
  "..#ww#ssssss#w#RR#..",
  ".#wWs#seEsss#sw#....",
  ".#wS#ssssssss#Sw#...",
  ".#s##s#ssss#s##s#...",
  "..#S#s#SSSS#s#S#....",
  "...##s#kRRk#s##.....",
  "....#ssRRRRss#......",
  "....#s#kRRk#s#......",
  ".....##wwww##.......",
  "......#RRRR#........",
  ".....#kR##Rk#.......",
  ".....#RR##RR#.......",
  "....#kR#..#Rk#......",
  "....#RR#..#RR#......",
  "...#ww#....#ww#.....",
  "...#WW#....#WW#.....",
  "..#bb#......#bb#....",
  "..####......####....",
  "....................",
  "...................."
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
// 전체 스프라이트 데이터 인덱스
// ============================================================================
export const PIXEL_SPRITES: Record<string, PixelSpriteDef> = {
  // 전사 (Warrior)
  hero_warrior_idle: { width: 20, height: 24, palette: WAR_PAL, rows: WAR_IDLE },
  hero_warrior_attack: { width: 20, height: 24, palette: WAR_PAL, rows: WAR_ATTACK },
  hero_warrior_hurt: { width: 20, height: 24, palette: WAR_PAL, rows: WAR_HURT },
  hero_warrior_danger: { width: 20, height: 24, palette: WAR_PAL, rows: WAR_DANGER },
  hero_warrior_victory: { width: 20, height: 24, palette: WAR_PAL, rows: WAR_VICTORY },

  // 백마도사 (White Mage)
  hero_white_mage_idle: { width: 20, height: 24, palette: WM_PAL, rows: WM_IDLE },
  hero_white_mage_attack: { width: 20, height: 24, palette: WM_PAL, rows: WM_ATTACK },
  hero_white_mage_hurt: { width: 20, height: 24, palette: WM_PAL, rows: WM_HURT },
  hero_white_mage_danger: { width: 20, height: 24, palette: WM_PAL, rows: WM_DANGER },
  hero_white_mage_victory: { width: 20, height: 24, palette: WM_PAL, rows: WM_VICTORY },

  // 흑마도사 (Black Mage)
  hero_black_mage_idle: { width: 20, height: 24, palette: BM_PAL, rows: BM_IDLE },
  hero_black_mage_attack: { width: 20, height: 24, palette: BM_PAL, rows: BM_ATTACK },
  hero_black_mage_hurt: { width: 20, height: 24, palette: BM_PAL, rows: BM_HURT },
  hero_black_mage_danger: { width: 20, height: 24, palette: BM_PAL, rows: BM_DANGER },
  hero_black_mage_victory: { width: 20, height: 24, palette: BM_PAL, rows: BM_VICTORY },

  // 몽크 (Monk)
  hero_monk_idle: { width: 20, height: 24, palette: MONK_PAL, rows: MONK_IDLE },
  hero_monk_attack: { width: 20, height: 24, palette: MONK_PAL, rows: MONK_ATTACK },
  hero_monk_hurt: { width: 20, height: 24, palette: MONK_PAL, rows: MONK_HURT },
  hero_monk_danger: { width: 20, height: 24, palette: MONK_PAL, rows: MONK_DANGER },
  hero_monk_victory: { width: 20, height: 24, palette: MONK_PAL, rows: MONK_VICTORY },

  // 4대 보스
  boss_golem: { width: 48, height: 48, palette: GOL_PAL, rows: GOLEM_ROWS },
  boss_kraken: { width: 48, height: 48, palette: KRAK_PAL, rows: KRAKEN_ROWS },
  boss_bahamut: { width: 48, height: 48, palette: BAH_PAL, rows: BAHAMUT_ROWS },
  boss_ezekiel: { width: 48, height: 48, palette: EZ_PAL, rows: EZEKIEL_ROWS },
};
