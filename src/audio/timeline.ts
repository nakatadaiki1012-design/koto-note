/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KotoScore, Beat, Slot } from '../types/koto';

/**
 * 譜面を「何拍目に・どの音を・何拍ぶん」鳴らすかという時間表に直す。
 * 画面での再生・WAV書き出し・MIDI書き出しのすべてがこれを使うので、3つの結果がずれない。
 */
export interface TimelineItem {
  /** 曲の頭からの位置（単位：拍） */
  beat: number;
  /** 次に音が出る（または休符になる）までの長さ（単位：拍） */
  durBeats: number;
  m: number;
  b: number;
  s: number;
  key: string;
  /** くり返し記号を元の音に置き換えたあとのマス */
  slot: Slot;
  /** 発音（または休符で止める）するマスなら true。延ばし・空きマスは false */
  sound: boolean;
}

/** 拍の中での各マスの開始位置（0〜1） */
export function slotOffsetInBeat(beat: Pick<Beat, 'div' | 'subDiv'>, s: number): number {
  if (beat.subDiv === '8_16_16') return s === 0 ? 0 : s === 1 ? 0.5 : 0.75;
  if (beat.subDiv === '16_16_8') return s === 0 ? 0 : s === 1 ? 0.25 : 0.5;
  return s / beat.div;
}

/** くり返し記号（〃 1拍 / く 2拍）の参照先の音を返す。参照先もくり返しなら辿る。 */
export function resolveSlot(score: KotoScore, m: number, b: number, s: number): Slot | null {
  const bpm = score.beatsPerMeasure;
  let curM = m;
  let curB = b;
  for (let guard = 0; guard < 8; guard++) {
    const beat = score.measures[curM]?.beats[curB];
    if (!beat) return null;
    const slot = beat.slots[Math.min(s, beat.slots.length - 1)];
    if (!slot) return null;
    const back = slot.repeat2 ? 2 : slot.repeat1 ? 1 : 0;
    if (!back) return slot;
    let idx = curM * bpm + curB - back;
    if (idx < 0) return null;
    curM = Math.floor(idx / bpm);
    curB = idx % bpm;
  }
  return null;
}

export function buildTimeline(score: KotoScore): { items: TimelineItem[]; totalBeats: number } {
  const bpm = score.beatsPerMeasure;
  const items: TimelineItem[] = [];

  score.measures.forEach((ms, m) => {
    ms.beats.forEach((bt, b) => {
      bt.slots.forEach((own, s) => {
        const slot = resolveSlot(score, m, b, s) || own;
        const isRepeat = !!(own.repeat1 || own.repeat2);
        const sound = isRepeat ? !!(slot.rest || slot.notes.length) : !!(own.rest || own.notes.length);
        items.push({
          beat: m * bpm + b + slotOffsetInBeat(bt, s),
          durBeats: 0,
          m,
          b,
          s,
          key: `${m}-${b}-${s}`,
          slot,
          sound
        });
      });
    });
  });

  const totalBeats = score.measures.length * bpm;
  let next = totalBeats;
  for (let i = items.length - 1; i >= 0; i--) {
    items[i].durBeats = next - items[i].beat;
    if (items[i].sound) next = items[i].beat;
  }
  return { items, totalBeats };
}
