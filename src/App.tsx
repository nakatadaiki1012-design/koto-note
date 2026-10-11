/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import {
  KotoScore,
  Slot,
  CursorPosition,
  getStringNames,
  KEYBOARD_ROW1,
  KEYBOARD_HOME,
  createNewSlot,
  createNewBeat,
  createNewMeasure,
  createEmptyScore,
  normalizeScore,
  getPitches,
  clamp,
  TEMPO_MIN,
  TEMPO_MAX,
  setBeatsPerMeasure,
  LeftHandOrn,
  RightHandOrn,
  LEFT_HAND_ORNS,
  RIGHT_HAND_ORNS,
  InputDivType
} from './types/koto';
import { createSakuraScore } from './data/presetScores';
import { kotoSynth } from './audio/kotoSynth';
import { ScorePlayer, PlayerSettings, previewSlot as previewSlotAudio } from './audio/player';
import { slotOffsetInBeat } from './audio/timeline';
import { Header } from './components/Header';
import { Dock } from './components/Dock';
import { MeasureNavigator } from './components/MeasureNavigator';
import { VirtualKoto } from './components/VirtualKoto';
import { ScoreSheetVertical } from './components/ScoreSheetVertical';
import { ScoreSheetHorizontal } from './components/ScoreSheetHorizontal';
import { TuningModal } from './components/TuningModal';
import { ScoreLibraryModal } from './components/ScoreLibraryModal';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';
import { PracticeModeOverlay } from './components/PracticeModeOverlay';
import { NewScoreWizardModal } from './components/NewScoreWizardModal';

const DRAFT_STORAGE_KEY = 'kotoBunkafu.draft.v8';
// 以前の版の下書き。新しい版の下書きが無いときだけ読み込む
const LEGACY_DRAFT_KEYS = ['kotoBunkafu.draft.v7'];

function loadDraft(): KotoScore {
  try {
    for (const key of [DRAFT_STORAGE_KEY, ...LEGACY_DRAFT_KEYS]) {
      const saved = localStorage.getItem(key);
      if (saved) return normalizeScore(JSON.parse(saved), createSakuraScore());
    }
  } catch {
    // 壊れた下書きは無視して見本から始める
  }
  return createSakuraScore();
}

const isEmptySlot = (sl: Slot) => !sl.notes.length && !sl.rest && !sl.tie && !sl.repeat1 && !sl.repeat2;

/** マスの中身（音・休符・延ばし・奏法記号・くり返し記号）をすべて消す */
function resetSlot(slot: Slot) {
  slot.notes = [];
  slot.rest = false;
  slot.tie = false;
  slot.oshi = 0;
  slot.finger = undefined;
  slot.repeat1 = false;
  slot.repeat2 = false;
  LEFT_HAND_ORNS.forEach(k => (slot[k] = false));
  RIGHT_HAND_ORNS.forEach(k => (slot[k] = false));
}

/** 次のマスの位置を返す。曲の最後を越えたら、空の小節を足す。 */
function stepForward(draft: KotoScore, m: number, b: number, s: number): CursorPosition {
  const beat = draft.measures[m]?.beats[b];
  const count = beat?.slots?.length || 1;
  let nS = s + 1;
  let nB = b;
  let nM = m;
  if (nS >= count) {
    nS = 0;
    nB++;
    if (nB >= draft.beatsPerMeasure) {
      nB = 0;
      nM++;
      if (nM >= draft.measures.length) {
        draft.measures.push(createNewMeasure(draft.beatsPerMeasure));
      }
    }
  }
  return { m: nM, b: nB, s: nS, low: false };
}

// 印刷のときは、選択枠・カーソル・再生位置の表示を消す
const NO_CURSOR: CursorPosition = { m: -1, b: -1, s: -1, low: false };
const NO_KEYS = new Set<string>();

export interface CopiedSlotItem {
  slot: Slot;
  sourceDiv: 1 | 2 | 3 | 4;
}

