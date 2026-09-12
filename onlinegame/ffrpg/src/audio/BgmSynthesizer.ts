// ============================================================================
// Web Audio API 16비트 레트로 JRPG BGM 신시사이저 엔진
// 외부 음원 파일(mp3/wav) 다운로드 없이 브라우저 오실레이터로 실시간 합성
// ============================================================================

export type BgmTrackType = 'field' | 'battle' | 'boss' | 'victory';

interface Note {
  freq: number;
  dur: number; // 박자 (1 = 4분음표, 0.5 = 8분음표, 0.25 = 16분음표)
}

// 음계별 주파수 (Hz)
const NOTE: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50,
  Db4: 277.18, Eb4: 311.13, Gb4: 369.99, Ab4: 415.30, Bb4: 466.16,
  Db5: 554.37, Eb5: 622.25, Gb5: 739.99, Ab5: 830.61, Bb5: 932.33,
  REST: 0,
};

// 1. 천공 대륙 에테리아 필드 테마 (희망찬 아르페지오, C Major, 110 BPM)
const FIELD_MELODY: Note[] = [
  { freq: NOTE.E4, dur: 0.5 }, { freq: NOTE.G4, dur: 0.5 }, { freq: NOTE.C5, dur: 1.0 },
  { freq: NOTE.B4, dur: 0.5 }, { freq: NOTE.G4, dur: 0.5 }, { freq: NOTE.E4, dur: 1.0 },
  { freq: NOTE.F4, dur: 0.5 }, { freq: NOTE.A4, dur: 0.5 }, { freq: NOTE.D5, dur: 1.0 },
  { freq: NOTE.C5, dur: 0.5 }, { freq: NOTE.B4, dur: 0.5 }, { freq: NOTE.G4, dur: 1.0 },
  { freq: NOTE.A4, dur: 0.5 }, { freq: NOTE.C5, dur: 0.5 }, { freq: NOTE.E5, dur: 1.0 },
  { freq: NOTE.D5, dur: 0.5 }, { freq: NOTE.C5, dur: 0.5 }, { freq: NOTE.B4, dur: 1.0 },
  { freq: NOTE.C5, dur: 2.0 },
];

const FIELD_BASS: Note[] = [
  { freq: NOTE.C3, dur: 1.0 }, { freq: NOTE.G3, dur: 1.0 },
  { freq: NOTE.E3, dur: 1.0 }, { freq: NOTE.G3, dur: 1.0 },
  { freq: NOTE.D3, dur: 1.0 }, { freq: NOTE.A3, dur: 1.0 },
  { freq: NOTE.G3, dur: 1.0 }, { freq: NOTE.D3, dur: 1.0 },
  { freq: NOTE.A3, dur: 1.0 }, { freq: NOTE.E3, dur: 1.0 },
  { freq: NOTE.F3, dur: 1.0 }, { freq: NOTE.G3, dur: 1.0 },
  { freq: NOTE.C3, dur: 2.0 },
];

// 2. 조율자들의 결전 턴제 배틀 테마 (질주감 있는 D Minor, 140 BPM)
const BATTLE_MELODY: Note[] = [
  { freq: NOTE.D4, dur: 0.25 }, { freq: NOTE.D4, dur: 0.25 }, { freq: NOTE.F4, dur: 0.5 },
  { freq: NOTE.A4, dur: 0.25 }, { freq: NOTE.G4, dur: 0.25 }, { freq: NOTE.F4, dur: 0.25 }, { freq: NOTE.E4, dur: 0.25 },
  { freq: NOTE.D4, dur: 0.5 }, { freq: NOTE.A4, dur: 0.5 }, { freq: NOTE.D5, dur: 0.75 }, { freq: NOTE.C5, dur: 0.25 },
  { freq: NOTE.Bb4, dur: 0.5 }, { freq: NOTE.A4, dur: 0.5 }, { freq: NOTE.G4, dur: 0.5 }, { freq: NOTE.A4, dur: 0.5 },
  { freq: NOTE.F4, dur: 0.5 }, { freq: NOTE.E4, dur: 0.5 }, { freq: NOTE.D4, dur: 1.0 },
];

const BATTLE_BASS: Note[] = [
  { freq: NOTE.D3, dur: 0.25 }, { freq: NOTE.D3, dur: 0.25 }, { freq: NOTE.D3, dur: 0.25 }, { freq: NOTE.D3, dur: 0.25 },
  { freq: NOTE.D3, dur: 0.25 }, { freq: NOTE.D3, dur: 0.25 }, { freq: NOTE.D3, dur: 0.25 }, { freq: NOTE.D3, dur: 0.25 },
  { freq: NOTE.G3, dur: 0.25 }, { freq: NOTE.G3, dur: 0.25 }, { freq: NOTE.F3, dur: 0.25 }, { freq: NOTE.F3, dur: 0.25 },
  { freq: NOTE.E3, dur: 0.25 }, { freq: NOTE.E3, dur: 0.25 }, { freq: NOTE.A3, dur: 0.25 }, { freq: NOTE.A3, dur: 0.25 },
  { freq: NOTE.D3, dur: 0.5 }, { freq: NOTE.A3, dur: 0.5 }, { freq: NOTE.D3, dur: 1.0 },
];

