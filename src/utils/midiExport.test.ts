import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyScore } from '../types/koto';
import { createSakuraScore } from '../data/presetScores';
import { exportScoreToMidi } from './midiExport';

async function bytesOf(score: ReturnType<typeof createEmptyScore>) {
  return new Uint8Array(await exportScoreToMidi(score).arrayBuffer());
}

/** MIDIファイルを読んで、ノートオンの数と、ファイルの構造が正しいかを返す */
function parse(b: Uint8Array) {
  const text = (o: number, n: number) => String.fromCharCode(...b.slice(o, o + n));
  assert.equal(text(0, 4), 'MThd');
  assert.equal(text(14, 4), 'MTrk');
  const len = (b[18] << 24) | (b[19] << 16) | (b[20] << 8) | b[21];
  assert.equal(22 + len, b.length, 'トラック長がファイル末尾と一致する');
  let i = 22;
  const end = 22 + len;
  let noteOns = 0;
  let noteOffs = 0;
  let sawEnd = false;
  const readVar = () => {
    let v = 0;
    for (;;) {
      const c = b[i++];
      v = (v << 7) | (c & 0x7f);
      if (!(c & 0x80)) return v;
    }
  };
  while (i < end) {
    readVar();
    const status = b[i++];
    if (status === 0xff) {
      const type = b[i++];
      const n = readVar();
      i += n;
      if (type === 0x2f) sawEnd = true;
    } else if ((status & 0xf0) === 0x90) {
      if (b[i + 1] > 0) noteOns++;
      i += 2;
    } else if ((status & 0xf0) === 0x80) {
      noteOffs++;
      i += 2;
    } else if ((status & 0xf0) === 0xc0) {
      i += 1;
    } else {
      assert.fail('想定外のイベント ' + status.toString(16));
    }
  }
  assert.equal(i, end);
  assert.ok(sawEnd);
  return { noteOns, noteOffs };
}

test('さくらさくらのMIDI：音の数がオン・オフで一致し、構造が正しい', async () => {
  const { noteOns, noteOffs } = parse(await bytesOf(createSakuraScore()));
  assert.ok(noteOns > 30);
  assert.equal(noteOns, noteOffs);
});

test('長い日本語の曲名（127バイト超）でもファイルが壊れない', async () => {
  const s = createSakuraScore();
  s.title = '春の海をわたる風に乗せて奏でる十三絃のための小品集第一番変奏曲'.repeat(2);
  const { noteOns } = parse(await bytesOf(s));
  assert.ok(noteOns > 0);
});

test('十七絃の高い絃もMIDIに出力される', async () => {
  const s = createEmptyScore(17);
  s.measures[0].beats[0].slots[0].notes = [16];
  const { noteOns } = parse(await bytesOf(s));
  assert.equal(noteOns, 1);
});
