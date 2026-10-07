/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KotoScore, KANJI_STRINGS, KEYBOARD_ROW1, KEYBOARD_HOME, getPitches, noteName, midiToHz } from '../types/koto';
import { kotoSynth } from '../audio/kotoSynth';

interface VirtualKotoProps {
  score: KotoScore;
  onSelectString?: (strIndex: number) => void;
  activeStrings?: number[];
}

export const VirtualKoto: React.FC<VirtualKotoProps> = ({ score, onSelectString, activeStrings = [] }) => {
  const pitches = getPitches(score);
  const [vibrating, setVibrating] = useState<Record<number, boolean>>({});

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

  // Bridge position (琴柱の位置): higher pitch -> bridge positioned further right (85%), lower -> further left (25%)
  const minMidi = 50;
  const maxMidi = 85;

  return (
    <div className="w-full select-none rounded-xl border border-amber-900/40 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 p-2.5 shadow-xl sm:p-4 text-stone-100">
      <div className="mb-2 flex items-center justify-between text-xs text-amber-200/80">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
          <span className="font-medium tracking-wide">十三絃 箏盤（仮想奏台）</span>
          <span className="hidden sm:inline text-amber-300/60">— クリックまたはキーで試奏・入力</span>
        </div>
        <div className="text-[11px] text-amber-300/70">
          調弦: <span className="font-semibold text-amber-100">{score.tuning.preset === 'custom' ? 'カスタム' : score.tuning.preset}</span> (一＝{noteName(score.tuning.root, false)})
        </div>
      </div>

      {/* Koto Body Simulation */}
      <div className="relative flex flex-col gap-1.5 rounded-lg bg-gradient-to-b from-[#b37d4e] via-[#945f34] to-[#714421] p-3 shadow-inner border border-amber-950/60 overflow-x-auto">
        {/* Subtle Paulownia wood grain texture line */}
        <div className="pointer-events-none absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* 13 Strings */}
        {KANJI_STRINGS.map((kanji, idx) => {
          const midi = pitches[idx];
          const isVib = vibrating[idx] || activeStrings.includes(idx);
          const ratio = Math.max(0.15, Math.min(0.85, (midi - minMidi) / (maxMidi - minMidi)));
          const bridgePercent = 20 + ratio * 60; // 20% to 80%

          return (
            <div
              key={idx}
              onClick={() => handlePluck(idx)}
              className="group relative flex h-7 sm:h-8 w-full min-w-[560px] cursor-pointer items-center transition-all duration-100"
            >
              {/* Left label: Kanji & Shortcuts */}
              <div className="z-10 flex w-20 sm:w-24 shrink-0 items-center gap-1.5 pl-1">
                <span className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md font-score font-bold text-sm shadow transition-colors ${
                  isVib ? 'bg-amber-300 text-stone-900 scale-110 shadow-amber-300/50' : 'bg-amber-950/80 text-amber-100 group-hover:bg-amber-800'
                }`}>
                  {kanji}
                </span>
                <div className="flex flex-col text-[10px] leading-tight text-amber-200/90 font-mono">
                  <span>{KEYBOARD_ROW1[idx]}<span className="opacity-50 sm:inline hidden">/{KEYBOARD_HOME[idx]}</span></span>
                </div>
              </div>

              {/* String wire container */}
              <div className="relative flex-1 h-full flex items-center px-2">
                {/* Visual String Wire */}
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
                  className="pointer-events-none absolute -translate-x-1/2 -top-1 flex flex-col items-center transition-all duration-300"
                  title="琴柱 (Ji)"
                >
                  <div className="w-2.5 h-4 sm:w-3 sm:h-5 bg-gradient-to-b from-amber-50 to-stone-300 clip-triangle shadow-md rounded-[1px] border border-amber-900/40"></div>
                </div>
              </div>

              {/* Right label: Pitch name & frequency */}
              <div className="z-10 flex w-16 sm:w-20 shrink-0 justify-end items-center pr-2 font-mono text-[11px] text-amber-100/90">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider ${
                  isVib ? 'bg-amber-400 text-stone-950' : 'bg-amber-950/60 text-amber-200'
                }`}>
                  {noteName(midi)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
