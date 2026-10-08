/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { KotoScore, KANJI_STRINGS } from '../types/koto';
import { Copy, CheckCircle2, Download, Sparkles, BookOpen, Image as ImageIcon, ExternalLink, RefreshCw } from 'lucide-react';

interface NoteArticleModalProps {
  score: KotoScore;
  isOpen: boolean;
  onClose: () => void;
}

export const NoteArticleModal: React.FC<NoteArticleModalProps> = ({ score, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'article' | 'screenshot'>('article');
  const [copiedArticle, setCopiedArticle] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const headerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const articleTitle = `【個人開発】和楽器の楽譜をもっと身近に！ブラウザで動く本格「琴譜エディタ」を作っています【現在開発中】`;

  const articleBody = `こんにちは！日本の伝統楽器「箏（こと・そう）」の楽譜を、ブラウザ上で直感的に作成・再生・編集・印刷できるWebアプリ**「琴譜エディタ（Koto Note）」**を個人開発しています。

現在まだ**開発中のベータ版**ですが、箏を演奏される方、和楽器やDTMに興味のある方にぜひ知っていただき、ご意見やフィードバックをいただきたく、開発の背景と現在の機能をnoteにまとめました！

---

## 開発の背景：なぜ「琴譜エディタ」を作ったのか？

箏（琴）の楽譜には、西洋音楽の五線譜とは大きく異なる、伝統的で合理的な記譜法があります。
中でも広く使われているのが、絃の番号（一・二・三…十・斗・為・巾）を漢数字や数字で書き表す**「文化譜（数字譜）」**や**「糸譜」**です。

しかし、現在コンピュータで箏の楽譜を作ろうとすると、以下のような悩みに直面します：

1. **五線譜用の楽譜作成ソフト（MuseScoreやFinaleなど）では和楽器譜が作りにくい**
   - 漢数字の縦書き配置や、和楽器特有の拍の区切り線、押し手や流し爪の記号に対応していない。
2. **手書きやWord/Excelでの作成はレイアウト調整や修正がとても大変**
3. **音の確認（試聴）ができない**
   - 調弦（平調子・雲井調子など）に合わせた箏特有の響きでプレビューする手軽な手段がない。

「**インストール不要で、スマホやPCのブラウザから誰でもサクサク縦書きの本格的な琴譜を作れて、その場で綺麗な箏の音で試聴できるツールがあればいいのに！**」

そんな思いから、この「琴譜エディタ」の開発をスタートしました。

---

## 主な機能と特徴（現在実装できていること）

### 1. 縦書き「伝統譜」と横書き「文化譜」の瞬時切り替え
日本の伝統的な縦書き楽譜（右から左へ流れる家庭式糸譜・文化譜スタイル）と、現代的な横書きレイアウトをワンクリックで切り替え可能です。
小節線や拍の区切り、繰り返し記号（〃、く、ゝ）や休符（○）も綺麗に清書されます。

### 2. 本格的な和楽器・箏のWeb Audio物理モデル音源で自動試聴
作成した楽譜は、再生ボタンを押すだけでその場で箏の撥弦サウンドで試聴できます。
テンポ変更、ループ練習、メトロノーム、カウントイン機能も搭載しており、**「耳で聴きながら確認する・練習する」**ことが可能です。

### 3. 多彩な伝統調弦プリセット＆カスタム調弦
- 平調子（一＝D）
- 本雲井調子
- 中空調子
- 乃木調子
- 楽調子
- **「荒城の月」特有の「平調子より四を一音上げる」調弦**
十三絃それぞれの音程を自由に微調整できるカスタム調弦機能も完備しています。

### 4. 歌詞の縦書き入力に対応
旋律と並行して歌詞（唱歌・歌詞）を縦書きで綺麗に表示・編集できます。
名曲「荒城の月」（土井晩翠 作詞 / 滝廉太郎 作曲）や「さくらさくら」などのサンプル譜も収録しています。

### 5. 多彩な保存・書き出しオプション
- **JSON保存・読み込み**：いつでも編集データをPCに保存・再開
- **WAV音声書き出し**：作成した譜面の演奏音源をそのままオーディオファイルとして保存
- **MIDI書き出し**：DAWソフトや他の音楽制作ツールと連携可能
- **清書印刷 / PDF出力**：印刷ダイアログから余計なボタンを除いた清書譜面としてそのままA4用紙やPDFに出力可能

---

## 画面イメージ（開発中スクリーンショット）

現在開発中の画面では、滝廉太郎の名曲「荒城の月」の正確な旋律（五五七八九八七・六六五四五…）や、美しい和紙の質感を持つ縦書き譜面が動いています。

※記事見出し・スクリーンショット画像をぜひご覧ください！

---

## 現在開発中！今後のロードマップとお願い

本ツールはまだまだ発展途上です。これから以下のような機能の追加を予定しています：

- **十七絃（低音箏）への拡張対応**
- **生田流・山田流など各流派の記譜差異や奏法記号のさらなる拡充**（押し手・後押し・すくい爪・ピチカート・消音など）
- **MIDIキーボードからのリアルタイム入力**
- **スマートフォン・タブレットでのタッチ操作最適化**
- **オンライン共有・URLでの譜面共有機能**

### 箏を演奏される皆様・音楽ファンの皆様へ
「この記号が入力できるようにしてほしい」「この流派の表記に対応してほしい」「こういう曲を打ち込んでみたい」など、些細なことでも構いませんので、**ぜひコメントやスキ、フィードバックをいただけると大きな励みになります！**

和楽器の素晴らしい伝統と音楽文化を、デジタルの力でもっと親しみやすく残していけるよう開発を続けていきます。
今後のアップデートもnoteやSNSで発信していきますので、ぜひフォローしていただけたら嬉しいです！

---
#琴 #箏 #和楽器 #個人開発 #Webアプリ #音楽制作 #DTM #伝統芸能 #荒城の月 #開発中`;

  // Draw eye-catch header (1200 x 630 / 16:9 Note recommended size)
  const drawEyecatch = () => {
    const canvas = headerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 630;

    // Background gradient: Japanese washi cream paper texture
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGrad.addColorStop(0, '#fdfaf5');
    bgGrad.addColorStop(0.5, '#f7f1e6');
    bgGrad.addColorStop(1, '#ebdccb');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Subtle Japanese decorative borders
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, 1144, 574);
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, 1128, 558);

    // Right side: Traditional vertical Koto score illustration card
    ctx.fillStyle = '#fffdfa';
    ctx.shadowColor = 'rgba(78, 52, 23, 0.15)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 6;
    ctx.fillRect(660, 65, 470, 500);
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#d6c4a8';
    ctx.lineWidth = 2;
    ctx.strokeRect(660, 65, 470, 500);

    // Score header inside the card
    ctx.fillStyle = '#8c2d19';
    ctx.font = 'bold 16px "Kaisei Decol", "Shippori Mincho", serif';
    ctx.fillText('箏 縦書き文化譜', 690, 105);

    ctx.fillStyle = '#2b2621';
    ctx.font = 'bold 28px "Kaisei Decol", "Shippori Mincho", serif';
    ctx.fillText(score.title || '荒城の月', 690, 145);

    ctx.fillStyle = '#6b5e51';
    ctx.font = '14px "Zen Kaku Gothic New", sans-serif';
    ctx.fillText('平調子（四上一音） / 四拍子', 690, 175);

    // Draw vertical score columns preview
    const sampleNotes = [
      ['五', '五', '七', '八'],
      ['九', '八', '七', '○'],
      ['六', '六', '五', '四'],
      ['五', '○', '○', '○']
    ];
    const sampleLyrics = [
      ['は', 'る', 'こ', 'う'],
      ['ろ', 'う', 'の', ''],
      ['は', 'な', 'の', 'え'],
      ['ん', '', '', '']
    ];

    const startX = 1060;
    const colWidth = 72;
    sampleNotes.forEach((col, cIdx) => {
      const cx = startX - cIdx * colWidth;
      // column box
      ctx.strokeStyle = '#c9b79c';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 28, 205, 56, 330);

      // Measure header number
      ctx.fillStyle = '#8c2d19';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${cIdx + 1}`, cx - 22, 222);

      col.forEach((note, nIdx) => {
        const ny = 250 + nIdx * 72;
        // beat separator line
        if (nIdx > 0) {
          ctx.strokeStyle = '#e2d5c3';
          ctx.beginPath();
          ctx.moveTo(cx - 28, ny - 36);
          ctx.lineTo(cx + 28, ny - 36);
          ctx.stroke();
        }

        // note kanji
        ctx.fillStyle = note === '○' ? '#8c7d6b' : '#1c1917';
        ctx.font = 'bold 26px "Kaisei Decol", "Shippori Mincho", serif';
        ctx.textAlign = 'center';
        ctx.fillText(note, cx - 4, ny);

        // lyrics
        const lyr = sampleLyrics[cIdx]?.[nIdx];
        if (lyr) {
          ctx.fillStyle = '#8c2d19';
          ctx.font = '13px "Kaisei Decol", serif';
          ctx.fillText(lyr, cx + 18, ny);
        }
      });
    });
    ctx.textAlign = 'left';

    // Left side: Main Title & Badges
    // Status Badge
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(70, 95, 170, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Zen Kaku Gothic New", sans-serif';
    ctx.fillText('★ 現在開発中 (Beta)', 86, 117);

    // App Badge
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.roundRect(252, 95, 120, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Zen Kaku Gothic New", sans-serif';
    ctx.fillText('和楽器 WebApp', 264, 117);

    // Main Catch Title
    ctx.fillStyle = '#292524';
    ctx.font = '900 48px "Kaisei Decol", "Shippori Mincho", serif';
    ctx.fillText('琴譜エディタ', 70, 195);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 22px "Zen Kaku Gothic New", sans-serif';
    ctx.fillText('Koto Note - ブラウザで動く本格和楽器楽譜ツール', 70, 235);

    // Sub Description
    ctx.fillStyle = '#44403c';
    ctx.font = '500 18px "Zen Kaku Gothic New", sans-serif';
    const lines = [
      '・十三絃箏の縦書き伝統譜・文化譜をブラウザで直感作成',
      '・本格Web Audio撥弦音源でリアルタイム自動試聴＆練習',
      '・調弦プリセット（平調子・荒城の月四下一音・雲井調子等）',
      '・MIDI / WAV音声書き出し・清書PDF印刷に対応'
    ];
    lines.forEach((l, idx) => {
      ctx.fillText(l, 70, 285 + idx * 34);
    });

    // Decorative Koto Strings Graphic on bottom left
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(70, 450 + i * 16);
      ctx.lineTo(580, 450 + i * 16);
      ctx.stroke();

      // Little koto bridge (ji)
      const bx = 160 + i * 50;
      ctx.fillStyle = '#f5f5f4';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx, 442 + i * 16);
      ctx.lineTo(bx + 12, 458 + i * 16);
      ctx.lineTo(bx - 12, 458 + i * 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Bottom note.com branding hint
    ctx.fillStyle = '#78716c';
    ctx.font = 'bold 15px "Zen Kaku Gothic New", sans-serif';
    ctx.fillText('note 開発記録・進捗記事用見出し画像', 70, 580);
  };

  // Draw full score screenshot (1200 x 800)
  const drawScoreScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 760;

    // Background paper
    ctx.fillStyle = '#fcf9f2';
    ctx.fillRect(0, 0, 1200, 760);

    // Top Header bar mockup
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, 0, 1200, 56);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Kaisei Decol", serif';
    ctx.fillText('琴譜エディタ (Koto Note)', 24, 35);

    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('【開発中プレビュー】', 240, 35);

    ctx.fillStyle = '#a8a29e';
    ctx.font = '14px sans-serif';
    ctx.fillText(`曲名: ${score.title || '荒城の月'}   調弦: 平調子（四下一音）   テンポ: ${score.tempo} BPM   4拍子`, 400, 35);

    // Score sheet area
    ctx.fillStyle = '#fffdfa';
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = 15;
    ctx.fillRect(40, 80, 1120, 640);
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 80, 1120, 640);

    // Traditional score header
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 28px "Kaisei Decol", serif';
    ctx.textAlign = 'right';
    ctx.fillText(score.title || '荒城の月', 1120, 140);

    ctx.font = '14px "Kaisei Decol", serif';
    ctx.fillStyle = '#78350f';
    ctx.fillText(score.subtitle || '土井晩翠 作詞 / 滝廉太郎 作曲', 1120, 170);
    ctx.fillText('平調子より四を一音上げる (一＝D)', 1120, 195);
    ctx.textAlign = 'left';

    // Render measures from the actual score
    const measures = score.measures.slice(0, 8); // show first 8 measures
    const startX = 980;
    const colWidth = 95;

    measures.forEach((m, mIdx) => {
      const cx = startX - mIdx * colWidth;
      if (cx < 80) return;

      ctx.strokeStyle = '#bfa175';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 36, 120, 72, 540);

      // Measure number badge
      ctx.fillStyle = '#8c2d19';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`第${mIdx + 1}小節`, cx - 30, 140);

      const beatHeight = 115;
      m.beats.forEach((b, bIdx) => {
        const by = 160 + bIdx * beatHeight;

        // beat line
        if (bIdx > 0) {
          ctx.strokeStyle = '#e7d9c6';
          ctx.beginPath();
          ctx.moveTo(cx - 36, by - 10);
          ctx.lineTo(cx + 36, by - 10);
          ctx.stroke();
        }

        const slot = b.slots[0];
        let noteText = '○';
        if (slot && !slot.rest && slot.notes && slot.notes.length > 0) {
          noteText = KANJI_STRINGS[slot.notes[0]] || '・';
        }

        ctx.fillStyle = noteText === '○' ? '#a8a29e' : '#1c1917';
        ctx.font = 'bold 30px "Kaisei Decol", "Shippori Mincho", serif';
        ctx.textAlign = 'center';
        ctx.fillText(noteText, cx - 6, by + 40);

        // lyrics
        if (b.lyrics) {
          ctx.fillStyle = '#8c2d19';
          ctx.font = 'bold 14px "Kaisei Decol", serif';
          ctx.fillText(b.lyrics, cx + 22, by + 40);
        }
      });
    });
    ctx.textAlign = 'left';

    // Watermark
    ctx.fillStyle = 'rgba(120, 53, 15, 0.5)';
    ctx.font = 'bold 16px "Kaisei Decol", serif';
    ctx.fillText('琴譜エディタ (Koto Note) - 縦書き文化譜プレビュー（開発中）', 70, 695);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        drawEyecatch();
        drawScoreScreenshot();
      }, 100);
    }
  }, [isOpen, score]);

  if (!isOpen) return null;

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(articleTitle);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyArticle = () => {
    navigator.clipboard.writeText(`${articleTitle}\n\n${articleBody}`);
    setCopiedArticle(true);
    setTimeout(() => setCopiedArticle(false), 2500);
  };

  const downloadCanvasAsPng = (canvas: HTMLCanvasElement | null, filename: string) => {
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-3 sm:p-5 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-4xl h-[92vh] rounded-2xl bg-stone-50 border border-stone-300 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-800 to-amber-950 text-white shadow-xs">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-score text-stone-900">
                  NOTE投稿用記事 ＆ スクリーンショット作成
                </h2>
                <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">
                  開発中ステータス
                </span>
              </div>
              <p className="text-xs text-stone-500">
                note.comにそのまま投稿できる記事ドラフトと、見出し画像・譜面スクリーンショットのPNGダウンロード
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-100/70 px-5 shrink-0">
          <button
            onClick={() => setActiveTab('article')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'article'
                ? 'border-amber-800 text-amber-950 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-700" />
            NOTE投稿用記事本文
          </button>
          <button
            onClick={() => setActiveTab('screenshot')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'screenshot'
                ? 'border-amber-800 text-amber-950 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <ImageIcon className="h-4 w-4 text-amber-700" />
            見出し画像 ＆ 譜面スクリーンショット
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'article' ? (
            <div className="space-y-4">
              {/* Title Card */}
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    おすすめ記事タイトル
                  </span>
                  <button
                    onClick={handleCopyTitle}
                    className="flex items-center gap-1 rounded bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 cursor-pointer"
                  >
                    {copiedTitle ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        コピー完了
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        タイトルをコピー
                      </>
                    )}
                  </button>
                </div>
                <div className="font-score font-bold text-stone-900 text-base sm:text-lg">
                  {articleTitle}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50/80 border border-amber-200/80 rounded-xl p-3">
                <div className="text-xs text-amber-950 font-medium">
                  note.comのエディタにそのまま貼り付けできるMarkdown形式の記事本文です。
                </div>
                <button
                  onClick={handleCopyArticle}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {copiedArticle ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      記事全文をコピーしました！
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      記事全文をコピー (1クリック)
                    </>
                  )}
                </button>
              </div>

              {/* Article Preview */}
              <div className="rounded-xl border border-stone-200 bg-white p-5 font-sans shadow-2xs text-stone-800 text-sm whitespace-pre-wrap leading-relaxed select-text font-serif">
                {articleBody}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Note Eyecatch Banner (1200x630) */}
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 font-score flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-amber-700" /> NOTE用 見出し画像 (1200×630 / 16:9)
                    </h3>
                    <p className="text-xs text-stone-500">
                      noteのカバー画像・アイキャッチにぴったりの高精細和風バナー
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={drawEyecatch}
                      className="flex items-center gap-1 rounded border border-stone-200 px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50 cursor-pointer"
                      title="再描画"
                    >
                      <RefreshCw className="h-3 w-3" /> 再生成
                    </button>
                    <button
                      onClick={() => downloadCanvasAsPng(headerCanvasRef.current, '琴譜エディタ_note見出し画像.png')}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" /> 見出し画像をPNGダウンロード
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-stone-200 bg-stone-100 flex justify-center">
                  <canvas ref={headerCanvasRef} className="w-full max-w-full h-auto aspect-[1200/630] object-contain shadow-xs" />
                </div>
              </div>

              {/* Score Sheet Screenshot (1200x760) */}
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 font-score flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-amber-700" /> 楽譜スクリーンショット (縦書き文化譜 清書版)
                    </h3>
                    <p className="text-xs text-stone-500">
                      現在読み込まれている「{score.title || '荒城の月'}」の縦書き文化譜プレビュー画像
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={drawScoreScreenshot}
                      className="flex items-center gap-1 rounded border border-stone-200 px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50 cursor-pointer"
                      title="再描画"
                    >
                      <RefreshCw className="h-3 w-3" /> 再生成
                    </button>
                    <button
                      onClick={() => downloadCanvasAsPng(canvasRef.current, `琴譜エディタ_${score.title || '楽譜'}_スクリーンショット.png`)}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" /> 譜面スクショをPNGダウンロード
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-stone-200 bg-stone-100 flex justify-center">
                  <canvas ref={canvasRef} className="w-full max-w-full h-auto aspect-[1200/760] object-contain shadow-xs" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 px-5 py-3 bg-stone-50 shrink-0">
          <div className="text-xs text-stone-500 flex items-center gap-1">
            <ExternalLink className="h-3.5 w-3.5" />
            <span>記事をコピー後、note.comの投稿画面でペーストして画像をご使用ください</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-200 px-4 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-300 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
