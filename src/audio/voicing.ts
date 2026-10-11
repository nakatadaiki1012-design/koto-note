/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Slot, clamp } from '../types/koto';
import type { BendConfig } from './kotoSynth';

/**
 * 1マスぶんの音を、奏法記号に合わせて「どの絃を・いつ・どんな強さで」弾くかに展開する。
 * 画面での再生・試聴・WAV書き出しで共通に使う（音を出す先だけを差し替える）。
 */
export interface VoiceSink {
  pluck(str: number, midi: number, t: number, vel: number, bright: number, bend: BendConfig | null, pan: number): void;
  damp(str: number, t: number): void;
  dampAll(t: number): void;
}

const LEFT_BENDS = ['ato', 'hanashi', 'hikiiro', 'tsuki', 'yuri'] as const;

export function voiceSlot(
  sink: VoiceSink,
  slot: Slot,
  t: number,
  durSec: number,
  pitches: number[],
  spb: number
): void {
  if (slot.rest) {
    sink.dampAll(t);
    return;
  }
  const count = pitches.length;
  const notes = (slot.notes || []).filter(n => n >= 0 && n < count).sort((a, b) => a - b);
  if (!notes.length) return;

  const panOf = (str: number) => (count > 1 ? (str - (count - 1) / 2) / ((count - 1) / 2) : 0);
  const bendName = LEFT_BENDS.find(k => slot[k]);
  const bend: BendConfig | null = bendName ? { type: bendName, amt: slot.oshi || 1, dur: durSec } : null;

  // 強さと音色（bright が小さいほど柔らかい音）
  let vel = 0.85 / Math.sqrt(notes.length);
  let bright = 0.88;
  if (slot.sukui) {
    bright = 0.55;
    vel *= 0.78;
  } else if (slot.pizz) {
    bright = 0.3;
    vel *= 0.8;
  } else if (slot.muko) {
    bright = 0.65;
  } else if (slot.harm) {
    bright = 0.35;
    vel *= 0.6;
  }
  const octave = slot.harm ? 12 : 0;

  const at = (str: number, tt: number, v: number, br: number, bd: BendConfig | null) => {
    // 押し手は弾く前に押さえるので、後押し(ア)以外は押した高さから始まる
    const midi = pitches[str] + (slot.ato ? 0 : slot.oshi || 0) + octave;
    sink.pluck(str, midi, tt, v, br, bd, panOf(str));
  };
  const open = (str: number, tt: number, v: number, br: number) => {
    sink.pluck(str, pitches[str], tt, v, br, null, panOf(str));
  };

  notes.forEach((str, j) => {
    let tt = t + j * 0.008;

    if (slot.nagashi) {
      // 流し爪：いちばん高い絃（巾）から順に流して、この絃で止める
      const step = clamp(spb / 10, 0.025, 0.045);
      let k = 0;
      for (let s = count - 1; s > str; s--, k++) open(s, tt + k * step, vel * 0.5, 0.7);
      tt += k * step;
    }

    if (slot.trem) {
      const step = clamp(spb / 4, 0.055, 0.1);
      const end = t + Math.max(durSec - 0.03, step);
      for (let x = tt, k = 0; x < end; x += step, k++) {
        at(str, x, vel * (k % 2 ? 0.7 : 0.95), k % 2 ? 0.6 : bright, k === 0 ? bend : null);
      }
    } else if (slot.kaki) {
      // 掻き爪：隣の絃（手前側）と続けて2音
      at(str, tt, vel, bright, bend);
      if (str + 1 < count) open(str + 1, tt + 0.045, vel * 0.9, bright);
    } else if (slot.hiki) {
      // 引き爪：隣の絃（向こう側）と続けて2音
      at(str, tt, vel, bright, bend);
      if (str - 1 >= 0) open(str - 1, tt + 0.045, vel * 0.85, bright * 0.9);
    } else if (slot.awase || slot.wari) {
      // 合わせ爪・割り爪：隣り合う2絃
      at(str, tt, vel, bright, bend);
      if (str + 1 < count) open(str + 1, tt + (slot.wari ? 0.012 : 0), vel * 0.9, bright);
    } else if (slot.suri || slot.ren || slot.chirashi) {
      // スリ爪・連・散らし爪：この絃に向かって素早く下る
      const run = slot.ren ? 4 : 3;
      const step = clamp(spb / 12, 0.02, 0.035);
      let k = 0;
      for (let s = Math.min(count - 1, str + run - 1); s > str; s--, k++) open(s, tt + k * step, vel * 0.55, 0.6);
      at(str, tt + k * step, vel, bright, bend);
    } else if (slot.haya) {
      // 早爪：同じ絃を素早く2回
      at(str, tt, vel, bright, bend);
      at(str, tt + clamp(spb / 6, 0.05, 0.1), vel * 0.8, bright, null);
    } else {
      at(str, tt, vel, bright, bend);
    }

    if (slot.keshi) sink.damp(str, tt + 0.12);
    else if (slot.pizz) sink.damp(str, tt + 0.4);
  });
}
