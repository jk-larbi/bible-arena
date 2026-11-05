// ============================================================================
// BIBLEARENA FAITH AUDIO & AMBIENT MUSIC SERVICE
// Pure Web Audio API synthesiser - zero external asset dependencies
// ============================================================================

type TrackId = 'peaceful-sanctuary' | 'living-waters' | 'morning-grace';

export interface MusicTrack {
  id: TrackId;
  name: string;
  description: string;
  key: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'peaceful-sanctuary',
    name: 'Peaceful Sanctuary',
    description: 'Serene meditative hymn harmonies and gentle acoustic chime arpeggios.',
    key: 'C Major',
  },
  {
    id: 'living-waters',
    name: 'Living Waters',
    description: 'Calm flowing worship ambiance with warm sustained string chords.',
    key: 'G Major',
  },
  {
    id: 'morning-grace',
    name: 'Morning Grace',
    description: 'Uplifting celestial bell tones celebrating renewed mercies.',
    key: 'D Major',
  },
];

class MusicService {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private volume = 0.4;
  private sfxEnabled = true;
  private currentTrack: TrackId = 'peaceful-sanctuary';
  private timerId: number | null = null;
  private listeners: Set<() => void> = new Set();

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Chords in frequency (Hz)
  private getChordNotes(track: TrackId, step: number): number[] {
    if (track === 'peaceful-sanctuary') {
      // C - G/B - Am - F progression (I - V6 - vi - IV)
      const chords = [
        [261.63, 329.63, 392.0, 523.25], // C major
        [246.94, 293.66, 392.0, 493.88], // G/B
        [220.0, 261.63, 329.63, 440.0],  // A minor
        [174.61, 220.0, 261.63, 349.23], // F major
      ];
      return chords[step % chords.length];
    } else if (track === 'living-waters') {
      // G - Em - C - D progression
      const chords = [
        [196.0, 246.94, 293.66, 392.0],  // G
        [164.81, 196.0, 246.94, 329.63], // Em
        [261.63, 329.63, 392.0, 523.25], // C
        [146.83, 220.0, 293.66, 369.99], // D
      ];
      return chords[step % chords.length];
    } else {
      // D - A - Bm - G progression
      const chords = [
        [146.83, 220.0, 293.66, 369.99], // D
        [220.0, 277.18, 329.63, 440.0],  // A
        [246.94, 293.66, 369.99, 493.88], // Bm
        [196.0, 246.94, 293.66, 392.0],  // G
      ];
      return chords[step % chords.length];
    }
  }

  private playAmbientChord(freqs: number[], duration = 3.8) {
    if (!this.isPlaying) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Warm sine + low triangle mix
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Low-pass warmth
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800 + idx * 200, now);

        // Gentle envelope: slow attack, long release
        const noteVol = (this.volume * 0.15) / freqs.length;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(noteVol, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });
    } catch {
      // AudioContext could be blocked by browser policy until gesture
    }
  }

  public startMusic() {
    this.isPlaying = true;
    let step = 0;

    const tick = () => {
      if (!this.isPlaying) return;
      const notes = this.getChordNotes(this.currentTrack, step++);
      this.playAmbientChord(notes, 4.0);
      this.timerId = window.setTimeout(tick, 3800);
    };

    tick();
    this.notify();
  }

  public pauseMusic() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  public toggleMusic(): boolean {
    if (this.isPlaying) {
      this.pauseMusic();
    } else {
      this.startMusic();
    }
    return this.isPlaying;
  }

  public setTrack(track: TrackId) {
    this.currentTrack = track;
    if (this.isPlaying) {
      if (this.timerId) clearTimeout(this.timerId);
      this.startMusic();
    }
    this.notify();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.notify();
  }

  public toggleSfx(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    this.notify();
    return this.sfxEnabled;
  }

  public playSfx(type: 'correct' | 'incorrect' | 'click' | 'level_complete') {
    if (!this.sfxEnabled) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      if (type === 'correct') {
        // Joyful two-note ascending chime (G5 -> C6)
        const notes = [783.99, 1046.5];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(this.volume * 0.35, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.4);
        });
      } else if (type === 'incorrect') {
        // Soft low muted tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(170, now + 0.25);
        gain.gain.setValueAtTime(this.volume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(this.volume * 0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'level_complete') {
        // Triumphant triad: C5, E5, G5, C6
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(this.volume * 0.4, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.65);
        });
      }
    } catch {
      // AudioContext could be blocked by browser policy
    }
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      volume: this.volume,
      sfxEnabled: this.sfxEnabled,
      currentTrack: this.currentTrack,
    };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }
}

export const musicService = new MusicService();
