import { StoryAct, SkillDefinition, HeroBattleUnit } from '../types/rpg';

// 4대 조율자 초기 파티 스탯
export const INITIAL_HEROES: HeroBattleUnit[] = [
  {
    id: 'hero-1',
    name: '아르반',
    job: 'warrior',
    title: '강철의 수호자',
    level: 3,
    hp: 240,
    maxHp: 240,
    mp: 40,
    maxMp: 40,
    atk: 36,
    def: 28,
    matk: 12,
    agi: 22,
    atb: 20,
    isDefending: false,
    isDead: false,
    textureKey: 'hero_warrior',
  },
  {
    id: 'hero-2',
    name: '세레나',
    job: 'white_mage',
    title: '자애의 백마도사',
    level: 3,
    hp: 160,
    maxHp: 160,
    mp: 110,
    maxMp: 110,
    atk: 18,
    def: 15,
    matk: 38,
    agi: 20,
    atb: 40,
    isDefending: false,
    isDead: false,
    textureKey: 'hero_white_mage',
  },
  {
    id: 'hero-3',
    name: '발렌',
    job: 'black_mage',
    title: '원소의 흑마도사',
    level: 3,
    hp: 140,
    maxHp: 140,
    mp: 120,
    maxMp: 120,
    atk: 16,
    def: 12,
    matk: 45,
    agi: 24,
    atb: 60,
    isDefending: false,
    isDead: false,
    textureKey: 'hero_black_mage',
  },
  {
    id: 'hero-4',
    name: '렌',
    job: 'monk',
    title: '질풍의 권사',
    level: 3,
    hp: 190,
    maxHp: 190,
    mp: 50,
    maxMp: 50,
    atk: 34,
    def: 20,
    matk: 16,
    agi: 28,
    atb: 80,
    isDefending: false,
    isDead: false,
    textureKey: 'hero_monk',
  },
];

// 직업별 고유 스킬 리스트
export const SKILLS: SkillDefinition[] = [
  // 전사 스킬
  { id: 'shield_bash', name: '실드 배시', mpCost: 8, targetType: 'single_enemy', description: '방패로 강하게 내리쳐 물리 피해를 입히고 기절시킵니다.', jobRequired: 'warrior' },
  { id: 'iron_will', name: '강철의 결의', mpCost: 12, targetType: 'single_ally', description: '자신의 방어력을 대폭 끌어올리고 어그로를 획득합니다.', jobRequired: 'warrior' },

  // 백마도사 스킬
  { id: 'cure', name: '케알라 (회복)', mpCost: 14, targetType: 'single_ally', description: '신성한 빛으로 단일 아군의 HP를 대량 회복합니다.', jobRequired: 'white_mage' },
  { id: 'protect', name: '프로테스 (방어막)', mpCost: 16, targetType: 'all_allies', description: '성스러운 방어막을 둘러 전원의 받는 피해를 줄입니다.', jobRequired: 'white_mage' },

  // 흑마도사 스킬
  { id: 'fire', name: '파이라 (화염)', mpCost: 15, targetType: 'single_enemy', description: '강력한 화염구를 투척하여 막대한 마법 피해를 입힙니다.', jobRequired: 'black_mage' },
  { id: 'blizzard', name: '블리자가 (빙결)', mpCost: 20, targetType: 'all_enemies', description: '절대영도의 얼음 폭풍으로 적 전체를 공격합니다.', jobRequired: 'black_mage' },

  // 몽크 스킬
  { id: 'flurry', name: '백열각 (4연격)', mpCost: 16, targetType: 'single_enemy', description: '바람의 기운을 실어 적에게 4회 연속 권격을 퍼붓습니다.', jobRequired: 'monk' },
  { id: 'wave_fist', name: '파동권 (기탄)', mpCost: 22, targetType: 'single_enemy', description: '응축된 기를 한 점에 쏘아 적의 방어력을 관통합니다.', jobRequired: 'monk' },
];

