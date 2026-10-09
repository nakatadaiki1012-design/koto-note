/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const KANJI_STRINGS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '斗', '為', '巾'] as const;
export const KANJI_STRINGS_17 = [
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七'
] as const;

export function getStringNames(count: number = 13): readonly string[] {
  return count === 17 ? KANJI_STRINGS_17 : KANJI_STRINGS;
}

export const KEYBOARD_ROW1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '^', '¥'] as const;
export const KEYBOARD_HOME = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', ':', ']', '@'] as const;

export const NOTE_CDE = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;
export const NOTE_DOREMI = ['ド', 'レ♭', 'レ', 'ミ♭', 'ミ', 'ファ', 'ファ♯', 'ソ', 'ラ♭', 'ラ', 'シ♭', 'シ'] as const;
export const RITSU_NAMES = ['神仙', '上無', '壱越', '断金', '平調', '勝絶', '下無', '双調', '鳧鐘', '黄鐘', '鸞鏡', '盤渉'] as const;

export const VERT_CHAR_MAP: Record<string, string> = {
  '（': '︵', '）': '︶', '(': '︵', ')': '︶',
  'ー': '｜', '－': '｜', '-': '｜',
  '「': '﹁', '」': '﹂', '、': '︑', '。': '︒',
  '…': '︙', '〜': '≀', '～': '≀'
};

export interface TuningPreset {
  name: string;
  desc?: string;
  off: number[];
}

export const TUNING_PRESETS: Record<string, TuningPreset> = {
  hira: {
    name: '平調子',
    desc: '最も標準的で典雅な調弦（一＝Dの場合: D G A B♭ D E♭ G A B♭ D E♭ G A）',
    off: [0, -7, -5, -4, 0, 1, 5, 7, 8, 12, 13, 17, 19]
  },
  kumoi: {
    name: '雲井調子',
    desc: '哀愁と風情のある陰音階調弦（三・八を半音下げ、四・九を全音上げ）',
    off: [0, -7, -6, -2, 0, 1, 5, 6, 10, 12, 13, 17, 19]
  },
  nakazora: {
    name: '中空調子',
    desc: '六・斗を半音上げ、七・為を全音下げた調弦',
    off: [0, -7, -5, -4, 0, 2, 3, 7, 8, 12, 14, 15, 19]
  },
  nogi: {
    name: '乃木調子',
    desc: '四・六・九・斗を半音上げた近代調弦',
    off: [0, -7, -5, -3, 0, 2, 5, 7, 9, 12, 14, 17, 19]
  },
  kokin: {
    name: '古今調子',
    desc: '四・九を全音上げ、二を七と同音にした古雅な調弦',
    off: [0, 5, -5, -2, 0, 1, 5, 7, 10, 12, 13, 17, 19]
  },
  gaku: {
    name: '楽調子',
    desc: '雅楽の風情を伝える陽音階（四・九全音上げ、六・斗半音上げ）',
    off: [0, -7, -5, -2, 0, 2, 5, 7, 10, 12, 14, 17, 19]
  },
  iwato: {
    name: '岩戸調子',
    desc: '古典名曲「みだれ」等で用いられる深く幽玄な調弦',
    off: [0, -7, -6, -2, -1, 3, 5, 6, 10, 11, 15, 17, 18]
  },
  honkumoi: {
    name: '本雲井調子',
    desc: '雲井調子の変化形、独特の情緒を漂わせる名調子',
    off: [0, -7, -6, -3, 0, 1, 5, 6, 9, 12, 13, 17, 18]
  },
  hira_yon_up: {
    name: '平調子（四を一音上げる）',
    desc: '平調子より四を一音上げた調弦（荒城の月など、一＝D: D G A C D E♭ G A B♭ D E♭ G A）',
    off: [0, -7, -5, -2, 0, 1, 5, 7, 8, 12, 13, 17, 19]
  },
  juushichi_std: {
    name: '十七絃標準調弦',
    desc: '宮城道雄考案の十七絃標準調弦（低音C2〜D5）',
    off: [-24, -22, -20, -17, -15, -12, -10, -8, -5, -3, 0, 2, 4, 7, 9, 12, 14]
  },
  custom: {
    name: 'カスタム調弦',
    desc: '弦それぞれの音程を自由に設定',
    off: [0, -7, -5, -4, 0, 1, 5, 7, 8, 12, 13, 17, 19]
  }
};

