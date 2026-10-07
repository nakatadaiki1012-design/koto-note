/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KotoScore, getPitches } from '../types/koto';

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
  const bpm = score.tempo;
  const microsecondsPerQuarter = Math.round(60000000 / bpm);
  const pitches = getPitches(score);

  interface MidiEvent {
    tick: number;
    data: number[];
  }

  const events: MidiEvent[] = [];

  // Track Name meta event
  const titleBytes = Array.from(new TextEncoder().encode(score.title || 'Koto Song'));
  events.push({
    tick: 0,
    data: [0xff, 0x03, titleBytes.length, ...titleBytes]
  });

  // Set Tempo meta event
  events.push({
    tick: 0,
    data: [
      0xff, 0x51, 0x03,
      (microsecondsPerQuarter >> 16) & 0xff,
      (microsecondsPerQuarter >> 8) & 0xff,
      microsecondsPerQuarter & 0xff
    ]
  });

  // Program change (General MIDI #108 = Koto)
  events.push({
    tick: 0,
    data: [0xc0, 107] // 0-indexed: 107 is GM Koto
  });

  const beatsPerMeasure = score.beatsPerMeasure;

  score.measures.forEach((m, mIdx) => {
    m.beats.forEach((b, bIdx) => {
      const beatTicks = (mIdx * beatsPerMeasure + bIdx) * ticksPerQuarter;
      const slotTicks = Math.round(ticksPerQuarter / b.div);

      b.slots.forEach((sl, sIdx) => {
        if (sl.rest || !sl.notes.length) return;
        const noteStartTick = beatTicks + sIdx * slotTicks;
        const noteDurationTicks = Math.max(20, Math.round(slotTicks * 0.9));

        sl.notes.forEach(strIdx => {
          if (strIdx < 0 || strIdx >= 13) return;
          const basePitch = pitches[strIdx];
          const actualPitch = Math.min(127, Math.max(0, basePitch + (sl.oshi || 0)));

          // Note On (Channel 0)
          events.push({
            tick: noteStartTick,
            data: [0x90, actualPitch, 96]
          });

          // Note Off
          events.push({
            tick: noteStartTick + noteDurationTicks,
            data: [0x80, actualPitch, 0]
          });
        });
      });
    });
  });

  // Sort events by tick
  events.sort((a, b) => a.tick - b.tick);

  // Build Track chunk data with delta times
  const trackBytes: number[] = [];
  let lastTick = 0;

  events.forEach(evt => {
    const delta = evt.tick - lastTick;
    trackBytes.push(...writeVarLen(delta));
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
