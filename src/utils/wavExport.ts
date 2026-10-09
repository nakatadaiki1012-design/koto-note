/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KotoScore, getPitches, midiToHz } from '../types/koto';
import { kotoSynth } from '../audio/kotoSynth';

export async function exportScoreToWav(
  score: KotoScore,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const bpm = score.tempo;
  const spb = 60 / bpm; // seconds per beat
  const beatsPerMeasure = score.beatsPerMeasure;
  const totalMeasures = score.measures.length;
  const totalBeats = totalMeasures * beatsPerMeasure;
  const totalDuration = totalBeats * spb + 3.0; // add 3 seconds of natural ring-out reverberation

  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate);

  const pitches = getPitches(score);

  // Re-create master filter path in offline context
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.9;

  const comp = offlineCtx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;

  const hp = offlineCtx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 70;

  const bodyFilter = offlineCtx.createBiquadFilter();
  bodyFilter.type = 'peaking';
  bodyFilter.frequency.value = 280;
  bodyFilter.Q.value = 1.2;
  bodyFilter.gain.value = 3.5;

  bodyFilter.connect(hp);
  hp.connect(comp);
  comp.connect(masterGain);
  masterGain.connect(offlineCtx.destination);

  // Pre-generate buffers for offline context
  const bufferCache = new Map<number, AudioBuffer>();
  const getBuf = (midi: number) => {
    const key = Math.round(midi);
    if (!bufferCache.has(key)) {
      bufferCache.set(key, kotoSynth.renderStringSample(offlineCtx, midi, 0.88));
    }
    return bufferCache.get(key)!;
  };

  // Schedule notes
  score.measures.forEach((ms, mIdx) => {
    ms.beats.forEach((bt, bIdx) => {
      const beatStartTime = (mIdx * beatsPerMeasure + bIdx) * spb;

      bt.slots.forEach((sl, sIdx) => {
        if (sl.rest || !sl.notes.length) return;

        let slotTimeOffset = sIdx * (spb / bt.div);
        if (bt.subDiv === '8_16_16') {
          slotTimeOffset = sIdx === 0 ? 0 : sIdx === 1 ? (spb * 0.5) : (spb * 0.75);
        } else if (bt.subDiv === '16_16_8') {
          slotTimeOffset = sIdx === 0 ? 0 : sIdx === 1 ? (spb * 0.25) : (spb * 0.5);
        }

        const noteTime = beatStartTime + slotTimeOffset;

        sl.notes.forEach(strIdx => {
          if (strIdx < 0 || strIdx >= 13) return;
          const basePitch = pitches[strIdx];
          const actualPitch = basePitch + (sl.ato ? 0 : sl.oshi || 0);

          const src = offlineCtx.createBufferSource();
          src.buffer = getBuf(actualPitch);

          // Apply left-hand ornaments if any
          if (sl.ato && src.detune) {
            const amt = 100 * (sl.oshi || 1);
            const t1 = noteTime + 0.15;
            src.detune.setValueAtTime(0, noteTime);
            src.detune.setValueAtTime(0, t1);
            src.detune.linearRampToValueAtTime(amt, t1 + 0.15);
          } else if (sl.hanashi && src.detune) {
            const amt = 100 * (sl.oshi || 1);
            const t1 = noteTime + 0.15;
            src.detune.setValueAtTime(amt, noteTime);
            src.detune.setValueAtTime(amt, t1);
            src.detune.linearRampToValueAtTime(0, t1 + 0.12);
          }

          const g = offlineCtx.createGain();
          g.gain.value = 0.8;

          // Stereo panning
          const pan = offlineCtx.createStereoPanner();
          pan.pan.value = ((strIdx - 6) / 6) * 0.35;

          src.connect(g);
          g.connect(pan);
          pan.connect(bodyFilter);

          src.start(noteTime);
        });
      });
    });
  });

  if (onProgress) onProgress(30);

  const renderedBuffer = await offlineCtx.startRendering();
  if (onProgress) onProgress(80);

  const wavBlob = audioBufferToWav(renderedBuffer);
  if (onProgress) onProgress(100);

  return wavBlob;
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferSize = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  const left = buffer.getChannelData(0);
  const right = numChannels > 1 ? buffer.getChannelData(1) : left;

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    // Left channel
    let sampleL = Math.max(-1, Math.min(1, left[i]));
    view.setInt16(offset, sampleL < 0 ? sampleL * 0x8000 : sampleL * 0x7fff, true);
    offset += 2;

    // Right channel
    if (numChannels > 1) {
      let sampleR = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, sampleR < 0 ? sampleR * 0x8000 : sampleR * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
