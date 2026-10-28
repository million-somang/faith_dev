// Web Audio API Zero-Dependency Retro Sound Synthesizer

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('vera_flight_muted');
      if (saved !== null) {
        this.muted = saved === 'true';
      }
    } catch {
      // localStorage may fail in private mode
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
    try {
      localStorage.setItem('vera_flight_muted', String(mute));
    } catch {
      // ignore
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // 플레이어 기관총 발사음
  public playGunSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // ignore audio errors
    }
  }

  // 적기/보스 피격 및 파괴 폭발음
  public playExplosionSound(scale: 'small' | 'medium' | 'boss' = 'small') {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const duration = scale === 'boss' ? 1.2 : scale === 'medium' ? 0.45 : 0.22;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const t = this.ctx.currentTime;

      if (scale === 'boss') {
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(80, t + duration);
      } else {
        filter.frequency.setValueAtTime(1200, t);
        filter.frequency.exponentialRampToValueAtTime(150, t + duration);
      }

      const gain = this.ctx.createGain();
      const initialVol = scale === 'boss' ? 0.35 : scale === 'medium' ? 0.25 : 0.15;
      gain.gain.setValueAtTime(initialVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + duration);
    } catch {
      // ignore audio errors
    }
  }

  // 360도 공중제비 롤 회전음 (Loop-the-loop whistle)
  public playRollSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(980, t + 0.35);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.7);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.75);
    } catch {
      // ignore
    }
  }

  // 아이템 획득음 (Bright Arpeggio Chime)
  public playItemSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const t = this.ctx.currentTime + idx * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.18);
      });
    } catch {
      // ignore
    }
  }

  // 메가 폭탄 발동음 (Heavy Mega Bomb Rumble)
  public playBombSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // 1. 저주파 럼블
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 1.2);

      oscGain.gain.setValueAtTime(0.4, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 1.2);

      // 2. 화이트 노이즈 충격파
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.9);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.9);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(t);
      noise.stop(t + 0.9);
    } catch {
      // ignore
    }
  }

  // 보스 출현 사이렌 경보음
  public playBossAlertSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const stepT = t + i * 0.45;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(440, stepT);
        osc.frequency.setValueAtTime(587.33, stepT + 0.2);

        gain.gain.setValueAtTime(0.12, stepT);
        gain.gain.exponentialRampToValueAtTime(0.001, stepT + 0.42);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(stepT);
        osc.stop(stepT + 0.42);
      }
    } catch {
      // ignore
    }
  }

  // 난이도 상승 경보음 (Dramatic Danger Level Escalation)
  public playRankUpSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [330, 392, 493.88, 659.25, 880]; // E4, G4, B4, E5, A5
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const t = this.ctx.currentTime + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.22);
      });
    } catch {
      // ignore
    }
  }

  public playPowerUpSound() {
    this.playRankUpSound();
  }

  // 보스 격파 & 스테이지 클리어 축하 팡파르 사운드
  public playStageClearSound() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      // C5 - E5 - G5 - C6 - E6 - G6 승리 팡파르 아르페지오
      const notes = [
        { freq: 523.25, delay: 0, dur: 0.16 },
        { freq: 659.25, delay: 0.11, dur: 0.16 },
        { freq: 783.99, delay: 0.22, dur: 0.16 },
        { freq: 1046.5, delay: 0.34, dur: 0.28 },
        { freq: 783.99, delay: 0.54, dur: 0.14 },
        { freq: 1046.5, delay: 0.68, dur: 0.55 },
      ];
      notes.forEach(({ freq, delay, dur }) => {
        if (!this.ctx) return;
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + dur);
      });
    } catch {
      // ignore
    }
  }
}

export const sound = new SoundEngine();
