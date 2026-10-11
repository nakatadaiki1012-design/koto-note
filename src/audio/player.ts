/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KotoScore, Slot, getPitches, clamp } from '../types/koto';
import { kotoSynth } from './kotoSynth';
import { buildTimeline, TimelineItem } from './timeline';
import { voiceSlot, VoiceSink } from './voicing';

/** 画面のスピーカーから実際に音を出す先 */
export const liveSink: VoiceSink = {
  pluck: (str, midi, t, vel, bright, bend, pan) => {
    kotoSynth.pluck(str, midi, t, vel, bright, bend, pan);
  },
  damp: (str, t) => kotoSynth.damp(str, t),
  dampAll: t => kotoSynth.dampAll(t, 0.05)
};

/** 入力したマスを試しに鳴らす */
export function previewSlot(slot: Slot | null | undefined, score: KotoScore): void {
  if (!slot || slot.rest || !slot.notes?.length) return;
  voiceSlot(liveSink, slot, kotoSynth.now(), 0.8, getPitches(score), 0.5);
}

export interface PlayerSettings {
  speed: number;
  countIn: boolean;
  metronome: boolean;
  /** くり返す小節の範囲（1始まり）。null ならくり返さない */
  loop: [number, number] | null;
}

export interface PlayerDeps {
  getScore: () => KotoScore;
  getSettings: () => PlayerSettings;
  /** いま鳴っているマス。止まったら null */
  onHighlight: (item: TimelineItem | null) => void;
  onStateChange: (state: 'playing' | 'paused' | 'stopped') => void;
}

type PlayEvent = { beat: number; metro: true; accent: boolean } | { beat: number; metro: false; item: TimelineItem };

/**
 * 先読みスケジューラ式の再生エンジン。
 * 再生中に譜面・テンポ・速さ・くり返し範囲が変わっても、refresh() で今の位置から組み直して反映する。
 */
export class ScorePlayer {
  private events: PlayEvent[] = [];
  private builtFor: KotoScore | null = null;
  private idx = 0;
  private anchorTime = 0;
  private anchorBeat = 0;
  private anchorTempo = 80;
  private lastBeat = 0;
  private rangeStart = 0;
  private rangeEnd = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private raf = 0;
  private pending: { t: number; item: TimelineItem }[] = [];
  private warmed = false;

  public playing = false;
  /** 一時停止した位置（拍）。止まっていれば null */
  public resumeBeat: number | null = null;
  /** 最後に鳴らしたマス */
  public lastItem: TimelineItem | null = null;

  constructor(private deps: PlayerDeps) {}

  private build() {
    const score = this.deps.getScore();
    if (this.builtFor === score) return;
    const { items } = buildTimeline(score);
    const bpm = score.beatsPerMeasure;
    const events: PlayEvent[] = [];
    score.measures.forEach((_, m) => {
      for (let b = 0; b < bpm; b++) events.push({ beat: m * bpm + b, metro: true, accent: b === 0 });
    });
    items.forEach(item => events.push({ beat: item.beat, metro: false, item }));
    // 同じ位置ならメトロノームを先に（Array.sort は安定）
    events.sort((a, b) => a.beat - b.beat || (a.metro === b.metro ? 0 : a.metro ? -1 : 1));
    this.events = events;
    this.builtFor = score;
  }

  private tempo() {
    return this.deps.getScore().tempo * this.deps.getSettings().speed;
  }

  private range(): [number, number] {
    const score = this.deps.getScore();
    const bpm = score.beatsPerMeasure;
    const n = score.measures.length;
    const loop = this.deps.getSettings().loop;
    if (loop) {
      let a = clamp(Math.round(loop[0]) || 1, 1, n);
      let b = clamp(Math.round(loop[1]) || a, 1, n);
      if (b < a) [a, b] = [b, a];
      return [(a - 1) * bpm, b * bpm];
    }
    return [0, n * bpm];
  }

  private beatToTime(beat: number) {
    return this.anchorTime + ((beat - this.anchorBeat) * 60) / this.anchorTempo;
  }