export type LeftHandOrn = 'ato' | 'hanashi' | 'hikiiro' | 'tsuki' | 'yuri' | 'pizz' | 'keshi' | 'harm';
export type RightHandOrn =
  | 'sukui'
  | 'kaki'
  | 'hiki'
  | 'trem'
  | 'nagashi'
  | 'wari'
  | 'suri'
  | 'ren'
  | 'chirashi'
  | 'awase'
  | 'haya'
  | 'muko';

export const LEFT_HAND_ORNS: LeftHandOrn[] = ['ato', 'hanashi', 'hikiiro', 'tsuki', 'yuri', 'pizz', 'keshi', 'harm'];
export const RIGHT_HAND_ORNS: RightHandOrn[] = [
  'sukui',
  'kaki',
  'hiki',
  'trem',
  'nagashi',
  'wari',
  'suri',
  'ren',
  'chirashi',
  'awase',
  'haya',
  'muko'
];

export const ORN_MARKS: Record<LeftHandOrn | RightHandOrn, string> = {
  ato: 'ア',
  hanashi: '放',
  hikiiro: 'ヒ',
  tsuki: 'ツ',
  yuri: 'ユ',
  pizz: '＋',
  keshi: '消',
  harm: '◇',
  sukui: 'ス',
  kaki: '掻',
  hiki: '引',
  trem: '〰',
  nagashi: '流',
  wari: 'ワ',
  suri: '摺',
  ren: '連',
  chirashi: '散',
  awase: '合',
  haya: 'ハ',
  muko: '向'
};

export const ORN_LABELS: Record<string, { short: string; label: string; desc: string; key: string }> = {
  oshi1: { short: 'オ', label: '半音押し', desc: '左手で弦を押してから弾く（半音高）/ 正派「半」', key: 'Z' },
  oshi2: { short: 'ヲ', label: '全音押し', desc: '左手で弦を強く押してから弾く（全音高）/ 正派「全」', key: 'X' },
  ato: { short: 'ア', label: '後押し', desc: '弾いてから押し上げる（余韻が上がる）', key: 'Y' },
  hanashi: { short: '放', label: '押し放し', desc: '押した音で弾き、手を放して下げる', key: 'U' },
  hikiiro: { short: 'ヒ', label: '引き色', desc: '弾いた後に少し音を下げて戻す', key: 'I' },
  tsuki: { short: 'ツ', label: '突き色', desc: '弾いた直後に一瞬押してすぐ戻す', key: 'O' },
  yuri: { short: 'ユ', label: '揺り色', desc: '余韻を指で揺らす（ビブラート）', key: 'M' },
  pizz: { short: '＋', label: 'ピチカート', desc: '爪をつけない指肉（左手等）ではじく', key: 'P' },
  keshi: { short: '消', label: '消音（止め）', desc: '弾いた直後に手のひらや指で響きを止める', key: 'Q' },
  harm: { short: '◇', label: 'ハーモニクス', desc: '絃の中央を軽く触れて弾き、倍音を鳴らす（当り音）', key: 'W' },
  sukui: { short: 'ス', label: 'スクイ', desc: '裏爪で手前にすくい上げるように弾く', key: 'C' },
  kaki: { short: '掻', label: '掻き爪', desc: '中指・薬指等で隣の弦と連続して弾く', key: 'V' },
  hiki: { short: '引', label: '引き爪', desc: '手前へ連続して引く', key: 'B' },
  trem: { short: '〰', label: 'トレモロ', desc: '爪を細かく往復させて連続打弦', key: 'N' },
  nagashi: { short: '流', label: '流し爪', desc: '巾から順に滑らせてこの弦で止める', key: '/' },
  wari: { short: 'ワ', label: '割爪', desc: '親指と人差指で隣り合う弦を割るように弾く（正派の散らし）', key: 'G' },
  suri: { short: '摺', label: 'スリ爪', desc: '人差指と中指の爪裏で弦を擦る（風情の効果音）', key: 'H' },
  ren: { short: '連', label: '連引き', desc: '複数の弦を連続して滑らかに流し弾く（引連・裏連・ツレ）', key: 'J' },
  chirashi: { short: '散', label: '散らし爪', desc: '爪先で素早く弦を擦りつける', key: 'K' },
  awase: { short: '合', label: '合わせ爪', desc: '親指と中指で2本の絃を同時に挟み弾く', key: 'E' },
  haya: { short: 'ハ', label: '早爪', desc: '親指を連続して素早く打弦する（山田流等）', key: 'R' },
  muko: { short: '向', label: '向う弾き', desc: '山田流丸爪で絃を前方へ押し出すように弾く', key: 'T' }
};

