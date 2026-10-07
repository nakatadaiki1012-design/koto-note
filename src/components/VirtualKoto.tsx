/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KotoScore, KANJI_STRINGS, KEYBOARD_ROW1, KEYBOARD_HOME, getPitches, noteName, midiToHz } from '../types/koto';
import { kotoSynth } from '../audio/kotoSynth';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface VirtualKotoProps {
  score: KotoScore;
  onSelectString?: (strIndex: number) => void;
  activeStrings?: number[];
  onClose?: () => void;
}

export const VirtualKoto: React.FC<VirtualKotoProps> = ({
  score,
  onSelectString,
  activeStrings = [],
  onClose
}) => {
  const pitches = getPitches(score);
  const [vibrating, setVibrating] = useState<Record<number, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Listen to real-time audio triggers from synth
    const unsubscribe = kotoSynth.onStringTrigger((strIdx) => {
      triggerVibration(strIdx);
    });
    return unsubscribe;
  }, []);

  const triggerVibration = (strIdx: number) => {
    setVibrating(prev => ({ ...prev, [strIdx]: true }));
    setTimeout(() => {
      setVibrating(prev => ({ ...prev, [strIdx]: false }));
    }, 450);
  };

  const handlePluck = (strIdx: number) => {
    const midi = pitches[strIdx];
    kotoSynth.pluck(strIdx, midi, 0, 0.85);
    triggerVibration(strIdx);
    if (onSelectString) {
      onSelectString(strIdx);
    }
  };

  const minMidi = 50;
  const maxMidi = 85;

  return (
    <div className="w-full select-none rounded-xl border border-amber-900/40 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 p-2 sm:p-3 shadow-xl text-stone-100 transition-all">
      {/* Header bar with title, tuning info, collapse, and close buttons */}
      <div className="flex items-center justify-between text-xs text-amber-200/90 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
          <span className="font-bold tracking-wide">十三絃 仮想琴台（奏台）</span>
          <span className="hidden sm:inline text-amber-300/60 text-[11px]">— 絃をクリックして試奏・入力</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] text-amber-300/80 hidden sm:block">
            調弦: <span className="font-semibold text-amber-100">{score.tuning.preset === 'custom' ? 'カスタム' : score.tuning.preset}</span> (一＝{noteName(score.tuning.root, false)})
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-amber-300/80 hover:bg-amber-900/60 hover:text-amber-100 cursor-pointer"
            title={isCollapsed ? '琴台を展開' : '琴台を折りたたむ'}
          >
            {isCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{isCollapsed ? '展開' : '畳む'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-amber-950/80 text-amber-200 hover:bg-amber-800 hover:text-white cursor-pointer transition-colors border border-amber-800/60"
              title="琴台を閉じる"
            >
              <X className="h-3.5 w-3.5" />
              <span>閉じる</span>
            </button>
          )}
        </div>
      </div>

      {/* Koto Strings Body (Shown when not collapsed) */}
      {!isCollapsed && (
        <div className="relative flex flex-col gap-1 rounded-lg bg-gradient-to-b from-[#b37d4e] via-[#945f34] to-[#714421] p-2.5 shadow-inner border border-amber-950/60 overflow-x-auto">
          {/* Subtle Paulownia wood grain texture */}
          <div className="pointer-events-none absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

          {/* 13 Strings */}
          {KANJI_STRINGS.map((kanji, idx) => {
            const midi = pitches[idx];
            const isVib = vibrating[idx] || activeStrings.includes(idx);
            const ratio = Math.max(0.15, Math.min(0.85, (midi - minMidi) / (maxMidi - minMidi)));
            const bridgePercent = 20 + ratio * 60;

            return (
              <div
                key={idx}
                onClick={() => handlePluck(idx)}
                className="group relative flex h-6 sm:h-7 w-full min-w-[520px] cursor-pointer items-center transition-all duration-100"
              >
                {/* Left label: Kanji & Shortcuts */}
                <div className="z-10 flex w-18 sm:w-20 shrink-0 items-center gap-1.5 pl-1">
                  <span className={`flex h-5 w-5 items-center justify-center rounded font-score font-bold text-xs shadow transition-colors ${
                    isVib ? 'bg-amber-300 text-stone-900 scale-110 shadow-amber-300/50' : 'bg-amber-950/80 text-amber-100 group-hover:bg-amber-800'
                  }`}>
                    {kanji}
                  </span>
                  <div className="flex flex-col text-[9px] leading-tight text-amber-200/90 font-mono">
                    <span>{KEYBOARD_ROW1[idx]}</span>
                  </div>
                </div>

                {/* String wire container */}
                <div className="relative flex-1 h-full flex items-center px-2">
                  <div
                    className={`w-full transition-all duration-100 ${
                      isVib
                        ? 'h-[2.5px] bg-yellow-200 shadow-[0_0_8px_#fde047] scale-y-150 animate-pulse'
                        : 'h-[1.5px] bg-amber-100/90 shadow-[0_1px_2px_rgba(0,0,0,0.6)] group-hover:bg-yellow-200/80'
                    }`}
                  />

                  {/* Kotoji (琴柱) Bridge graphic */}
                  <div
                    style={{ left: `${bridgePercent}%` }}
                    className="pointer-events-none absolute -translate-x-1/2 -top-0.5 flex flex-col items-center transition-all duration-300"
                    title="琴柱 (Ji)"
                  >
                    <div className="w-2.5 h-3.5 sm:w-3 sm:h-4 bg-gradient-to-b from-amber-50 to-stone-300 clip-triangle shadow-md rounded-[1px] border border-amber-900/40"></div>
                  </div>
                </div>

                {/* Right label: Pitch name */}
                <div className="z-10 flex w-14 sm:w-16 shrink-0 justify-end items-center pr-2 font-mono text-[10px] text-amber-100/90">
                  <span className={`px-1 py-0.5 rounded text-[10px] font-semibold ${
                    isVib ? 'bg-amber-400 text-stone-950' : 'bg-amber-950/60 text-amber-200'
                  }`}>
                    {noteName(midi)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
