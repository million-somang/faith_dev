import { Difficulty } from '../types/janggi';

export interface AiPersona {
  id: Difficulty;
  name: string;
  title: string;
  rank: string;
  avatar: string;
  badgeColor: string;
  greeting: string;
  onThinking: string[];
  onCheck: string[];
  onInCheck: string[];
  onCapture: string[];
  onVictory: string[];
  onDefeat: string[];
}

export const AI_PERSONAS: Record<Difficulty, AiPersona> = {
  beginner: {
    id: 'beginner',
    name: '똘이',
    title: '장기 입문 훈수봇',
    rank: '18급',
    avatar: '🤖',
    badgeColor: 'from-emerald-500 to-teal-600',
    greeting: '반가워요! 저랑 재미있게 장기 배워봐요!',
    onThinking: [
      '어디로 가볼까? 요리조리...',
      '음... 똘이 열심히 생각 중!',
      '초록 버튼, 빨간 버튼... 찰칵!',
    ],
    onCheck: [
      '기습 장군이다! 조심하라구~!',
      '받아랏! 똘이표 번개 장군!',
    ],
    onInCheck: [
      '으앗! 내 왕이 위험해! 어디로 도망가지?!',
      '장군이라니! 얼른 피해야겠어!',
    ],
    onCapture: [
      '앗싸! 장기알 하나 득템!',
      '히히, 이건 내가 가져갈게!',
    ],
    onVictory: [
      '야호! 똘이가 이겼어요! 짝짝짝!',
      '우와! 저 오늘 장기 천재인가 봐요!',
    ],
    onDefeat: [
      '흐앙~ 졌어요! 다음엔 꼭 이길 테야!',
      '정말 잘 두시네요! 한 수 배웠습니다!',
    ],
  },
  easy: {
    id: 'easy',
    name: '수호',
    title: '동네 기원 꿈나무',
    rank: '10급',
    avatar: '👦',
    badgeColor: 'from-sky-500 to-blue-600',
    greeting: '안녕하세요! 정정당당하게 한 판 겨뤄봐요.',
    onThinking: [
      '기물을 어디로 전진시킬까...',
      '차와 마의 길목을 살피는 중입니다.',
      '신중하게 다음 수를 계산해볼게요.',
    ],
    onCheck: [
      '장군입니다! 방심하시면 안 돼요.',
      '기습 공격 성공! 장군을 받으세요!',
    ],
    onInCheck: [
      '침착하게 길을 막거나 왕을 피하자...',
      '날카로운 공격이네요! 방어에 집중!',
    ],
    onCapture: [
      '기물 교환에서 이득을 봤네요!',
      '좋은 찬스를 놓치지 않았습니다.',
    ],
    onVictory: [
      '승리했습니다! 좋은 대국 감사합니다.',
      '포진 연습한 보람이 있네요!',
    ],
    onDefeat: [
      '실력이 대단하십니다! 복기해봐야겠어요.',
      '완패입니다! 다음엔 더 강해져서 올게요.',
    ],
  },
  normal: {
    id: 'normal',
    name: '박 영감',
    title: '기원 3급 훈장님',
    rank: '3급',
    avatar: '👴',
    badgeColor: 'from-amber-500 to-orange-600',
    greeting: '허허, 반갑구려. 차분하게 정석대로 한 수 둬보세.',
    onThinking: [
      '허허, 어디 급소가 어디 있더라...',
      '장기는 기세와 균형의 조화지...',
      '중앙을 장악할 타이밍을 보는 중이오.',
    ],
    onCheck: [
      '허허, 길목이 비었구려. 장군을 받으시오!',
      '늙은이의 장군이 제법 매섭지 않소?',
    ],
    onInCheck: [
      '허허! 젊은 친구 수가 아주 매섭구려.',
      '어디 보자, 궁성을 두텁게 보강해야겠군.',
    ],
    onCapture: [
      '공짜 말은 사양하지 않는 법이지, 허허.',
      '욕심을 내면 기물이 걸려드는 법.',
    ],
    onVictory: [
      '허허, 좋은 대국이었소. 수고 많았네.',
      '기초가 탄탄하면 승리는 따라오는 법이지.',
    ],
    onDefeat: [
      '젊은이의 수읽기가 예사롭지 않구려! 완패요!',
      '오늘 기원에서 명국 한 판 두었네. 훌륭하오!',
    ],
  },
  hard: {
    id: 'hard',
    name: '강백호',
    title: '기원 1단 유단자',
    rank: '1단',
    avatar: '🥋',
    badgeColor: 'from-indigo-600 to-purple-600',
    greeting: '반갑습니다. 빈틈을 보이지 않는 실전 장기를 보여드리죠.',
    onThinking: [
      '3수 앞의 맥점을 분석하는 중이다...',
      '중앙 돌파와 외곽 포위 중 최선의 길을 계산 중.',
      '알파베타 프루닝 완료. 최적의 수를 놓는다.',
    ],
    onCheck: [
      '외통의 서막입니다. 장군!',
      '피할 수 없는 장군 공세입니다.',
    ],
    onInCheck: [
      '허를 찔렸군. 하지만 아직 역전의 수가 남아있다.',
      '철벽 궁성으로 막아내겠습니다.',
    ],
    onCapture: [
      '급소를 타격하여 기물을 포획했습니다.',
      '승부의 저울추가 기울기 시작했습니다.',
    ],
    onVictory: [
      '승리했습니다. 날카로운 수읽기 대결이었습니다.',
      '포격과 마의 연계가 적중했군요.',
    ],
    onDefeat: [
      '깔끔한 완승이었습니다. 제 패배를 인정합니다.',
      '단 한 치의 오차도 없는 완벽한 수순이었습니다.',
    ],
  },
  master: {
    id: 'master',
    name: '조조 국수',
    title: '천하제일 프로 9단',
    rank: '프로 9단',
    avatar: '👑',
    badgeColor: 'from-rose-600 to-red-700',
    greeting: '천하의 기객이 모였소. 반상의 진정한 도를 겨뤄봅시다.',
    onThinking: [
      '천라지망(天羅地網)의 그물을 엮는 중이오...',
      '한 치의 빈틈도 없는 외통수 수순을 검토하오.',
      '승부는 이미 이 수에서 결정되었소.',
    ],
    onCheck: [
      '천하를 호령하는 벼락 장군이오! 피해보시오!',
      '퇴로는 없다! 장군!',
    ],
    onInCheck: [
      '궁성의 호위가 반석 같으니 흔들리지 않소.',
      '잠시 칼끝을 비껴갈 뿐, 형세는 변치 않소.',
    ],
    onCapture: [
      '반상의 대세를 거스를 수는 없는 법이오.',
      '기물을 잃은 슬픔을 감당할 수 있겠소?',
    ],
    onVictory: [
      '천하의 대국이 끝났소. 기품 있는 승부였소.',
      '외통수로 대국을 마감하오. 수고하셨소.',
    ],
    onDefeat: [
      '기적 같은 묘수로군요... 천하의 명국이었습니다.',
      '제 9단 명예를 걸고 그대의 천하제일 수를 인정하오!',
    ],
  },
};

export function getRandomLine(lines: string[]): string {
  if (!lines || lines.length === 0) return '';
  return lines[Math.floor(Math.random() * lines.length)];
}
