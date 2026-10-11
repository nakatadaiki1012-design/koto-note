/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KotoScore, getPitches } from '../types/koto';
import { buildTimeline } from '../audio/timeline';

function writeVarLen(val: number): number[] {
  const bytes = [];
  let buffer = val & 0x7f;
  while ((val >>= 7) > 0) {
    buffer <<= 8;
    buffer |= 0x80;
    buffer += val & 0x7f;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

export function exportScoreToMidi(score: KotoScore): Blob {
  const ticksPerQuarter = 480;
  const microsecondsPerQuarter = Math.round(60000000 / score.tempo);
  const pitches = getPitches(score);
  const { items } = buildTimeline(score);

  interface MidiEvent {
    tick: number;
    order: number; // 同じ時刻の並び順：メタ情報 → 音を止める → 音を出す
    data: number[];
  }

  const events: MidiEvent[] = [];

  // Track Name meta event（長さは可変長で書く。日本語の曲名は127バイトを超えることがある）
  const titleBytes = Array.from(new TextEncoder().encode(score.title || 'Koto Song')).slice(0, 200);
  events.push({ tick: 0, order: 0, data: [0xff, 0x03, ...writeVarLen(titleBytes.length), ...titleBytes] });

  // Time signature (n/4)
  events.push({ tick: 0, order: 0, data: [0xff, 0x58, 0x04, score.beatsPerMeasure, 0x02, 0x18, 0x08] });

  // Set Tempo meta event
  events.push({
    tick: 0,
    order: 0,
    data: [
      0xff, 0x51, 0x03,
      (microsecondsPerQuarter >> 16) & 0xff,
      (microsecondsPerQuarter >> 8) & 0xff,
      microsecondsPerQuarter & 0xff
    ]
  });

  // Program change (General MIDI #108 = Koto)
  events.push({ tick: 0, order: 0, data: [0xc0, 107] }); // 0-indexed: 107 is GM Koto

  items.forEach(item => {
    const sl = item.slot;
    if (!item.sound || sl.rest || !sl.notes.length) return;

    const start = Math.round(item.beat * ticksPerQuarter);
    // 次の音（または休符）まで音を延ばす。延ばし記号や空きマスも含む。長すぎる場合は8拍で止める
    const length = Math.max(30, Math.round(Math.min(item.durBeats, 8) * ticksPerQuarter) - 8);

    sl.notes.forEach(strIdx => {
      if (strIdx < 0 || strIdx >= pitches.length) return;
      const pitch = Math.min(127, Math.max(0, Math.round(pitches[strIdx] + (sl.ato ? 0 : sl.oshi || 0))));
      events.push({ tick: start, order: 2, data: [0x90, pitch, 96] });
      events.push({ tick: start + length, order: 1, data: [0x80, pitch, 0] });
    });
  });

  events.sort((a, b) => a.tick - b.tick || a.order - b.order);

  // Build Track chunk data with delta times
  const trackBytes: number[] = [];
  let lastTick = 0;

  events.forEach(evt => {
    trackBytes.push(...writeVarLen(evt.tick - lastTick));
    trackBytes.push(...evt.data);
    lastTick = evt.tick;
  });

  // End of Track meta event
  trackBytes.push(...writeVarLen(0));
  trackBytes.push(0xff, 0x2f, 0x00);

  // MThd header: type 0, 1 track, ticksPerQuarter
  const headerBytes = [
    0x4d, 0x54, 0x68, 0x64, // 'MThd'
    0x00, 0x00, 0x00, 0x06, // length = 6
    0x00, 0x00,             // format 0
    0x00, 0x01,             // 1 track
    (ticksPerQuarter >> 8) & 0xff, ticksPerQuarter & 0xff
  ];

  // MTrk header
  const trkLen = trackBytes.length;
  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // 'MTrk'
    (trkLen >> 24) & 0xff,
    (trkLen >> 16) & 0xff,
    (trkLen >> 8) & 0xff,
    trkLen & 0xff
  ];

  const fullFile = new Uint8Array([...headerBytes, ...trackHeader, ...trackBytes]);
  return new Blob([fullFile], { type: 'audio/midi' });
}