// 4개 막 시나리오 및 보스 설정
export const STORY_ACTS: StoryAct[] = [
  {
    actNumber: 1,
    title: '제1막: 깨어진 평온과 비공정의 기상',
    subTitle: 'The Fractured Sky & Awakening Airship',
    locationName: '고대 비공정 격납고 유적',
    altitudeMeters: 8400,
    boss: {
      id: 'boss-act1',
      name: '유적 수호 골렘',
      title: '고대 결계의 파수꾼',
      level: 4,
      hp: 380,
      maxHp: 380,
      atk: 32,
      def: 22,
      matk: 15,
      agi: 16,
      atb: 10,
      expReward: 150,
      goldReward: 200,
      textureKey: 'boss_golem',
      isBoss: true,
    },
    introDialog: [
      { speaker: '장로 올리버', avatar: '👴', text: '조율자들이여, 바람의 결정이 깨어져 대륙 에테리아가 서서히 하계로 추락하고 있네.' },
      { speaker: '아르반 (전사)', avatar: '🛡️', text: '구름 장벽 밑으로 내려가려면 고대 비공정의 동력 코어가 필요합니다!' },
      { speaker: '수호 골렘', avatar: '🗿', text: '침입자 확인... 고대 비공정 코어를 인가되지 않은 자에게 양도할 수 없다!' }
    ],
    outroDialog: [
      { speaker: '렌 (몽크)', avatar: '🥋', text: '골렘을 쓰러뜨렸다! 비공정 동력 코어가 다시 푸른빛으로 공명하기 시작했어!' },
      { speaker: '세레나 (백마도사)', avatar: '✨', text: '비공정의 시동이 걸렸습니다. 이제 찢겨진 구름 장벽을 뚫고 잊힌 하계로 강하할 때입니다.' }
    ]
  },
  {
    actNumber: 2,
    title: '제2막: 심연으로의 강하와 고대의 진실',
    subTitle: 'Descent into the Abyss: The Truth',
    locationName: '하계 님버스 - 침식된 흑암 협곡',
    altitudeMeters: 5200,
    boss: {
      id: 'boss-act2',
      name: '심연수 네더 크라켄',
      title: '대침식의 침전물',
      level: 6,
      hp: 550,
      maxHp: 550,
      atk: 42,
      def: 26,
      matk: 35,
      agi: 19,
      atb: 25,
      expReward: 280,
      goldReward: 350,
      textureKey: 'boss_kraken',
      isBoss: true,
    },
    introDialog: [
      { speaker: '발렌 (흑마도사)', avatar: '🔮', text: '이곳이 바로 구름 아래에 잠들어 있던 대지... 하계 님버스인가?' },
      { speaker: '고대 비문', avatar: '📜', text: '하계는 버려진 것이 아니다. 대침식의 날, 하늘로 도망친 자들이 우리를 버리고 떠난 것이다.' },
      { speaker: '네더 크라켄', avatar: '🐙', text: '하늘의 도망자들아... 수천 년의 어둠과 원망을 온몸으로 받아내라!' }
    ],
    outroDialog: [
      { speaker: '아르반 (전사)', avatar: '🛡️', text: '하계에 남겨졌던 자들의 슬픔이 마물들을 왜곡시켰던 것이었어...' },
      { speaker: '세레나 (백마도사)', avatar: '✨', text: '우리가 이 오랜 상처를 치유하고 결정을 되돌려 놓아야만 해요.' }
    ]
  },
  {
    actNumber: 3,
    title: '제3막: 거짓된 수호자의 배신',
    subTitle: 'Betrayal of the False Prophet',
    locationName: '왜곡의 고대 제단',
    altitudeMeters: 2600,
    boss: {
      id: 'boss-act3',
      name: '타락한 바하무트의 허상',
      title: '왜곡된 시원의 용',
      level: 8,
      hp: 780,
      maxHp: 780,
      atk: 52,
      def: 32,
      matk: 48,
      agi: 22,
      atb: 30,
      expReward: 450,
      goldReward: 500,
      textureKey: 'boss_bahamut',
      isBoss: true,
    },
    introDialog: [
      { speaker: '대사제 에제키엘', avatar: '⚜️', text: '어리석은 조율자들이여, 왜 멸망해야 마땅한 불완전한 세계를 붙잡으려 하는가?' },
      { speaker: '렌 (몽크)', avatar: '🥋', text: '에제키엘 의장님?! 당신이... 바람의 결정을 고의로 부순 흑막이었단 말입니까?!' },
      { speaker: '에제키엘', avatar: '⚜️', text: '에테리아를 지상에 통째로 충돌시켜 무(無)로 되돌린 뒤, 새 시대를 열 것이다. 나의 수호수여, 저들을 삼켜라!' }
    ],
    outroDialog: [
      { speaker: '발렌 (흑마도사)', avatar: '🔮', text: '수호수가 정화되었다... 에제키엘은 마지막 의식을 치르기 위해 종언의 첨탑으로 향했다!' },
      { speaker: '아르반 (전사)', avatar: '🛡️', text: '전 대륙의 비공정 편대와 함께 첨탑으로 총진격한다! 하늘의 추락을 반드시 막아야 한다!' }
    ]
  },
  {
    actNumber: 4,
    title: '제4막: 조화의 새벽',
    subTitle: 'Dawn of Harmony: The Unified Genesis',
    locationName: '심연의 거탑 - 종언의 첨탑',
    altitudeMeters: 900,
    boss: {
      id: 'boss-act4',
      name: '창조신의 사도 에제키엘',
      title: '파멸의 대사제',
      level: 10,
      hp: 1200,
      maxHp: 1200,
      atk: 65,
      def: 38,
      matk: 60,
      agi: 25,
      atb: 40,
      expReward: 1000,
      goldReward: 1000,
      textureKey: 'boss_ezekiel',
      isBoss: true,
    },
    introDialog: [
      { speaker: '에제키엘', avatar: '👑', text: '때가 되었다! 하늘이 무너지고 땅이 쪼개지며 완전한 무(無)의 조화가 도래하리라!' },
      { speaker: '아르반 (전사)', avatar: '🛡️', text: '거짓된 신이여, 빛과 어둠, 하늘과 땅은 어느 하나의 파멸로 이루어지는 것이 아니다!' },
      { speaker: '세레나 & 렌', avatar: '✨', text: '우리 네 조율자의 영혼과 네 개의 시원 결정이 당신의 광기를 끝낼 것입니다!' }
    ],
    outroDialog: [
      { speaker: '시스템 알림', avatar: '🎉', text: '대사제 에제키엘을 저지했습니다! 조율자들이 네 개의 결정을 하나로 융합합니다.' },
      { speaker: '엔딩 서사', avatar: '🕊️', text: '천공 대륙 에테리아가 지상의 크레이터에 기적처럼 부드럽게 안착하며, 하늘과 땅은 비로소 하나의 온전한 세계로 통합되었습니다!' }
    ]
  }
];
