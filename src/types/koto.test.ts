import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyScore,
  normalizeScore,
  setBeatsPerMeasure,
  getPitches,
  noteName,
  getTuningLabel
} from './koto';

test('平調子（一＝D）の13本の音名', () => {
  const names = getPitches(createEmptyScore()).map(p => noteName(p, false));
  assert.deepEqual(names, ['D', 'G', 'A', 'B♭', 'D', 'E♭', 'G', 'A', 'B♭', 'D', 'E♭', 'G', 'A']);
  assert.match(getTuningLabel(createEmptyScore()), /平調子/);
});

test('十七絃は17本の音高を返す', () => {
  assert.equal(getPitches(createEmptyScore(17)).length, 17);
});

test('壊れたデータは見本・既定値に戻る（例外を出さない）', () => {
  assert.doesNotThrow(() => normalizeScore(null));
  assert.doesNotThrow(() => normalizeScore({ measures: 'x', tempo: 'fast', tuning: 5 }));
  const s = normalizeScore({ tempo: 9999 });
  assert.equal(s.tempo, 260);
});

test('拍子を3/4に変えると、すべての小節が3拍になる', () => {
  const s = createEmptyScore();
  setBeatsPerMeasure(s, 3);
  assert.equal(s.beatsPerMeasure, 3);
  assert.ok(s.measures.every(m => m.beats.length === 3));
  setBeatsPerMeasure(s, 4);
  assert.ok(s.measures.every(m => m.beats.length === 4));
});

test('保存して読み込んでも内容が変わらない', () => {
  const s = createEmptyScore();
  s.measures[0].beats[0].slots[0].notes = [3, 5];
  s.measures[0].beats[0].slots[0].oshi = 2;
  const back = normalizeScore(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(back.measures[0].beats[0].slots[0].notes, [3, 5]);
  assert.equal(back.measures[0].beats[0].slots[0].oshi, 2);
});