export interface Slot {
  notes: number[]; // 0~12 or 0~16 index of string
  rest: boolean;
  tie: boolean;
  oshi: number; // 0=none, 1=half (オ/半), 2=whole (ヲ/全)
  ato?: boolean;
  hanashi?: boolean;
  hikiiro?: boolean;
  tsuki?: boolean;
  yuri?: boolean;
  pizz?: boolean;
  keshi?: boolean;
  harm?: boolean;
  sukui?: boolean;
  kaki?: boolean;
  hiki?: boolean;
  trem?: boolean;
  nagashi?: boolean;
  wari?: boolean;
  suri?: boolean;
  ren?: boolean;
  chirashi?: boolean;
  awase?: boolean;
  haya?: boolean;
  muko?: boolean;
  finger?: number; // 1=親指, 2=人差し指, 3=中指
  repeat1?: boolean; // 1拍繰り返し記号（〃）
  repeat2?: boolean; // 2拍繰り返し記号（く / 𝄥）
}

export type BeatSubDiv = 'equal' | '8_16_16' | '16_16_8';
export type InputDivType = 1 | 2 | 3 | 4 | '8_16_16' | '16_16_8';

export interface Beat {
  div: 1 | 2 | 3 | 4;
  slots: Slot[];
  lyrics?: string;
  subDiv?: BeatSubDiv;
}

export interface Measure {
  beats: Beat[];
}

export interface TuningConfig {
  preset: string;
  root: number; // MIDI number for 一 (default 62 = D4, for 17-string 36 = C2)
  custom: number[] | null;
}

export interface ViewSettings {
  numerals: 'kanji' | 'arabic';
  ruby: 'off' | 'doremi' | 'cde';
  layout: 'vertical' | 'horizontal';
  paper: 'portrait' | 'landscape';
  chart: 'off' | 'on';
  perLine: number;
  showLyrics: boolean;
  lyricsPosition?: 'right' | 'bottom'; // 歌詞の位置: 'right' (マスの右側に薄い列) | 'bottom' (マスの下)
  showKotoBoard: boolean;
  zoom: number;
  sixteenthLayout?: 'vertical' | 'grid'; // 16分音符の配置: 'vertical' (縦4段：8分音符より縦に小さく表示) | 'grid' (2x2横分割)
  fontStyle?: 'shippori' | 'kaisei' | 'yuji' | 'klee' | 'noto';
  schoolStyle?: 'standard' | 'seinha' | 'yamada' | 'ancient' | 'modern'; // 流派様式
}

export interface KotoScore {
  id?: string;
  app: 'koto-bunkafu';
  version: number;
  title: string;
  subtitle: string;
  composer: string;
  tempo: number;
  beatsPerMeasure: 2 | 3 | 4;
  stringCount?: 13 | 17; // 十三絃 または 十七絃
  tuning: TuningConfig;
  view: ViewSettings;
  measures: Measure[];
  updatedAt?: number;
}

export interface CursorPosition {
  m: number; // measure index
  b: number; // beat index
  s: number; // slot index
  low?: boolean; // clicking bottom half of quarter note
}

export function createNewSlot(): Slot {
  return {
    notes: [],
    rest: false,
    tie: false,
    oshi: 0,
    ato: false,
    hanashi: false,
    hikiiro: false,
    tsuki: false,
    yuri: false,
    pizz: false,
    keshi: false,
    harm: false,
    sukui: false,
    kaki: false,
    hiki: false,
    trem: false,
    nagashi: false,
    wari: false,
    suri: false,
    ren: false,
    chirashi: false,
    awase: false,
    haya: false,
    muko: false,
    repeat1: false,
    repeat2: false
  };
}

export function createNewBeat(div: 1 | 2 | 3 | 4 = 2, subDiv?: BeatSubDiv): Beat {
  const count = subDiv === '8_16_16' || subDiv === '16_16_8' ? 3 : div;
  return {
    div,
    slots: Array.from({ length: count }, () => createNewSlot()),
    lyrics: '',
    subDiv
  };
}

