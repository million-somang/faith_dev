import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Shield, 
  Swords, 
  Sparkles, 
  Users, 
  MapPin, 
  Heart, 
  Zap, 
  Volume2, 
  VolumeX, 
  Award, 
  Flame, 
  PlusCircle, 
  RefreshCw 
} from 'lucide-react';
import { 
  CharacterClass, 
  PlayerCharacter, 
  Monster, 
  DungeonArea, 
  PartyRoom, 
  BattleLogEntry 
} from './types/rpg';
import { sounds } from './utils/soundEffects';

// 직업 메타데이터
const JOB_INFO: Record<CharacterClass, { name: string; icon: string; color: string; desc: string; hp: number; mp: number; atk: number; def: number }> = {
  warrior: {
    name: '전사 (Warrior)',
    icon: '🛡️',
    color: 'bg-red-50 text-red-600 border-red-200',
    desc: '강인한 체력과 높은 물리 방어력으로 아군을 보호합니다.',
    hp: 240,
    mp: 40,
    atk: 32,
    def: 25,
  },
  black_mage: {
    name: '흑마법사 (Black Mage)',
    icon: '🔮',
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    desc: '화염과 번개 원소 마법으로 적에게 파괴적인 피해를 입힙니다.',
    hp: 140,
    mp: 120,
    atk: 18,
    def: 12,
  },
  white_mage: {
    name: '백마법사 (White Mage)',
    icon: '✨',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    desc: '신성한 치유 마법과 파티원 버프를 담당하는 수호자입니다.',
    hp: 160,
    mp: 110,
    atk: 16,
    def: 15,
  },
  thief: {
    name: '도적 (Thief)',
    icon: '🗡️',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: '빠른 기동력과 치명타, 아이템 획득에 특화된 재빠른 전사입니다.',
    hp: 180,
    mp: 60,
    atk: 28,
    def: 18,
  },
};

// 던전 지역 데이터
const DUNGEONS: DungeonArea[] = [
  {
    id: 'dungeon-1',
    name: '속삭이는 고블린 숲',
    difficulty: '초급',
    recommendedLevel: 1,
    description: '초보 모험가들이 처음으로 파티를 맺고 탐험하는 숲속 던전',
    bossName: '고블린 대장',
    monsters: [
      { id: 'm1', name: '숲의 고블린', title: '야생 몬스터', level: 1, hp: 85, maxHp: 85, atk: 15, def: 8, expReward: 35, goldReward: 50, icon: '👺', color: 'bg-amber-100 text-amber-800' },
      { id: 'm2', name: '포레스트 울프', title: '야생 몬스터', level: 2, hp: 110, maxHp: 110, atk: 20, def: 10, expReward: 50, goldReward: 70, icon: '🐺', color: 'bg-slate-100 text-slate-800' }
    ]
  },
  {
    id: 'dungeon-2',
    name: '봉인된 크리스탈 지하묘지',
    difficulty: '중급',
    recommendedLevel: 3,
    description: '고대 마법 크리스탈의 기운으로 되살아난 언데드가 출몰하는 묘지',
    bossName: '스켈레톤 나이트',
    monsters: [
      { id: 'm3', name: '스켈레톤 워리어', title: '언데드 몬스터', level: 4, hp: 160, maxHp: 160, atk: 28, def: 18, expReward: 90, goldReward: 120, icon: '💀', color: 'bg-indigo-100 text-indigo-800' }
    ]
  },
  {
    id: 'dungeon-3',
    name: '화룡의 불꽃 성채',
    difficulty: '레이드',
    recommendedLevel: 5,
    description: '강력한 화염 마법을 구사하는 고대 용이 잠든 최후의 시련',
    bossName: '바하무트의 파편',
    monsters: [
      { id: 'm4', name: '레드 드레이크', title: '고대 드래곤', level: 7, hp: 320, maxHp: 320, atk: 45, def: 28, expReward: 250, goldReward: 400, icon: '🐲', color: 'bg-rose-100 text-rose-800' }
    ]
  }
];

