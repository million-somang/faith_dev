import { useState, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { InningRecord, GameStatus, SpecialBadge, BaseRunners, PitchEffect } from '../types/baseball';

// 0~9 중복 없는 3자리 난수 생성
function generateSecret(): string {
  const digits: number[] = [];
  while (digits.length < 3) {
    const r = Math.floor(Math.random() * 10);
    if (!digits.includes(r)) {
      digits.push(r);
    }
  }
  return digits.join('');
}

export function useBaseballGame() {
  const [secret, setSecret] = useState<string>('');
  const [currentInning, setCurrentInning] = useState<number>(1);
  const [inputDigits, setInputDigits] = useState<string[]>([]);
  const [history, setHistory] = useState<InningRecord[]>([]);
  const [status, setStatus] = useState<GameStatus>('READY');
  const [badge, setBadge] = useState<SpecialBadge>(null);
  const [runners, setRunners] = useState<BaseRunners>({ first: false, second: false, third: false });
  const [pitchEffect, setPitchEffect] = useState<PitchEffect | null>(null);
  const [isPitching, setIsPitching] = useState<boolean>(false);

  // 새 경기 시작
  const startNewGame = useCallback(() => {
    const newSecret = generateSecret();
    setSecret(newSecret);
    setCurrentInning(1);
    setInputDigits([]);
    setHistory([]);
    setStatus('PLAYING');
    setBadge(null);
    setRunners({ first: false, second: false, third: false });
    setPitchEffect(null);
    setIsPitching(false);
  }, []);

  // 마운트 시 최초 게임 초기화
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // 숫자 키패드 입력 (중복 방지)
  const pushDigit = useCallback((digit: number) => {
    if (status !== 'PLAYING' || isPitching) return;
    const str = String(digit);
    setInputDigits((prev) => {
      if (prev.length >= 3 || prev.includes(str)) return prev;
      return [...prev, str];
    });
  }, [status, isPitching]);

  // 백스페이스
  const deleteDigit = useCallback(() => {
    if (status !== 'PLAYING' || isPitching) return;
    setInputDigits((prev) => prev.slice(0, -1));
  }, [status, isPitching]);

  // 입력 초기화
  const clearDigits = useCallback(() => {
    if (status !== 'PLAYING' || isPitching) return;
    setInputDigits([]);
  }, [status, isPitching]);

  // 투구 실행 (Pitch)
  const pitch = useCallback(() => {
    if (status !== 'PLAYING' || isPitching || inputDigits.length !== 3) return;

    const guessStr = inputDigits.join('');
    setIsPitching(true);

    // 공 날아가는 모션 시간 (400ms) 후 판정
    setTimeout(() => {
      let sCount = 0;
      let bCount = 0;

      for (let i = 0; i < 3; i++) {
        if (guessStr[i] === secret[i]) {
          sCount++;
        } else if (secret.includes(guessStr[i])) {
          bCount++;
        }
      }

      const isOut = sCount === 0 && bCount === 0;
      let judgment = '';
      let effectType: PitchEffect['type'] = 'OUT';

      if (sCount === 3) {
        judgment = '🎉 3 STRIKE! (홈런/정답 적중!)';
        effectType = 'HOMERUN';
      } else if (sCount > 0 && bCount > 0) {
        judgment = `${sCount}S ${bCount}B (적시타 안타!)`;
        effectType = 'HIT';
      } else if (sCount > 0) {
        judgment = `${sCount}S ${bCount}B (스트라이크!)`;
        effectType = 'STRIKE';
      } else if (bCount > 0) {
        judgment = `${sCount}S ${bCount}B (볼 카운트)`;
        effectType = 'BALL';
      } else {
        judgment = 'OUT (헛스윙 삼진!)';
        effectType = 'OUT';
      }

      // 판정 이펙트 발동
      setPitchEffect({
        type: effectType,
        message: judgment,
        key: Date.now(),
      });

      // 다이아몬드 베이스 주자 상태 반영
      if (sCount === 3) {
        setRunners({ first: true, second: true, third: true });
      } else if (sCount >= 2 || (sCount === 1 && bCount >= 1)) {
        setRunners({ first: true, second: true, third: false });
      } else if (sCount === 1 || bCount >= 2) {
        setRunners({ first: true, second: false, third: false });
      } else if (bCount === 1) {
        setRunners({ first: false, second: true, third: false });
      } else {
        setRunners({ first: false, second: false, third: false });
      }

      const newRecord: InningRecord = {
        inning: currentInning,
        guess: guessStr,
        strikes: sCount,
        balls: bCount,
        isOut,
        judgment,
      };

      setHistory((prev) => [...prev, newRecord]);
      setInputDigits([]);
      setIsPitching(false);

      // 승패 판정
      if (sCount === 3) {
        // 승리!
        setStatus('WON');
        let awardedBadge: SpecialBadge = 'REGULAR_WIN';
        if (currentInning <= 3) {
          awardedBadge = 'SHUTOUT'; // 3이닝 이내 완봉승
        } else if (currentInning <= 6) {
          awardedBadge = 'QUALITY_START'; // 6이닝 이내 QS
        }
        setBadge(awardedBadge);

        // 승리 축포 콘페티
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (_e) {}
      } else if (currentInning >= 9) {
        // 9회말 종료, 패배
        setStatus('LOST');
        setBadge('DEFEAT');
      } else {
        // 다음 이닝 진행
        setCurrentInning((prev) => prev + 1);
      }
    }, 450);
  }, [status, isPitching, inputDigits, secret, currentInning]);

  return {
    secret,
    currentInning,
    inputDigits,
    history,
    status,
    badge,
    runners,
    pitchEffect,
    isPitching,
    pushDigit,
    deleteDigit,
    clearDigits,
    pitch,
    startNewGame,
  };
}