export function createNewMeasure(beatsPerMeasure: number = 4): Measure {
  return {
    beats: Array.from({ length: beatsPerMeasure }, () => createNewBeat(2))
  };
}

export function getDefaultView(): ViewSettings {
  return {
    numerals: 'kanji',
    ruby: 'off',
    layout: 'vertical',
    paper: 'portrait',
    chart: 'on',
    perLine: 4,
    showLyrics: false,
    lyricsPosition: 'right',
    showKotoBoard: false,
    zoom: 1,
    schoolStyle: 'standard'
  };
}

export function createEmptyScore(stringCount: 13 | 17 = 13): KotoScore {
  return {
    app: 'koto-bunkafu',
    version: 2,
    title: '無題',
    subtitle: '',
    composer: '',
    tempo: 80,
    beatsPerMeasure: 4,
    stringCount,
    tuning: {
      preset: stringCount === 17 ? 'juushichi_std' : 'hira',
      root: stringCount === 17 ? 36 : 62,
      custom: null
    },
    view: getDefaultView(),
    measures: Array.from({ length: 8 }, () => createNewMeasure(4)),
    updatedAt: Date.now()
  };
}

export const pc = (m: number) => ((Math.round(m) % 12) + 12) % 12;

export const noteName = (m: number, oct = true) =>
  NOTE_CDE[pc(m)] + (oct ? String(Math.floor(Math.round(m) / 12) - 1) : '');

export const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
export const hzToMidi = (f: number) => 69 + 12 * Math.log2(f / 440);
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function getPitches(score: KotoScore): number[] {
  const t = score.tuning;
  const count = score.stringCount === 17 ? 17 : 13;
  if (t.preset === 'custom' && t.custom && t.custom.length === count) {
    return t.custom.slice();
  }
  const preset = TUNING_PRESETS[t.preset] || (count === 17 ? TUNING_PRESETS.juushichi_std : TUNING_PRESETS.hira);
  const pitches = preset.off.map(o => t.root + o);
  if (pitches.length < count) {
    // Fill remaining with octave extensions
    while (pitches.length < count) {
      const last = pitches[pitches.length - 1];
      pitches.push(last + 2);
    }
  }
  return pitches.slice(0, count);
}

export function getTuningLabel(score: KotoScore): string {
  const t = score.tuning || { preset: 'hira', root: 62, custom: null };
  if (t.preset === 'custom') return 'カスタム調弦';
  const presetName = TUNING_PRESETS[t.preset]?.name || '平調子';
  return `${presetName}（${RITSU_NAMES[pc(t.root)]} ${noteName(t.root, false)}）`;
}

