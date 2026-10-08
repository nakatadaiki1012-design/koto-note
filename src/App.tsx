/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  KotoScore,
  CursorPosition,
  KANJI_STRINGS,
  KEYBOARD_ROW1,
  KEYBOARD_HOME,
  createNewSlot,
  createNewBeat,
  createNewMeasure,
  createEmptyScore,
  normalizeScore,
  getPitches,
  clamp,
  LeftHandOrn,
  RightHandOrn,
  LEFT_HAND_ORNS,
  RIGHT_HAND_ORNS
} from './types/koto';
import { createSakuraScore } from './data/presetScores';
import { kotoSynth } from './audio/kotoSynth';
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

const DRAFT_STORAGE_KEY = 'kotoBunkafu.draft.v1';

export default function App() {
  // Score state
  const [score, setScore] = useState<KotoScore>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return normalizeScore(parsed, createSakuraScore());
      }
    } catch {
      // ignore
    }
    return createSakuraScore();
  });

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
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<Set<string>>(new Set());
  const [inputDiv, setInputDiv] = useState<1 | 2 | 3 | 4>(1);
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

  // Clipboard for measures
  const clipboardRef = useRef<any[] | null>(null);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(score));
    } catch {
      // ignore
    }
  }, [score]);

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

  // Push undo state before mutating score
  const pushUndo = useCallback((prevScore: KotoScore) => {
    undoStackRef.current.push(JSON.parse(JSON.stringify(prevScore)));
    if (undoStackRef.current.length > 50) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setHistoryVersion(v => v + 1);
  }, []);

  const mutateScore = useCallback((updater: (draft: KotoScore) => void) => {
    setScore(prev => {
      pushUndo(prev);
      const next = JSON.parse(JSON.stringify(prev));
      updater(next);
      return next;
    });
  }, [pushUndo]);

  const handleUndo = useCallback(() => {
    if (!undoStackRef.current.length) return;
    const prev = undoStackRef.current.pop()!;
    redoStackRef.current.push(JSON.parse(JSON.stringify(score)));
    setScore(prev);
    setHistoryVersion(v => v + 1);
  }, [score]);

  const handleRedo = useCallback(() => {
    if (!redoStackRef.current.length) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(JSON.parse(JSON.stringify(score)));
    setScore(next);
    setHistoryVersion(v => v + 1);
  }, [score]);

  // Fit-all overview mode state
  const isFitAll = score.view.zoom <= 0.72;

  const handleToggleFitAll = useCallback(() => {
    mutateScore(d => {
      if (d.view.zoom <= 0.72) {
        d.view.zoom = 1.0;
      } else {
        d.view.zoom = 0.58;
      }
    });
  }, [mutateScore]);

  const handleSetZoom100 = useCallback(() => {
    mutateScore(d => {
      d.view.zoom = 1.0;
    });
  }, [mutateScore]);

  // Touch gesture handling: Swipe between measures, Double-tap to toggle zoom, Pinch to zoom
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    lastTapTime: number;
    initialDistance: number;
    initialZoom: number;
    isPinching: boolean;
  }>({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
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

      // Double tap detection (within 320ms) -> Toggle 全体表示 / 100%
      if (now - lastTap < 320) {
        handleToggleFitAll();
        touchStateRef.current.lastTapTime = 0;
      } else {
        touchStateRef.current.lastTapTime = now;
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
      mutateScore(d => {
        d.view.zoom = newZoom;
      });
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

  // Audio Playback Scheduler Loop
  const playStateRef = useRef<{
    active: boolean;
    currentBeat: number;
    anchorTime: number;
    anchorBeat: number;
    timer: any;
    raf: any;
    warmed: boolean;
  }>({
    active: false,
    currentBeat: 0,
    anchorTime: 0,
    anchorBeat: 0,
    timer: null,
    raf: null,
    warmed: false
  });

  const stopPlayback = useCallback(() => {
    playStateRef.current.active = false;
    clearTimeout(playStateRef.current.timer);
    cancelAnimationFrame(playStateRef.current.raf);
    kotoSynth.dampAll();
    setIsPlaying(false);
    setCurrentPlayKey(null);
  }, []);

  const startPlayback = useCallback((fromBeat: number = 0) => {
    const ctx = kotoSynth.ensureContext();
    if (!playStateRef.current.warmed) {
      playStateRef.current.warmed = true;
      kotoSynth.prewarm(getPitches(score));
    }

    const bpm = score.beatsPerMeasure;
    const totalMeasures = score.measures.length;
    let [rangeStart, rangeEnd] = loopActive
      ? [(clamp(loopRange[0], 1, totalMeasures) - 1) * bpm, clamp(loopRange[1], 1, totalMeasures) * bpm]
      : [0, totalMeasures * bpm];

    if (fromBeat < rangeStart || fromBeat >= rangeEnd) {
      fromBeat = rangeStart;
    }

    interface PlayItem {
      beat: number;
      m: number;
      b: number;
      s: number;
      metro?: boolean;
      accent?: boolean;
      slot?: any;
    }

    const items: PlayItem[] = [];
    score.measures.forEach((ms, m) => {
      ms.beats.forEach((bt, b) => {
        items.push({ beat: m * bpm + b, m, b, s: 0, metro: true, accent: b === 0 });
        bt.slots.forEach((sl, s) => {
          let resolvedSlot = sl;
          // If repeat2 (2拍繰り返し), duplicate notes from 2 beats prior
          if (sl.repeat2) {
            let prevB = b - 2;
            let prevM = m;
            if (prevB < 0) {
              prevM = m - 1;
              prevB = bpm + prevB;
            }
            if (prevM >= 0) {
              const prevBeat = score.measures[prevM]?.beats[prevB];
              if (prevBeat && prevBeat.slots[s]) {
                resolvedSlot = prevBeat.slots[s];
              }
            }
          }
          items.push({
            beat: m * bpm + b + s / bt.div,
            m,
            b,
            s,
            slot: resolvedSlot
          });
        });
      });
    });

    const spb = 60 / (score.tempo * speed);
    const now = ctx.currentTime;
    let t0 = now + 0.08;

    if (countIn) {
      for (let i = 0; i < bpm; i++) {
        kotoSynth.click(t0 + i * spb, i === 0);
      }
      t0 += bpm * spb;
    }

    playStateRef.current.active = true;
    playStateRef.current.anchorTime = t0;
    playStateRef.current.anchorBeat = fromBeat;
    setIsPlaying(true);

    const pitches = getPitches(score);
    let schedIdx = items.findIndex(it => it.beat >= fromBeat);
    if (schedIdx < 0) schedIdx = 0;

    const schedule = () => {
      if (!playStateRef.current.active) return;
      const curCtxTime = ctx.currentTime;
      const curBeatTime = (b: number) =>
        playStateRef.current.anchorTime +
        (b - playStateRef.current.anchorBeat) * spb;

      while (schedIdx < items.length) {
        const item = items[schedIdx];
        if (item.beat >= rangeEnd) {
          if (loopActive) {
            const loopDuration = (rangeEnd - rangeStart) * spb;
            playStateRef.current.anchorTime += loopDuration;
            playStateRef.current.anchorBeat = rangeStart;
            schedIdx = items.findIndex(it => it.beat >= rangeStart);
            continue;
          } else {
            break;
          }
        }

        const itemTime = curBeatTime(item.beat);
        if (itemTime > curCtxTime + 0.45) break;

        if (itemTime >= curCtxTime - 0.05) {
          if (item.metro && metronome) {
            kotoSynth.click(itemTime, item.accent);
          } else if (item.slot && !item.slot.rest && item.slot.notes?.length) {
            item.slot.notes.forEach((strIdx: number) => {
              if (strIdx >= 0 && strIdx < 13) {
                const pitch = pitches[strIdx] + (item.slot.ato ? 0 : item.slot.oshi || 0);
                let bend = null;
                if (item.slot.ato) {
                  bend = { type: 'ato' as const, amt: item.slot.oshi || 1, dur: 0.8 };
                } else if (item.slot.hanashi) {
                  bend = { type: 'hanashi' as const, amt: item.slot.oshi || 1, dur: 0.8 };
                } else if (item.slot.hikiiro) {
                  bend = { type: 'hikiiro' as const, dur: 0.6 };
                } else if (item.slot.tsuki) {
                  bend = { type: 'tsuki' as const, dur: 0.3 };
                } else if (item.slot.yuri) {
                  bend = { type: 'yuri' as const, dur: 1.2 };
                }

                const vel = item.slot.sukui ? 0.72 : 0.85;
                const bright = item.slot.sukui ? 0.92 : 0.85;
                kotoSynth.pluck(strIdx, pitch, itemTime, vel, bright, bend);
              }
            });
          }
        }
        schedIdx++;
      }

      if (schedIdx >= items.length && !loopActive) {
        const lastTime = curBeatTime(rangeEnd);
        if (curCtxTime >= lastTime + 0.5) {
          stopPlayback();
          return;
        }
      }

      playStateRef.current.timer = setTimeout(schedule, 40);
    };

    schedule();

    const syncVisuals = () => {
      if (!playStateRef.current.active) return;
      const curCtxTime = ctx.currentTime;
      const elapsed = curCtxTime - playStateRef.current.anchorTime;
      const curBeat = playStateRef.current.anchorBeat + elapsed / spb;

      const activeItem = items
        .filter(it => !it.metro && it.beat <= curBeat && it.beat > curBeat - 0.7)
        .pop();

      if (activeItem) {
        setCurrentPlayKey(`${activeItem.m}-${activeItem.b}-${activeItem.s}`);
      } else {
        setCurrentPlayKey(null);
      }

      playStateRef.current.raf = requestAnimationFrame(syncVisuals);
    };

    syncVisuals();
  }, [score, loopActive, loopRange, speed, countIn, metronome, stopPlayback]);

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback(cursor.m * score.beatsPerMeasure + cursor.b);
    }
  };

  const previewSlot = useCallback((sl: any) => {
    if (!sl || sl.rest || !sl.notes?.length) return;
    const pitches = getPitches(score);
    sl.notes.forEach((strIdx: number) => {
      if (strIdx >= 0 && strIdx < 13) {
        const p = pitches[strIdx] + (sl.ato ? 0 : sl.oshi || 0);
        kotoSynth.pluck(strIdx, p, 0, 0.85);
      }
    });
  }, [score]);

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
        s = prevBeat.div - 1;
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
      if (s >= beat.div) {
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
  const inputString = useCallback((stringIndex: number) => {
    const pitches = getPitches(score);
    kotoSynth.pluck(stringIndex, pitches[stringIndex], 0, 0.85);

    mutateScore(draft => {
      let m = cursor.m;
      let b = cursor.b;
      let s = cursor.s;

      while (m >= draft.measures.length) {
        draft.measures.push(createNewMeasure(draft.beatsPerMeasure));
      }

      const beat = draft.measures[m].beats[b];
      if (cursor.low && beat.div === 1) {
        beat.div = 2;
        const oldSlot = beat.slots[0];
        beat.slots = [oldSlot, createNewSlot()];
        s = 1;
      }

      if (s === 0 && beat.div !== inputDiv && beat.slots[0].notes.length === 0 && !beat.slots[0].rest) {
        beat.div = inputDiv;
        beat.slots = Array.from({ length: inputDiv }, () => createNewSlot());
      }

      const slot = beat.slots[s];
      slot.rest = false;
      slot.tie = false;

      if (isChordMode) {
        if (slot.notes.includes(stringIndex)) {
          slot.notes = slot.notes.filter(n => n !== stringIndex);
        } else {
          slot.notes = [...slot.notes, stringIndex].sort((x, y) => x - y);
        }
      } else {
        slot.notes = [stringIndex];
      }

      setLastEnteredSlot({ m, b, s });

      if (!isChordMode) {
        let nextS = s + 1;
        let nextB = b;
        let nextM = m;

        if (nextS >= beat.div) {
          nextS = 0;
          nextB++;
          if (nextB >= draft.beatsPerMeasure) {
            nextB = 0;
            nextM++;
            if (nextM >= draft.measures.length) {
              draft.measures.push(createNewMeasure(draft.beatsPerMeasure));
            }
          }
        }
        setCursor({ m: nextM, b: nextB, s: nextS, low: false });
      }
    });
  }, [score, cursor, inputDiv, isChordMode, mutateScore]);

  // Rest, Tie, Clear
  const handleInputRest = useCallback(() => {
    mutateScore(draft => {
      const beat = draft.measures[cursor.m]?.beats[cursor.b];
      if (!beat) return;
      const slot = beat.slots[cursor.s];
      if (!slot) return;
      slot.notes = [];
      slot.tie = false;
      slot.rest = true;
    });
  }, [cursor, mutateScore]);

  const handleInputTie = useCallback(() => {
    mutateScore(draft => {
      const beat = draft.measures[cursor.m]?.beats[cursor.b];
      if (!beat) return;
      const slot = beat.slots[cursor.s];
      if (!slot) return;
      slot.notes = [];
      slot.rest = false;
      slot.repeat2 = false;
      slot.tie = true;
    });
  }, [cursor, mutateScore]);

  const handleInputRepeat2 = useCallback(() => {
    mutateScore(draft => {
      const beat = draft.measures[cursor.m]?.beats[cursor.b];
      if (!beat) return;
      const slot = beat.slots[cursor.s];
      if (!slot) return;
      slot.notes = [];
      slot.rest = false;
      slot.tie = false;
      slot.repeat2 = true;
    });
  }, [cursor, mutateScore]);

  const handleInputClear = useCallback(() => {
    mutateScore(draft => {
      // If multiple slots are selected (like Excel multi-select cells)
      if (selectedSlotKeys.size > 0) {
        selectedSlotKeys.forEach(k => {
          const [mStr, bStr, sStr] = k.split('-');
          const m = parseInt(mStr, 10);
          const b = parseInt(bStr, 10);
          const s = parseInt(sStr, 10);
          const slot = draft.measures[m]?.beats[b]?.slots[s];
          if (slot) {
            slot.notes = [];
            slot.rest = false;
            slot.tie = false;
            slot.oshi = 0;
            slot.finger = undefined;
            LEFT_HAND_ORNS.forEach(key => (slot[key] = false));
            RIGHT_HAND_ORNS.forEach(key => (slot[key] = false));
          }
        });
        setSelectedSlotKeys(new Set());
        return;
      }

      // If a measure range is selected
      if (selectedRange) {
        for (let m = selectedRange[0]; m <= selectedRange[1]; m++) {
          const meas = draft.measures[m];
          if (meas) {
            meas.beats.forEach(b => {
              b.slots.forEach(slot => {
                slot.notes = [];
                slot.rest = false;
                slot.tie = false;
                slot.oshi = 0;
                slot.finger = undefined;
                LEFT_HAND_ORNS.forEach(key => (slot[key] = false));
                RIGHT_HAND_ORNS.forEach(key => (slot[key] = false));
              });
            });
          }
        }
        return;
      }

      const beat = draft.measures[cursor.m]?.beats[cursor.b];
      if (!beat) return;
      const slot = beat.slots[cursor.s];
      if (!slot) return;
      slot.notes = [];
      slot.rest = false;
      slot.tie = false;
      slot.oshi = 0;
      slot.finger = undefined;
      LEFT_HAND_ORNS.forEach(k => (slot[k] = false));
      RIGHT_HAND_ORNS.forEach(k => (slot[k] = false));
    });
  }, [cursor, selectedSlotKeys, selectedRange, mutateScore]);

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
      const targetPos = lastEnteredSlot || cursor;
      const slot = draft.measures[targetPos.m]?.beats[targetPos.b]?.slots[targetPos.s];
      if (!slot) return;

      if (ornKey === 'oshi1') {
        slot.oshi = slot.oshi === 1 ? 0 : 1;
      } else if (ornKey === 'oshi2') {
        slot.oshi = slot.oshi === 2 ? 0 : 2;
      } else {
        const val = !(slot as any)[ornKey];
        if (ornKey === 'kaki' && val) slot.hiki = false;
        if (ornKey === 'hiki' && val) slot.kaki = false;
        (slot as any)[ornKey] = val;
      }
    });
  }, [cursor, lastEnteredSlot, mutateScore]);

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

  const handleCopyMeasure = useCallback(() => {
    const [start, end] = selectedRange ? selectedRange : [cursor.m, cursor.m];
    clipboardRef.current = JSON.parse(JSON.stringify(score.measures.slice(start, end + 1)));
  }, [score, selectedRange, cursor.m]);

  const handlePasteMeasure = useCallback(() => {
    if (!clipboardRef.current || !clipboardRef.current.length) return;
    mutateScore(draft => {
      const copied = JSON.parse(JSON.stringify(clipboardRef.current));
      draft.measures.splice(cursor.m, 0, ...copied);
    });
  }, [cursor.m, mutateScore]);

  // Click on Slot in Score (Supports Excel-like multi-cell selection with Shift / Ctrl)
  const handleSlotClick = useCallback(
    (mIdx: number, bIdx: number, sIdx: number, low?: boolean, modifierKey?: boolean) => {
      const slotKey = `${mIdx}-${bIdx}-${sIdx}`;

      if (modifierKey) {
        // Toggle or add to multi-cell selection set
        setSelectedSlotKeys(prev => {
          const next = new Set(prev);
          if (next.has(slotKey)) {
            next.delete(slotKey);
          } else {
            next.add(slotKey);
          }
          return next;
        });
      } else {
        // Single selection resets multi-select
        setSelectedSlotKeys(new Set());
        setSelectedRange(null);
        setSelAnchor(null);
      }

      setCursor({ m: mIdx, b: bIdx, s: sIdx, low });
      setLastEnteredSlot(null);

      const sl = score.measures[mIdx]?.beats[bIdx]?.slots[sIdx];
      if (sl && sl.notes?.length && !isPlaying) {
        previewSlot(sl);
      }
    },
    [score, isPlaying, previewSlot]
  );

  const handleMeasureClick = useCallback(
    (mIdx: number) => {
      setCursor({ m: mIdx, b: 0, s: 0 });
      startPlayback(mIdx * score.beatsPerMeasure);
    },
    [score.beatsPerMeasure, startPlayback]
  );

  const handleLyricsChange = useCallback((mIdx: number, bIdx: number, text: string) => {
    setScore(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next.measures[mIdx]?.beats[bIdx]) {
        next.measures[mIdx].beats[bIdx].lyrics = text;
      }
      return next;
    });
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        if (e.key === 'Escape') (document.activeElement as HTMLElement).blur();
        return;
      }

      const mod = e.ctrlKey || e.metaKey;

      if (mod) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
          return;
        }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
          return;
        }
        if (e.key === 'c') {
          e.preventDefault();
          handleCopyMeasure();
          return;
        }
        if (e.key === 'v') {
          e.preventDefault();
          handlePasteMeasure();
          return;
        }
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          // Select all slots across the score (Excel-like Ctrl+A)
          const allKeys = new Set<string>();
          score.measures.forEach((meas, m) => {
            meas.beats.forEach((b, bIdx) => {
              b.slots.forEach((_, sIdx) => {
                allKeys.add(`${m}-${bIdx}-${sIdx}`);
              });
            });
          });
          setSelectedSlotKeys(allKeys);
          return;
        }
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          window.print();
          return;
        }
        if (e.key === 's') {
          e.preventDefault();
          setIsExportOpen(true);
          return;
        }
      }

      // Space: Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.shiftKey) {
          startPlayback(cursor.m * score.beatsPerMeasure + cursor.b);
        } else {
          togglePlay();
        }
        return;
      }

      // Escape: Stop playback or clear selection
      if (e.key === 'Escape') {
        if (isPlaying) {
          stopPlayback();
        } else {
          setSelectedSlotKeys(new Set());
          setSelectedRange(null);
          setSelAnchor(null);
        }
        return;
      }

      // Division length Q, W, E, R
      if (e.key === 'q' || e.key === 'Q') {
        setInputDiv(1);
        return;
      }
      if (e.key === 'w' || e.key === 'W') {
        setInputDiv(2);
        return;
      }
      if (e.key === 'e' || e.key === 'E') {
        setInputDiv(3);
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        setInputDiv(4);
        return;
      }

      // Rest (P or .) & Tie (T or ,)
      if (e.key === 'p' || e.key === 'P' || e.key === '.') {
        handleInputRest();
        return;
      }
      if (e.key === 't' || e.key === 'T' || e.key === ',') {
        handleInputTie();
        return;
      }

      // Delete & Backspace
      if (e.key === 'Delete') {
        handleInputClear();
        return;
      }

      // Left-hand ornaments: Z=oshi1, X=oshi2, Y=ato, U=hanashi, I=hikiiro, O=tsuki, M=yuri
      const ornMap: Record<string, string> = {
        z: 'oshi1',
        x: 'oshi2',
        y: 'ato',
        u: 'hanashi',
        i: 'hikiiro',
        o: 'tsuki',
        m: 'yuri',
        c: 'sukui',
        v: 'kaki',
        b: 'hiki',
        n: 'trem',
        '/': 'nagashi'
      };
      if (ornMap[e.key.toLowerCase()]) {
        handleToggleOrn(ornMap[e.key.toLowerCase()]);
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const v = score.view.layout === 'vertical';
        setCursor(prev => {
          let m = prev.m;
          let b = prev.b;
          let s = prev.s;
          const beat = score.measures[m]?.beats[b] || { div: 1 };

          if (v) {
            if (e.key === 'ArrowDown') {
              s++;
              if (s >= beat.div) {
                s = 0;
                b++;
                if (b >= score.beatsPerMeasure) {
                  b = 0;
                  m = Math.min(score.measures.length - 1, m + 1);
                }
              }
            } else if (e.key === 'ArrowUp') {
              s--;
              if (s < 0) {
                b--;
                if (b < 0) {
                  m = Math.max(0, m - 1);
                  b = score.beatsPerMeasure - 1;
                }
                const prevBeat = score.measures[m]?.beats[b] || { div: 1 };
                s = prevBeat.div - 1;
              }
            } else if (e.key === 'ArrowLeft') {
              m = Math.min(score.measures.length - 1, m + score.view.perLine);
            } else if (e.key === 'ArrowRight') {
              m = Math.max(0, m - score.view.perLine);
            }
          } else {
            if (e.key === 'ArrowRight') {
              s++;
              if (s >= beat.div) {
                s = 0;
                b++;
                if (b >= score.beatsPerMeasure) {
                  b = 0;
                  m = Math.min(score.measures.length - 1, m + 1);
                }
              }
            } else if (e.key === 'ArrowLeft') {
              s--;
              if (s < 0) {
                b--;
                if (b < 0) {
                  m = Math.max(0, m - 1);
                  b = score.beatsPerMeasure - 1;
                }
                const prevBeat = score.measures[m]?.beats[b] || { div: 1 };
                s = prevBeat.div - 1;
              }
            } else if (e.key === 'ArrowDown') {
              m = Math.min(score.measures.length - 1, m + score.view.perLine);
            } else if (e.key === 'ArrowUp') {
              m = Math.max(0, m - score.view.perLine);
            }
          }

          return { m, b, s, low: false };
        });
        return;
      }

      // Enter: Advance measure
      if (e.key === 'Enter') {
        setCursor(prev => ({
          m: Math.min(score.measures.length - 1, prev.m + 1),
          b: 0,
          s: 0,
          low: false
        }));
        return;
      }

      // Strings: Number row 1~0, -, ^, ¥
      const row1Idx = KEYBOARD_ROW1.indexOf(e.key as any);
      if (row1Idx >= 0) {
        inputString(row1Idx);
        return;
      }

      // Home row: A~], @
      const homeIdx = KEYBOARD_HOME.indexOf(e.key.toLowerCase() as any);
      if (homeIdx >= 0) {
        inputString(homeIdx);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    score,
    cursor,
    isPlaying,
    handleUndo,
    handleRedo,
    handleCopyMeasure,
    handlePasteMeasure,
    togglePlay,
    stopPlayback,
    startPlayback,
    handleInputRest,
    handleInputTie,
    handleInputClear,
    handleToggleOrn,
    inputString
  ]);

  const curSlot = score.measures[cursor.m]?.beats[cursor.b]?.slots[cursor.s] || null;
  const targetSlot = lastEnteredSlot
    ? score.measures[lastEnteredSlot.m]?.beats[lastEnteredSlot.b]?.slots[lastEnteredSlot.s]
    : curSlot;

  const currentOrns: Record<string, boolean> = {
    oshi1: targetSlot?.oshi === 1,
    oshi2: targetSlot?.oshi === 2,
    ato: !!targetSlot?.ato,
    hanashi: !!targetSlot?.hanashi,
    hikiiro: !!targetSlot?.hikiiro,
    tsuki: !!targetSlot?.tsuki,
    yuri: !!targetSlot?.yuri,
    sukui: !!targetSlot?.sukui,
    kaki: !!targetSlot?.kaki,
    hiki: !!targetSlot?.hiki,
    trem: !!targetSlot?.trem,
    nagashi: !!targetSlot?.nagashi
  };

  return (
    <div className="min-h-screen bg-[#edece8] text-stone-900 flex flex-col font-sans">
      {/* Container */}
      <div className="w-full max-w-[1360px] mx-auto p-2 sm:p-3 flex flex-col gap-2">
        {/* Header (Top app bar with title, actions, and collapsible settings) */}
        <Header
          score={score}
          onUpdateScoreMeta={meta => mutateScore(d => Object.assign(d, meta))}
          onUpdateView={view => mutateScore(d => Object.assign(d.view, view))}
          onOpenLibrary={() => setIsLibraryOpen(true)}
          onOpenTuning={() => setIsTuningOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenPracticeMode={() => setIsPracticeMode(true)}
          onPrint={() => window.print()}
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
          onSetPerLine={perLine => mutateScore(d => (d.view.perLine = perLine))}
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
            <div className="min-w-fit mx-auto flex justify-center">
              <ScoreSheetVertical
                score={score}
                cursor={cursor}
                currentPlayKey={currentPlayKey}
                selectedRange={selectedRange}
                selectedSlotKeys={selectedSlotKeys}
                onSlotClick={handleSlotClick}
                onMeasureClick={handleMeasureClick}
                onLyricsChange={handleLyricsChange}
                onUpdateScoreMeta={meta => mutateScore(d => Object.assign(d, meta))}
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
                cursor={cursor}
                currentPlayKey={currentPlayKey}
                selectedRange={selectedRange}
                selectedSlotKeys={selectedSlotKeys}
                onSlotClick={handleSlotClick}
                onMeasureClick={handleMeasureClick}
                onLyricsChange={handleLyricsChange}
                onUpdateScoreMeta={meta => mutateScore(d => Object.assign(d, meta))}
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
        <div className="sticky bottom-1 z-30">
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
            onSetInputDiv={setInputDiv}
            onToggleChordMode={() => setIsChordMode(!isChordMode)}
            onInputRest={handleInputRest}
            onInputTie={handleInputTie}
            onInputRepeat2={handleInputRepeat2}
            onInputClear={handleInputClear}
            onToggleOrn={handleToggleOrn}
            onAddMeasure={handleAddMeasure}
            onInsertMeasure={handleInsertMeasure}
            onDeleteMeasure={handleDeleteMeasure}
            onCopyMeasure={handleCopyMeasure}
            onPasteMeasure={handlePasteMeasure}
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
            onTempoChange={bpm => mutateScore(d => (d.tempo = bpm))}
            onToggleKotoBoard={() => mutateScore(d => { d.view.showKotoBoard = !d.view.showKotoBoard; })}
          />
        </div>

        {/* Virtual 13-String Koto Instrument (Placed at the very bottom, out of the way) */}
        {score.view.showKotoBoard && (
          <div className="no-print mt-1 pb-4">
            <VirtualKoto
              score={score}
              onSelectString={inputString}
              activeStrings={curSlot?.notes || []}
              onClose={() => mutateScore(d => (d.view.showKotoBoard = false))}
            />
          </div>
        )}
      </div>

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
        onLoadScore={s => {
          pushUndo(score);
          setScore(s);
          setCursor({ m: 0, b: 0, s: 0 });
        }}
      />

      <ExportModal
        score={score}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onImportScore={s => {
          pushUndo(score);
          setScore(s);
          setCursor({ m: 0, b: 0, s: 0 });
        }}
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
          onSetTempo={bpm => mutateScore(d => (d.tempo = bpm))}
          onSetMetronome={setMetronome}
          onSetLoop={(active, a, b) => {
            setLoopActive(active);
            if (a != null && b != null) setLoopRange([a, b]);
          }}
          onSelectMeasure={mIdx => setCursor({ m: mIdx, b: 0, s: 0, low: false })}
          onSlotClick={handleSlotClick}
          onClose={() => setIsPracticeMode(false)}
          onUpdateScoreMeta={meta => mutateScore(d => Object.assign(d, meta))}
        />
      )}
    </div>
  );
}
