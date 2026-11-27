import { PieceType, SoundSettings } from '../types/janggi';

// Web Audio API + Web Speech API 기반 무의존성 한국 전통 장기 사운드 엔진
// - 기물 무게별 리얼 원목 타격음
// - 국악 타악기(대북·징·목탁) & 5음계 연출음
// - 한국어 음성 선언 ("장군!", "멍군!", "외통수!", "빅장!")
// - 은은한 평조 가야금·대금 앰비언스 BGM

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const GUGAK_PENTATONIC_FREQS = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
const BGM_MELODY_INDICES = [0, 2, 4, 3, 2, 1, 2, 5, 4, 3, 2, 0, 1, 2, 4, 2];

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private settings: SoundSettings = {
    sfxEnabled: true,
    voiceEnabled: true,
    bgmEnabled: false,
  };
  private bgmTimerId: number | null = null;
  private bgmStep: number = 0;

  private ensureCtx(allowResume = true): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const win = window as WindowWithWebkitAudio;
      const AudioCtx = window.AudioContext || win.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && allowResume && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Autoplay policy until user gesture
      });
    }
    return this.ctx;
  }

  private canPlaySfx(): boolean {
    return !this.isMuted && this.settings.sfxEnabled;
  }

  public getSettings(): SoundSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<SoundSettings>): SoundSettings {
    const prevBgm = this.settings.bgmEnabled;
    this.settings = {
      ...this.settings,
      ...partial,
    };

    if (!this.settings.voiceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    if (this.settings.bgmEnabled && !this.isMuted) {
      if (!prevBgm || this.bgmTimerId === null) {
        this.startBgm();
      }
    } else {
      this.stopBgm();
    }

    return this.getSettings();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopBgm();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    } else if (this.settings.bgmEnabled) {
      this.startBgm();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public isAnyAudioEnabled(): boolean {
    if (this.isMuted) return false;
    return this.settings.sfxEnabled || this.settings.voiceEnabled || this.settings.bgmEnabled;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // 내부 헬퍼: 필터링된 짧은 노이즈 버스트 생성 (목재 마찰음 / 타악기 스킨)
  private playNoiseBurst(
    ctx: AudioContext,
    startTime: number,
    duration: number,
    filterType: BiquadFilterType,
    frequency: number,
    q: number,
    gainPeak: number,
    decayFactor = 0.25
  ) {
    try {
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * decayFactor));
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(frequency, startTime);
      filter.Q.setValueAtTime(q, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainPeak, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(startTime);
      source.stop(startTime + duration);
    } catch {
      // AudioBuffer 미지원 브라우저 폴백
    }
  }

  // 내부 헬퍼: 원목 장기알 착수 합성 (주파수/무게 파라미터화)
  private playWoodClackAt(
    ctx: AudioContext,
    startTime: number,
    opts: {
      noiseFreq: number;
      noiseGain: number;
      clickStartFreq: number;
      clickEndFreq: number;
      clickFilterFreq: number;
      clickGain: number;
      bodyStartFreq: number;
      bodyEndFreq: number;
      bodyGain: number;
      bodyDuration: number;
    }
  ) {
    this.playNoiseBurst(ctx, startTime, 0.036, 'bandpass', opts.noiseFreq, 2.2, opts.noiseGain, 0.24);

    const clickOsc = ctx.createOscillator();
    const clickFilter = ctx.createBiquadFilter();
    const clickGain = ctx.createGain();

    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(opts.clickStartFreq, startTime);
    clickOsc.frequency.exponentialRampToValueAtTime(opts.clickEndFreq, startTime + 0.024);

    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(opts.clickFilterFreq, startTime);
    clickFilter.Q.setValueAtTime(3.2, startTime);

    clickGain.gain.setValueAtTime(opts.clickGain, startTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.048);

    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);

    clickOsc.start(startTime);
    clickOsc.stop(startTime + 0.048);

    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();

    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(opts.bodyStartFreq, startTime);
    bodyOsc.frequency.exponentialRampToValueAtTime(opts.bodyEndFreq, startTime + opts.bodyDuration);

    bodyGain.gain.setValueAtTime(opts.bodyGain, startTime);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, startTime + opts.bodyDuration);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(ctx.destination);

    bodyOsc.start(startTime);
    bodyOsc.stop(startTime + opts.bodyDuration);
  }

  // 내부 헬퍼: 국악 대북(太鼓) 타격음
  private playDaebukStrike(ctx: AudioContext, startTime: number, intensity = 1.0) {
    this.playNoiseBurst(ctx, startTime, 0.14, 'lowpass', 420, 1.0, 0.45 * intensity, 0.28);

    const drumOsc = ctx.createOscillator();
    const drumGain = ctx.createGain();
    drumOsc.type = 'sine';
    drumOsc.frequency.setValueAtTime(112, startTime);
    drumOsc.frequency.exponentialRampToValueAtTime(38, startTime + 0.24);

    drumGain.gain.setValueAtTime(0.75 * intensity, startTime);
    drumGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.34);

    drumOsc.connect(drumGain);
    drumGain.connect(ctx.destination);
    drumOsc.start(startTime);
    drumOsc.stop(startTime + 0.34);
  }

  // 내부 헬퍼: 국악 징(Gong) 비조화 배음 울림
  private playJingShimmer(ctx: AudioContext, startTime: number, duration = 0.72, gainScale = 1.0) {
    const partials = [
      { freq: 310, gain: 0.22, type: 'sine' as OscillatorType },
      { freq: 472, gain: 0.14, type: 'triangle' as OscillatorType },
      { freq: 718, gain: 0.08, type: 'sine' as OscillatorType },
    ];
    partials.forEach(({ freq, gain, type }) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.985, startTime + duration);

      g.gain.setValueAtTime(0.001, startTime);
      g.gain.linearRampToValueAtTime(gain * gainScale, startTime + 0.025);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  // 0. 한국어 음성 선언 ("장군!", "멍군!", "외통수!", "빅장!")
  public speakVoice(text: string, rate = 1.04, pitch = 1.0) {
    if (this.isMuted || !this.settings.voiceEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 0.92;

      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ko'));
      if (koVoice) {
        utterance.voice = koVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // SpeechSynthesis 미지원 환경 무시
    }
  }

  // 1. UI 버튼 클릭음 (착수음과 분리된 경쾌한 탭)
  public playUiClick() {
    if (!this.canPlaySfx()) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1450, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.018);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.022);
  }

  // 2. 기물 집어 들기 ("톡" 가벼운 원목 픽업음)
  public playSelect() {
    if (!this.canPlaySfx()) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playNoiseBurst(ctx, now, 0.018, 'bandpass', 3200, 2.5, 0.25, 0.2);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1850, now);
    osc.frequency.exponentialRampToValueAtTime(860, now + 0.02);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.024);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.024);
  }

  // 3. 전통 원목 장기알 기본 착수음 (하위 호환 유지)
  public playSnap() {
    this.playPieceMove('soldier');
  }

  // 4. 기물 무게별 리얼 원목 착수음
  public playPieceMove(pieceType: PieceType) {
    if (!this.canPlaySfx()) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (pieceType === 'king' || pieceType === 'chariot') {
      // 궁·차: 묵직하고 위엄 있는 "쩍!"
      this.playWoodClackAt(ctx, now, {
        noiseFreq: 2100,
        noiseGain: 0.9,
        clickStartFreq: 1180,
        clickEndFreq: 175,
        clickFilterFreq: 880,
        clickGain: 0.95,
        bodyStartFreq: 126,
        bodyEndFreq: 48,
        bodyGain: 0.72,
        bodyDuration: 0.11,
      });
      return;
    }

    if (pieceType === 'cannon') {
      // 포: 탄성 있는 착수음 + 짧은 통 울림
      this.playWoodClackAt(ctx, now, {
        noiseFreq: 2400,
        noiseGain: 0.85,
        clickStartFreq: 1320,
        clickEndFreq: 210,
        clickFilterFreq: 980,
        clickGain: 0.88,
        bodyStartFreq: 155,
        bodyEndFreq: 56,
        bodyGain: 0.62,
        bodyDuration: 0.095,
      });
      return;
    }

    if (pieceType === 'horse' || pieceType === 'elephant') {
      // 마·상: 중량감 있는 착수음 + 마는 경쾌한 이중 발굽 리듬
      this.playWoodClackAt(ctx, now, {
        noiseFreq: 2550,
        noiseGain: 0.8,
        clickStartFreq: 1380,
        clickEndFreq: 230,
        clickFilterFreq: 1050,
        clickGain: 0.85,
        bodyStartFreq: 148,
        bodyEndFreq: 62,
        bodyGain: 0.54,
        bodyDuration: 0.085,
      });
      if (pieceType === 'horse') {
        this.playWoodClackAt(ctx, now + 0.028, {
          noiseFreq: 2900,
          noiseGain: 0.28,
          clickStartFreq: 1620,
          clickEndFreq: 310,
          clickFilterFreq: 1220,
          clickGain: 0.32,
          bodyStartFreq: 175,
          bodyEndFreq: 82,
          bodyGain: 0.2,
          bodyDuration: 0.05,
        });
      }
      return;
    }

    // 사·졸·병: 경쾌하고 또렷한 "딱!"
    this.playWoodClackAt(ctx, now, {
      noiseFreq: 2800,
      noiseGain: 0.78,
      clickStartFreq: 1620,
      clickEndFreq: 320,
      clickFilterFreq: 1180,
      clickGain: 0.84,
      bodyStartFreq: 175,
      bodyEndFreq: 78,
      bodyGain: 0.45,
      bodyDuration: 0.068,
    });
  }

  // 5. 기물 포획 사운드 (기물 무게 + 연속 포획 콤보 피치 반영)
  public playCapture(capturedType?: PieceType, comboCount = 1) {
    if (!this.canPlaySfx()) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const isHeavyCapture = capturedType === 'chariot' || capturedType === 'cannon';

    // 1차 주 타격
    this.playPieceMove(isHeavyCapture ? 'chariot' : 'horse');

    // 2차 튕겨나가는 기물 충돌음
    const osc2 = ctx.createOscillator();
    const filter2 = ctx.createBiquadFilter();
    const gain2 = ctx.createGain();

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(820, now + 0.034);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.105);

    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(920, now + 0.034);
    filter2.Q.setValueAtTime(2.6, now + 0.034);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.75, now + 0.034);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.034);
    osc2.stop(now + 0.13);

    // 대물(차·포) 격파 시 묵직한 저음 임팩트 추가
    if (isHeavyCapture) {
      this.playDaebukStrike(ctx, now + 0.02, 0.72);
    }

    // 2연속 이상 포획 시 기세 상승 5음계 스파크
    if (comboCount >= 2) {
      const idx = Math.min(comboCount - 2, GUGAK_PENTATONIC_FREQS.length - 1);
      const chimeFreq = GUGAK_PENTATONIC_FREQS[idx] * 2;
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'triangle';
      chimeOsc.frequency.setValueAtTime(chimeFreq, now + 0.06);
      chimeGain.gain.setValueAtTime(0.24, now + 0.06);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chimeOsc.start(now + 0.06);
      chimeOsc.stop(now + 0.3);
    }
  }

  // 6. 장군(Check) 경고: 대북 + 징 + "장군!" 보이스
  public playCheck() {
    const sfx = this.canPlaySfx();
    if (sfx) {
      const ctx = this.ensureCtx();
      if (ctx) {
        const now = ctx.currentTime;
        this.playDaebukStrike(ctx, now, 1.0);
        this.playJingShimmer(ctx, now + 0.04, 0.75, 0.95);
      }
    }
    this.speakVoice('장군!', 1.05, 0.92);
  }

  // 7. 멍군(Munggun): 장군 방어 성공! 맑은 목탁·대나무 화음 + "멍군!" 보이스
  public playMunggun() {
    const sfx = this.canPlaySfx();
    if (sfx) {
      const ctx = this.ensureCtx();
      if (ctx) {
        const now = ctx.currentTime;
        [659.25, 880].forEach((freq, idx) => {
          const t = now + idx * 0.075;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.28, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.24);
        });
      }
    }
    this.speakVoice('멍군!', 1.06, 1.08);
  }

  // 8. 빅장(Face-to-Face King) 경고음
  public playBigjang() {
    const sfx = this.canPlaySfx();
    if (sfx) {
      const ctx = this.ensureCtx();
      if (ctx) {
        const now = ctx.currentTime;
        this.playDaebukStrike(ctx, now, 0.85);
        this.playDaebukStrike(ctx, now + 0.16, 0.75);
      }
    }
    this.speakVoice('빅장!', 0.98, 0.95);
  }

  // 9. 승리 팡파레 (평조 5음계)
  public playVictory() {
    if (!this.canPlaySfx()) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const notes = [523.25, 587.33, 659.25, 783.99, 1046.5];
    const now = ctx.currentTime;
    this.playDaebukStrike(ctx, now, 0.85);

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.095;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.32, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.48);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.48);
    });
  }

  // 10. 패배 여운음 (승리음과 명확히 구분)
  public playDefeat() {
    if (!this.canPlaySfx()) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playDaebukStrike(ctx, now, 0.75);

    const notes = [392.0, 329.63, 293.66, 220.0];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + 0.08 + idx * 0.14;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.52);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.52);
    });
  }

  // 11. 무승부 / 삼복수 / 빅장 합의 종소리
  public playDraw() {
    if (!this.canPlaySfx()) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playJingShimmer(ctx, now, 0.9, 0.65);
  }

  // 12. 샷클락 카운트다운 째깍음
  public playTick() {
    if (!this.canPlaySfx()) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(840, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.032);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.032);
  }

  // 13. 외통수(Checkmate) 피날레 (승/패 구분 + 대북·징·"외통수!" 보이스)
  public playCheckmate(isPlayerWin = true) {
    const sfx = this.canPlaySfx();
    if (sfx) {
      const ctx = this.ensureCtx();
      if (ctx) {
        const now = ctx.currentTime;
        this.playDaebukStrike(ctx, now, 1.0);
        this.playDaebukStrike(ctx, now + 0.14, 0.85);
        this.playJingShimmer(ctx, now + 0.08, 1.1, isPlayerWin ? 1.0 : 0.7);

        if (isPlayerWin) {
          const fanfare = [
            { freq: 261.63, delay: 0.05 },
            { freq: 293.66, delay: 0.15 },
            { freq: 329.63, delay: 0.25 },
            { freq: 392.0, delay: 0.36 },
            { freq: 440.0, delay: 0.47 },
            { freq: 523.25, delay: 0.58 },
            { freq: 659.25, delay: 0.7 },
          ];
          fanfare.forEach(({ freq, delay }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = now + delay;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.28, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.7);
          });
        } else {
          const lament = [329.63, 293.66, 246.94, 220.0];
          lament.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = now + 0.18 + idx * 0.16;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.22, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.55);
          });
        }
      }
    }
    this.speakVoice('외통수!', 0.94, isPlayerWin ? 0.95 : 0.85);
  }

  // 14. 포(包) 포격 발사음
  public playCannonShot() {
    if (!this.canPlaySfx()) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playNoiseBurst(ctx, now, 0.16, 'lowpass', 950, 1.4, 0.48, 0.32);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.21);

    gain.gain.setValueAtTime(0.42, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  // 15. 은은한 국악풍(가야금 5음계 + 대금 패드) BGM 루프
  private playBgmBeat() {
    if (this.isMuted || !this.settings.bgmEnabled) return;
    const ctx = this.ensureCtx(false);
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const noteIdx = BGM_MELODY_INDICES[this.bgmStep % BGM_MELODY_INDICES.length];
    const freq = GUGAK_PENTATONIC_FREQS[noteIdx];

    // 가야금 발현음 (Plucked String)
    const pluckOsc = ctx.createOscillator();
    const pluckFilter = ctx.createBiquadFilter();
    const pluckGain = ctx.createGain();

    pluckOsc.type = 'triangle';
    pluckOsc.frequency.setValueAtTime(freq, now);

    pluckFilter.type = 'lowpass';
    pluckFilter.frequency.setValueAtTime(1400, now);
    pluckFilter.frequency.exponentialRampToValueAtTime(340, now + 1.1);

    pluckGain.gain.setValueAtTime(0.001, now);
    pluckGain.gain.linearRampToValueAtTime(0.055, now + 0.018);
    pluckGain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

    pluckOsc.connect(pluckFilter);
    pluckFilter.connect(pluckGain);
    pluckGain.connect(ctx.destination);

    pluckOsc.start(now);
    pluckOsc.stop(now + 1.15);

    // 4박자마다 은은한 대금 바람결 저음 패드
    if (this.bgmStep % 4 === 0) {
      const padOsc = ctx.createOscillator();
      const padGain = ctx.createGain();
      padOsc.type = 'sine';
      padOsc.frequency.setValueAtTime(freq * 0.5, now);

      padGain.gain.setValueAtTime(0.001, now);
      padGain.gain.linearRampToValueAtTime(0.024, now + 0.8);
      padGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      padOsc.connect(padGain);
      padGain.connect(ctx.destination);

      padOsc.start(now);
      padOsc.stop(now + 2.8);
    }

    this.bgmStep += 1;
  }

  public startBgm() {
    if (typeof window === 'undefined') return;
    if (this.isMuted || !this.settings.bgmEnabled) return;
    this.ensureCtx(true);

    if (this.bgmTimerId !== null) return;
    this.playBgmBeat();
    this.bgmTimerId = window.setInterval(() => {
      this.playBgmBeat();
    }, 1600);
  }

  public stopBgm() {
    if (typeof window !== 'undefined' && this.bgmTimerId !== null) {
      window.clearInterval(this.bgmTimerId);
    }
    this.bgmTimerId = null;
  }

  public playShotClock() {
    this.playTick();
  }
}

export const soundManager = new SoundManager();
export const soundEffects = soundManager;