// 3. 종언의 첨탑 - 대사제 에제키엘 결전 테마 (비장하고 웅장한 C Minor, 150 BPM)
const BOSS_MELODY: Note[] = [
  { freq: NOTE.C4, dur: 0.25 }, { freq: NOTE.Eb4, dur: 0.25 }, { freq: NOTE.G4, dur: 0.5 },
  { freq: NOTE.Ab4, dur: 0.5 }, { freq: NOTE.G4, dur: 0.5 },
  { freq: NOTE.Eb4, dur: 0.25 }, { freq: NOTE.F4, dur: 0.25 }, { freq: NOTE.G4, dur: 0.75 }, { freq: NOTE.F4, dur: 0.25 },
  { freq: NOTE.Eb4, dur: 0.5 }, { freq: NOTE.D4, dur: 0.5 }, { freq: NOTE.C4, dur: 1.0 },
  { freq: NOTE.G4, dur: 0.5 }, { freq: NOTE.C5, dur: 0.5 }, { freq: NOTE.B4, dur: 0.75 }, { freq: NOTE.Ab4, dur: 0.25 },
  { freq: NOTE.G4, dur: 1.5 }, { freq: NOTE.REST, dur: 0.5 },
];

const BOSS_BASS: Note[] = [
  { freq: NOTE.C3, dur: 0.25 }, { freq: NOTE.C3, dur: 0.25 }, { freq: NOTE.C3, dur: 0.25 }, { freq: NOTE.C3, dur: 0.25 },
  { freq: NOTE.Ab3, dur: 0.25 }, { freq: NOTE.Ab3, dur: 0.25 }, { freq: NOTE.G3, dur: 0.25 }, { freq: NOTE.G3, dur: 0.25 },
  { freq: NOTE.F3, dur: 0.25 }, { freq: NOTE.F3, dur: 0.25 }, { freq: NOTE.G3, dur: 0.25 }, { freq: NOTE.G3, dur: 0.25 },
  { freq: NOTE.C3, dur: 1.0 }, { freq: NOTE.G3, dur: 1.0 },
];

// 4. 승리 팡파레 (Victory Fanfare, C Major, 130 BPM)
const VICTORY_MELODY: Note[] = [
  { freq: NOTE.C5, dur: 0.2 }, { freq: NOTE.C5, dur: 0.2 }, { freq: NOTE.C5, dur: 0.2 },
  { freq: NOTE.C5, dur: 0.6 }, { freq: NOTE.Ab4, dur: 0.6 }, { freq: NOTE.Bb4, dur: 0.6 },
  { freq: NOTE.C5, dur: 0.8 }, { freq: NOTE.REST, dur: 0.2 },
  // 루프 화음
  { freq: NOTE.C5, dur: 0.3 }, { freq: NOTE.E5, dur: 0.3 }, { freq: NOTE.G5, dur: 0.6 },
  { freq: NOTE.F5, dur: 0.3 }, { freq: NOTE.E5, dur: 0.3 }, { freq: NOTE.D5, dur: 0.6 },
  { freq: NOTE.C5, dur: 1.2 },
];

class BgmSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentTrack: BgmTrackType | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private volume: number = 0.18; // 부드럽고 듣기 편한 기본 볼륨

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stop();
    } else if (this.currentTrack) {
      this.play(this.currentTrack);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getCurrentTrack(): BgmTrackType | null {
    return this.currentTrack;
  }

  public play(track: BgmTrackType) {
    this.currentTrack = track;
    if (this.isMuted) return;

    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    this.isPlaying = true;

    let melody: Note[] = FIELD_MELODY;
    let bass: Note[] = FIELD_BASS;
    let tempo = 110;

    if (track === 'battle') {
      melody = BATTLE_MELODY;
      bass = BATTLE_BASS;
      tempo = 140;
    } else if (track === 'boss') {
      melody = BOSS_MELODY;
      bass = BOSS_BASS;
      tempo = 150;
    } else if (track === 'victory') {
      melody = VICTORY_MELODY;
      bass = [];
      tempo = 130;
    }

    this.startSequencer(melody, bass, tempo);
  }

  private startSequencer(melody: Note[], bass: Note[], tempo: number) {
    if (!this.ctx || !this.isPlaying) return;

    const beatDuration = 60 / tempo; // 1박자 길이 (초)
    let totalDuration = 0;
    melody.forEach(n => { totalDuration += n.dur * beatDuration; });

    const playSequence = () => {
      if (!this.ctx || !this.isPlaying) return;
      const startTime = this.ctx.currentTime + 0.05;

      // 1. 리드 멜로디 (Square 웨이브)
      let mTime = startTime;
      melody.forEach(n => {
        if (!this.ctx) return;
        const dur = n.dur * beatDuration;
        if (n.freq > 0) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(n.freq, mTime);

          // 부드러운 ADSR 엔벨로프
          gain.gain.setValueAtTime(0.001, mTime);
          gain.gain.linearRampToValueAtTime(this.volume, mTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, mTime + dur * 0.9);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(mTime);
          osc.stop(mTime + dur);
        }
        mTime += dur;
      });

      // 2. 베이스 채널 (Triangle 웨이브)
      if (bass.length > 0) {
        let bTime = startTime;
        bass.forEach(n => {
          if (!this.ctx) return;
          const dur = n.dur * beatDuration;
          if (n.freq > 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n.freq, bTime);

            gain.gain.setValueAtTime(0.001, bTime);
            gain.gain.linearRampToValueAtTime(this.volume * 0.9, bTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, bTime + dur * 0.85);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(bTime);
            osc.stop(bTime + dur);
          }
          bTime += dur;
        });
      }

      // 무한 루프 스케줄링
      const loopIntervalMs = Math.max(1000, totalDuration * 1000);
      this.timerId = window.setTimeout(() => {
        if (this.isPlaying) {
          playSequence();
        }
      }, loopIntervalMs);
    };

    playSequence();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

export const bgm = new BgmSynthesizer();
