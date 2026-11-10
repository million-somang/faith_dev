// Web Audio API 기반 물리 음향(Procedural Naval Acoustic Synthesis) 사운드 엔진
// 단순 오실레이터 전자음을 배제하고 브라운/핑크 노이즈, 비선형 새추레이션(WaveShaper),
// 다중 대역 필터 스윕 및 해수/화염 잔향(Reverb Tail)을 결합해 실제 해전 사운드를 합성합니다.

type NoiseColor = 'white' | 'pink' | 'brown';

class NavalSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // 최초 클릭 또는 사용자 인터랙션 시 자동 초기화
  }

  private initCtx(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * 화이트 / 핑크(1/f) / 브라운(1/f²) 노이즈 버퍼 생성기
   * - Brown Noise: 수중 폭압, 함포 사출, 거대 폭발의 묵직한 저역 에너지
   * - Pink Noise: 실제 바닷물 물기둥 분출, 화염 연소, 제트 터빈 추진음
   */
  private createNoiseBuffer(ctx: AudioContext, durationSec: number, color: NoiseColor): AudioBuffer {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (color === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (color === 'pink') {
      // Paul Kellet's Pink Noise 1/f filter approximation
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else {
      // Brown Noise (1/f^2 integration)
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    }

    return buffer;
  }

  /**
   * 폭발음의 비선형 음압 포화(Analog Saturation / Clipping) 커브 생성
   */
  private createSaturationCurve(amount: number): Float32Array<ArrayBuffer> {
    const k = typeof amount === 'number' ? amount : 50;
    const nSamples = 44100;
    const buffer = new ArrayBuffer(nSamples * 4);
    const curve = new Float32Array(buffer);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /**
   * 대함 미사일 발사관 사출 및 초기 점화음 (Realistic VLS / Tube Launch Ignition)
   */
  public playFire() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Layer 1: 발사관 고압 가스 사출 펀치 (Pneumatic Breach Thump)
      const thumpOsc = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thumpOsc.type = 'sine';
      thumpOsc.frequency.setValueAtTime(125, now);
      thumpOsc.frequency.exponentialRampToValueAtTime(32, now + 0.24);

      thumpGain.gain.setValueAtTime(0.65, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.008, now + 0.26);

      thumpOsc.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      thumpOsc.start(now);
      thumpOsc.stop(now + 0.27);

      // Layer 2: 초기 로켓 부스터 점화 파열음 (Booster Ignition Blast)
      const blastBuffer = this.createNoiseBuffer(ctx, 0.32, 'brown');
      const blastNoise = ctx.createBufferSource();
      blastNoise.buffer = blastBuffer;

      const blastFilter = ctx.createBiquadFilter();
      blastFilter.type = 'bandpass';
      blastFilter.frequency.setValueAtTime(420, now);
      blastFilter.frequency.exponentialRampToValueAtTime(180, now + 0.3);
      blastFilter.Q.setValueAtTime(1.2, now);

      const blastGain = ctx.createGain();
      blastGain.gain.setValueAtTime(0.55, now);
      blastGain.gain.exponentialRampToValueAtTime(0.01, now + 0.31);

      blastNoise.connect(blastFilter);
      blastFilter.connect(blastGain);
      blastGain.connect(ctx.destination);

      blastNoise.start(now);
      blastNoise.stop(now + 0.32);
    } catch (_e) {}
  }

  /**
   * 순항 미사일 초음속 급강하 추진음 (Realistic Supersonic Jet & Rocket Doppler Whoosh)
   */
  public playMissileFlight() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.52;

      // Layer 1: 핑크 노이즈 기반 로켓 제트 화염 기류음 (Jet Exhaust Roar)
      const pinkBuffer = this.createNoiseBuffer(ctx, duration, 'pink');
      const jetSource = ctx.createBufferSource();
      jetSource.buffer = pinkBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      // 상공 가속 -> 목표 지점 급강하 도플러 주파수 이동
      bandpass.frequency.setValueAtTime(550, now);
      bandpass.frequency.exponentialRampToValueAtTime(1650, now + 0.28);
      bandpass.frequency.exponentialRampToValueAtTime(380, now + 0.5);
      bandpass.Q.setValueAtTime(2.4, now);

      const jetGain = ctx.createGain();
      jetGain.gain.setValueAtTime(0.02, now);
      jetGain.gain.linearRampToValueAtTime(0.45, now + 0.16);
      jetGain.gain.linearRampToValueAtTime(0.52, now + 0.36);
      jetGain.gain.exponentialRampToValueAtTime(0.01, now + 0.51);

      jetSource.connect(bandpass);
      bandpass.connect(jetGain);
      jetGain.connect(ctx.destination);

      jetSource.start(now);
      jetSource.stop(now + duration);

      // Layer 2: 탄두가 대기를 가르는 초음속 휘슬 (Aerodynamic Air-Shear Whistle)
      const whistleBuffer = this.createNoiseBuffer(ctx, duration, 'white');
      const whistleSource = ctx.createBufferSource();
      whistleSource.buffer = whistleBuffer;

      const highFilter = ctx.createBiquadFilter();
      highFilter.type = 'bandpass';
      highFilter.frequency.setValueAtTime(2600, now);
      highFilter.frequency.exponentialRampToValueAtTime(1100, now + 0.49);
      highFilter.Q.setValueAtTime(6.0, now);

      const whistleGain = ctx.createGain();
      whistleGain.gain.setValueAtTime(0.005, now);
      whistleGain.gain.linearRampToValueAtTime(0.14, now + 0.22);
      whistleGain.gain.exponentialRampToValueAtTime(0.005, now + 0.5);

      whistleSource.connect(highFilter);
      highFilter.connect(whistleGain);
      whistleGain.connect(ctx.destination);

      whistleSource.start(now);
      whistleSource.stop(now + duration);
    } catch (_e) {}
  }

  /**
   * 실제 함선 명중 & 거대 불기둥 폭발음 (Realistic Warship Detonation & Fire Pillar Roar - ~1.55초)
   */
  public playExplosion() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.createSaturationCurve(90);
      shaper.oversample = '2x';

      const masterComp = ctx.createDynamicsCompressor();
      masterComp.threshold.setValueAtTime(-12, now);
      masterComp.knee.setValueAtTime(10, now);
      masterComp.ratio.setValueAtTime(6, now);
      masterComp.attack.setValueAtTime(0.002, now);
      masterComp.release.setValueAtTime(0.25, now);
      masterComp.connect(ctx.destination);

      // Layer 1: 철갑 선체 관통 및 초기 탄두 파열 크랙 (0 ~ 0.12s)
      const crackBuffer = this.createNoiseBuffer(ctx, 0.14, 'white');
      const crackSource = ctx.createBufferSource();
      crackSource.buffer = crackBuffer;

      const crackFilter = ctx.createBiquadFilter();
      crackFilter.type = 'highpass';
      crackFilter.frequency.setValueAtTime(600, now);

      const crackGain = ctx.createGain();
      crackGain.gain.setValueAtTime(0.9, now);
      crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      crackSource.connect(crackFilter);
      crackFilter.connect(shaper);
      shaper.connect(crackGain);
      crackGain.connect(masterComp);

      crackSource.start(now);
      crackSource.stop(now + 0.13);

      // Layer 2: 중어뢰/대함 탄두 심부 폭압 서브베이스 (0 ~ 0.95s)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(95, now);
      subOsc.frequency.exponentialRampToValueAtTime(34, now + 0.25);
      subOsc.frequency.exponentialRampToValueAtTime(18, now + 0.9);

      subGain.gain.setValueAtTime(0.95, now);
      subGain.gain.exponentialRampToValueAtTime(0.35, now + 0.3);
      subGain.gain.exponentialRampToValueAtTime(0.005, now + 0.95);

      subOsc.connect(shaper);
      subOsc.connect(subGain);
      subGain.connect(masterComp);
      subOsc.start(now);
      subOsc.stop(now + 0.96);

      // Layer 3: 브라운 노이즈 기반 거대 폭발 럼블 (0.02 ~ 1.35s)
      const boomBuffer = this.createNoiseBuffer(ctx, 1.4, 'brown');
      const boomSource = ctx.createBufferSource();
      boomSource.buffer = boomBuffer;

      const boomFilter = ctx.createBiquadFilter();
      boomFilter.type = 'lowpass';
      boomFilter.frequency.setValueAtTime(380, now);
      boomFilter.frequency.exponentialRampToValueAtTime(65, now + 1.3);

      const boomGain = ctx.createGain();
      boomGain.gain.setValueAtTime(0.85, now);
      boomGain.gain.exponentialRampToValueAtTime(0.28, now + 0.45);
      boomGain.gain.exponentialRampToValueAtTime(0.005, now + 1.35);

      boomSource.connect(boomFilter);
      boomFilter.connect(boomGain);
      boomGain.connect(masterComp);

      boomSource.start(now);
      boomSource.stop(now + 1.38);

      // Layer 4: 치솟는 불기둥 화염 포효 및 2차 유폭 크래클 (0.12 ~ 1.5s)
      const fireBuffer = this.createNoiseBuffer(ctx, 1.45, 'pink');
      const fireSource = ctx.createBufferSource();
      fireSource.buffer = fireBuffer;

      const fireFilter = ctx.createBiquadFilter();
      fireFilter.type = 'bandpass';
      fireFilter.frequency.setValueAtTime(480, now + 0.1);
      fireFilter.frequency.exponentialRampToValueAtTime(220, now + 1.45);
      fireFilter.Q.setValueAtTime(0.9, now + 0.1);

      const fireGain = ctx.createGain();
      fireGain.gain.setValueAtTime(0.01, now);
      fireGain.gain.linearRampToValueAtTime(0.55, now + 0.18);
      fireGain.gain.exponentialRampToValueAtTime(0.008, now + 1.5);

      fireSource.connect(fireFilter);
      fireFilter.connect(fireGain);
      fireGain.connect(masterComp);

      fireSource.start(now);
      fireSource.stop(now + 1.52);
    } catch (_e) {}
  }

  /**
   * 실제 해수 물기둥 분출 및 물보라 낙하음 (Realistic Naval Water Geyser Plume & Splash - ~1.35초)
   */
  public playSplash() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Layer 1: 탄두 해수면 격돌 및 수중 공동(Cavitation) 파열음 (0 ~ 0.25s)
      const hydroOsc = ctx.createOscillator();
      const hydroGain = ctx.createGain();
      hydroOsc.type = 'sine';
      hydroOsc.frequency.setValueAtTime(115, now);
      hydroOsc.frequency.exponentialRampToValueAtTime(34, now + 0.22);

      hydroGain.gain.setValueAtTime(0.65, now);
      hydroGain.gain.exponentialRampToValueAtTime(0.008, now + 0.24);

      hydroOsc.connect(hydroGain);
      hydroGain.connect(ctx.destination);
      hydroOsc.start(now);
      hydroOsc.stop(now + 0.25);

      const impactBuffer = this.createNoiseBuffer(ctx, 0.28, 'brown');
      const impactSource = ctx.createBufferSource();
      impactSource.buffer = impactBuffer;

      const impactFilter = ctx.createBiquadFilter();
      impactFilter.type = 'lowpass';
      impactFilter.frequency.setValueAtTime(260, now);
      impactFilter.frequency.exponentialRampToValueAtTime(55, now + 0.26);

      const impactNoiseGain = ctx.createGain();
      impactNoiseGain.gain.setValueAtTime(0.6, now);
      impactNoiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.27);

      impactSource.connect(impactFilter);
      impactFilter.connect(impactNoiseGain);
      impactNoiseGain.connect(ctx.destination);
      impactSource.start(now);
      impactSource.stop(now + 0.28);

      // Layer 2: 수십 미터 높이로 치솟는 거대 물기둥 분출음 (0.04 ~ 0.75s)
      const plumeBuffer = this.createNoiseBuffer(ctx, 0.8, 'pink');
      const plumeSource = ctx.createBufferSource();
      plumeSource.buffer = plumeBuffer;

      const plumeFilter = ctx.createBiquadFilter();
      plumeFilter.type = 'bandpass';
      plumeFilter.frequency.setValueAtTime(280, now + 0.03);
      plumeFilter.frequency.exponentialRampToValueAtTime(880, now + 0.28);
      plumeFilter.frequency.exponentialRampToValueAtTime(340, now + 0.75);
      plumeFilter.Q.setValueAtTime(1.1, now);

      const plumeGain = ctx.createGain();
      plumeGain.gain.setValueAtTime(0.01, now);
      plumeGain.gain.linearRampToValueAtTime(0.55, now + 0.14);
      plumeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.78);

      plumeSource.connect(plumeFilter);
      plumeFilter.connect(plumeGain);
      plumeGain.connect(ctx.destination);
      plumeSource.start(now);
      plumeSource.stop(now + 0.8);

      // Layer 3: 솟구친 물보라가 바다 수면으로 쏟아져 내리는 해수 포말 잔향 (0.25 ~ 1.35s)
      const sprayBuffer = this.createNoiseBuffer(ctx, 1.35, 'pink');
      const spraySource = ctx.createBufferSource();
      spraySource.buffer = sprayBuffer;

      const sprayFilter = ctx.createBiquadFilter();
      sprayFilter.type = 'bandpass';
      sprayFilter.frequency.setValueAtTime(1600, now + 0.2);
      sprayFilter.frequency.exponentialRampToValueAtTime(750, now + 1.32);
      sprayFilter.Q.setValueAtTime(0.7, now);

      const sprayGain = ctx.createGain();
      sprayGain.gain.setValueAtTime(0.001, now);
      sprayGain.gain.linearRampToValueAtTime(0.32, now + 0.35);
      sprayGain.gain.linearRampToValueAtTime(0.24, now + 0.65);
      sprayGain.gain.exponentialRampToValueAtTime(0.005, now + 1.34);

      spraySource.connect(sprayFilter);
      sprayFilter.connect(sprayGain);
      sprayGain.connect(ctx.destination);
      spraySource.start(now);
      spraySource.stop(now + 1.35);
    } catch (_e) {}
  }

  /**
   * 소나 레이더 핑 (Sonar Ping)
   */
  public playSonar() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1750, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (_e) {}
  }

  /**
   * 적군 조준 락온 경보음 (Lock-on Warning Beep)
   */
  public playLockOn() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      [0, 0.15].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(960, ctx.currentTime + offset);
        osc.frequency.exponentialRampToValueAtTime(1440, ctx.currentTime + offset + 0.08);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + offset + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.11);
      });
    } catch (_e) {}
  }

  /**
   * 적함 격침 2차 유폭 및 침몰음 (Ship Magazine Secondary Detonation & Sinking Rumbling)
   */
  public playSunk() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1) 탄약고 2차 심부 유폭 (Secondary Magazine Implosion)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(75, now + 0.15);
      subOsc.frequency.exponentialRampToValueAtTime(16, now + 1.4);

      subGain.gain.setValueAtTime(0.01, now);
      subGain.gain.linearRampToValueAtTime(0.85, now + 0.22);
      subGain.gain.exponentialRampToValueAtTime(0.005, now + 1.45);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now + 0.15);
      subOsc.stop(now + 1.5);

      // 2) 선체 침몰 수중 기포 및 폭압 럼블
      const sinkBuffer = this.createNoiseBuffer(ctx, 1.4, 'brown');
      const sinkSource = ctx.createBufferSource();
      sinkSource.buffer = sinkBuffer;

      const sinkFilter = ctx.createBiquadFilter();
      sinkFilter.type = 'lowpass';
      sinkFilter.frequency.setValueAtTime(320, now + 0.15);
      sinkFilter.frequency.exponentialRampToValueAtTime(45, now + 1.5);

      const sinkGain = ctx.createGain();
      sinkGain.gain.setValueAtTime(0.01, now);
      sinkGain.gain.linearRampToValueAtTime(0.7, now + 0.25);
      sinkGain.gain.exponentialRampToValueAtTime(0.005, now + 1.52);

      sinkSource.connect(sinkFilter);
      sinkFilter.connect(sinkGain);
      sinkGain.connect(ctx.destination);
      sinkSource.start(now + 0.15);
      sinkSource.stop(now + 1.55);
    } catch (_e) {}
  }

  /**
   * 승리 팡파르 (Victory Fanfare)
   */
  public playVictory() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + (idx === 3 ? 0.6 : 0.2));

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + (idx === 3 ? 0.65 : 0.22));
      });
    } catch (_e) {}
  }

  /**
   * 패배 효과음 (Defeat Tone)
   */
  public playDefeat() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.18;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.38);
      });
    } catch (_e) {}
  }
}

export const navalSound = new NavalSoundEngine();
