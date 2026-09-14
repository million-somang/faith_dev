import { SajuElementBuff } from '../types/janggi';

const ELEMENTS: SajuElementBuff[] = [
  {
    element: 'wood',
    name: '목(木)의 기운',
    icon: '🌱',
    favoredSide: 'cho',
    title: '청룡(靑龍)의 생기 버프',
    desc: '푸른 초(楚)나라 진영의 기동력이 강화되어 [외통수 힌트 보기] 1회가 추가 지급됩니다.'
  },
  {
    element: 'fire',
    name: '화(火)의 기운',
    icon: '🔥',
    favoredSide: 'han',
    title: '주작(朱雀)의 열정 버프',
    desc: '붉은 한(漢)나라 진영의 화력이 솟구쳐 [차·포 공격 시 기력 게이지 +15%] 보너스를 얻습니다.'
  },
  {
    element: 'earth',
    name: '토(土)의 기운',
    icon: '⛰️',
    favoredSide: 'han',
    title: '황룡(黃龍)의 수비 버프',
    desc: '대지의 기운이 궁성을 지켜주어 궁과 사의 안전 착수 위치를 자동으로 강조해줍니다.'
  },
  {
    element: 'metal',
    name: '금(金)의 기운',
    icon: '⚔️',
    favoredSide: 'cho',
    title: '백호(白虎)의 결단 버프',
    desc: '단단한 쇠의 기운으로 차(車)의 전진 경로가 선명하게 빛나며 초읽기 시간 +5초가 추가됩니다.'
  },
  {
    element: 'water',
    name: '수(水)의 기운',
    icon: '💧',
    favoredSide: 'cho',
    title: '현무(玄武)의 지혜 버프',
    desc: '유연하고 깊은 수싸움의 기운으로 실수를 되돌릴 수 있는 [무르기 기회 +1회]가 제공됩니다.'
  }
];

export function getTodaySajuBuff(): SajuElementBuff {
  const now = new Date();
  const day = now.getDate();
  const index = day % ELEMENTS.length;
  return ELEMENTS[index];
}
