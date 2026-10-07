/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KotoScore, KANJI_STRINGS, createNewBeat, createEmptyScore } from '../types/koto';

export interface PresetSongInfo {
  id: string;
  title: string;
  subtitle: string;
  composer: string;
  description: string;
  tuningName: string;
  score: () => KotoScore;
}

export function createSakuraScore(): KotoScore {
  const s = createEmptyScore();
  s.id = 'sakura';
  s.title = 'さくらさくら';
  s.subtitle = '日本古謡';
  s.composer = '日本伝統曲';
  s.tempo = 72;
  s.beatsPerMeasure = 4;
  s.tuning = { preset: 'hira', root: 62, custom: null };

  // 14 measures
  const bars = [
    '七 七 八 -',
    '七 七 八 -',
    '七 八 九 八',
    '七 八七 六 -',
    '五 四 五 六',
    '五 五四 三 -',
    '七 八 九 八',
    '七 八七 六 -',
    '五 四 五 六',
    '五 五四 三 -',
    '七 七 八 -',
    '七 七 八 -',
    '五 六 八七 六',
    '五 - - ○'
  ];

  s.measures = bars.map((bar, mIdx) => ({
    beats: bar.split(' ').map((tok) => {
      if (tok === '-') return createNewBeat(1);
      if (tok === '○') {
        const b = createNewBeat(1);
        b.slots[0].rest = true;
        return b;
      }
      const chars = [...tok];
      const b = createNewBeat(chars.length as 1 | 2 | 3 | 4);
      chars.forEach((c, i) => {
        const stringIdx = KANJI_STRINGS.indexOf(c as any);
        if (stringIdx >= 0) {
          b.slots[i].notes = [stringIdx];
        }
      });
      return b;
    })
  }));

  // Add ornaments: yuri (揺り色) on final note
  if (s.measures[13]?.beats[0]?.slots[0]) {
    s.measures[13].beats[0].slots[0].yuri = true;
  }
  // Add ato (後押し) or kaki on some notes for authentic expression
  if (s.measures[3]?.beats[1]?.slots[0]) {
    s.measures[3].beats[1].slots[0].sukui = true;
  }

  return s;
}

export function createRokudanScore(): KotoScore {
  const s = createEmptyScore();
  s.id = 'rokudan';
  s.title = '六段の調（初段抜粋）';
  s.subtitle = '八橋検校 作曲';
  s.composer = '八橋検校';
  s.tempo = 60;
  s.beatsPerMeasure = 4;
  s.tuning = { preset: 'hira', root: 62, custom: null };

  // Famous opening of Rokudan no Shirabe (First Dan)
  const bars = [
    '一 - - -',
    '二 - - -',
    '三 - - -',
    '四 - - -',
    '五 - - -',
    '六 - - -',
    '七 - 八 -',
    '九 - 八 -',
    '七 八 九 八',
    '七 - 六 -',
    '五 - 六 -',
    '七 八七 六 -',
    '五 四 五 六',
    '五 - - ○'
  ];

  s.measures = bars.map(bar => ({
    beats: bar.split(' ').map(tok => {
      if (tok === '-') return createNewBeat(1);
      if (tok === '○') {
        const b = createNewBeat(1);
        b.slots[0].rest = true;
        return b;
      }
      const chars = [...tok];
      const b = createNewBeat(chars.length as 1 | 2 | 3 | 4);
      chars.forEach((c, i) => {
        const stringIdx = KANJI_STRINGS.indexOf(c as any);
        if (stringIdx >= 0) {
          b.slots[i].notes = [stringIdx];
        }
      });
      return b;
    })
  }));

  return s;
}

export function createKojoScore(): KotoScore {
  const s = createEmptyScore();
  s.id = 'kojo';
  s.title = '荒城の月';
  s.subtitle = '土井晩翠 作詞 / 滝廉太郎 作曲';
  s.composer = '滝廉太郎';
  s.tempo = 68;
  s.beatsPerMeasure = 4;
  s.tuning = { preset: 'kumoi', root: 62, custom: null }; // 雲井調子

  // Kojo no Tsuki in Kumoi-joshi
  const bars = [
    '五 六 七 八',
    '七 - 六 -',
    '五 六 七 八',
    '七 - - ○',
    '八 九 十 九',
    '八 - 七 -',
    '六 七 八 六',
    '五 - - ○',
    '五 六 七 八',
    '七 - 六 -',
    '五 六 七 八',
    '七 - - ○'
  ];

  s.measures = bars.map(bar => ({
    beats: bar.split(' ').map(tok => {
      if (tok === '-') return createNewBeat(1);
      if (tok === '○') {
        const b = createNewBeat(1);
        b.slots[0].rest = true;
        return b;
      }
      const chars = [...tok];
      const b = createNewBeat(chars.length as 1 | 2 | 3 | 4);
      chars.forEach((c, i) => {
        const stringIdx = KANJI_STRINGS.indexOf(c as any);
        if (stringIdx >= 0) {
          b.slots[i].notes = [stringIdx];
        }
      });
      return b;
    })
  }));

  return s;
}

export const PRESET_SONGS: PresetSongInfo[] = [
  {
    id: 'sakura',
    title: 'さくらさくら',
    subtitle: '日本古謡',
    composer: '日本伝統曲',
    description: '箏の代表曲。初心者から親しまれる典雅な旋律。平調子（一＝D）。',
    tuningName: '平調子',
    score: createSakuraScore
  },
  {
    id: 'rokudan',
    title: '六段の調（初段）',
    subtitle: '八橋検校 作曲',
    composer: '八橋検校',
    description: '箏曲の最高峰の古典本曲。静寂から始まる格式ある格調高い調べ。',
    tuningName: '平調子',
    score: createRokudanScore
  },
  {
    id: 'kojo',
    title: '荒城の月',
    subtitle: '滝廉太郎 作曲',
    composer: '滝廉太郎',
    description: '哀愁漂う雲井調子の響きが美しい名曲。',
    tuningName: '雲井調子',
    score: createKojoScore
  }
];
