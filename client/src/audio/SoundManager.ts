export class SoundManager {
  private ctx: AudioContext | null = null;
  private _muted: boolean = false;

  get muted() { return this._muted; }

  private getContext(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this._muted = muted;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
    if (this._muted) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  paddleHit() { this.playTone(440, 0.08); }
  wallHit() { this.playTone(300, 0.06); }
  score() { this.playTone(660, 0.15, 'sine', 0.2); }
  gameStart() {
    this.playTone(440, 0.1);
    setTimeout(() => this.playTone(550, 0.1), 120);
    setTimeout(() => this.playTone(660, 0.2), 240);
  }
  gameEnd() {
    this.playTone(660, 0.15);
    setTimeout(() => this.playTone(550, 0.15), 150);
    setTimeout(() => this.playTone(440, 0.3), 300);
  }
}

export const soundManager = new SoundManager();
