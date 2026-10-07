/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const KANJI_STRINGS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '斗', '為', '巾'] as const;
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
  custom: {
    name: 'カスタム調弦',
    desc: '13本それぞれの音程を自由に設定',
    off: [0, -7, -5, -4, 0, 1, 5, 7, 8, 12, 13, 17, 19]
  }
};

export type LeftHandOrn = 'ato' | 'hanashi' | 'hikiiro' | 'tsuki' | 'yuri';
export type RightHandOrn = 'sukui' | 'kaki' | 'hiki' | 'trem' | 'nagashi';

export const LEFT_HAND_ORNS: LeftHandOrn[] = ['ato', 'hanashi', 'hikiiro', 'tsuki', 'yuri'];
export const RIGHT_HAND_ORNS: RightHandOrn[] = ['sukui', 'kaki', 'hiki', 'trem', 'nagashi'];

export const ORN_MARKS: Record<LeftHandOrn | RightHandOrn, string> = {
  ato: 'ア',
  hanashi: 'ハ',
  hikiiro: 'ヒ',
  tsuki: 'ツ',
  yuri: 'ユ',
  sukui: 'ス',
  kaki: '掻',
  hiki: '引',
  trem: '〰',
  nagashi: '流'
};

export const ORN_LABELS: Record<string, { short: string; label: string; desc: string; key: string }> = {
  oshi1: { short: 'オ', label: '半音押し', desc: '左手で弦を押してから弾く（半音高）', key: 'Z' },
  oshi2: { short: 'ヲ', label: '全音押し', desc: '左手で弦を強く押してから弾く（全音高）', key: 'X' },
  ato: { short: 'ア', label: '後押し', desc: '弾いてから押し上げる（余韻が上がる）', key: 'Y' },
  hanashi: { short: 'ハ', label: '押し放し', desc: '押した音で弾き、手を放して下げる', key: 'U' },
  hikiiro: { short: 'ヒ', label: '引き色', desc: '弾いた後に少し音を下げて戻す', key: 'I' },
  tsuki: { short: 'ツ', label: '突き色', desc: '弾いた直後に一瞬押してすぐ戻す', key: 'O' },
  yuri: { short: 'ユ', label: '揺り色', desc: '余韻を指で揺らす（ビブラート）', key: 'M' },
  sukui: { short: 'ス', label: 'スクイ', desc: '裏爪で手前にすくい上げるように弾く', key: 'C' },
  kaki: { short: '掻', label: '掻き爪', desc: '中指・薬指等で隣の弦と連続して弾く', key: 'V' },
  hiki: { short: '引', label: '引き爪', desc: '手前へ連続して引く', key: 'B' },
  trem: { short: '〰', label: 'トレモロ', desc: '爪を細かく往復させて連続打弦', key: 'N' },
  nagashi: { short: '流', label: '流し爪', desc: '巾から順に滑らせてこの弦で止める', key: '/' }
};

export interface Slot {
  notes: number[]; // 0~12 index of string (0=一 ... 12=巾)
  rest: boolean;
  tie: boolean;
  oshi: number; // 0=none, 1=half (オ), 2=whole (ヲ)
  ato?: boolean;
  hanashi?: boolean;
  hikiiro?: boolean;
  tsuki?: boolean;
  yuri?: boolean;
  sukui?: boolean;
  kaki?: boolean;
  hiki?: boolean;
  trem?: boolean;
  nagashi?: boolean;
}

export interface Beat {
  div: 1 | 2 | 3 | 4;
  slots: Slot[];
  lyrics?: string;
}

export interface Measure {
  beats: Beat[];
}

export interface TuningConfig {
  preset: string;
  root: number; // MIDI number for 一 (default 62 = D4)
  custom: number[] | null; // 13 pitches if custom
}

export interface ViewSettings {
  numerals: 'kanji' | 'arabic';
  ruby: 'off' | 'doremi' | 'cde';
  layout: 'vertical' | 'horizontal';
  paper: 'portrait' | 'landscape';
  chart: 'off' | 'on';
  perLine: number;
  showLyrics: boolean;
  showKotoBoard: boolean;
  zoom: number;
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
    sukui: false,
    kaki: false,
    hiki: false,
    trem: false,
    nagashi: false
  };
}

