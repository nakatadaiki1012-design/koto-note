/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KotoScore, getPitches } from '../types/koto';
import { kotoSynth, applyBend } from '../audio/kotoSynth';
import { buildTimeline } from '../audio/timeline';
import { voiceSlot, VoiceSink } from '../audio/voicing';

export async function exportScoreToWav(
  score: KotoScore,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const spb = 60 / score.tempo; // seconds per beat
  const { items, totalBeats } = buildTimeline(score);
  const totalDuration = totalBeats * spb + 3.0; // add 3 seconds of natural ring-out reverberation

  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate);
  const pitches = getPitches(score);

  // 画面再生と同じ音の通り道（胴鳴り → 爪のツヤ → ローカット → コンプレッサー）
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.9;

  const comp = offlineCtx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.25;

  const hp = offlineCtx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 70;

  const bodyFilter = offlineCtx.createBiquadFilter();
  bodyFilter.type = 'peaking';
  bodyFilter.frequency.value = 280;
  bodyFilter.Q.value = 1.2;
  bodyFilter.gain.value = 3.5;

  const presenceFilter = offlineCtx.createBiquadFilter();
  presenceFilter.type = 'peaking';
  presenceFilter.frequency.value = 2600;
  presenceFilter.Q.value = 1.0;
  presenceFilter.gain.value = 2.0;

  bodyFilter.connect(presenceFilter);
  presenceFilter.connect(hp);
  hp.connect(comp);
  comp.connect(masterGain);
  masterGain.connect(offlineCtx.destination);

  const bufferCache = new Map<string, AudioBuffer>();
  const getBuf = (midi: number, bright: number) => {
    const key = `${Math.round(midi * 100)}:${bright.toFixed(2)}`;
    if (!bufferCache.has(key)) {
      bufferCache.set(key, kotoSynth.renderStringSample(offlineCtx, midi, bright));
    }
    return bufferCache.get(key)!;
  };

  // 同じ絃を弾き直したら前の響きを止める（画面再生と同じ）
  const voices = new Map<number, GainNode>();
  const dampVoice = (str: number, t: number, tc: number) => {
    const g = voices.get(str);
    if (g) {
      g.gain.setTargetAtTime(0, t, tc);
      voices.delete(str);
    }
  };

  const sink: VoiceSink = {
    pluck: (str, midi, t, vel, bright, bend, pan) => {
      dampVoice(str, t, 0.03);
      const src = offlineCtx.createBufferSource();
      src.buffer = getBuf(midi, bright);
      if (bend && src.detune) applyBend(offlineCtx, src, t, bend);
      const g = offlineCtx.createGain();
      g.gain.value = vel;
      const panner = offlineCtx.createStereoPanner();
      panner.pan.value = pan * 0.32;
      src.connect(g);
      g.connect(panner);
      panner.connect(bodyFilter);
      src.start(t);
      voices.set(str, g);
    },
    damp: (str, t) => dampVoice(str, t, 0.04),
    dampAll: t => {
      Array.from(voices.keys()).forEach(str => dampVoice(str, t, 0.05));
    }
  };

  items.forEach(item => {
    if (!item.sound) return;
    voiceSlot(sink, item.slot, item.beat * spb, item.durBeats * spb, pitches, spb);
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
