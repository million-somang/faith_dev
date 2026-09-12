import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Music, 
  Volume2, 
  VolumeX, 
  Shield, 
  Swords, 
  Flame, 
  Sparkles, 
  Heart, 
  Zap, 
  Compass, 
  Award, 
  ChevronRight, 
  RotateCcw,
  Plane
} from 'lucide-react';
import { PhaserGame } from './game/PhaserGame';
import { EventBus, GAME_EVENTS } from './bridge/EventBus';
import { HeroBattleUnit, EnemyBattleUnit, SkillDefinition } from './types/rpg';
import { INITIAL_HEROES, STORY_ACTS, SKILLS } from './data/storyData';
import { bgm } from './audio/BgmSynthesizer';
import { sfx } from './audio/SfxSynthesizer';

export default function App() {
  const [currentActNum, setCurrentActNum] = useState<1 | 2 | 3 | 4>(1);
  const [heroes, setHeroes] = useState<HeroBattleUnit[]>(INITIAL_HEROES);
  const [enemy, setEnemy] = useState<EnemyBattleUnit | null>(STORY_ACTS[0].boss);
  const [activeHeroIndex, setActiveHeroIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'root' | 'magic' | 'monk'>('root');
  
  // 오디오 상태
  const [isBgmMuted, setIsBgmMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);

  // 대화 컷씬 및 로그 상태
  const [showStoryModal, setShowStoryModal] = useState<boolean>(true);
  const [dialogIndex, setDialogIndex] = useState<number>(0);
  const [battleLogs, setBattleLogs] = useState<string[]>([
    '성좌의 잔향에 오신 것을 환영합니다.',
    '바람의 결정이 부서져 에테리아가 하계로 추락하기 시작했습니다!'
  ]);

  // 승리/패배 모달
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showDefeatModal, setShowDefeatModal] = useState(false);
  const [earnedRewards, setEarnedRewards] = useState({ exp: 0, gold: 0 });

  const currentAct = STORY_ACTS.find(a => a.actNumber === currentActNum) || STORY_ACTS[0];

  // Phaser 이벤트 리스너 등록
  useEffect(() => {
    // 1. 턴 도달
    const handleTurnReady = (data: { heroIndex: number; heroData: HeroBattleUnit }) => {
      setActiveHeroIndex(data.heroIndex);
      setSelectedCategory('root');
    };

    // 2. 스탯 갱신
    const handleStatsUpdate = (data: { heroes: HeroBattleUnit[]; enemy: EnemyBattleUnit | null }) => {
      setHeroes([...data.heroes]);
      if (data.enemy) {
        setEnemy({ ...data.enemy });
      }
    };

    // 3. 로그 메시지
    const handleLog = (data: { text: string }) => {
      setBattleLogs(prev => [...prev.slice(-8), data.text]);
    };

    // 4. 승리 이벤트
    const handleVictory = (data: { exp: number; gold: number }) => {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      setEarnedRewards({ exp: data.exp, gold: data.gold });
      setShowVictoryModal(true);
    };

    // 5. 패배 이벤트
    const handleDefeat = () => {
      setShowDefeatModal(true);
    };

    EventBus.on(GAME_EVENTS.HERO_TURN_READY, handleTurnReady);
    EventBus.on(GAME_EVENTS.HP_MP_UPDATE, handleStatsUpdate);
    EventBus.on(GAME_EVENTS.LOG_MESSAGE, handleLog);
    EventBus.on(GAME_EVENTS.BATTLE_VICTORY, handleVictory);
    EventBus.on(GAME_EVENTS.BATTLE_DEFEAT, handleDefeat);

    return () => {
      EventBus.off(GAME_EVENTS.HERO_TURN_READY, handleTurnReady);
      EventBus.off(GAME_EVENTS.HP_MP_UPDATE, handleStatsUpdate);
      EventBus.off(GAME_EVENTS.LOG_MESSAGE, handleLog);
      EventBus.off(GAME_EVENTS.BATTLE_VICTORY, handleVictory);
      EventBus.off(GAME_EVENTS.BATTLE_DEFEAT, handleDefeat);
    };
  }, []);

  // BGM 및 SFX 제어
  const handleToggleBgm = () => {
    const muted = bgm.toggleMute();
    setIsBgmMuted(muted);
  };

  const handleToggleSfx = () => {
    const muted = sfx.toggleMute();
    setIsSfxMuted(muted);
  };

  // 커맨드 실행: 일반 공격
  const handleAttack = () => {
    if (activeHeroIndex === null) return;
    sfx.playCursor();
    EventBus.emit(GAME_EVENTS.COMMAND_EXECUTE, {
      actorType: 'hero',
      actorIndex: activeHeroIndex,
      actionType: 'attack',
      targetIndex: 0
    });
    setActiveHeroIndex(null);
    setSelectedCategory('root');
  };

  // 커맨드 실행: 직업 스킬/마법
  const handleSkill = (skill: SkillDefinition) => {
    if (activeHeroIndex === null) return;
    sfx.playCursor();
    EventBus.emit(GAME_EVENTS.COMMAND_EXECUTE, {
      actorType: 'hero',
      actorIndex: activeHeroIndex,
      actionType: 'skill',
      skillId: skill.id,
      targetIndex: 0
    });
    setActiveHeroIndex(null);
    setSelectedCategory('root');
  };

  // 커맨드 실행: 방어
  const handleDefend = () => {
    if (activeHeroIndex === null) return;
    sfx.playCursor();
    EventBus.emit(GAME_EVENTS.COMMAND_EXECUTE, {
      actorType: 'hero',
      actorIndex: activeHeroIndex,
      actionType: 'defend',
      targetIndex: 0
    });
    setActiveHeroIndex(null);
    setSelectedCategory('root');
  };

  // 막(Act) 변경 및 다음 시나리오 로드
  const handleNextAct = () => {
    setShowVictoryModal(false);
    const nextActNum = (currentActNum < 4 ? currentActNum + 1 : 1) as 1 | 2 | 3 | 4;
    setCurrentActNum(nextActNum);
    setShowStoryModal(true);
    setDialogIndex(0);
    EventBus.emit(GAME_EVENTS.LOAD_ACT, nextActNum);
  };

  // 재도전
  const handleRetryBattle = () => {
    setShowDefeatModal(false);
    EventBus.emit(GAME_EVENTS.RESTART_BATTLE);
  };

  const currentActiveHero = activeHeroIndex !== null ? heroes[activeHeroIndex] : null;

  return (
    <div className="w-[450px] max-w-full h-[850px] mx-auto bg-slate-50 flex flex-col justify-between shadow-2xl relative select-none font-sans overflow-hidden border border-slate-200">
      
      {/* 1. 상단 글로벌 HUD (48px) */}
      <header className="bg-white border-b border-slate-200 px-3.5 py-2 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs shadow-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 text-xs tracking-tight">성좌의 잔향</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-100">
                Act {currentActNum}
              </span>
            </div>
            <p className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
              <span>에테리아 고도:</span>
              <span>{currentAct.altitudeMeters.toLocaleString()}m 📉</span>
            </p>
          </div>
        </div>

        {/* BGM 및 SFX 음소거 토글 컨트롤러 */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleBgm}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              isBgmMuted ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
            title="BGM 배경음악 On/Off"
          >
            <Music className="w-3.5 h-3.5" />
            <span>BGM</span>
          </button>

          <button
            onClick={handleToggleSfx}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isSfxMuted ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="SFX 효과음 On/Off"
          >
            {isSfxMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* 2. Phaser 3 2D 사이드뷰 배틀 캔버스 (380px) */}
      <section className="relative w-full h-[380px] shrink-0 bg-slate-950">
        <PhaserGame />

        {/* 보스 상단 미니 HUD 오버레이 */}
        {enemy && (
          <div className="absolute top-2 left-3 bg-slate-900/80 backdrop-blur-xs border border-slate-700/80 px-2.5 py-1 rounded-lg text-white pointer-events-none shadow-md">
            <div className="flex items-center justify-between gap-3 text-[10px]">
              <span className="font-bold text-amber-300">{enemy.name} <small className="text-slate-400 font-normal">Lv.{enemy.level}</small></span>
              <span className="font-mono text-rose-400 font-bold">{enemy.hp} / {enemy.maxHp}</span>
            </div>
            <div className="w-28 h-1.5 bg-slate-800 rounded-full mt-0.5 overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* 3. 4인 조율자 파티 실시간 상태창 & ATB 게이지 (115px) */}
      <section className="bg-white border-y border-slate-200 px-3 py-1.5 shrink-0 shadow-2xs">
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-1">
          {heroes.map((hero, idx) => {
            const isTurn = activeHeroIndex === idx;
            return (
              <div 
                key={hero.id} 
                className={`p-1.5 rounded-xl border transition-all ${
                  hero.isDead ? 'bg-slate-100 border-slate-200 opacity-40' :
                  isTurn ? 'bg-amber-50 border-amber-400 shadow-xs ring-2 ring-amber-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="font-black text-slate-800 truncate">
                    {idx === 0 ? '🛡️' : idx === 1 ? '✨' : idx === 2 ? '🔮' : '🥋'} {hero.name}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">Lv.{hero.level}</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                  <div>
                    <div className="flex justify-between text-slate-600 font-bold">
                      <span className="text-rose-600">HP</span>
                      <span>{hero.hp}/{hero.maxHp}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 transition-all duration-300" 
                        style={{ width: `${Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 font-bold">
                      <span className="text-blue-600">MP</span>
                      <span>{hero.mp}/{hero.maxMp}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300" 
                        style={{ width: `${Math.max(0, Math.min(100, (hero.mp / hero.maxMp) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 실시간 노란색 ATB 게이지 바 */}
                <div className="mt-1">
                  <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-100 ${isTurn ? 'bg-amber-400 animate-pulse' : 'bg-amber-300'}`}
                      style={{ width: `${hero.atb}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. 파이널 판타지 클래식 커맨드 윈도우 (150px) */}
      <section className="bg-white px-3 py-2 shrink-0 border-b border-slate-200 min-h-[150px] flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs mb-1 font-bold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
            <span>
              {currentActiveHero 
                ? `[${currentActiveHero.name}] 커맨드 선택 대기` 
                : '파티원 ATB 게이지 충전 중...'}
            </span>
          </div>
          {selectedCategory !== 'root' && (
            <button 
              onClick={() => setSelectedCategory('root')}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              ← 이전 메뉴
            </button>
          )}
        </div>

        {/* 루트 커맨드: 4대 주 행동 */}
        {selectedCategory === 'root' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAttack}
              disabled={activeHeroIndex === null}
              className="p-2.5 rounded-xl border-2 border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/50 text-slate-800 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              <Swords className="w-4 h-4 text-rose-500" />
              <span>[1] 일반 공격</span>
            </button>

            <button
              onClick={() => { sfx.playCursor(); setSelectedCategory('magic'); }}
              disabled={activeHeroIndex === null}
              className="p-2.5 rounded-xl border-2 border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/50 text-slate-800 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>[2] 마법 시전</span>
            </button>

            <button
              onClick={() => { sfx.playCursor(); setSelectedCategory('monk'); }}
              disabled={activeHeroIndex === null}
              className="p-2.5 rounded-xl border-2 border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/50 text-slate-800 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              <Flame className="w-4 h-4 text-amber-500" />
              <span>[3] 몽크 기공</span>
            </button>

            <button
              onClick={handleDefend}
              disabled={activeHeroIndex === null}
              className="p-2.5 rounded-xl border-2 border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/50 text-slate-800 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              <Shield className="w-4 h-4 text-blue-500" />
              <span>[4] 방어 태세</span>
            </button>
          </div>
        )}

        {/* 서브 메뉴: 마법 시전 목록 */}
        {selectedCategory === 'magic' && (
          <div className="grid grid-cols-2 gap-2">
            {SKILLS.filter(s => s.jobRequired === 'white_mage' || s.jobRequired === 'black_mage').map(skill => {
              const hasMp = (currentActiveHero?.mp || 0) >= skill.mpCost;
              return (
                <button
                  key={skill.id}
                  onClick={() => handleSkill(skill)}
                  disabled={!hasMp}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 text-left transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                    <span>{skill.name}</span>
                    <span className="text-[10px] text-blue-600 font-mono">{skill.mpCost}MP</span>
                  </div>
                  <p className="text-[9px] text-slate-500 truncate">{skill.description}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* 서브 메뉴: 몽크 기공 목록 */}
        {selectedCategory === 'monk' && (
          <div className="grid grid-cols-2 gap-2">
            {SKILLS.filter(s => s.jobRequired === 'monk' || s.jobRequired === 'warrior').map(skill => {
              const hasMp = (currentActiveHero?.mp || 0) >= skill.mpCost;
              return (
                <button
                  key={skill.id}
                  onClick={() => handleSkill(skill)}
                  disabled={!hasMp}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:border-amber-400 text-left transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                    <span>{skill.name}</span>
                    <span className="text-[10px] text-amber-600 font-mono">{skill.mpCost}MP</span>
                  </div>
                  <p className="text-[9px] text-slate-500 truncate">{skill.description}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. 실시간 전투 및 서사 로그 윈도우 (115px) */}
      <section className="bg-slate-100 px-3.5 py-2 shrink-0 border-b border-slate-200 h-[115px] overflow-hidden flex flex-col justify-between">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 border-b border-slate-200/80 pb-0.5">
          <span>전투 & 서사 진행 로그</span>
          <span className="text-indigo-600 font-semibold">{currentAct.locationName}</span>
        </div>
        <div className="overflow-y-auto space-y-1 font-mono text-[11px] text-slate-700 flex-1">
          {battleLogs.map((log, idx) => (
            <div key={idx} className="leading-tight truncate">
              • {log}
            </div>
          ))}
        </div>
      </section>

      {/* 6. 푸터 및 저작권 (42px) */}
      <footer className="bg-white px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 shrink-0 border-t border-slate-200">
        <div className="flex items-center gap-1 font-semibold text-slate-500">
          <Award className="w-3.5 h-3.5 text-indigo-500" />
          <span>Vera Fantasy RPG</span>
        </div>
        <span>© 2026 VeraNex. All rights reserved.</span>
      </footer>

      {/* 7. 스토리 대화 다이얼로그 컷씬 모달 */}
      {showStoryModal && currentAct.introDialog[dialogIndex] && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xl w-full max-w-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-indigo-700">{currentAct.title}</span>
              <button 
                onClick={() => setShowStoryModal(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600 font-bold px-2 py-0.5 rounded cursor-pointer"
              >
                스킵
              </button>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-4xl p-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                {currentAct.introDialog[dialogIndex].avatar}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-xs text-slate-900 mb-1">
                  {currentAct.introDialog[dialogIndex].speaker}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentAct.introDialog[dialogIndex].text}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  sfx.playCursor();
                  if (dialogIndex < currentAct.introDialog.length - 1) {
                    setDialogIndex(prev => prev + 1);
                  } else {
                    setShowStoryModal(false);
                  }
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <span>{dialogIndex < currentAct.introDialog.length - 1 ? '다음' : '전투 시작'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. 승리 모달 (다음 막 진입) */}
      {showVictoryModal && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl w-full max-w-sm text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-sm">
              🏆
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 mb-1">전투 승리!</h3>
              <p className="text-xs text-slate-500">
                {currentAct.title}의 보스를 물리치고 시원 결정의 파편을 수습했습니다!
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-around text-xs font-bold text-slate-700">
              <span>경험치 +{earnedRewards.exp}</span>
              <span>골드 +{earnedRewards.gold}G</span>
            </div>

            <button
              onClick={handleNextAct}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Plane className="w-4 h-4" />
              <span>{currentActNum < 4 ? '비공정 출항: 다음 막으로 이동' : '시원 결정 융합: 엔딩 보기'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 9. 패배 모달 (재도전) */}
      {showDefeatModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl w-full max-w-sm text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-sm">
              💀
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 mb-1">파티 전멸...</h3>
              <p className="text-xs text-slate-500">
                조율자들이 쓰러졌습니다. 전열을 재정비하고 다시 도전하세요.
              </p>
            </div>

            <button
              onClick={handleRetryBattle}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>전투 다시 시작</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
