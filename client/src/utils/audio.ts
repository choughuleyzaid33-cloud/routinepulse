// Synthesizes pleasant alarm & reminder sounds using browser Web Audio API
class AudioSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playTone(frequency: number, type: OscillatorType, duration: number, delay = 0, volume = 0.2) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      console.warn('Audio playback not supported or blocked:', e);
    }
  }

  playCrystal() {
    // Elegant crystal chime chord (C6, E6, G6, C7)
    const notes = [1046.50, 1318.51, 1567.98, 2093.00];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 1.2, idx * 0.12, 0.25);
    });
  }

  playRadar() {
    // Tech radar double-pulse
    this.playTone(880, 'sine', 0.15, 0, 0.3);
    this.playTone(1760, 'sine', 0.2, 0.15, 0.3);
    this.playTone(880, 'sine', 0.15, 0.5, 0.3);
    this.playTone(1760, 'sine', 0.3, 0.65, 0.3);
  }

  playHarp() {
    // Gentle relaxing harp sweep
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.8, idx * 0.09, 0.2);
    });
  }

  playChime() {
    // Classic two-tone door chime
    this.playTone(659.25, 'sine', 0.6, 0, 0.3); // E5
    this.playTone(523.25, 'sine', 1.0, 0.25, 0.3); // C5
  }

  playCosmic() {
    // Deep futuristic ambient ping
    this.playTone(440, 'sine', 1.5, 0, 0.3);
    this.playTone(880, 'triangle', 1.2, 0.1, 0.2);
    this.playTone(1320, 'sine', 0.8, 0.25, 0.15);
  }

  playAlert(soundType: string = 'crystal') {
    switch (soundType) {
      case 'radar':
        this.playRadar();
        break;
      case 'harp':
        this.playHarp();
        break;
      case 'chime':
        this.playChime();
        break;
      case 'cosmic':
        this.playCosmic();
        break;
      case 'crystal':
      default:
        this.playCrystal();
        break;
    }
  }
}

export const soundManager = new AudioSynthesizer();