export default function App() {
  // Score state (defaults to さくらさくら)
  const [score, setScore] = useState<KotoScore>(loadDraft);
  // 最新の譜面（イベント処理や再生エンジンが古い値を見ないように）
  const scoreRef = useRef(score);
  scoreRef.current = score;

  // Score container ref for scrolling
  const scoreContainerRef = useRef<HTMLDivElement>(null);

  // Undo / Redo history
  const undoStackRef = useRef<KotoScore[]>([]);
  const redoStackRef = useRef<KotoScore[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);

  // Editing cursor
  const [cursor, setCursor] = useState<CursorPosition>({ m: 0, b: 0, s: 0, low: false });
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
  const [selAnchor, setSelAnchor] = useState<number | null>(null);
  const [slotAnchor, setSlotAnchor] = useState<{ m: number; b: number; s: number } | null>(null);
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<Set<string>>(new Set());
  const [isDraggingSlots, setIsDraggingSlots] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [inputDiv, setInputDiv] = useState<InputDivType>(2);
  const [isChordMode, setIsChordMode] = useState(false);
  const [lastEnteredSlot, setLastEnteredSlot] = useState<{ m: number; b: number; s: number } | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayKey, setCurrentPlayKey] = useState<string | null>(null);
  const [loopActive, setLoopActive] = useState(false);
  const [loopRange, setLoopRange] = useState<[number, number]>([1, score.measures.length]);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [countIn, setCountIn] = useState(false);
  const [metronome, setMetronome] = useState(false);

  // Modals
  const [isTuningOpen, setIsTuningOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [isNewScoreWizardOpen, setIsNewScoreWizardOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    // ブラウザのメニューや Ctrl+P からの印刷でも、印刷用の見た目に切り替える
    const before = () => flushSync(() => setIsPrinting(true));
    const after = () => setIsPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  // Clipboard for measures & slots (Excel-like multi-cell clipboard)
  const clipboardRef = useRef<any[] | null>(null);
  const slotClipboardRef = useRef<CopiedSlotItem[] | null>(null);

  const showToast = useCallback((msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast(curr => (curr === msg ? null : curr));
    }, 2200);
  }, []);

  const handlePrint = useCallback(() => {
    const originalTitle = document.title;
    document.title = score.title ? `${score.title} - 琴譜` : '琴譜';
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  }, [score.title]);

  // Global mouseup listener for drag selection ending outside sheet
  useEffect(() => {
    const onGlobalMouseUp = () => setIsDraggingSlots(false);
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, []);

  // 印刷する用紙の向き（A4 縦/横）を、印刷ダイアログの初期値として CSS で伝える
  useEffect(() => {
    let el = document.getElementById('print-page-style') as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = 'print-page-style';
      document.head.appendChild(el);
    }
    el.textContent = `@page { size: A4 ${score.view.paper === 'landscape' ? 'landscape' : 'portrait'}; margin: 10mm; }`;
  }, [score.view.paper]);

  // 自動保存（入力が落ち着いてから保存。タブを閉じる・隠すときは即保存）
  const saveWarnedRef = useRef(false);
  // 未保存の変更があるときだけ保存する（何も触っていない別タブが、新しい下書きを古い内容で上書きしないように）
  const dirtyRef = useRef(false);
  const saveDraft = useCallback(() => {
    if (!dirtyRef.current) return;
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(scoreRef.current));
      dirtyRef.current = false;
    } catch {
      if (!saveWarnedRef.current) {
        saveWarnedRef.current = true;
        showToast('このブラウザでは自動保存できません。「保存」からJSONを書き出してください');
      }
    }
  }, [showToast]);

  const firstScoreRef = useRef(true);
  useEffect(() => {
    if (firstScoreRef.current) {
      firstScoreRef.current = false;
      return;
    }
    dirtyRef.current = true;
    const id = setTimeout(saveDraft, 300);
    return () => clearTimeout(id);
  }, [score, saveDraft]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') saveDraft();
    };
    window.addEventListener('pagehide', saveDraft);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', saveDraft);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [saveDraft]);

  // Initial scroll alignment to the right for vertical Bunkafu
  useEffect(() => {
    if (score.view.layout === 'vertical' && scoreContainerRef.current) {
      setTimeout(() => {
        if (scoreContainerRef.current) {
          scoreContainerRef.current.scrollLeft = scoreContainerRef.current.scrollWidth;
        }
      }, 100);
    }
  }, [score.view.layout]);

  // 元に戻す用の履歴を積む
  const pushUndo = useCallback((prevScore: KotoScore) => {
    undoStackRef.current.push(JSON.parse(JSON.stringify(prevScore)));
    if (undoStackRef.current.length > 100) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setHistoryVersion(v => v + 1);
  }, []);

  // 同じ種類の連続した編集（曲名の入力など）を、元に戻す1回分にまとめるための記録
  const lastHistoryRef = useRef<{ key: string; time: number } | null>(null);

  /**
   * 譜面を書き換える。
   * history: true=元に戻せる / false=元に戻す対象にしない（拡大・表示設定など） /
   *          文字列=同じ文字列の編集が1.5秒以内に続くときは1回分にまとめる
   */
  const mutateScore = useCallback(
    (updater: (draft: KotoScore) => void, opts: { history?: boolean | string } = {}) => {
      const prev = scoreRef.current;
      const next = JSON.parse(JSON.stringify(prev)) as KotoScore;
      updater(next);
      const h = opts.history ?? true;
      if (h !== false) {
        const now = Date.now();
        const last = lastHistoryRef.current;
        const merge = typeof h === 'string' && last && last.key === h && now - last.time < 1500;
        if (!merge) pushUndo(prev);
        lastHistoryRef.current = typeof h === 'string' ? { key: h, time: now } : null;
      }
      scoreRef.current = next;
      setScore(next);
    },
    [pushUndo]
  );

  /** 別の譜面に丸ごと入れ替える（楽曲集・読み込み・新規作成） */
  const replaceScore = useCallback(
    (next: KotoScore, opts: { resetHistory?: boolean } = {}) => {
      if (opts.resetHistory) {
        undoStackRef.current = [];
        redoStackRef.current = [];
        setHistoryVersion(v => v + 1);
      } else {
        pushUndo(scoreRef.current);
      }
      lastHistoryRef.current = null;
      scoreRef.current = next;
      setScore(next);
      setCursor({ m: 0, b: 0, s: 0, low: false });
      setSelectedSlotKeys(new Set());
      setSelectedRange(null);
      setSelAnchor(null);
      setSlotAnchor(null);
      setLastEnteredSlot(null);
      setLoopRange([1, next.measures.length]);
    },
    [pushUndo]
  );

  const handleCreateScoreFromWizard = useCallback(
    (newScore: KotoScore) => {
      replaceScore(newScore, { resetHistory: true });
      showToast(`「${newScore.title || '無題'}」を作成しました`);
    },
    [replaceScore, showToast]
  );

  const handleUndo = useCallback(() => {
    if (!undoStackRef.current.length) return;
    const prev = undoStackRef.current.pop()!;
    redoStackRef.current.push(JSON.parse(JSON.stringify(scoreRef.current)));
    lastHistoryRef.current = null;
    scoreRef.current = prev;
    setScore(prev);
    setHistoryVersion(v => v + 1);
  }, []);

  const handleRedo = useCallback(() => {
    if (!redoStackRef.current.length) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(JSON.parse(JSON.stringify(scoreRef.current)));
    lastHistoryRef.current = null;
    scoreRef.current = next;
    setScore(next);
    setHistoryVersion(v => v + 1);
  }, []);

  // Fit-all overview mode state
  const isFitAll = score.view.zoom <= 0.72;

  const handleToggleFitAll = useCallback(() => {
    mutateScore(
      d => {
        d.view.zoom = d.view.zoom <= 0.72 ? 1.0 : 0.58;
      },
      { history: false }
    );
  }, [mutateScore]);

  const handleSetZoom100 = useCallback(() => {
    mutateScore(
      d => {
        d.view.zoom = 1.0;
      },
      { history: false }
    );
  }, [mutateScore]);

  // Touch gesture handling: Swipe between measures, Double-tap to toggle zoom, Pinch to zoom
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    lastTapTime: number;
    lastTapX: number;
    lastTapY: number;
    initialDistance: number;
    initialZoom: number;
    isPinching: boolean;
  }>({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
    initialDistance: 0,
    initialZoom: 1,
    isPinching: false
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = performance.now();
      const lastTap = touchStateRef.current.lastTapTime;
      touchStateRef.current.startX = touch.clientX;
      touchStateRef.current.startY = touch.clientY;
      touchStateRef.current.startTime = now;
      touchStateRef.current.isPinching = false;

      // ダブルタップ（320ミリ秒以内・ほぼ同じ場所）で「全体表示 / 100%」を切り替える。
      // 別々のマスを続けてタップして入力しているときに拡大縮小が起きないよう、位置が離れていれば対象外にする。
      const near =
        Math.hypot(touch.clientX - touchStateRef.current.lastTapX, touch.clientY - touchStateRef.current.lastTapY) < 24;
      if (now - lastTap < 320 && near) {
        handleToggleFitAll();
        touchStateRef.current.lastTapTime = 0;
      } else {
        touchStateRef.current.lastTapTime = now;
        touchStateRef.current.lastTapX = touch.clientX;
        touchStateRef.current.lastTapY = touch.clientY;
      }
    } else if (e.touches.length === 2) {
      // Pinch start
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStateRef.current.initialDistance = dist;
      touchStateRef.current.initialZoom = score.view.zoom;
      touchStateRef.current.isPinching = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStateRef.current.isPinching) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / (touchStateRef.current.initialDistance || 1);
      const newZoom = clamp(Math.round(touchStateRef.current.initialZoom * ratio * 100) / 100, 0.45, 1.5);
      mutateScore(
        d => {
          d.view.zoom = newZoom;
        },
        { history: false }
      );
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStateRef.current.isPinching) {
      touchStateRef.current.isPinching = false;
      return;
    }

    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStateRef.current.startX;
      const deltaY = touch.clientY - touchStateRef.current.startY;
      const elapsed = performance.now() - touchStateRef.current.startTime;

      // Horizontal swipe gesture detection
      if (Math.abs(deltaX) > 55 && Math.abs(deltaY) < 45 && elapsed < 400) {
        const v = score.view.layout === 'vertical';
        const step = score.view.perLine || 2;
        if (v) {
          // Vertical layout: right to left reading
          // Finger moves left (deltaX < 0) -> advance to later measures (to the left)
          if (deltaX < 0) {
            setCursor(prev => ({
              ...prev,
              m: Math.min(score.measures.length - 1, prev.m + step)
            }));
          } else {
            // Finger moves right (deltaX > 0) -> retreat to earlier measures (to the right)
            setCursor(prev => ({
              ...prev,
              m: Math.max(0, prev.m - step)
            }));
          }
        } else {
          // Horizontal layout
          if (deltaX < 0) {
            setCursor(prev => ({
              ...prev,
              m: Math.min(score.measures.length - 1, prev.m + step)
            }));
          } else {
            setCursor(prev => ({
              ...prev,
              m: Math.max(0, prev.m - step)
            }));
          }
        }
      }
    }
  };

  // 再生エンジン（譜面・速さ・くり返し範囲が変わったら、再生中でも今の位置から反映する）
  const settingsRef = useRef<PlayerSettings>({ speed, countIn, metronome, loop: null });
  settingsRef.current = { speed, countIn, metronome, loop: loopActive ? loopRange : null };

  const playerRef = useRef<ScorePlayer | null>(null);
  if (!playerRef.current) {
    playerRef.current = new ScorePlayer({
      getScore: () => scoreRef.current,
      getSettings: () => settingsRef.current,
      onHighlight: item => setCurrentPlayKey(item ? item.key : null),
      onStateChange: state => setIsPlaying(state === 'playing')
    });
  }
  const player = playerRef.current;

  useEffect(() => {
    player.refresh();
  }, [score, speed, loopActive, loopRange, metronome, player]);

  useEffect(() => () => player.stop(), [player]);

  const stopPlayback = useCallback(() => {
    player.stop();
  }, [player]);

  const startPlayback = useCallback(
    (fromBeat: number = 0) => {
      player.start(fromBeat);
    },
    [player]
  );

  /** カーソルのあるマスの、曲の頭からの位置（拍） */
  const cursorBeatPos = useCallback(() => {
    const sc = scoreRef.current;
    const beat = sc.measures[cursor.m]?.beats[cursor.b];
    const inner = beat ? (cursor.low ? 0.5 : slotOffsetInBeat(beat, Math.min(cursor.s, beat.slots.length - 1))) : 0;
    return cursor.m * sc.beatsPerMeasure + cursor.b + inner;
  }, [cursor]);

  // 再生中に押すと一時停止（カーソルは止まった位置へ）。止まっているときは、カーソルの位置から再生
  const togglePlay = useCallback(() => {
    if (player.playing) {
      const it = player.lastItem;
      player.pause();
      if (it) setCursor({ m: it.m, b: it.b, s: it.s, low: false });
    } else {
      player.start(cursorBeatPos());
    }
  }, [player, cursorBeatPos]);

  const previewSlot = useCallback((sl: any) => {
    previewSlotAudio(sl, scoreRef.current);
  }, []);

  // Step backward / forward for easy thumb navigation
  const handlePrevSlot = useCallback(() => {
    setCursor(prev => {
      let m = prev.m;
      let b = prev.b;
      let s = prev.s - 1;
      if (s < 0) {
        b--;
        if (b < 0) {
          m = Math.max(0, m - 1);
          b = score.beatsPerMeasure - 1;
        }
        const prevBeat = score.measures[m]?.beats[b] || { div: 1 };
        s = (prevBeat.slots?.length || prevBeat.div) - 1;
      }
      return { m, b, s, low: false };
    });
  }, [score]);

  const handleNextSlot = useCallback(() => {
    setCursor(prev => {
      let m = prev.m;
      let b = prev.b;
      let s = prev.s + 1;
      const beat = score.measures[m]?.beats[b] || { div: 1 };
      const slotCount = beat.slots?.length || beat.div;
      if (s >= slotCount) {
        s = 0;
        b++;
        if (b >= score.beatsPerMeasure) {
          b = 0;
          m = Math.min(score.measures.length - 1, m + 1);
        }
      }
      return { m, b, s, low: false };
    });
  }, [score]);

  // Note entry: Pluck string and input into current slot
  const inputString = useCallback(
    (stringIndex: number, forceChord?: boolean) => {
      const sc = scoreRef.current;
      if (stringIndex < 0 || stringIndex >= (sc.stringCount === 17 ? 17 : 13)) return;
      const pitches = getPitches(sc);
      kotoSynth.pluck(stringIndex, pitches[stringIndex], 0, 0.85);

      const chord = forceChord !== undefined ? forceChord : isChordMode;

      mutateScore(draft => {
        const m = cursor.m;
        const b = cursor.b;
        let s = cursor.s;

        while (m >= draft.measures.length) {
          draft.measures.push(createNewMeasure(draft.beatsPerMeasure));
        }

        const beat = draft.measures[m].beats[b];
        if (!beat) return;

        if (cursor.low && beat.div === 1) {
          beat.div = 2;
          beat.slots = [beat.slots[0], createNewSlot()];
          s = 1;
        }

        // 拍がまるごと空のときだけ、選んでいる長さ（8分・3連など）に整える。
        // 一部でも音が入っている拍は作り替えない（他のマスの音が消えるため）。
        if (s === 0 && beat.slots.every(isEmptySlot)) {
          if (inputDiv === '8_16_16' || inputDiv === '16_16_8') {
            if (beat.subDiv !== inputDiv) {
              beat.div = 3;
              beat.subDiv = inputDiv;
              beat.slots = Array.from({ length: 3 }, () => createNewSlot());
            }
          } else if (beat.div !== inputDiv || beat.subDiv === '8_16_16' || beat.subDiv === '16_16_8') {
            beat.div = inputDiv;
            beat.subDiv = inputDiv === 3 ? 'equal' : undefined;
            beat.slots = Array.from({ length: inputDiv }, () => createNewSlot());
          }
        }

        const slot = beat.slots[s];
        if (!slot) return;
        slot.rest = false;
        slot.tie = false;
        slot.repeat1 = false;
        slot.repeat2 = false;

        if (chord) {
          if (slot.notes.includes(stringIndex)) {
            slot.notes = slot.notes.filter(n => n !== stringIndex);
          } else {
            slot.notes = [...slot.notes, stringIndex].sort((x, y) => x - y);
          }
        } else {
          slot.notes = [stringIndex];
        }

        setLastEnteredSlot({ m, b, s });
        if (!chord) setCursor(stepForward(draft, m, b, s));
      });
    },
    [cursor, inputDiv, isChordMode, mutateScore]
  );

  // Set note duration / beat division for current beat (splits or merges cell)
  const handleSetInputDiv = useCallback((newDiv: InputDivType) => {
    setInputDiv(newDiv);
    mutateScore(draft => {
      let m = cursor.m;
      let b = cursor.b;
      while (m >= draft.measures.length) {
        draft.measures.push(createNewMeasure(draft.beatsPerMeasure));
      }
      const beat = draft.measures[m]?.beats[b];
      if (!beat) return;

      const oldSlots = beat.slots || [];

      if (newDiv === '8_16_16') {
        beat.div = 3;
        beat.subDiv = '8_16_16';
        beat.slots = [
          oldSlots[0] ? JSON.parse(JSON.stringify(oldSlots[0])) : createNewSlot(),
          oldSlots[1] ? JSON.parse(JSON.stringify(oldSlots[1])) : createNewSlot(),
          oldSlots[2] ? JSON.parse(JSON.stringify(oldSlots[2])) : createNewSlot()
        ];
        if (cursor.s >= 3) {
          setCursor(prev => ({ ...prev, s: 2, low: false }));
        }
        return;
      }

      if (newDiv === '16_16_8') {
        beat.div = 3;
        beat.subDiv = '16_16_8';
        beat.slots = [
          oldSlots[0] ? JSON.parse(JSON.stringify(oldSlots[0])) : createNewSlot(),
          oldSlots[1] ? JSON.parse(JSON.stringify(oldSlots[1])) : createNewSlot(),
          oldSlots[2] ? JSON.parse(JSON.stringify(oldSlots[2])) : createNewSlot()
        ];
        if (cursor.s >= 3) {
          setCursor(prev => ({ ...prev, s: 2, low: false }));
        }
        return;
      }

      if (beat.div === newDiv && !beat.subDiv) return;

      beat.div = newDiv;
      beat.subDiv = newDiv === 3 ? 'equal' : undefined;
      const newSlots: any[] = [];
      for (let i = 0; i < newDiv; i++) {
        if (i < oldSlots.length) {
          newSlots.push(oldSlots[i]);
        } else {
          newSlots.push(createNewSlot());
        }
      }
      beat.slots = newSlots;

      if (cursor.s >= (typeof newDiv === 'number' ? newDiv : 3)) {
        setCursor(prev => ({ ...prev, s: (typeof newDiv === 'number' ? newDiv : 3) - 1, low: false }));
      }
    });
  }, [cursor.m, cursor.b, cursor.s, mutateScore]);

  // 休符・延ばし・くり返し記号を入れる（複数マス選択中はまとめて。1マスのときは次のマスへ進む）
  const setSlotKind = useCallback(
    (kind: 'rest' | 'tie' | 'repeat2') => {
      mutateScore(draft => {
        const apply = (slot: Slot) => {
          resetSlot(slot);
          slot[kind] = true;
        };
        if (selectedSlotKeys.size > 1) {
          selectedSlotKeys.forEach(k => {
            const [m, b, s] = k.split('-').map(Number);
            const slot = draft.measures[m]?.beats[b]?.slots[s];
            if (slot) apply(slot);
          });
          return;
        }
        const { m, b, s } = cursor;
        const slot = draft.measures[m]?.beats[b]?.slots[s];
        if (!slot) return;
        apply(slot);
        setLastEnteredSlot(null);
        setCursor(stepForward(draft, m, b, s));
      });
    },
    [cursor, selectedSlotKeys, mutateScore]
  );

  const handleInputRest = useCallback(() => setSlotKind('rest'), [setSlotKind]);
  const handleInputTie = useCallback(() => setSlotKind('tie'), [setSlotKind]);
  const handleInputRepeat2 = useCallback(() => setSlotKind('repeat2'), [setSlotKind]);

  const handleInputClear = useCallback(() => {
    mutateScore(draft => {
      // 複数マスを選んでいるとき（Excelのセル選択のように）
      if (selectedSlotKeys.size > 0) {
        selectedSlotKeys.forEach(k => {
          const [m, b, s] = k.split('-').map(Number);
          const slot = draft.measures[m]?.beats[b]?.slots[s];
          if (slot) resetSlot(slot);
        });
        setSelectedSlotKeys(new Set());
        return;
      }

      // 小節の範囲を選んでいるとき
      if (selectedRange) {
        for (let m = selectedRange[0]; m <= selectedRange[1]; m++) {
          draft.measures[m]?.beats.forEach(bt => bt.slots.forEach(resetSlot));
        }
        return;
      }

      const slot = draft.measures[cursor.m]?.beats[cursor.b]?.slots[cursor.s];
      if (slot) resetSlot(slot);
    });
  }, [cursor, selectedSlotKeys, selectedRange, mutateScore]);

  // Backspace：中身があればそのマスを消す。空なら1つ戻ってそのマスを消す
  const handleBackspace = useCallback(() => {
    if (selectedSlotKeys.size > 0 || selectedRange) {
      handleInputClear();
      return;
    }
    const sc = scoreRef.current;
    const cur = sc.measures[cursor.m]?.beats[cursor.b]?.slots[cursor.s];
    if (cur && !isEmptySlot(cur)) {
      handleInputClear();
      return;
    }
    let { m, b, s } = cursor;
    s--;
    if (s < 0) {
      b--;
      if (b < 0) {
        if (m === 0) return;
        m--;
        b = sc.beatsPerMeasure - 1;
      }
      s = (sc.measures[m]?.beats[b]?.slots.length || 1) - 1;
    }
    mutateScore(draft => {
      const slot = draft.measures[m]?.beats[b]?.slots[s];
      if (slot) resetSlot(slot);
    });
    setCursor({ m, b, s, low: false });
    setLastEnteredSlot(null);
  }, [cursor, selectedSlotKeys, selectedRange, handleInputClear, mutateScore]);

  // Set finger (中指 3, 人差指 2, 親指 1)
  const handleSetFinger = useCallback((fingerNum: number | undefined) => {
    mutateScore(draft => {
      if (selectedSlotKeys.size > 0) {
        selectedSlotKeys.forEach(k => {
          const [mStr, bStr, sStr] = k.split('-');
          const m = parseInt(mStr, 10);
          const b = parseInt(bStr, 10);
          const s = parseInt(sStr, 10);
          const slot = draft.measures[m]?.beats[b]?.slots[s];
          if (slot) slot.finger = fingerNum;
        });
        return;
      }
      const targetPos = lastEnteredSlot || cursor;
      const slot = draft.measures[targetPos.m]?.beats[targetPos.b]?.slots[targetPos.s];
      if (slot) slot.finger = fingerNum;
    });
  }, [cursor, lastEnteredSlot, selectedSlotKeys, mutateScore]);

  // Toggle Ornament
  const handleToggleOrn = useCallback((ornKey: string) => {
    mutateScore(draft => {
      const applyOrn = (slot: any) => {
        if (ornKey === 'oshi1') {
          slot.oshi = slot.oshi === 1 ? 0 : 1;
        } else if (ornKey === 'oshi2') {
          slot.oshi = slot.oshi === 2 ? 0 : 2;
        } else {
          const val = !slot[ornKey];
          if (ornKey === 'kaki' && val) slot.hiki = false;
          if (ornKey === 'hiki' && val) slot.kaki = false;
          slot[ornKey] = val;
        }
      };

      if (selectedSlotKeys.size > 0) {
        selectedSlotKeys.forEach(k => {
          const [mStr, bStr, sStr] = k.split('-');
          const m = parseInt(mStr, 10);
          const b = parseInt(bStr, 10);
          const s = parseInt(sStr, 10);
          const slot = draft.measures[m]?.beats[b]?.slots[s];
          if (slot) applyOrn(slot);
        });
        return;
      }

      const targetPos = (lastEnteredSlot && lastEnteredSlot.m === cursor.m && lastEnteredSlot.b === cursor.b && lastEnteredSlot.s === cursor.s)
        ? lastEnteredSlot
        : cursor;
      const slot = draft.measures[targetPos.m]?.beats[targetPos.b]?.slots[targetPos.s];
      if (!slot) return;
      applyOrn(slot);
    });
  }, [cursor, lastEnteredSlot, selectedSlotKeys, mutateScore]);

  // Measure operations
  const handleAddMeasure = useCallback(() => {
    mutateScore(draft => {
      draft.measures.push(createNewMeasure(draft.beatsPerMeasure));
    });
  }, [mutateScore]);

  const handleInsertMeasure = useCallback(() => {
    mutateScore(draft => {
      draft.measures.splice(cursor.m, 0, createNewMeasure(draft.beatsPerMeasure));
    });
  }, [cursor.m, mutateScore]);

  const handleInsertMeasureAt = useCallback((mIdx: number) => {
    mutateScore(draft => {
      draft.measures.splice(mIdx, 0, createNewMeasure(draft.beatsPerMeasure));
    });
  }, [mutateScore]);

  const handleDuplicateMeasure = useCallback((mIdx: number) => {
    mutateScore(draft => {
      const target = draft.measures[mIdx];
      if (target) {
        draft.measures.splice(mIdx + 1, 0, JSON.parse(JSON.stringify(target)));
      }
    });
  }, [mutateScore]);

  const handleDeleteMeasureAt = useCallback((mIdx: number) => {
    mutateScore(draft => {
      if (draft.measures.length <= 1) {
        draft.measures = [createNewMeasure(draft.beatsPerMeasure)];
      } else {
        draft.measures.splice(mIdx, 1);
        setCursor(prev => ({ ...prev, m: Math.min(prev.m, draft.measures.length - 1) }));
      }
    });
  }, [mutateScore]);

  const handleDeleteMeasure = useCallback(() => {
    mutateScore(draft => {
      if (selectedRange) {
        const [a, b] = selectedRange;
        draft.measures.splice(a, b - a + 1);
        if (draft.measures.length === 0) {
          draft.measures.push(createNewMeasure(draft.beatsPerMeasure));
        }
        setSelectedRange(null);
        setCursor({ m: Math.min(a, draft.measures.length - 1), b: 0, s: 0 });
      } else {
        if (draft.measures.length <= 1) {
          draft.measures = [createNewMeasure(draft.beatsPerMeasure)];
        } else {
          draft.measures.splice(cursor.m, 1);
          setCursor(prev => ({ ...prev, m: Math.min(prev.m, draft.measures.length - 1) }));
        }
      }
    });
  }, [cursor.m, selectedRange, mutateScore]);

  // Helper to select contiguous slot range between anchor and target (Excel-like range)
  const selectSlotRange = useCallback(
    (anchor: { m: number; b: number; s: number }, target: { m: number; b: number; s: number }) => {
      const toLinear = (pos: { m: number; b: number; s: number }) => pos.m * 10000 + pos.b * 100 + pos.s;
      const minL = Math.min(toLinear(anchor), toLinear(target));
      const maxL = Math.max(toLinear(anchor), toLinear(target));
      const newSet = new Set<string>();

      score.measures.forEach((meas, m) => {
        meas.beats.forEach((b, bI) => {
          b.slots.forEach((_, sI) => {
            const lin = m * 10000 + bI * 100 + sI;
            if (lin >= minL && lin <= maxL) {
              newSet.add(`${m}-${bI}-${sI}`);
            }
          });
        });
      });

      setSelectedSlotKeys(newSet);
    },
    [score]
  );

  // Excel-like Slot Mouse Down (Click, Drag Start, Shift+Click, Ctrl+Click)
  const handleSlotMouseDown = useCallback(
    (mIdx: number, bIdx: number, sIdx: number, e: React.MouseEvent) => {
      if (e.shiftKey && slotAnchor) {
        selectSlotRange(slotAnchor, { m: mIdx, b: bIdx, s: sIdx });
        setCursor({ m: mIdx, b: bIdx, s: sIdx, low: false });
      } else if (e.ctrlKey || e.metaKey) {
        const slotKey = `${mIdx}-${bIdx}-${sIdx}`;
        setSelectedSlotKeys(prev => {
          const next = new Set(prev);
          if (next.has(slotKey)) next.delete(slotKey);
          else next.add(slotKey);
          return next;
        });
        setSlotAnchor({ m: mIdx, b: bIdx, s: sIdx });
        setCursor({ m: mIdx, b: bIdx, s: sIdx, low: false });
      } else {
        setSlotAnchor({ m: mIdx, b: bIdx, s: sIdx });
        setSelectedSlotKeys(new Set());
        setIsDraggingSlots(true);
        setSelectedRange(null);
        setCursor({ m: mIdx, b: bIdx, s: sIdx, low: false });
      }
    },
    [slotAnchor, selectSlotRange]
  );

  // Excel-like Drag to Select
  const handleSlotMouseEnter = useCallback(
    (mIdx: number, bIdx: number, sIdx: number) => {
      if (isDraggingSlots && slotAnchor) {
        selectSlotRange(slotAnchor, { m: mIdx, b: bIdx, s: sIdx });
        setCursor({ m: mIdx, b: bIdx, s: sIdx, low: false });
      }
    },
    [isDraggingSlots, slotAnchor, selectSlotRange]
  );

  const handleSlotMouseUp = useCallback(() => {
    setIsDraggingSlots(false);
  }, []);

  // Click on Slot in Score
  const handleSlotClick = useCallback(
    (mIdx: number, bIdx: number, sIdx: number) => {
      const beat = score.measures[mIdx]?.beats[bIdx];
      setCursor({ m: mIdx, b: bIdx, s: sIdx, low: false });
      if (beat) {
        if (beat.subDiv === '8_16_16') {
          setInputDiv('8_16_16');
        } else if (beat.subDiv === '16_16_8') {
          setInputDiv('16_16_8');
        } else {
          setInputDiv(beat.div);
        }
      }
      setLastEnteredSlot(null);

      const sl = score.measures[mIdx]?.beats[bIdx]?.slots[sIdx];
      if (sl && sl.notes?.length && !isPlaying) {
        previewSlot(sl);
      }
    },
    [score, isPlaying, previewSlot]
  );

  // Excel-like Copy (Ctrl+C)
  const handleCopy = useCallback(() => {
    if (selectedSlotKeys.size > 0) {
      // Sort keys by linear order
      const sortedKeys = Array.from(selectedSlotKeys).sort((a, b) => {
        const [m1, b1, s1] = a.split('-').map(Number);
        const [m2, b2, s2] = b.split('-').map(Number);
        return m1 * 10000 + b1 * 100 + s1 - (m2 * 10000 + b2 * 100 + s2);
      });

      const copied: CopiedSlotItem[] = [];
      const textParts: string[] = [];

      sortedKeys.forEach(k => {
        const [m, b, s] = k.split('-').map(Number);
        const beat = score.measures[m]?.beats[b];
        const slot = beat?.slots[s];
        if (slot && beat) {
          copied.push({
            slot: JSON.parse(JSON.stringify(slot)),
            sourceDiv: beat.div || 2
          });
          if (slot.rest) textParts.push('○');
          else if (slot.tie) textParts.push('ー');
          else if (slot.repeat2) textParts.push('𝄥');
          else if (slot.notes?.length) {
            textParts.push(slot.notes.map(n => getStringNames(score.stringCount === 17 ? 17 : 13)[n]).join('+'));
          } else {
            textParts.push('');
          }
        }
      });

      slotClipboardRef.current = copied;
      try {
        navigator.clipboard.writeText(textParts.join('\t'));
      } catch {
        // ignore
      }
      showToast(`${copied.length}マスをコピーしました (Ctrl+C)`);
      return;
    }

    if (selectedRange) {
      const [start, end] = selectedRange;
      clipboardRef.current = JSON.parse(JSON.stringify(score.measures.slice(start, end + 1)));
      showToast(`${end - start + 1}小節をコピーしました`);
      return;
    }

    // Default: copy single active slot
    const curBeat = score.measures[cursor.m]?.beats[cursor.b];
    const curSlot = curBeat?.slots[cursor.s];
    if (curSlot && curBeat) {
      slotClipboardRef.current = [{
        slot: JSON.parse(JSON.stringify(curSlot)),
        sourceDiv: curBeat.div || 2
      }];
      showToast('1マスをコピーしました (Ctrl+C)');
    }
  }, [selectedSlotKeys, selectedRange, cursor, score, showToast]);

  // Excel-like Cut (Ctrl+X)
  const handleCut = useCallback(() => {
    if (selectedSlotKeys.size > 0) {
      const count = selectedSlotKeys.size;
      handleCopy();
      handleInputClear();
      showToast(`${count}マスを切り取りました (Ctrl+X)`);
      return;
    }
    if (selectedRange) {
      handleCopy();
      handleDeleteMeasure();
      showToast('小節を切り取りました');
      return;
    }
    handleCopy();
    handleInputClear();
  }, [selectedSlotKeys, selectedRange, handleCopy, handleInputClear, handleDeleteMeasure, showToast]);

  // Excel-like Paste (Ctrl+V)
  const handlePaste = useCallback(() => {
    // If multi-cell clipboard has content
    if (slotClipboardRef.current && slotClipboardRef.current.length > 0) {
      const copiedSlots = slotClipboardRef.current;
      mutateScore(draft => {
        let curM = cursor.m;
        let curB = cursor.b;
        let curS = cursor.s;
        const newSel = new Set<string>();

        copiedSlots.forEach(item => {
          while (curM >= draft.measures.length) {
            draft.measures.push(createNewMeasure(draft.beatsPerMeasure));
          }

          let meas = draft.measures[curM];
          if (curB >= meas.beats.length) {
            curB = 0;
            curM++;
            while (curM >= draft.measures.length) {
              draft.measures.push(createNewMeasure(draft.beatsPerMeasure));
            }
            meas = draft.measures[curM];
          }

          let beat = meas.beats[curB];
          if (!beat) return;

          // If the target beat's division is smaller than the copied note's source division,
          // adapt beat.div so eighth notes don't turn into quarter notes!
          if (beat.div < item.sourceDiv) {
            const oldSlots = beat.slots;
            beat.div = item.sourceDiv;
            beat.slots = Array.from({ length: item.sourceDiv }, (_, idx) => oldSlots[idx] || createNewSlot());
          }

          if (curS >= beat.slots.length) {
            curS = 0;
            curB++;
            if (curB >= meas.beats.length) {
              curB = 0;
              curM++;
              while (curM >= draft.measures.length) {
                draft.measures.push(createNewMeasure(draft.beatsPerMeasure));
              }
              meas = draft.measures[curM];
            }
            beat = meas.beats[curB];
            if (beat && beat.div < item.sourceDiv) {
              const oldSlots = beat.slots;
              beat.div = item.sourceDiv;
              beat.slots = Array.from({ length: item.sourceDiv }, (_, idx) => oldSlots[idx] || createNewSlot());
            }
          }

          if (beat && beat.slots[curS]) {
            beat.slots[curS] = JSON.parse(JSON.stringify(item.slot));
            newSel.add(`${curM}-${curB}-${curS}`);
          }

          // Advance cursor to next slot
          curS++;
          if (beat && curS >= beat.slots.length) {
            curS = 0;
            curB++;
            if (curB >= meas.beats.length) {
              curB = 0;
              curM++;
            }
          }
        });

        setSelectedSlotKeys(newSel);
        setCursor({ m: curM, b: curB, s: curS, low: false });
      });

      showToast(`${copiedSlots.length}マスを貼り付けました (Ctrl+V)`);
      return;
    }

    // Fallback: paste measures
    if (clipboardRef.current && clipboardRef.current.length) {
      mutateScore(draft => {
        const copied = JSON.parse(JSON.stringify(clipboardRef.current));
        draft.measures.splice(cursor.m, 0, ...copied);
      });
      showToast(`${clipboardRef.current.length}小節を貼り付けました`);
    }
  }, [cursor, mutateScore, showToast]);

  const handleMeasureClick = useCallback(
    (mIdx: number) => {
      setCursor({ m: mIdx, b: 0, s: 0 });
      startPlayback(mIdx * score.beatsPerMeasure);
    },
    [score.beatsPerMeasure, startPlayback]
  );

  const handleLyricsChange = useCallback(
    (mIdx: number, bIdx: number, text: string) => {
      mutateScore(
        d => {
          const bt = d.measures[mIdx]?.beats[bIdx];
          if (bt) bt.lyrics = text;
        },
        { history: 'lyrics' }
      );
    },
    [mutateScore]
  );

  // 曲名・副題・作曲者・テンポ・拍子の変更
  const handleUpdateMeta = useCallback(
    (meta: Partial<KotoScore>) => {
      const next = { ...meta };
      if (typeof next.tempo === 'number') {
        next.tempo = clamp(Math.round(next.tempo) || 80, TEMPO_MIN, TEMPO_MAX);
      }
      if (next.beatsPerMeasure && next.beatsPerMeasure !== scoreRef.current.beatsPerMeasure) {
        const beats = next.beatsPerMeasure;
        delete next.beatsPerMeasure;
        mutateScore(d => {
          Object.assign(d, next);
          setBeatsPerMeasure(d, beats);
        });
        setCursor(c => ({ ...c, b: Math.min(c.b, beats - 1), s: 0, low: false }));
        showToast(`${beats}拍子にしました（削った拍の音は「元に戻す」で復元できます）`);
        return;
      }
      mutateScore(d => Object.assign(d, next), { history: `meta:${Object.keys(next).join(',')}` });
    },
    [mutateScore, showToast]
  );

  // ポップアップ（調弦・楽曲集・保存・ヘルプ・新規作成）が開いている間は、裏の譜面を操作しない
  const isModalOpen = isTuningOpen || isLibraryOpen || isExportOpen || isHelpOpen || isNewScoreWizardOpen;

  // 絃キー：物理キーの位置（e.code）で判定するので、日本語入力ONでも、JIS・USどちらの配列でも動く
  //   数字列  1 2 3 4 5 6 7 8 9 0 - ^ ¥   → 一〜巾
  //   ホーム列 A S D F G H J K L ; : ]    → 一〜為（巾は @）
  const stringIndexFromEvent = (e: KeyboardEvent): number | undefined => {
    const digit: Record<string, number> = {
      Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit7: 6,
      Digit8: 7, Digit9: 8, Digit0: 9, Minus: 10, Equal: 11, IntlYen: 12,
      KeyA: 0, KeyS: 1, KeyD: 2, KeyF: 3, KeyG: 4, KeyH: 5, KeyJ: 6, KeyK: 7, KeyL: 8,
      Semicolon: 9, Quote: 10, BracketLeft: 12,
      Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3, Numpad5: 4, Numpad6: 5, Numpad7: 6,
      Numpad8: 7, Numpad9: 8, Numpad0: 9
    };
    let idx: number | undefined = digit[e.code];
    // JIS配列の「]」は e.code が Backslash、US配列の「\」も Backslash。押された文字で見分ける
    if (e.code === 'Backslash') idx = e.key === ']' || e.key === '}' ? 11 : 12;
    if (e.code === 'BracketRight') idx = e.key === ']' || e.key === '}' ? 11 : undefined;
    if (idx === undefined) return undefined;
    return idx < (scoreRef.current.stringCount === 17 ? 17 : 13) ? idx : undefined;
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (isModalOpen || isPracticeMode) return;

      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        if (e.key === 'Escape') target?.blur();
        return;
      }

      const mod = e.ctrlKey || e.metaKey;

      if (mod) {
        // 登録していない Ctrl/⌘ の組み合わせ（再読み込み Ctrl+R など）はブラウザに任せる
        switch (e.code) {
          case 'KeyZ':
            e.preventDefault();
            if (e.shiftKey) handleRedo();
            else handleUndo();
            break;
          case 'KeyY':
            e.preventDefault();
            handleRedo();
            break;
          case 'KeyC':
            if (String(window.getSelection() || '').trim()) return; // 文字を選択しているときは普通のコピー
            e.preventDefault();
            handleCopy();
            break;
          case 'KeyX':
            e.preventDefault();
            handleCut();
            break;
          case 'KeyV':
            e.preventDefault();
            handlePaste();
            break;
          case 'KeyA': {
            e.preventDefault();
            // 全マスを選択（Excelの Ctrl+A のように）
            const allKeys = new Set<string>();
            score.measures.forEach((meas, m) => {
              meas.beats.forEach((b, bIdx) => {
                b.slots.forEach((_, sIdx) => {
                  allKeys.add(`${m}-${bIdx}-${sIdx}`);
                });
              });
            });
            setSelectedSlotKeys(allKeys);
            break;
          }
          case 'KeyN':
            e.preventDefault();
            setIsNewScoreWizardOpen(true);
            break;
          case 'KeyP':
            e.preventDefault();
            handlePrint();
            break;
          case 'KeyS':
            e.preventDefault();
            setIsExportOpen(true);
            break;
        }
        return;
      }
      if (e.altKey) {
        // 十七絃：14〜17本目は Alt + 1〜4
        if (scoreRef.current.stringCount === 17 && /^Digit[1-4]$/.test(e.code)) {
          e.preventDefault();
          inputString(12 + Number(e.code.slice(5)), e.shiftKey ? true : undefined);
        }
        return;
      }

      // Space: 再生 / 一時停止（Shift+Space はカーソルの位置から）
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.shiftKey) {
          startPlayback(cursorBeatPos());
        } else {
          togglePlay();
        }
        return;
      }

      // Escape: 再生を止める。止まっていれば選択を解除
      if (e.key === 'Escape') {
        if (player.playing) {
          stopPlayback();
        } else {
          setSelectedSlotKeys(new Set());
          setSelectedRange(null);
          setSelAnchor(null);
        }
        return;
      }

      // 絃キー（Shift を押しながらで和音）
      const strIdx = stringIndexFromEvent(e);
      if (strIdx !== undefined) {
        e.preventDefault();
        inputString(strIdx, e.shiftKey ? true : undefined);
        return;
      }

      // 文字キー（物理キー位置で判定）
      const letter = e.code.startsWith('Key') ? e.code.slice(3).toLowerCase() : '';

      // 入力する長さ Q W E R
      const divMap: Record<string, 1 | 2 | 3 | 4> = { q: 1, w: 2, e: 3, r: 4 };
      if (divMap[letter]) {
        e.preventDefault();
        handleSetInputDiv(divMap[letter]);
        return;
      }

      // 休符 (P / .)・延ばし (T / ,)
      if (letter === 'p' || e.code === 'Period') {
        e.preventDefault();
        handleInputRest();
        return;
      }
      if (letter === 't' || e.code === 'Comma') {
        e.preventDefault();
        handleInputTie();
        return;
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        handleInputClear();
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }

      // 奏法記号
      const ornMap: Record<string, string> = {
        z: 'oshi1', x: 'oshi2', y: 'ato', u: 'hanashi', i: 'hikiiro', o: 'tsuki', m: 'yuri',
        c: 'sukui', v: 'kaki', b: 'hiki', n: 'trem'
      };
      const kanaOrnMap: Record<string, string> = {
        'オ': 'oshi1', 'お': 'oshi1', 'ヲ': 'oshi2', 'を': 'oshi2', 'ヒ': 'hikiiro', 'ひ': 'hikiiro',
        'ア': 'ato', 'あ': 'ato', 'ツ': 'tsuki', 'つ': 'tsuki', 'ユ': 'yuri', 'ゆ': 'yuri', 'ス': 'sukui', 'す': 'sukui'
      };
      const orn = ornMap[letter] || kanaOrnMap[e.key] || (e.code === 'Slash' ? 'nagashi' : '');
      if (orn) {
        e.preventDefault();
        handleToggleOrn(orn);
        return;
      }

      // 矢印キー（Shift+矢印で範囲選択）
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setLastEnteredSlot(null);
        const v = score.view.layout === 'vertical';

        let m = cursor.m;
        let b = cursor.b;
        let s = cursor.s;
        const beat = score.measures[m]?.beats[b] || { div: 1 };
        const slotCount = beat.slots?.length || beat.div;

        const forward = () => {
          s++;
          if (s >= slotCount) {
            s = 0;
            b++;
            if (b >= score.beatsPerMeasure) {
              b = 0;
              m = Math.min(score.measures.length - 1, m + 1);
            }
          }
        };
        const backward = () => {
          s--;
          if (s < 0) {
            b--;
            if (b < 0) {
              m = Math.max(0, m - 1);
              b = score.beatsPerMeasure - 1;
            }
            const prevBeat = score.measures[m]?.beats[b] || { div: 1 };
            s = (prevBeat.slots?.length || prevBeat.div) - 1;
          }
        };
        const nextLine = () => {
          m = Math.min(score.measures.length - 1, m + score.view.perLine);
        };
        const prevLine = () => {
          m = Math.max(0, m - score.view.perLine);
        };

        if (v) {
          // 縦書き: 上下で1マスずつ、左右で列（段）を移動。左が先の小節
          if (e.key === 'ArrowDown') forward();
          else if (e.key === 'ArrowUp') backward();
          else if (e.key === 'ArrowLeft') nextLine();
          else prevLine();
        } else {
          if (e.key === 'ArrowRight') forward();
          else if (e.key === 'ArrowLeft') backward();
          else if (e.key === 'ArrowDown') nextLine();
          else prevLine();
        }

        const nextPos = { m, b, s, low: false };
        if (e.shiftKey) {
          const anchor = slotAnchor || { m: cursor.m, b: cursor.b, s: cursor.s };
          if (!slotAnchor) setSlotAnchor(anchor);
          selectSlotRange(anchor, nextPos);
        } else {
          setSelectedSlotKeys(new Set());
          setSelectedRange(null);
          setSlotAnchor(nextPos);
        }
        setCursor(nextPos);
        return;
      }

      // Enter: 次の小節の頭へ（ボタンにフォーカスがあるときはボタンの操作を優先）
      if (e.key === 'Enter') {
        if (tag === 'button') return;
        e.preventDefault();
        setLastEnteredSlot(null);
        setCursor(prev => ({
          m: Math.min(score.measures.length - 1, prev.m + 1),
          b: 0,
          s: 0,
          low: false
        }));
        return;
      }

      if (e.key === 'Home') {
        e.preventDefault();
        setCursor({ m: 0, b: 0, s: 0, low: false });
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        setCursor({ m: score.measures.length - 1, b: 0, s: 0, low: false });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    score,
    cursor,
    isModalOpen,
    isPracticeMode,
    player,
    handleUndo,
    handleRedo,
    handleCopy,
    handleCut,
    handlePaste,
    handlePrint,
    selectSlotRange,
    slotAnchor,
    togglePlay,
    stopPlayback,
    startPlayback,
    cursorBeatPos,
    handleInputRest,
    handleInputTie,
    handleInputClear,
    handleBackspace,
    handleToggleOrn,
    inputString,
    handleSetInputDiv
  ]);

  const curSlot = score.measures[cursor.m]?.beats[cursor.b]?.slots[cursor.s] || null;
  const targetSlot = (lastEnteredSlot && lastEnteredSlot.m === cursor.m && lastEnteredSlot.b === cursor.b && lastEnteredSlot.s === cursor.s)
    ? score.measures[lastEnteredSlot.m]?.beats[lastEnteredSlot.b]?.slots[lastEnteredSlot.s]
    : curSlot;

  const currentOrns: Record<string, boolean> = {
    oshi1: targetSlot?.oshi === 1,
    oshi2: targetSlot?.oshi === 2
  };
  [...LEFT_HAND_ORNS, ...RIGHT_HAND_ORNS].forEach(k => {
    currentOrns[k] = !!targetSlot?.[k];
  });

  return (
    <div className="min-h-screen bg-[#edece8] print:bg-white print:min-h-0 text-stone-900 flex flex-col font-sans">
      {/* Container */}
      <div className="w-full max-w-[1360px] mx-auto p-2 sm:p-3 print:p-0 print:m-0 print:max-w-none flex flex-col gap-2">
        {/* Header (Top app bar with title, actions, and collapsible settings) */}
        <Header
          score={score}
          onUpdateScoreMeta={handleUpdateMeta}
          onUpdateView={view => mutateScore(d => Object.assign(d.view, view), { history: false })}
          onOpenLibrary={() => setIsLibraryOpen(true)}
          onOpenTuning={() => setIsTuningOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenPracticeMode={() => setIsPracticeMode(true)}
          onOpenNewScoreWizard={() => setIsNewScoreWizardOpen(true)}
          onPrint={handlePrint}
        />

        {/* Measure Scrubber / Quick Navigation Bar with Fit-All Overview Switcher */}
        <MeasureNavigator
          totalMeasures={score.measures.length}
          currentMeasure={cursor.m}
          perLine={score.view.perLine}
          layout={score.view.layout}
          zoom={score.view.zoom}
          isFitAll={isFitAll}
          onSelectMeasure={mIdx => setCursor({ m: mIdx, b: 0, s: 0, low: false })}
          onAddMeasure={handleAddMeasure}
          onSetPerLine={perLine => mutateScore(d => (d.view.perLine = perLine), { history: false })}
          onToggleFitAll={handleToggleFitAll}
          onSetZoom100={handleSetZoom100}
        />

        {/* Main Bunkafu Score Paper Sheet (Continuous horizontal flow, centered in viewport) */}
        <main
          ref={scoreContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full rounded-2xl border border-stone-300 bg-[#fdfcf8] p-3 sm:p-6 shadow-md overflow-x-auto overflow-y-auto max-h-[68vh] print:max-h-none print:border-none print:shadow-none print:p-0 print:bg-white touch-pan-x touch-pan-y flex justify-center items-start"
        >
          {score.view.layout === 'vertical' ? (
            <div className="min-w-fit mx-auto flex justify-center print:min-w-0 print:w-full">
              <ScoreSheetVertical
                score={score}
                cursor={isPrinting ? NO_CURSOR : cursor}
                currentPlayKey={isPrinting ? null : currentPlayKey}
                selectedRange={isPrinting ? null : selectedRange}
                selectedSlotKeys={isPrinting ? NO_KEYS : selectedSlotKeys}
                onSlotClick={handleSlotClick}
                onSlotMouseDown={handleSlotMouseDown}
                onSlotMouseEnter={handleSlotMouseEnter}
                onSlotMouseUp={handleSlotMouseUp}
                onMeasureClick={handleMeasureClick}
                onLyricsChange={handleLyricsChange}
                onUpdateScoreMeta={handleUpdateMeta}
                onInsertMeasure={handleInsertMeasureAt}
                onDuplicateMeasure={handleDuplicateMeasure}
                onDeleteMeasure={handleDeleteMeasureAt}
                onAddMeasure={handleAddMeasure}
                onSetLoop={(active, a, b) => {
                  setLoopActive(active);
                  if (a != null && b != null) setLoopRange([a, b]);
                }}
                autoScroll={true}
              />
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto flex justify-center">
              <ScoreSheetHorizontal
                score={score}
                cursor={isPrinting ? NO_CURSOR : cursor}
                currentPlayKey={isPrinting ? null : currentPlayKey}
                selectedRange={isPrinting ? null : selectedRange}
                selectedSlotKeys={isPrinting ? NO_KEYS : selectedSlotKeys}
                onSlotClick={handleSlotClick}
                onSlotMouseDown={handleSlotMouseDown}
                onSlotMouseEnter={handleSlotMouseEnter}
                onSlotMouseUp={handleSlotMouseUp}
                onMeasureClick={handleMeasureClick}
                onLyricsChange={handleLyricsChange}
                onUpdateScoreMeta={handleUpdateMeta}
                onInsertMeasure={handleInsertMeasureAt}
                onDuplicateMeasure={handleDuplicateMeasure}
                onDeleteMeasure={handleDeleteMeasureAt}
                onAddMeasure={handleAddMeasure}
                onSetLoop={(active, a, b) => {
                  setLoopActive(active);
                  if (a != null && b != null) setLoopRange([a, b]);
                }}
                autoScroll={true}
              />
            </div>
          )}
        </main>

        {/* Dock Controls (Input pad, tabs, playback, thumb-friendly navigation) */}
        <div className="sticky bottom-1 z-30 no-print">
          <Dock
            score={score}
            currentCursor={{ m: cursor.m, b: cursor.b, s: cursor.s }}
            isPlaying={isPlaying}
            inputDiv={inputDiv}
            isChordMode={isChordMode}
            selectedOrns={currentOrns}
            currentFinger={targetSlot?.finger}
            onSetFinger={handleSetFinger}
            canUndo={undoStackRef.current.length > 0}
            canRedo={redoStackRef.current.length > 0}
            loopActive={loopActive}
            loopRange={loopRange}
            speed={speed}
            volume={volume}
            countIn={countIn}
            metronome={metronome}
            onPlayToggle={togglePlay}
            onStop={stopPlayback}
            onRewind={() => {
              stopPlayback();
              setCursor({ m: 0, b: 0, s: 0 });
            }}
            onSetInputDiv={handleSetInputDiv}
            onToggleChordMode={() => setIsChordMode(!isChordMode)}
            onInputRest={handleInputRest}
            onInputTie={handleInputTie}
            onInputRepeat2={handleInputRepeat2}
            onInputClear={handleInputClear}
            onToggleOrn={handleToggleOrn}
            onAddMeasure={handleAddMeasure}
            onInsertMeasure={handleInsertMeasure}
            onDeleteMeasure={handleDeleteMeasure}
            onCopyMeasure={handleCopy}
            onPasteMeasure={handlePaste}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onStringClick={inputString}
            onPrevSlot={handlePrevSlot}
            onNextSlot={handleNextSlot}
            onSetLoop={(active, a, b) => {
              setLoopActive(active);
              if (a != null && b != null) setLoopRange([a, b]);
            }}
            onSetSpeed={setSpeed}
            onSetVolume={v => {
              setVolume(v);
              kotoSynth.setVolume(v);
            }}
            onSetCountIn={setCountIn}
            onSetMetronome={setMetronome}
            onTempoChange={bpm => handleUpdateMeta({ tempo: bpm })}
            onToggleKotoBoard={() => mutateScore(d => { d.view.showKotoBoard = !d.view.showKotoBoard; }, { history: false })}
          />
        </div>

        {/* Virtual 13-String Koto Instrument (Placed at the very bottom, out of the way) */}
        {score.view.showKotoBoard && (
          <div className="no-print mt-1 pb-4">
            <VirtualKoto
              score={score}
              onSelectString={inputString}
              activeStrings={curSlot?.notes || []}
              onClose={() => mutateScore(d => (d.view.showKotoBoard = false), { history: false })}
            />
          </div>
        )}
      </div>

      {/* Excel-like Multi-Cell Selection Floating Action Bar (Only shown when 2 or more cells are selected) */}
      {selectedSlotKeys.size > 1 && (
        <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 sm:gap-2 rounded-full border border-amber-400 bg-amber-50/95 px-3.5 py-1.5 shadow-xl text-xs font-semibold text-amber-950 backdrop-blur-md no-print transition-all animate-fade-in">
          <span className="font-bold text-amber-900">【{selectedSlotKeys.size}マス選択】</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 bg-white hover:bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-md cursor-pointer font-bold text-amber-950 shadow-2xs transition-colors"
            title="選択したマスをコピー (Ctrl+C)"
          >
            コピー (Ctrl+C)
          </button>
          <button
            onClick={handleCut}
            className="flex items-center gap-1 bg-white hover:bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-md cursor-pointer font-bold text-amber-950 shadow-2xs transition-colors"
            title="選択したマスを切り取り (Ctrl+X)"
          >
            切取 (Ctrl+X)
          </button>
          <button
            onClick={handleInputClear}
            className="flex items-center gap-1 bg-white hover:bg-red-50 border border-red-300 px-2.5 py-0.5 rounded-md cursor-pointer text-red-700 font-bold shadow-2xs transition-colors"
            title="選択したマスを消去 (Delete)"
          >
            消去 (Del)
          </button>
          <button
            onClick={() => setSelectedSlotKeys(new Set())}
            className="hover:bg-amber-200/80 px-1.5 py-0.5 rounded text-stone-500 hover:text-stone-800 cursor-pointer ml-1 text-sm leading-none"
            title="選択解除 (Esc)"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Status Toast Notification */}
      {statusToast && (
        <div className="fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-50 rounded-full bg-stone-900/95 text-white text-xs font-bold px-4 py-1.5 shadow-xl backdrop-blur-md no-print transition-all animate-fade-in flex items-center gap-1.5 pointer-events-none">
          <span className="text-amber-400">✓</span> {statusToast}
        </div>
      )}

      {/* Modals */}
      <TuningModal
        score={score}
        isOpen={isTuningOpen}
        onClose={() => setIsTuningOpen(false)}
        onUpdateTuning={newTuning => mutateScore(d => (d.tuning = newTuning))}
      />

      <ScoreLibraryModal
        score={score}
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onLoadScore={s => replaceScore(s)}
        onOpenNewScoreWizard={() => setIsNewScoreWizardOpen(true)}
      />

      <NewScoreWizardModal
        isOpen={isNewScoreWizardOpen}
        onClose={() => setIsNewScoreWizardOpen(false)}
        onCreateScore={handleCreateScoreFromWizard}
      />

      <ExportModal
        score={score}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onImportScore={s => replaceScore(s)}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Zen Performance & Practice Mode Overlay */}
      {isPracticeMode && (
        <PracticeModeOverlay
          score={score}
          cursor={cursor}
          currentPlayKey={currentPlayKey}
          isPlaying={isPlaying}
          speed={speed}
          metronome={metronome}
          loopActive={loopActive}
          loopRange={loopRange}
          onPlayToggle={togglePlay}
          onStop={stopPlayback}
          onRewind={() => {
            stopPlayback();
            setCursor({ m: 0, b: 0, s: 0 });
          }}
          onSetSpeed={setSpeed}
          onSetTempo={bpm => handleUpdateMeta({ tempo: bpm })}
          onSetMetronome={setMetronome}
          onSetLoop={(active, a, b) => {
            setLoopActive(active);
            if (a != null && b != null) setLoopRange([a, b]);
          }}
          onSelectMeasure={mIdx => setCursor({ m: mIdx, b: 0, s: 0, low: false })}
          onSlotClick={handleSlotClick}
          onClose={() => setIsPracticeMode(false)}
          onUpdateScoreMeta={handleUpdateMeta}
        />
      )}
    </div>
  );
}