export function createNewBeat(div: 1 | 2 | 3 | 4 = 1): Beat {
  return {
    div,
    slots: Array.from({ length: div }, () => createNewSlot()),
    lyrics: ''
  };
}

export function createNewMeasure(beatsPerMeasure: number = 4): Measure {
  return {
    beats: Array.from({ length: beatsPerMeasure }, () => createNewBeat(1))
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
    showKotoBoard: false,
    zoom: 1
  };
}

export function createEmptyScore(): KotoScore {
  return {
    app: 'koto-bunkafu',
    version: 2,
    title: '無題',
    subtitle: '',
    composer: '',
    tempo: 80,
    beatsPerMeasure: 4,
    tuning: { preset: 'hira', root: 62, custom: null },
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
  if (t.preset === 'custom' && t.custom && t.custom.length === 13) {
    return t.custom.slice();
  }
  const preset = TUNING_PRESETS[t.preset] || TUNING_PRESETS.hira;
  return preset.off.map(o => t.root + o);
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

  const validPreset = raw.tuning?.preset && TUNING_PRESETS[raw.tuning.preset] ? raw.tuning.preset : 'hira';
  const root = typeof raw.tuning?.root === 'number' && !isNaN(raw.tuning.root) ? clamp(raw.tuning.root, 36, 96) : 62;
  const custom = Array.isArray(raw.tuning?.custom) && raw.tuning.custom.length === 13 ? raw.tuning.custom.map((p: any) => Number(p) || 60) : null;

  const defaultV = getDefaultView();
  const v = raw.view || {};
  const view: ViewSettings = {
    numerals: v.numerals === 'arabic' ? 'arabic' : 'kanji',
    ruby: ['off', 'doremi', 'cde'].includes(v.ruby) ? v.ruby : 'off',
    layout: v.layout === 'horizontal' ? 'horizontal' : 'vertical',
    paper: v.paper === 'landscape' ? 'landscape' : 'portrait',
    chart: v.chart === 'off' ? 'off' : 'on',
    perLine: typeof v.perLine === 'number' && v.perLine > 0 ? clamp(Math.round(v.perLine), 1, 8) : 4,
    showLyrics: !!v.showLyrics,
    showKotoBoard: !!v.showKotoBoard,
    zoom: typeof v.zoom === 'number' && !isNaN(v.zoom) && v.zoom >= 0.3 ? clamp(v.zoom, 0.4, 2.0) : 1.0
  };

  const beatsPerMeasure = [2, 3, 4].includes(raw.beatsPerMeasure) ? raw.beatsPerMeasure : 4;

  const measures = Array.isArray(raw.measures) && raw.measures.length > 0 ? raw.measures.map((m: any) => {
    const rawBeats = Array.isArray(m?.beats) ? m.beats : [];
    const beats: Beat[] = [];
    for (let bIdx = 0; bIdx < beatsPerMeasure; bIdx++) {
      const b = rawBeats[bIdx];
      const div = [1, 2, 3, 4].includes(b?.div) ? b.div : 1;
      const rawSlots = Array.isArray(b?.slots) ? b.slots : [];
      const slots: Slot[] = [];
      for (let sIdx = 0; sIdx < div; sIdx++) {
        const sl = rawSlots[sIdx];
        if (sl && typeof sl === 'object') {
          slots.push({
            notes: Array.isArray(sl.notes) ? sl.notes.filter((n: any) => typeof n === 'number' && n >= 0 && n <= 12) : [],
            rest: !!sl.rest,
            tie: !!sl.tie,
            oshi: [0, 1, 2].includes(sl.oshi) ? sl.oshi : 0,
            ato: !!sl.ato,
            hanashi: !!sl.hanashi,
            hikiiro: !!sl.hikiiro,
            tsuki: !!sl.tsuki,
            yuri: !!sl.yuri,
            sukui: !!sl.sukui,
            kaki: !!sl.kaki,
            hiki: !!sl.hiki,
            trem: !!sl.trem,
            nagashi: !!sl.nagashi
          });
        } else {
          slots.push(createNewSlot());
        }
      }
      beats.push({
        div,
        slots,
        lyrics: typeof b?.lyrics === 'string' ? b.lyrics : ''
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
