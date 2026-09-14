// Web Audio API 기반 무의존성 사운드 신시사이저 (네트워크 다운로드 실패 0%, 저작권 100% 클린)

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // 1. 실제 전통 원목 장기알 착수음 (딱-! 리얼 우드 클래크)
  public playSnap() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // A. 초기 파열음 (단단한 회양목/박달나무 모서리가 판에 닿는 순간의 고주파 마찰 "딱!")
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.035); // 35ms 노이즈 버퍼
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2600, now);
      noiseFilter.Q.setValueAtTime(2.2, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.85, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 0.035);
    } catch {
      // AudioBuffer 미지원 브라우저 폴백
    }

    // B. 단단한 원목 타격 클릭 (Wood Clack Core)
    const clickOsc = this.ctx.createOscillator();
    const clickFilter = this.ctx.createBiquadFilter();
    const clickGain = this.ctx.createGain();

    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1400, now);
    clickOsc.frequency.exponentialRampToValueAtTime(240, now + 0.022);

    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(1050, now);
    clickFilter.Q.setValueAtTime(3.5, now);

    clickGain.gain.setValueAtTime(0.9, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(this.ctx.destination);

    clickOsc.start(now);
    clickOsc.stop(now + 0.045);

    // C. 두꺼운 비자목 장기판 바디 공명 (Board Body Thud)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();

    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(145, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(65, now + 0.08);

    bodyGain.gain.setValueAtTime(0.55, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.ctx.destination);

    bodyOsc.start(now);
    bodyOsc.stop(now + 0.08);
  }

  // 2. 기물 포획 사운드 (장기알 2개가 부딪히며 튕겨나가는 중후한 충돌음)
  public playCapture() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 기본 착수음 1차 타격
    this.playSnap();

    // 2차 잔여 기물 튕김 타격음 (35ms 뒤 장기알 튕겨나감)
    const osc2 = this.ctx.createOscillator();
    const filter2 = this.ctx.createBiquadFilter();
    const gain2 = this.ctx.createGain();

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(780, now + 0.032);
    osc2.frequency.exponentialRampToValueAtTime(160, now + 0.095);

    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(900, now + 0.032);
    filter2.Q.setValueAtTime(2.8, now + 0.032);

    gain2.gain.setValueAtTime(0.0, now);
    gain2.gain.setValueAtTime(0.75, now + 0.032);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc2.start(now + 0.032);
    osc2.stop(now + 0.12);
  }

  // 3. 장군(Check) 경고 알림음 (긴장감 넘치는 2중 톤)
  public playCheck() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1st chime
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // 2nd chime (higher)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1); // A5
    gain2.gain.setValueAtTime(0.5, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.3);
  }

  // 4. 외통수 승리 팡파레
  public playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  // 5. 15초 샷클락 카운트다운 째깍음
  public playTick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public playShotClock() {
    this.playTick();
  }
}

export const soundManager = new SoundManager();
export const soundEffects = soundManager;
