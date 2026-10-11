import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyScore, createNewBeat, KotoScore } from '../types/koto';
import { buildTimeline } from './timeline';
import { voiceSlot, VoiceSink } from './voicing';
import { createNewSlot } from '../types/koto';

/** 4拍×指定小節数の譜面。各拍は4分（div=1）にして、先頭のマスに音を入れる */
function scoreWith(notesPerBeat: (number[] | 'rest' | 'tie' | null)[], opts: { stringCount?: 13 | 17 } = {}): KotoScore {
  const s = createEmptyScore(opts.stringCount ?? 13);
  s.measures = [{ beats: [] }];
  notesPerBeat.forEach((n, i) => {
    if (i > 0 && i % 4 === 0) s.measures.push({ beats: [] });
    const beat = createNewBeat(1);
    const slot = beat.slots[0];
    if (n === 'rest') slot.rest = true;
    else if (n === 'tie') slot.tie = true;
    else if (n) slot.notes = n;
    s.measures[s.measures.length - 1].beats.push(beat);
  });
  return s;
}

test('音の長さは、次に音が出るまでの拍数（延ばし・空きマスを含む）', () => {
  const { items, totalBeats } = buildTimeline(scoreWith([[0], 'tie', null, [1]]));
  assert.equal(totalBeats, 4);
  assert.equal(items.length, 4);
  assert.equal(items[0].durBeats, 3);
  assert.equal(items[0].sound, true);
  assert.equal(items[1].sound, false);
  assert.equal(items[3].durBeats, 1);
});

test('休符も「発音する側」に数える（前の音を止める）', () => {
  const { items } = buildTimeline(scoreWith([[0], 'rest', [1], null]));
  assert.equal(items[0].durBeats, 1);
  assert.equal(items[1].sound, true);
  assert.equal(items[1].slot.rest, true);
});

test('裏拍のみ2分割（8_16_16）の位置と長さ', () => {
  const s = scoreWith([null, null, null, null]);
  const beat = createNewBeat(3, '8_16_16');
  beat.slots.forEach((sl, i) => (sl.notes = [i]));
  s.measures[0].beats[0] = beat;
  s.measures[0].beats[1].slots[0].notes = [9]; // 次の拍に音があるので、最後の16分は0.25拍で終わる
  const { items } = buildTimeline(s);
  const first = items.filter(i => i.b === 0);
  assert.deepEqual(first.map(i => i.beat), [0, 0.5, 0.75]);
  assert.deepEqual(first.map(i => i.durBeats), [0.5, 0.25, 0.25]);
});

test('くり返し記号（く＝2拍前）は参照先の音になる', () => {
  const s = scoreWith([[3], [4], null, null]);
  s.measures[0].beats[2].slots[0].repeat2 = true;
  s.measures[0].beats[3].slots[0].repeat2 = true;
  const { items } = buildTimeline(s);
  assert.deepEqual(items[2].slot.notes, [3]);
  assert.deepEqual(items[3].slot.notes, [4]);
  assert.equal(items[2].sound, true);
});

test('先頭のくり返し記号は参照先が無いので鳴らさない', () => {
  const s = scoreWith([null, null, null, null]);
  s.measures[0].beats[0].slots[0].repeat2 = true;
  const { items } = buildTimeline(s);
  assert.equal(items[0].sound, false);
});

// ---- 奏法の展開 ----
function record() {
  const calls: { str: number; midi: number; t: number; bend: string | null }[] = [];
  const damps: { str: number | 'all'; t: number }[] = [];
  const sink: VoiceSink = {
    pluck: (str, midi, t, _v, _b, bend) => calls.push({ str, midi, t, bend: bend ? bend.type : null }),
    damp: (str, t) => damps.push({ str, t }),
    dampAll: t => damps.push({ str: 'all', t })
  };
  return { calls, damps, sink };
}
const pitches13 = Array.from({ length: 13 }, (_, i) => 60 + i);
const pitches17 = Array.from({ length: 17 }, (_, i) => 40 + i);

test('ふつうの音は1回だけ鳴る。押し手(オ)は高さが上がる', () => {
  const r = record();
  const sl = createNewSlot();
  sl.notes = [2];
  sl.oshi = 1;
  voiceSlot(r.sink, sl, 0, 1, pitches13, 0.5);
  assert.equal(r.calls.length, 1);
  assert.equal(r.calls[0].midi, 63);
});

test('後押し(ア)は開放の高さで弾いてから音程が動く', () => {
  const r = record();
  const sl = createNewSlot();
  sl.notes = [2];
  sl.oshi = 2;
  sl.ato = true;
  voiceSlot(r.sink, sl, 0, 1, pitches13, 0.5);
  assert.equal(r.calls[0].midi, 62);
  assert.equal(r.calls[0].bend, 'ato');
});

test('トレモロ・掻き爪・流し爪は複数回鳴る', () => {
  const trem = record();
  const a = createNewSlot();
  a.notes = [5];
  a.trem = true;
  voiceSlot(trem.sink, a, 0, 2, pitches13, 0.5);
  assert.ok(trem.calls.length >= 6);

  const kaki = record();
  const b = createNewSlot();
  b.notes = [5];
  b.kaki = true;
  voiceSlot(kaki.sink, b, 0, 1, pitches13, 0.5);
  assert.deepEqual(kaki.calls.map(c => c.str), [5, 6]);

  const nag = record();
  const c = createNewSlot();
  c.notes = [9];
  c.nagashi = true;
  voiceSlot(nag.sink, c, 0, 1, pitches13, 0.5);
  assert.deepEqual(nag.calls.map(x => x.str), [12, 11, 10, 9]);
});

test('十七絃の16番目（index 16）も鳴る。範囲外の絃は無視する', () => {
  const r = record();
  const sl = createNewSlot();
  sl.notes = [16, 17];
  voiceSlot(r.sink, sl, 0, 1, pitches17, 0.5);
  assert.deepEqual(r.calls.map(c => c.str), [16]);
});

test('休符は全部の絃を止める', () => {
  const r = record();
  const sl = createNewSlot();
  sl.rest = true;
  voiceSlot(r.sink, sl, 1.5, 1, pitches13, 0.5);
  assert.deepEqual(r.damps, [{ str: 'all', t: 1.5 }]);
  assert.equal(r.calls.length, 0);
});
