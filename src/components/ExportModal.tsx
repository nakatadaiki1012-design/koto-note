/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KotoScore } from '../types/koto';
import { exportScoreToWav } from '../utils/wavExport';
import { exportScoreToMidi } from '../utils/midiExport';
import { Download, Upload, Music, Printer, FileText, CheckCircle2, Loader2 } from 'lucide-react';

interface ExportModalProps {
  score: KotoScore;
  isOpen: boolean;
  onClose: () => void;
  onImportScore: (score: KotoScore) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  score,
  isOpen,
  onClose,
  onImportScore
}) => {
  const [isRenderingWav, setIsRenderingWav] = useState(false);
  const [wavProgress, setWavProgress] = useState(0);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(score, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    downloadBlob(blob, `${score.title || '琴譜'}.json`);
  };

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(score, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleExportMidi = () => {
    const midiBlob = exportScoreToMidi(score);
    downloadBlob(midiBlob, `${score.title || '琴譜'}.mid`);
  };

  const handleExportWav = async () => {
    try {
      setIsRenderingWav(true);
      setWavProgress(10);
      const wavBlob = await exportScoreToWav(score, p => setWavProgress(p));
      downloadBlob(wavBlob, `${score.title || '琴譜'}.wav`);
    } catch (err) {
      console.error('WAV export error:', err);
      alert('音声の書き出しに失敗しました');
    } finally {
      setIsRenderingWav(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed || !Array.isArray(parsed.measures)) {
          throw new Error('琴譜のデータ形式ではありません');
        }
        onImportScore(parsed);
        onClose();
      } catch (err: any) {
        alert('ファイルの読み込みに失敗しました: ' + (err.message || ''));
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-stone-50 border border-stone-300 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h2 className="text-xl font-bold font-score text-stone-900">保存・書き出し・印刷</h2>
            <p className="text-xs text-stone-500 mt-0.5">譜面データの保存、音源出力、PDF印刷</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* WAV & MIDI Audio Exports */}
          <div className="rounded-xl border border-amber-900/20 bg-amber-50/50 p-4">
            <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5 mb-2">
              <Music className="h-4 w-4 text-amber-700" /> 音声・音楽ファイル出力
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleExportWav}
                disabled={isRenderingWav}
                className="flex items-center justify-between rounded-lg border border-amber-300 bg-white p-3 text-left shadow-2xs hover:bg-amber-50 disabled:opacity-50 transition-colors"
              >
                <div>
                  <div className="font-bold text-sm text-stone-900">WAV 音声書き出し</div>
                  <div className="text-[11px] text-stone-500">箏の撥弦モデルで演奏を録音</div>
                </div>
                {isRenderingWav ? (
                  <div className="flex items-center gap-1 text-xs text-amber-700 font-bold">
                    <Loader2 className="h-4 w-4 animate-spin" /> {wavProgress}%
                  </div>
                ) : (
                  <Download className="h-4 w-4 text-amber-800" />
                )}
              </button>

              <button
                onClick={handleExportMidi}
                className="flex items-center justify-between rounded-lg border border-amber-300 bg-white p-3 text-left shadow-2xs hover:bg-amber-50 transition-colors"
              >
                <div>
                  <div className="font-bold text-sm text-stone-900">MIDI 書き出し (.mid)</div>
                  <div className="text-[11px] text-stone-500">DAWや楽譜ソフトで利用可能</div>
                </div>
                <Download className="h-4 w-4 text-amber-800" />
              </button>
            </div>
          </div>

          {/* JSON File & Backup */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-2">
              <FileText className="h-4 w-4 text-stone-600" /> 譜面データ（JSON）
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-stone-100/80 px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-200"
              >
                <Download className="h-3.5 w-3.5" /> JSON ファイルを保存
              </button>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-stone-100/80 px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-200"
              >
                {copiedJson ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> コピー完了
                  </>
                ) : (
                  'JSON をクリップボードにコピー'
                )}
              </button>
              <label className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-100 cursor-pointer">
                <Upload className="h-3.5 w-3.5" /> JSON ファイルを読み込む
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Print & PDF */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-2">
              <Printer className="h-4 w-4 text-stone-600" /> 印刷 / PDF保存
            </h3>
            <p className="text-xs text-stone-600 mb-3">
              印刷画面で操作パネルを除いた清書譜面が出力されます。PDF化する場合は印刷ダイアログの送信先で「PDFに保存」を選択してください。
            </p>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
            >
              <Printer className="h-4 w-4" /> 印刷プレビューを開く (Ctrl+P)
            </button>
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