export function normalizeScore(raw: any, fallback?: KotoScore): KotoScore {
  const base = fallback || createEmptyScore();
  if (!raw || typeof raw !== 'object') return base;

  const stringCount: 13 | 17 = raw.stringCount === 17 ? 17 : 13;
  const validPreset = raw.tuning?.preset && TUNING_PRESETS[raw.tuning.preset] ? raw.tuning.preset : (stringCount === 17 ? 'juushichi_std' : 'hira');
  const root = typeof raw.tuning?.root === 'number' && !isNaN(raw.tuning.root) ? clamp(raw.tuning.root, 24, 96) : (stringCount === 17 ? 36 : 62);
  const custom = Array.isArray(raw.tuning?.custom) && raw.tuning.custom.length === stringCount ? raw.tuning.custom.map((p: any) => Number(p) || 60) : null;

  const v = raw.view || {};
  const view: ViewSettings = {
    numerals: v.numerals === 'arabic' ? 'arabic' : 'kanji',
    ruby: ['off', 'doremi', 'cde'].includes(v.ruby) ? v.ruby : 'off',
    layout: v.layout === 'horizontal' ? 'horizontal' : 'vertical',
    paper: v.paper === 'landscape' ? 'landscape' : 'portrait',
    chart: v.chart === 'off' ? 'off' : 'on',
    perLine: typeof v.perLine === 'number' && v.perLine > 0 ? clamp(Math.round(v.perLine), 1, 8) : 4,
    showLyrics: !!v.showLyrics,
    lyricsPosition: v.lyricsPosition === 'bottom' ? 'bottom' : 'right',
    showKotoBoard: !!v.showKotoBoard,
    zoom: typeof v.zoom === 'number' && !isNaN(v.zoom) && v.zoom >= 0.3 ? clamp(v.zoom, 0.4, 2.0) : 1.0,
    fontStyle: ['shippori', 'kaisei', 'yuji', 'klee', 'noto'].includes(v.fontStyle) ? v.fontStyle : 'shippori',
    schoolStyle: ['standard', 'seinha', 'yamada', 'ancient', 'modern'].includes(v.schoolStyle) ? v.schoolStyle : 'standard'
  };

  const beatsPerMeasure = [2, 3, 4].includes(raw.beatsPerMeasure) ? raw.beatsPerMeasure : 4;
  const maxStringIndex = stringCount - 1;

  const measures = Array.isArray(raw.measures) && raw.measures.length > 0 ? raw.measures.map((m: any) => {
    const rawBeats = Array.isArray(m?.beats) ? m.beats : [];
    const beats: Beat[] = [];
    for (let bIdx = 0; bIdx < beatsPerMeasure; bIdx++) {
      const b = rawBeats[bIdx];
      let div = [1, 2, 3, 4].includes(b?.div) ? b.div : 2;
      const subDiv = ['equal', '8_16_16', '16_16_8'].includes(b?.subDiv) ? b.subDiv : undefined;
      const rawSlots = Array.isArray(b?.slots) ? b.slots : [];
      // If beat was div 1 and has no notes, rest, or tie, normalize to div 2 (8th-note units)
      if (div === 1 && rawSlots.length <= 1 && !subDiv) {
        const s0 = rawSlots[0];
        const isEmpty = !s0 || (!s0.notes?.length && !s0.rest && !s0.tie && !s0.repeat1 && !s0.repeat2);
        if (isEmpty) {
          div = 2;
        }
      }
      const slotCount = subDiv === '8_16_16' || subDiv === '16_16_8' ? 3 : div;
      const slots: Slot[] = [];
      for (let sIdx = 0; sIdx < slotCount; sIdx++) {
        const sl = rawSlots[sIdx];
        if (sl && typeof sl === 'object') {
          slots.push({
            notes: Array.isArray(sl.notes) ? sl.notes.filter((n: any) => typeof n === 'number' && n >= 0 && n <= maxStringIndex) : [],
            rest: !!sl.rest,
            tie: !!sl.tie,
            oshi: [0, 1, 2].includes(sl.oshi) ? sl.oshi : 0,
            ato: !!sl.ato,
            hanashi: !!sl.hanashi,
            hikiiro: !!sl.hikiiro,
            tsuki: !!sl.tsuki,
            yuri: !!sl.yuri,
            pizz: !!sl.pizz,
            keshi: !!sl.keshi,
            harm: !!sl.harm,
            sukui: !!sl.sukui,
            kaki: !!sl.kaki,
            hiki: !!sl.hiki,
            trem: !!sl.trem,
            nagashi: !!sl.nagashi,
            wari: !!sl.wari,
            suri: !!sl.suri,
            ren: !!sl.ren,
            chirashi: !!sl.chirashi,
            awase: !!sl.awase,
            haya: !!sl.haya,
            muko: !!sl.muko,
            finger: typeof sl.finger === 'number' && [1, 2, 3].includes(sl.finger) ? sl.finger : undefined,
            repeat1: !!sl.repeat1,
            repeat2: !!sl.repeat2
          });
        } else {
          slots.push(createNewSlot());
        }
      }
      beats.push({
        div,
        slots,
        lyrics: typeof b?.lyrics === 'string' ? b.lyrics : '',
        subDiv
      });
    }
    return { beats };
  }) : base.measures;

  return {
    id: typeof raw.id === 'string' ? raw.id : base.id,
    app: 'koto-bunkafu',
    version: 2,
    title: typeof raw.title === 'string' ? raw.title : '無題',
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : '',
    composer: typeof raw.composer === 'string' ? raw.composer : '',
    tempo: typeof raw.tempo === 'number' && !isNaN(raw.tempo) && raw.tempo >= 20 ? clamp(raw.tempo, 20, 260) : 80,
    beatsPerMeasure,
    stringCount,
    tuning: {
      preset: validPreset,
      root,
      custom
    },
    view,
    measures,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now()
  };
}
