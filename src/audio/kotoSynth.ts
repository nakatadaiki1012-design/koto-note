/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { midiToHz, clamp } from '../types/koto';

export interface BendConfig {
  type: 'ato' | 'hanashi' | 'hikiiro' | 'tsuki' | 'yuri';
  amt?: number; // semitones (1 = half, 2 = whole)
  dur?: number; // duration in seconds
}

export type StringTriggerCallback = (stringIndex: number) => void;

class KotoSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private inputGain: GainNode | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private activeVoices: (({ src: AudioBufferSourceNode; gain: GainNode } | null))[] = new Array(13).fill(null);
  private volume: number = 0.8;
  private stringListeners: Set<StringTriggerCallback> = new Set();

  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.knee.value = 12;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 70;

      // Resonant body peak (桐の胴鳴り 280Hz)
      const bodyFilter = this.ctx.createBiquadFilter();
      bodyFilter.type = 'peaking';
      bodyFilter.frequency.value = 280;
      bodyFilter.Q.value = 1.2;
      bodyFilter.gain.value = 3.5;

      // Presence / Ivory pick overtone (爪のツヤ 2600Hz)
      const presenceFilter = this.ctx.createBiquadFilter();
      presenceFilter.type = 'peaking';
      presenceFilter.frequency.value = 2600;
      presenceFilter.Q.value = 1.0;
      presenceFilter.gain.value = 2.0;

      this.inputGain = this.ctx.createGain();
      this.inputGain.gain.value = 1.0;

      this.inputGain.connect(bodyFilter);
      bodyFilter.connect(presenceFilter);
      presenceFilter.connect(hp);
      hp.connect(compressor);
      compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public setVolume(vol: number): void {
    this.volume = clamp(vol, 0, 1);
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  public onStringTrigger(callback: StringTriggerCallback): () => void {
    this.stringListeners.add(callback);
    return () => this.stringListeners.delete(callback);
  }

  private notifyStringTrigger(stringIndex: number) {
    this.stringListeners.forEach(cb => {
      try {
        cb(stringIndex);
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   * Karplus-Strong physical modeling of a plucked koto silk/tetron string
   */
  public renderStringSample(ctx: BaseAudioContext, midi: number, bright: number = 0.85): AudioBuffer {
    const sr = ctx.sampleRate;
    const f = midiToHz(midi);

    // Koto string decay: low strings ring longer, high strings decay faster
    const T60 = clamp(4.0 - (midi - 50) * 0.08, 1.2, 5.0);
    const len = Math.min(sr * 4.5, Math.ceil(sr * T60));
    const out = new Float32Array(len);

    const S = 0.42; // Low-pass damping coefficient inside the delay loop
    const P = sr / f; // Period in samples
    let N = Math.floor(P + S);
    let frac = P + S - N;
    if (frac < 0.15) {
      N -= 1;
      frac += 1;
    }

    const C = (1 - frac) / (1 + frac);
    const rho = Math.pow(0.001, 1 / (T60 * f));
    const delayLine = new Float32Array(N);

    // Excitation: noise burst filtered to model pluck angle & distance from bridge
    const a = 0.18 + 0.8 * bright;
    let lp = 0;
    const raw = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      lp += a * ((Math.random() * 2 - 1) - lp);
      raw[i] = lp;
    }

    // Comb filter: striking near the Ryukaku (龍角) bridge (~13% along the active string)
    const d = Math.max(1, Math.round(N * 0.13));
    let mean = 0;
    for (let i = 0; i < N; i++) {
      delayLine[i] = raw[i] - 0.9 * raw[(i - d + N) % N];
      mean += delayLine[i];
    }
    mean /= N;
    let peak = 1e-6;
    for (let i = 0; i < N; i++) {
      delayLine[i] -= mean;
      peak = Math.max(peak, Math.abs(delayLine[i]));
    }
    for (let i = 0; i < N; i++) {
      delayLine[i] /= peak;
    }

    let idx = 0;
    let apX = 0;
    let apY = 0;

    for (let n = 0; n < len; n++) {
      const cur = delayLine[idx];
      const nxt = delayLine[(idx + 1) % N];
      out[n] = cur;

      // Loop filter (damping + fractional all-pass)
      const filt = rho * ((1 - S) * cur + S * nxt);
      const y = C * filt + apX - C * apY;
      apX = filt;
      apY = y;
      delayLine[idx] = y;
      idx = (idx + 1) % N;
    }

    // Tsume (plectrum/claw) attack transient
    const clickLen = Math.floor(sr * 0.006);
    let c = 0;
    for (let n = 0; n < clickLen && n < len; n++) {
      c += 0.6 * ((Math.random() * 2 - 1) - c);
      out[n] += c * 0.35 * bright * (1 - n / clickLen);
    }

    // Peak normalize & click-free envelope
    let pk = 1e-6;
    for (let n = 0; n < len; n++) {
      pk = Math.max(pk, Math.abs(out[n]));
    }
    const g = 0.85 / pk;
    const fadeIn = 24;
    const fadeOut = Math.floor(sr * 0.05);

    for (let n = 0; n < len; n++) {
      let e = g;
      if (n < fadeIn) e *= n / fadeIn;
      if (n > len - fadeOut) e *= (len - n) / fadeOut;
      out[n] *= e;
    }

    const buf = ctx.createBuffer(1, len, sr);
    buf.getChannelData(0).set(out);
    return buf;
  }

  public getBuffer(midi: number, bright: number = 0.85): AudioBuffer {
    const ctx = this.ensureContext();
    const key = `${Math.round(midi * 100)}:${bright.toFixed(2)}`;
    if (!this.bufferCache.has(key)) {
      if (this.bufferCache.size > 500) {
        this.bufferCache.clear();
      }
      this.bufferCache.set(key, this.renderStringSample(ctx, midi, bright));
    }
    return this.bufferCache.get(key)!;
  }

  private applyBend(src: AudioBufferSourceNode, t: number, bend: BendConfig): void {
    const p = src.detune;
    const d = clamp(bend.dur || 1.0, 0.25, 3.0);
    const amt = 100 * (bend.amt || 1); // cents

    if (bend.type === 'ato') {
      // 後押し: pluck open note, then push upward
      const t1 = t + clamp(d * 0.35, 0.1, 0.5);
      p.setValueAtTime(0, t);
      p.setValueAtTime(0, t1);
      p.linearRampToValueAtTime(amt, t1 + 0.12);
    } else if (bend.type === 'hanashi') {
      // 押し放し: strike while pushed, then release string back down
      const t1 = t + clamp(d * 0.4, 0.12, 0.6);
      p.setValueAtTime(amt, t);
      p.setValueAtTime(amt, t1);
      p.linearRampToValueAtTime(0, t1 + 0.1);
    } else if (bend.type === 'hikiiro') {
      // 引き色: dip down slightly and recover
      p.setValueAtTime(0, t);
      p.setValueAtTime(0, t + 0.15);
      p.linearRampToValueAtTime(-70, t + 0.32);
      p.linearRampToValueAtTime(0, t + 0.55);
    } else if (bend.type === 'tsuki') {
      // 突き色: sharp quick push and return
      p.setValueAtTime(0, t);
      p.setValueAtTime(0, t + 0.09);
      p.linearRampToValueAtTime(100, t + 0.14);
      p.linearRampToValueAtTime(0, t + 0.24);
    } else if (bend.type === 'yuri') {
      // 揺り色: vibrato oscillation
      if (!this.ctx) return;
      const lfo = this.ctx.createOscillator();
      const dep = this.ctx.createGain();
      lfo.frequency.value = 5.2;
      dep.gain.setValueAtTime(0, t);
      dep.gain.setValueAtTime(0, t + 0.2);
      dep.gain.linearRampToValueAtTime(28, t + 0.5);
      lfo.connect(dep);
      dep.connect(p);
      lfo.start(t);
      if (src.buffer) {
        lfo.stop(t + src.buffer.duration);
      }
    }
  }

  public pluck(
    strIndex: number,
    midi: number,
    time: number = 0,
    vel: number = 0.8,
    bright: number = 0.85,
    bend: BendConfig | null = null
  ) {
    const ctx = this.ensureContext();
    const t = Math.max(time, ctx.currentTime);

    // Notify listeners that this string is plucked
    this.notifyStringTrigger(strIndex);

    // Damp previously vibrating string on this physical string
    const old = this.activeVoices[strIndex];
    if (old) {
      this.dampVoice(old, t, 0.03);
    }

    const src = ctx.createBufferSource();
    src.buffer = this.getBuffer(midi, bright);

    if (bend && src.detune) {
      this.applyBend(src, t, bend);
    }

    const g = ctx.createGain();
    g.gain.value = vel;

    // Stereo panning across the 13 strings (low strings slightly to the left, high strings to the right)
    if (ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = ((strIndex - 6) / 6) * 0.32;
      src.connect(g);
      g.connect(pan);
      if (this.inputGain) pan.connect(this.inputGain);
    } else {
      src.connect(g);
      if (this.inputGain) g.connect(this.inputGain);
    }

    src.start(t);
    const voice = { src, gain: g };
    this.activeVoices[strIndex] = voice;

    src.onended = () => {
      if (this.activeVoices[strIndex] === voice) {
        this.activeVoices[strIndex] = null;
      }
    };

    return voice;
  }

  private dampVoice(v: { src: AudioBufferSourceNode; gain: GainNode }, t: number, tc: number) {
    try {
      v.gain.gain.setTargetAtTime(0, t, tc);
      v.src.stop(t + tc * 8);
    } catch {
      // ignored
    }
  }

  public dampAll(t: number = 0) {
    if (!this.ctx) return;
    const now = Math.max(t, this.ctx.currentTime);
    this.activeVoices.forEach((v, i) => {
      if (v) {
        this.dampVoice(v, now, 0.05);
        this.activeVoices[i] = null;
      }
    });
  }

  /**
   * Hyoshigi (拍子木) wooden clapper click for count-in and metronome
   */
  public click(t: number, accent: boolean = false) {
    const ctx = this.ensureContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = 'triangle';
    o.frequency.value = accent ? 1760 : 1180;

    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(accent ? 0.35 : 0.22, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    o.connect(g);
    if (this.masterGain) {
      g.connect(this.masterGain);
    }
    o.start(t);
    o.stop(t + 0.08);
  }

  public prewarm(pitches: number[]) {
    const ctx = this.ensureContext();
    const list = pitches.flatMap(p => [
      [p, 0.85],
      [p + 1, 0.85],
      [p + 2, 0.85]
    ]);
    const step = () => {
      const t0 = performance.now();
      while (list.length && performance.now() - t0 < 8) {
        const item = list.shift();
        if (item) {
          this.renderStringSample(ctx, item[0], item[1]);
        }
      }
      if (list.length) {
        setTimeout(step, 0);
      }
    };
    step();
  }
}

export const kotoSynth = new KotoSynthesizer();