// 초기 파티 대기실 더미 데이터
const INITIAL_ROOMS: PartyRoom[] = [
  {
    id: 'room-101',
    title: '고블린 숲 4인 풀파티 출발합니다!',
    dungeonId: 'dungeon-1',
    dungeonName: '속삭이는 고블린 숲',
    leaderName: '빛의용사',
    maxMembers: 4,
    status: 'waiting',
    members: [
      { id: 'p1', name: '빛의용사', job: 'warrior', level: 3, isLeader: true, ready: true },
      { id: 'p2', name: '아르카나', job: 'black_mage', level: 2, isLeader: false, ready: true }
    ]
  },
  {
    id: 'room-102',
    title: '크리스탈 묘지 백마법사님 모셔요',
    dungeonId: 'dungeon-2',
    dungeonName: '봉인된 크리스탈 지하묘지',
    leaderName: '섀도우러너',
    maxMembers: 4,
    status: 'waiting',
    members: [
      { id: 'p3', name: '섀도우러너', job: 'thief', level: 4, isLeader: true, ready: true }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'lobby' | 'world' | 'battle'>('lobby');
  const [isMuted, setIsMuted] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);

  // 플레이어 캐릭터 상태
  const [player, setPlayer] = useState<PlayerCharacter>({
    id: 'player-me',
    name: '모험가 (나)',
    job: 'warrior',
    stats: {
      level: 1,
      exp: 0,
      maxExp: 100,
      hp: 240,
      maxHp: 240,
      mp: 40,
      maxMp: 40,
      atk: 32,
      def: 25,
      matk: 15,
      gold: 250
    }
  });

  // 파티 방 목록
  const [rooms] = useState<PartyRoom[]>(INITIAL_ROOMS);
  const [currentRoom, setCurrentRoom] = useState<PartyRoom | null>(null);

  // 전투 상태
  const [currentMonster, setCurrentMonster] = useState<Monster>(DUNGEONS[0].monsters[0]);
  const [battleLogs, setBattleLogs] = useState<BattleLogEntry[]>([
    { id: 'init-1', text: '전투가 시작되었습니다! 몬스터를 처치하세요.', type: 'system' }
  ]);
  const [isActionPending, setIsActionPending] = useState(false);
  const [floatingDamage, setFloatingDamage] = useState<{ text: string; isCrit?: boolean; isHeal?: boolean } | null>(null);

  // 사운드 음소거 토글
  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // 직업 변경
  const handleSelectJob = (newJob: CharacterClass) => {
    sounds.playCursor();
    const info = JOB_INFO[newJob];
    setPlayer(prev => ({
      ...prev,
      job: newJob,
      stats: {
        ...prev.stats,
        hp: info.hp,
        maxHp: info.hp,
        mp: info.mp,
        maxMp: info.mp,
        atk: info.atk,
        def: info.def
      }
    }));
    setShowJobModal(false);
  };

  // 파티 방 참여
  const handleJoinRoom = (room: PartyRoom) => {
    sounds.playCursor();
    setCurrentRoom(room);
    setActiveTab('battle');
    setBattleLogs([
      { id: String(Date.now()), text: `[${room.title}] 파티에 합류했습니다. 던전으로 진입합니다!`, type: 'system' }
    ]);
  };

  // 던전 선택 후 즉시 솔로/파티 진입
  const handleSelectDungeon = (dungeon: DungeonArea) => {
    sounds.playCursor();
    const targetMonster = dungeon.monsters[0];
    setCurrentMonster({ ...targetMonster });
    setActiveTab('battle');
    setBattleLogs([
      { id: String(Date.now()), text: `[${dungeon.name}]에 진입했습니다! ${targetMonster.name}이(가) 나타났습니다!`, type: 'system' }
    ]);
  };

  // 전투 액션: 일반 물리 공격 (슬래시)
  const handleAttack = () => {
    if (isActionPending || currentMonster.hp <= 0) return;
    setIsActionPending(true);
    sounds.playSlash();

    // 데미지 계산: ATK 기준 랜덤 변동
    const damage = Math.max(5, player.stats.atk - Math.floor(currentMonster.def / 2) + Math.floor(Math.random() * 8));
    const isCrit = Math.random() < 0.25;
    const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;

    setFloatingDamage({ text: `-${finalDamage}`, isCrit });

    setTimeout(() => {
      setFloatingDamage(null);
      const remainingHp = Math.max(0, currentMonster.hp - finalDamage);
      setCurrentMonster(prev => ({ ...prev, hp: remainingHp }));

      const newLogs: BattleLogEntry[] = [
        ...battleLogs,
        { 
          id: String(Date.now()), 
          text: `${player.name}의 ${isCrit ? '💥 치명타 공격!' : '검 공격!'} ${currentMonster.name}에게 ${finalDamage} 피해!`, 
          type: 'player_attack' 
        }
      ];

      if (remainingHp <= 0) {
        // 몬스터 처치 및 보상
        handleVictory(newLogs);
      } else {
        // 몬스터 반격 턴
        setBattleLogs(newLogs);
        setTimeout(() => {
          handleMonsterCounter(newLogs);
        }, 600);
      }
    }, 400);
  };

  // 전투 액션: 직업별 고유 스킬 (화염구 / 강타 / 기습)
  const handleSkill = () => {
    if (isActionPending || currentMonster.hp <= 0) return;
    const mpCost = 15;
    if (player.stats.mp < mpCost) {
      sounds.playCursor();
      setBattleLogs(prev => [...prev, { id: String(Date.now()), text: 'MP가 부족합니다!', type: 'system' }]);
      return;
    }

    setIsActionPending(true);
    sounds.playMagic();

    setPlayer(prev => ({
      ...prev,
      stats: { ...prev.stats, mp: prev.stats.mp - mpCost }
    }));

    const skillDamage = Math.floor(player.stats.atk * 1.8) + Math.floor(Math.random() * 10);
    setFloatingDamage({ text: `-${skillDamage}🔥`, isCrit: true });

    setTimeout(() => {
      setFloatingDamage(null);
      const remainingHp = Math.max(0, currentMonster.hp - skillDamage);
      setCurrentMonster(prev => ({ ...prev, hp: remainingHp }));

      const newLogs: BattleLogEntry[] = [
        ...battleLogs,
        { 
          id: String(Date.now()), 
          text: `${player.name}의 강력한 스킬 발동! ${currentMonster.name}에게 ${skillDamage}의 마법 피해!`, 
          type: 'player_attack' 
        }
      ];

      if (remainingHp <= 0) {
        handleVictory(newLogs);
      } else {
        setBattleLogs(newLogs);
        setTimeout(() => {
          handleMonsterCounter(newLogs);
        }, 600);
      }
    }, 400);
  };

  // 전투 액션: 케알라 치유 마법 (힐)
  const handleHeal = () => {
    if (isActionPending) return;
    const mpCost = 12;
    if (player.stats.mp < mpCost) {
      sounds.playCursor();
      setBattleLogs(prev => [...prev, { id: String(Date.now()), text: 'MP가 부족합니다!', type: 'system' }]);
      return;
    }

    setIsActionPending(true);
    sounds.playHeal();

    const healAmount = 65;
    const restoredHp = Math.min(player.stats.maxHp, player.stats.hp + healAmount);

    setPlayer(prev => ({
      ...prev,
      stats: { 
        ...prev.stats, 
        hp: restoredHp, 
        mp: prev.stats.mp - mpCost 
      }
    }));

    setFloatingDamage({ text: `+${healAmount}💚`, isHeal: true });

    setTimeout(() => {
      setFloatingDamage(null);
      const newLogs: BattleLogEntry[] = [
        ...battleLogs,
        { id: String(Date.now()), text: `✨ 케알라 시전! HP가 ${healAmount} 회복되었습니다.`, type: 'heal' }
      ];
      setBattleLogs(newLogs);

      // 힐 후에도 몬스터 반격
      setTimeout(() => {
        handleMonsterCounter(newLogs);
      }, 500);
    }, 400);
  };

  // 몬스터 반격 로직
  const handleMonsterCounter = (currentLogs: BattleLogEntry[]) => {
    sounds.playSlash();
    const monsterDmg = Math.max(4, currentMonster.atk - Math.floor(player.stats.def / 2) + Math.floor(Math.random() * 5));
    const newPlayerHp = Math.max(0, player.stats.hp - monsterDmg);

    setPlayer(prev => ({
      ...prev,
      stats: { ...prev.stats, hp: newPlayerHp }
    }));

    setBattleLogs([
      ...currentLogs,
      { 
        id: String(Date.now()), 
        text: `⚔️ ${currentMonster.name}의 반격! ${player.name}이(가) ${monsterDmg} 피해를 입었습니다.`, 
        type: 'monster_attack' 
      }
    ]);

    setIsActionPending(false);
  };

  // 전투 승리 및 보상
  const handleVictory = (currentLogs: BattleLogEntry[]) => {
    sounds.playVictory();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    const earnedExp = currentMonster.expReward;
    const earnedGold = currentMonster.goldReward;

    setPlayer(prev => {
      const newExp = prev.stats.exp + earnedExp;
      const isLevelUp = newExp >= prev.stats.maxExp;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          level: isLevelUp ? prev.stats.level + 1 : prev.stats.level,
          exp: isLevelUp ? newExp - prev.stats.maxExp : newExp,
          maxExp: isLevelUp ? Math.floor(prev.stats.maxExp * 1.5) : prev.stats.maxExp,
          maxHp: isLevelUp ? prev.stats.maxHp + 25 : prev.stats.maxHp,
          hp: isLevelUp ? prev.stats.maxHp + 25 : prev.stats.hp,
          atk: isLevelUp ? prev.stats.atk + 4 : prev.stats.atk,
          gold: prev.stats.gold + earnedGold
        }
      };
    });

    setBattleLogs([
      ...currentLogs,
      { 
        id: String(Date.now()), 
        text: `🎉 승리! ${currentMonster.name}을(를) 물리치고 경험치 +${earnedExp}, 골드 +${earnedGold}G를 획득했습니다!`, 
        type: 'victory' 
      }
    ]);

    setIsActionPending(false);
  };

  // 다음 몬스터 마주침
  const handleRespawnMonster = () => {
    sounds.playCursor();
    const area = DUNGEONS[0];
    const nextM = area.monsters[Math.floor(Math.random() * area.monsters.length)];
    setCurrentMonster({ ...nextM });
    setBattleLogs([
      { id: String(Date.now()), text: `야생의 ${nextM.name}이(가) 나타났습니다! 전투 준비!`, type: 'system' }
    ]);
  };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab === 'battle' && !isActionPending && currentMonster.hp > 0) {
        if (e.key === '1') handleAttack();
        if (e.key === '2') handleSkill();
        if (e.key === '3') handleHeal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isActionPending, currentMonster.hp, player.stats]);

  const activeJob = JOB_INFO[player.job];

  return (
    <div className="w-[450px] max-w-full h-[850px] mx-auto bg-slate-50 flex flex-col justify-between shadow-2xl relative select-none font-sans overflow-hidden border border-slate-200">
      
      {/* 1. 상단 글로벌 네비게이션 헤더 */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-base shadow-sm">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 text-sm tracking-tight">VERA 판타지 RPG</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">ONLINE</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">실시간 온라인 멀티플레이어 턴제 RPG</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={handleToggleMute}
            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
          </button>
          <button
            onClick={() => setShowJobModal(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>{activeJob.icon}</span>
            <span>{player.job.split('_')[0].toUpperCase()}</span>
          </button>
        </div>
      </header>

      {/* 2. 캐릭터 상태 바 (HUD) */}
      <section className="bg-white px-4 py-2 border-b border-slate-200 shadow-2xs shrink-0">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 text-[11px]">
              LV.{player.stats.level}
            </span>
            <span className="font-bold text-slate-800 text-xs">{player.name}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
            <span>🪙 {player.stats.gold.toLocaleString()} G</span>
            <span>EXP {player.stats.exp}/{player.stats.maxExp}</span>
          </div>
        </div>

        {/* HP / MP 게이지 */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <div className="flex justify-between font-bold text-slate-600 mb-0.5">
              <span className="flex items-center gap-0.5 text-rose-600"><Heart className="w-3 h-3 fill-rose-500" /> HP</span>
              <span>{player.stats.hp} / {player.stats.maxHp}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-rose-500 to-red-500 transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, (player.stats.hp / player.stats.maxHp) * 100))}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-600 mb-0.5">
              <span className="flex items-center gap-0.5 text-blue-600"><Zap className="w-3 h-3 fill-blue-500" /> MP</span>
              <span>{player.stats.mp} / {player.stats.maxMp}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, (player.stats.mp / player.stats.maxMp) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. 3단 서브 탭 네비게이션 */}
      <nav className="flex bg-slate-100 p-1 mx-3 mt-2 rounded-xl border border-slate-200 shrink-0">
        <button
          onClick={() => { sounds.playCursor(); setActiveTab('lobby'); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'lobby' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>파티 로비</span>
        </button>

        <button
          onClick={() => { sounds.playCursor(); setActiveTab('world'); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'world' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>월드 던전</span>
        </button>

        <button
          onClick={() => { sounds.playCursor(); setActiveTab('battle'); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer relative ${
            activeTab === 'battle' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>실시간 배틀</span>
          {currentMonster.hp > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-2 animate-ping" />
          )}
        </button>
      </nav>

      {/* 4. 메인 컨텐츠 뷰 (탭 전환) */}
      <main className="flex-1 px-3 py-2 overflow-y-auto space-y-3">
        
        {/* TAB 1: 파티 대기실 로비 */}
        {activeTab === 'lobby' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <span>온라인 파티 모집 대기열</span>
                  <span className="text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">2개 파티 대기중</span>
                </h2>
                <p className="text-[11px] text-slate-500">다른 모험가와 함께 파티를 맺고 강력한 보스를 토벌하세요.</p>
              </div>
              <button 
                onClick={() => { sounds.playCursor(); setActiveTab('world'); }}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>방 만들기</span>
              </button>
            </div>

            {/* 대기실 리스트 */}
            <div className="space-y-2">
              {rooms.map(r => (
                <div key={r.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                          {r.dungeonName}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{r.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">방장: <span className="font-semibold text-slate-700">{r.leaderName}</span> (참가인원 {r.members.length}/{r.maxMembers})</p>
                    </div>
                    <button 
                      onClick={() => handleJoinRoom(r)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all cursor-pointer active:scale-95"
                    >
                      참가하기
                    </button>
                  </div>

                  {/* 파티원 아바타 칩 */}
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                    {r.members.map(m => (
                      <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-700">
                        <span>{JOB_INFO[m.job].icon}</span>
                        <span>{m.name}</span>
                        <span className="text-indigo-600 font-bold">Lv.{m.level}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 빠른 참가 퀵 배너 */}
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-md flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black mb-0.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> 자동 빠른 매칭 (Quick Match)
                </h3>
                <p className="text-[10px] text-indigo-100">대기 중인 최적의 레이드 파티로 즉시 연결됩니다.</p>
              </div>
              <button 
                onClick={() => handleJoinRoom(rooms[0])}
                className="px-3 py-1.5 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                매칭 시작
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: 월드 맵 던전 선택 */}
        {activeTab === 'world' && (
          <div className="space-y-3 animate-fade-in">
            <div>
              <h2 className="text-sm font-black text-slate-800">탐험 던전 선택</h2>
              <p className="text-[11px] text-slate-500">목표 던전을 선택하여 솔로 탐험 혹은 파티 레이드를 시작하세요.</p>
            </div>

            <div className="space-y-2.5">
              {DUNGEONS.map((d, idx) => (
                <div 
                  key={d.id}
                  onClick={() => handleSelectDungeon(d)}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        d.difficulty === '초급' ? 'bg-emerald-100 text-emerald-800' :
                        d.difficulty === '중급' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {d.difficulty}
                      </span>
                      <h3 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {idx + 1}. {d.name}
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">권장 Lv.{d.recommendedLevel}+</span>
                  </div>

                  <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">{d.description}</p>

                  <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500">출현 보스: <strong className="text-slate-800">{d.bossName}</strong></span>
                    <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      탐험 시작 →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: 실시간 턴제 배틀 화면 */}
        {activeTab === 'battle' && (
          <div className="space-y-2.5 animate-fade-in">
            {/* 몬스터 배틀 필드 */}
            <div className="neu-rpg-panel rounded-2xl p-4 relative overflow-hidden border border-slate-200 text-center">
              <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <MapPin className="w-3 h-3" />
                <span>{currentRoom ? currentRoom.dungeonName : '고블린 숲 필드'}</span>
              </div>

              {/* 몬스터 체력 바 */}
              <div className="max-w-[240px] mx-auto mt-1 mb-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 mb-1">
                  <span>{currentMonster.name} <small className="text-slate-400">Lv.{currentMonster.level}</small></span>
                  <span>{currentMonster.hp} / {currentMonster.maxHp}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, (currentMonster.hp / currentMonster.maxHp) * 100))}%` }}
                  />
                </div>
              </div>

              {/* 몬스터 그래픽 아바타 & 애니메이션 */}
              <div className="relative py-3 flex items-center justify-center min-h-[110px]">
                {currentMonster.hp > 0 ? (
                  <div className="text-6xl filter drop-shadow-md select-none animate-monster-idle cursor-pointer">
                    {currentMonster.icon}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="text-5xl opacity-40 grayscale">💀</div>
                    <p className="text-xs font-bold text-emerald-600">몬스터 토벌 완료!</p>
                    <button
                      onClick={handleRespawnMonster}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>다음 몬스터 소환</span>
                    </button>
                  </div>
                )}

                {/* 타격 플로팅 데미지 */}
                {floatingDamage && (
                  <div className={`absolute top-2 font-black text-xl animate-damage-float ${
                    floatingDamage.isHeal ? 'text-emerald-500' : floatingDamage.isCrit ? 'text-amber-500 text-2xl' : 'text-rose-600'
                  }`}>
                    {floatingDamage.text}
                  </div>
                )}
              </div>

              {/* 파티원 협동 상태 (온라인 파티 시) */}
              {currentRoom && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-center gap-2">
                  <span className="text-[10px] text-slate-400 font-semibold">파티원:</span>
                  {currentRoom.members.map(m => (
                    <span key={m.id} className="text-[10px] bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200 font-semibold text-slate-700">
                      {JOB_INFO[m.job].icon} {m.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 턴제 커맨드 액션 버튼 그리드 (4대 행동) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleAttack}
                disabled={isActionPending || currentMonster.hp <= 0}
                className="bg-white hover:bg-rose-50 border-2 border-rose-200 hover:border-rose-400 text-rose-700 p-2.5 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <Swords className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-black">[1] 일반 공격</span>
                <span className="text-[10px] text-rose-500 font-medium">물리 타격 (0 MP)</span>
              </button>

              <button
                onClick={handleSkill}
                disabled={isActionPending || currentMonster.hp <= 0 || player.stats.mp < 15}
                className="bg-white hover:bg-indigo-50 border-2 border-indigo-200 hover:border-indigo-400 text-indigo-700 p-2.5 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <Flame className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-black">[2] 파이어</span>
                <span className="text-[10px] text-indigo-500 font-medium">원소 강타 (15 MP)</span>
              </button>

              <button
                onClick={handleHeal}
                disabled={isActionPending || player.stats.mp < 12}
                className="bg-white hover:bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-400 text-emerald-700 p-2.5 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black">[3] 케알라</span>
                <span className="text-[10px] text-emerald-500 font-medium">HP 회복 (12 MP)</span>
              </button>
            </div>

            {/* 실시간 전투 로그 윈도우 */}
            <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 border-b border-slate-100 pb-1 mb-1">
                <span>실시간 전투/모험 로그</span>
                <span className="text-[10px] text-indigo-600">키보드 1, 2, 3 키 지원</span>
              </div>
              <div className="h-24 overflow-y-auto space-y-1 text-xs text-slate-700 font-mono">
                {battleLogs.slice(-6).map((log) => (
                  <div key={log.id} className={`leading-relaxed text-[11px] ${
                    log.type === 'victory' ? 'text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded' :
                    log.type === 'player_attack' ? 'text-indigo-800' :
                    log.type === 'monster_attack' ? 'text-rose-700' :
                    log.type === 'heal' ? 'text-teal-700 font-semibold' : 'text-slate-500'
                  }`}>
                    • {log.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 5. 하단 푸터 / 저작권 */}
      <footer className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-1 font-semibold text-slate-500">
          <Award className="w-3.5 h-3.5 text-indigo-500" />
          <span>Vera Fantasy Online RPG v1.0</span>
        </div>
        <span>© 2026 VeraNex. All rights reserved.</span>
      </footer>

      {/* 직업 선택 모달 다이얼로그 */}
      {showJobModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xl w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" /> 직업 전직 / 변경
              </h3>
              <button 
                onClick={() => setShowJobModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {(Object.keys(JOB_INFO) as CharacterClass[]).map(jobKey => {
                const j = JOB_INFO[jobKey];
                const isSelected = player.job === jobKey;
                return (
                  <div
                    key={jobKey}
                    onClick={() => handleSelectJob(jobKey)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected ? 'border-indigo-500 bg-indigo-50/50 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{j.icon}</span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{j.name}</h4>
                        <p className="text-[10px] text-slate-500">{j.desc}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                        선택됨
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
