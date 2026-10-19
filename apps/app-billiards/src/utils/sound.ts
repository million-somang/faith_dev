// Web Audio API 기반 무의존성 리얼 당구장 물리 사운드 신시사이저 (저작권 100% 클린)

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

class BilliardsSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastBallClackTime: number = 0;

  constructor() {
    try {
      const saved = localStorage.getItem('vera_billiards_muted');
      if (saved !== null) {
        this.muted = saved === 'true';
      }
    } catch {
      // ignore storage errors
    }
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as WindowWithWebkitAudio).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    try {
      localStorage.setItem('vera_billiards_muted', String(mute));
    } catch {
      // ignore
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public cleanup(): void {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  /**
   * 1. 큐대 스트로크 타격음 ("통!/딱!" 또는 미스큐 "삑-")
   * @param powerNorm 0.1 ~ 1.0
   * @param spinIntensity 0.0 ~ 1.4
   * @param isMiscue 초크 부족 + 극단적 당점으로 인한 미스큐 여부
   */
  public playCueStrike(powerNorm: number, spinIntensity: number = 0, isMiscue: boolean = false): void {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const vol = Math.min(1, Math.max(0.18, powerNorm));

      if (isMiscue) {
        // 미스큐(삑사리): 가죽 팁이 공 표면을 긁으며 미끄러지는 고주파 마찰음
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1450, now);
        osc.frequency.exponentialRampToValueAtTime(2950, now + 0.09);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
        return;
      }

      // A. 가죽 팁 + 선골(Ferrule) 초기 임팩트 노이즈
      const bufLen = Math.floor(ctx.sampleRate * 0.025);
      const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.25));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600 + spinIntensity * 500, now);
      filter.Q.setValueAtTime(2.5, now);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.55 * vol, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.025);

      // B. 단풍나무 큐 샤프트 & 수구 코어 타격 공명 ("통/딱")
      const osc = ctx.createOscillator();
      const oGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520 + powerNorm * 260, now);
      osc.frequency.exponentialRampToValueAtTime(135, now + 0.065);

      oGain.gain.setValueAtTime(0.65 * vol, now);
      oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(oGain);
      oGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // ignore audio error
    }
  }

  /**
   * 2. 페놀 수지 당구공 충돌음 ("딱! / 따닥!")
   * 실제 캐럼 당구공 특유의 맑고 단단한 고밀도 공명음을 3중 레이어로 합성
   */
  public playBallCollision(impactSpeed: number): void {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const nowMs = performance.now();
    if (nowMs - this.lastBallClackTime < 14) return;
    this.lastBallClackTime = nowMs;

    try {
      const now = ctx.currentTime;
      const intensity = Math.min(1, Math.max(0.08, impactSpeed / 14));
      const pitchJitter = 0.96 + Math.random() * 0.08;

      // Layer 1: 초단파 표면 클릭 (Surface Click, 2850Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2850 * pitchJitter, now);
      osc1.frequency.exponentialRampToValueAtTime(1750 * pitchJitter, now + 0.028);

      gain1.gain.setValueAtTime(0.55 * intensity, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.03);

      // Layer 2: 당구공 내부 코어 배음 공명 (Phenolic Resin Ring, 1920Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1920 * pitchJitter, now);
      osc2.frequency.exponentialRampToValueAtTime(820 * pitchJitter, now + 0.048);

      gain2.gain.setValueAtTime(0.45 * intensity, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.052);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.052);

      // Layer 3: 묵직한 질량감 바디 노크 (Mass Knock, 480Hz -> 190Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(480, now);
      osc3.frequency.exponentialRampToValueAtTime(190, now + 0.035);

      gain3.gain.setValueAtTime(0.38 * intensity, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now);
      osc3.stop(now + 0.038);
    } catch {
      // ignore
    }
  }

  /**
   * 3. 고무 쿠션(가드레일) 바운스 사운드 ("통-")
   */
  public playCushionBounce(impactSpeed: number, spinAmount: number = 0): void {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const intensity = Math.min(1, Math.max(0.1, impactSpeed / 13));

      // 고무 레일 탄성 저음
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(155 + intensity * 40, now);
      osc.frequency.exponentialRampToValueAtTime(58, now + 0.085);

      gain.gain.setValueAtTime(0.48 * intensity, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);

      // 강한 회전(스핀)이 걸려 있을 때 라사지 천을 감아도는 마찰음 추가
      if (Math.abs(spinAmount) > 0.35) {
        const bufLen = Math.floor(ctx.sampleRate * 0.045);
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.18 * intensity, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.045);
      }
    } catch {
      // ignore
    }
  }

  /**
   * 4. 초크 바르는 소리 ("쓱- 싹-")
   */
  public playChalkBrush(): void {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.13].forEach((offset, idx) => {
        const startT = now + offset;
        const dur = 0.095;
        const bufLen = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
          const env = Math.sin((i / bufLen) * Math.PI);
          ch[i] = (Math.random() * 2 - 1) * env;
        }

        const src = ctx.createBufferSource();
        src.buffer = buf;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(idx === 0 ? 1650 : 2100, startT);
        filter.Q.setValueAtTime(3.2, startT);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.28, startT);
        gain.gain.exponentialRampToValueAtTime(0.01, startT + dur);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(startT);
        src.stop(startT + dur);
      });
    } catch {
      // ignore
    }
  }

  /**
   * 5. 득점 성공 사운드 (4구 +10점 / 3쿠션 +1점 / 뱅크샷 보너스)
   */
  public playScoreChime(isThreeCushionOrBank: boolean = false): void {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = isThreeCushionOrBank
        ? [523.25, 659.25, 783.99, 1046.5, 1318.5] // C5, E5, G5, C6, E6
        : [587.33, 783.99, 1174.66]; // D5, G5, D6

      notes.forEach((freq, idx) => {
        const t = now + idx * 0.065;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
      });
    } catch {
      // ignore
    }
  }

  /**
   * 6. 파울(노란공 접촉 등) 경고 사운드
   */
  public playFoulBuzz(): void {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [220, 174.61].forEach((freq, idx) => {
        const t = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.14);
      });
    } catch {
      // ignore
    }
  }

  /**
   * 7. 경기 최종 승리 팡파레
   */
  public playVictoryFanfare(): void {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const seq = [
        { f: 523.25, d: 0 },
        { f: 659.25, d: 0.1 },
        { f: 783.99, d: 0.2 },
        { f: 1046.5, d: 0.32 },
        { f: 1318.5, d: 0.46 },
      ];
      seq.forEach(({ f, d }) => {
        const t = now + d;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch {
      // ignore
    }
  }
}

export const sound = new BilliardsSoundEngine();
