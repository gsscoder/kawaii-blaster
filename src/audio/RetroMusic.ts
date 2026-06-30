type MusicMode = "attract" | "game" | "none";

type MusicTrack = {
  steps: readonly number[];
  stepMs: number;
  wave: OscillatorType;
  volume: number;
};

const ATTRACT_TRACK: MusicTrack = {
  // coin-wait arpeggio: C major, bouncy arcade feel
  steps: [
    262, 330, 392, 523, 392, 330, 262, 0,
    330, 392, 494, 659, 494, 392, 330, 0,
    392, 494, 587, 784, 587, 494, 392, 0,
    262, 330, 392, 523, 659, 523, 392, 0,
  ],
  stepMs: 190,
  wave: "square",
  volume: 0.1,
};

const GAME_TRACK: MusicTrack = {
  // A minor / F major mix — gothic tint, still moving
  steps: [
    220, 262, 330, 440, 392, 330, 262, 220,
    175, 220, 262, 349, 330, 262, 220, 0,
    196, 247, 294, 392, 349, 294, 247, 196,
    220, 262, 330, 440, 392, 440, 392, 330,
  ],
  stepMs: 210,
  wave: "triangle",
  volume: 0.11,
};

export class RetroMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private mode: MusicMode = "none";
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private activeTrack: MusicTrack | null = null;
  unlock(): void {
    if (this.ctx === null) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  playAttract(): void {
    this.startTrack("attract", ATTRACT_TRACK);
  }

  playGame(restart = false): void {
    this.startTrack("game", GAME_TRACK, restart);
  }

  pause(): void {
    this.setMasterGain(0);
  }

  resume(): void {
    if (this.mode === "none") return;
    this.setMasterGain(this.activeTrack?.volume ?? 0);
  }

  stop(): void {
    this.clearTimer();
    this.mode = "none";
    this.activeTrack = null;
    this.step = 0;
    this.setMasterGain(0);
  }

  private startTrack(mode: MusicMode, track: MusicTrack, restart = false): void {
    this.unlock();
    if (!restart && this.mode === mode) return;
    this.clearTimer();
    this.mode = mode;
    this.activeTrack = track;
    this.step = 0;
    this.setMasterGain(track.volume);
    this.timer = setInterval(() => this.tick(), track.stepMs);
  }

  private tick(): void {
    const track = this.activeTrack;
    const ctx = this.ctx;
    const master = this.master;
    if (track === null || ctx === null || master === null) return;

    const freq = track.steps[this.step % track.steps.length] ?? 0;
    this.step += 1;
    if (freq > 0) this.playTone(ctx, master, freq, track.stepMs / 1000, track.wave);
  }

  private playTone(
    ctx: AudioContext,
    master: GainNode,
    freq: number,
    duration: number,
    wave: OscillatorType,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const noteLen = Math.max(0.04, duration * 0.85);

    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + noteLen);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + noteLen + 0.02);
  }

  private setMasterGain(value: number): void {
    if (this.master === null || this.ctx === null) return;
    this.master.gain.setValueAtTime(value, this.ctx.currentTime);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}