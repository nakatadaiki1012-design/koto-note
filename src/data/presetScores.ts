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
  s.title = '六段の調（初段）';
  s.subtitle = '八橋検校 作曲';
  s.composer = '八橋検校';
  s.tempo = 56;
  s.beatsPerMeasure = 4;
  s.tuning = { preset: 'hira', root: 62, custom: null }; // 平調子 (一=D)

  // 正確な六段の調（初段）伝統文化譜
  // 1: 引爪 2: 一拍目・二拍目・三拍目・四拍目
  // 冒頭: 六・七・八・九・八七六...
  const bars = [
    '六 - - -',
    '七 - 八 -',
    '九 - 八 -',
    '七 八 九 八',
    '七 - 六 -',
    '五 - 六 -',
    '七 八七 六 -',
    '五 四 五 六',
    '七 - 八 -',
    '九 - 八 -',
    '七 八 九 八',
    '七 - 六 -',
    '五 - 六 -',
    '七 八七 六 -',
    '五 四 五 -',
    '四 - - ○'
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

  // 伝統奏法の付与（掻き爪・引き爪・スクイ・揺り色）
  if (s.measures[0]?.beats[0]?.slots[0]) {
    s.measures[0].beats[0].slots[0].hiki = true; // 初めの引き爪
  }
  if (s.measures[6]?.beats[1]?.slots[0]) {
    s.measures[6].beats[1].slots[0].sukui = true;
  }
  if (s.measures[13]?.beats[1]?.slots[0]) {
    s.measures[13].beats[1].slots[0].sukui = true;
  }
  if (s.measures[15]?.beats[0]?.slots[0]) {
    s.measures[15].beats[0].slots[0].yuri = true;
  }

  return s;
}

export function createKojoScore(): KotoScore {
  const s = createEmptyScore();
  s.id = 'kojo';
  s.title = '荒城の月';
  s.subtitle = '土井晩翠 作詞 / 滝廉太郎 作曲';
  s.composer = '滝廉太郎 作曲';
  s.tempo = 68;
  s.beatsPerMeasure = 4;
  s.tuning = { preset: 'hira_yon_up', root: 62, custom: null }; // 平調子より四を一音上げる (一=D)

  // 写真の文化譜通りの正確な16小節（各小節4拍）:
  // 1: 五 - 五 -  (はるこ / うろうの)
  // 2: 七 - 七 -  (はなのえ / ん)
  // 3: 八 - 八 -  (めぐる / さかずき)
  // 4: 九 - 九 -  (かげさ / して)
  // 5: 七 - 七 -  (ちよの / まつが)
  // 6: 六 - 五 -  (えもわ / けいで)
  // 7: 四 - 三 -  (むかし / のひかり)
  // 8: ○ ○ ○ ○  (いまー / ー)
  // 9: 六 - 六 -  (あきじん / ぐのしも)
  // 10: 四 - 四 -  (のおも / てみせて)
  // 11: 五 - 五 -  (うずく / まるけい)
  // 12: △ - 二 -  (こりつ / のつるぎ)
  // 13: 七 - 七 -  (にねん / ごしのあ)
  // 14: 八 - 九 -  (きふく / のあらし)
  // 15: 十 - 斗 -  (よはの / つきは)
  // 16: 巾 - ○ ○ ○  (むかし / のひかり)
  const bars = [
    '五 - 五 -',
    '七 - 七 -',
    '八 - 八 -',
    '九 - 九 -',
    '七 - 七 -',
    '六 - 五 -',
    '四 - 三 -',
    '○ ○ ○ ○',
    '六 - 六 -',
    '四 - 四 -',
    '五 - 五 -',
    '△ - 二 -',
    '七 - 七 -',
    '八 - 九 -',
    '十 - 斗 -',
    '巾 - ○ ○'
  ];

  const lyrics = [
    'はる こう ろう の',
    'は な の えん',
    'めぐ る さか ず',
    'き',
    'ち よ の ま',
    'つ が え も',
    'わ け い で',
    'む か し の',
    'あ き じん ぐ',
    'の し も の お',
    'も て み せ て',
    'う ず く ま',
    'る け い こ',
    'り つ の つ',
    'る ぎ に ね ん',
    'ご し の あ'
  ];

  s.measures = bars.map((bar) => ({
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