  start(fromBeat?: number | null, opts: { count?: boolean } = {}) {
    const ctx = kotoSynth.ensureContext();
    const score = this.deps.getScore();
    const settings = this.deps.getSettings();
    if (!this.warmed) {
      this.warmed = true;
      kotoSynth.prewarm(getPitches(score));
    }
    this.halt();
    this.build();
    [this.rangeStart, this.rangeEnd] = this.range();
    let from = fromBeat ?? this.rangeStart;
    if (from < this.rangeStart || from >= this.rangeEnd) from = this.rangeStart;

    let t0 = ctx.currentTime + 0.08;
    if (opts.count !== false && settings.countIn) {
      const spb = 60 / this.tempo();
      const n = score.beatsPerMeasure;
      for (let i = 0; i < n; i++) kotoSynth.click(t0 + i * spb, i === 0);
      t0 += n * spb;
    }

    this.anchorTime = t0;
    this.anchorBeat = from;
    this.anchorTempo = this.tempo();
    this.lastBeat = from - 1e-3;
    this.idx = this.events.findIndex(e => e.beat >= from - 1e-6);
    if (this.idx < 0) this.idx = this.events.length;
    this.pending = [];
    this.playing = true;
    this.resumeBeat = null;
    this.timer = setInterval(() => this.tick(), 25);
    this.tick();
    this.raf = requestAnimationFrame(() => this.frame());
    this.deps.onStateChange('playing');
  }

  private tick() {
    if (!this.playing) return;
    const settings = this.deps.getSettings();
    const score = this.deps.getScore();
    const pitches = getPitches(score);
    const now = kotoSynth.now();
    // 裏のタブではタイマーが遅くなるので、先読みを長くして音切れを防ぐ
    const horizon = now + (document.hidden ? 1.6 : 0.15);
    const spb = 60 / this.anchorTempo;

    for (let guard = 0; guard < 5000; guard++) {
      const ev = this.events[this.idx];
      if (!ev || ev.beat >= this.rangeEnd - 1e-6) {
        const endT = this.beatToTime(this.rangeEnd);
        if (!settings.loop) {
          if (now >= endT) this.finish();
          return;
        }
        if (endT > horizon) return;
        // くり返し：範囲の先頭へ戻る
        this.anchorTime = endT;
        this.anchorBeat = this.rangeStart;
        this.lastBeat = this.rangeStart - 1e-3;
        this.idx = this.events.findIndex(e => e.beat >= this.rangeStart - 1e-6);
        if (this.idx < 0) return;
        continue;
      }
      const t = this.beatToTime(ev.beat);
      if (t > horizon) return;
      if (ev.metro) {
        if (settings.metronome) kotoSynth.click(t, ev.accent);
      } else {
        this.pending.push({ t, item: ev.item });
        if (ev.item.sound) voiceSlot(liveSink, ev.item.slot, t, ev.item.durBeats * spb, pitches, spb);
      }
      this.lastBeat = ev.beat;
      this.idx++;
    }
  }

  private frame() {
    if (!this.playing) return;
    const now = kotoSynth.now();
    let last: TimelineItem | null = null;
    while (this.pending.length && this.pending[0].t <= now) last = this.pending.shift()!.item;
    if (last) {
      this.lastItem = last;
      this.deps.onHighlight(last);
    }
    this.raf = requestAnimationFrame(() => this.frame());
  }

  private halt() {
    this.playing = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    cancelAnimationFrame(this.raf);
  }

  pause() {
    if (!this.playing) return;
    this.halt();
    this.resumeBeat = this.lastItem ? this.lastItem.beat : null;
    kotoSynth.dampAll(kotoSynth.now(), 0.12);
    this.deps.onStateChange('paused');
  }

  stop() {
    const was = this.playing;
    this.halt();
    if (was) kotoSynth.dampAll(kotoSynth.now(), 0.06);
    this.resumeBeat = null;
    this.lastItem = null;
    this.pending = [];
    this.deps.onHighlight(null);
    this.deps.onStateChange('stopped');
  }

  /** 曲の最後まで来た。余韻は切らずに止める */
  private finish() {
    this.halt();
    this.resumeBeat = null;
    this.lastItem = null;
    this.pending = [];
    this.deps.onHighlight(null);
    this.deps.onStateChange('stopped');
  }

  /** 再生中に譜面やテンポ・速さ・くり返し範囲が変わったら、今の位置から組み直す */
  refresh() {
    if (!this.playing) return;
    const now = kotoSynth.now();
    this.build();
    [this.rangeStart, this.rangeEnd] = this.range();
    if (now >= this.anchorTime) {
      this.anchorBeat += ((now - this.anchorTime) * this.anchorTempo) / 60;
      this.anchorTime = now;
    }
    this.anchorTempo = this.tempo();
    this.idx = this.events.findIndex(e => e.beat > this.lastBeat + 1e-6);
    if (this.idx < 0) this.idx = this.events.length;
  }
}
