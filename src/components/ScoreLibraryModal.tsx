/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KotoScore, createEmptyScore } from '../types/koto';
import { PRESET_SONGS, PresetSongInfo } from '../data/presetScores';
import { BookOpen, FolderHeart, Plus, Copy, Trash2, ArrowRight } from 'lucide-react';

interface ScoreLibraryModalProps {
  score: KotoScore;
  isOpen: boolean;
  onClose: () => void;
  onLoadScore: (score: KotoScore) => void;
}

const STORAGE_KEY = 'koto_saved_scores_v2';

export const ScoreLibraryModal: React.FC<ScoreLibraryModalProps> = ({
  score,
  isOpen,
  onClose,
  onLoadScore
}) => {
  const [savedScores, setSavedScores] = useState<KotoScore[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedScores(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const persistScores = (list: KotoScore[]) => {
    setSavedScores(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleSaveCurrent = () => {
    const newScore = {
      ...score,
      id: score.id || `score_${Date.now()}`,
      updatedAt: Date.now()
    };
    const existingIndex = savedScores.findIndex(s => s.id === newScore.id);
    let updated;
    if (existingIndex >= 0) {
      updated = [...savedScores];
      updated[existingIndex] = newScore;
    } else {
      updated = [newScore, ...savedScores];
    }
    persistScores(updated);
    alert(`「${newScore.title || '無題'}」を保存しました`);
  };

  const handleLoadPreset = (preset: PresetSongInfo) => {
    const s = preset.score();
    onLoadScore(s);
    onClose();
  };

  const handleCreateNew = () => {
    const s = createEmptyScore();
    onLoadScore(s);
    onClose();
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('この保存譜面を削除しますか？')) return;
    const updated = savedScores.filter(s => s.id !== id);
    persistScores(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-stone-50 border border-stone-300 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h2 className="text-xl font-bold font-score text-stone-900">楽曲ライブラリ</h2>
            <p className="text-xs text-stone-500 mt-0.5">古典名曲プリセットの読み込みとマイ譜面保存</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Classical Preset Pieces */}
          <div>
            <h3 className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-2.5">
              <BookOpen className="h-4 w-4 text-amber-700" /> 古典・お手本楽曲プリセット
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESET_SONGS.map(song => (
                <div
                  key={song.id}
                  onClick={() => handleLoadPreset(song)}
                  className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs hover:border-amber-600 hover:shadow-md cursor-pointer transition-all"
                >
                  <div>
                    <span className="inline-block text-[10px] font-semibold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded mb-1">
                      {song.tuningName}
                    </span>
                    <h4 className="font-bold text-base font-score text-stone-900 group-hover:text-amber-800">
                      {song.title}
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">{song.subtitle}</p>
                    <p className="text-[11px] text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                      {song.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-semibold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                    この曲を開く <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions: New Blank & Save Current */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100"
            >
              <Plus className="h-3.5 w-3.5 text-stone-600" /> 新規空白の譜面を作成
            </button>
            <button
              onClick={handleSaveCurrent}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-950 hover:bg-indigo-100"
            >
              <FolderHeart className="h-3.5 w-3.5 text-indigo-700" /> 現在の譜面をマイ保存に追加
            </button>
          </div>

          {/* Saved Scores in LocalStorage */}
          <div>
            <h3 className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-2.5">
              <FolderHeart className="h-4 w-4 text-stone-600" /> ブラウザ保存済み譜面 ({savedScores.length})
            </h3>
            {savedScores.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-xs text-stone-500">
                まだブラウザに保存された譜面はありません。「現在の譜面をマイ保存に追加」ボタンでいつでも保存できます。
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {savedScores.map(saved => (
                  <div
                    key={saved.id}
                    onClick={() => {
                      onLoadScore(saved);
                      onClose();
                    }}
                    className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-bold text-sm text-stone-900 font-score">{saved.title || '無題'}</div>
                      <div className="text-[11px] text-stone-500">
                        {saved.tuning?.preset}・♩={saved.tempo}・{saved.measures.length}小節
                        {saved.updatedAt && ` · ${new Date(saved.updatedAt).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => handleDeleteSaved(saved.id || '', e)}
                        className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-stone-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-300"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
