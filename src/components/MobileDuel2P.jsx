import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, RotateCcw, Check, SkipForward, Mic, MicOff, Eye, EyeOff, Trophy, Swords } from 'lucide-react';
import { SmartImage } from './SmartImage';
import { sound } from '../utils/audio';
import { resolveAssetUrl } from '../utils/assets';
import { useSpeechRecognition } from '../utils/speech';

const INITIAL_TIME = 45.0;
const PASS_PENALTY_SECONDS = 3.0;

export function MobileDuel2P({ categories, selectedCategory, onSelectCategory }) {
  const [phase, setPhase] = useState('setup'); // 'setup' | 'playing' | 'finished'
  const [p1Name, setP1Name] = useState('Gracz 1');
  const [p2Name, setP2Name] = useState('Gracz 2');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [judgePeek, setJudgePeek] = useState(false);

  const [items, setItems] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [activePlayer, setActivePlayer] = useState(1); // 1 | 2
  const [p1Time, setP1Time] = useState(INITIAL_TIME);
  const [p2Time, setP2Time] = useState(INITIAL_TIME);
  const [passRemaining, setPassRemaining] = useState(0); // >0 during 3s pass penalty
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Passes, setP1Passes] = useState(0);
  const [p2Passes, setP2Passes] = useState(0);
  const [winner, setWinner] = useState(null);

  const lastTickRef = useRef(null);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' }));
  }, [categories]);

  const buildDeck = useCallback(() => {
    let pool = [];
    if (selectedCategory === 'all') {
      categories.forEach(c => {
        (c.items || []).forEach(it => {
          pool.push({ ...it, categoryName: c.name, categoryEmoji: c.emoji });
        });
      });
    } else {
      const match = categories.find(c => c.id === selectedCategory);
      if (match) {
        pool = (match.items || []).map(it => ({
          ...it,
          categoryName: match.name,
          categoryEmoji: match.emoji,
        }));
      }
    }
    return [...pool].sort(() => Math.random() - 0.5);
  }, [categories, selectedCategory]);

  const startDuel = useCallback(() => {
    const deck = buildDeck();
    if (!deck.length) return;
    setItems(deck);
    setCardIndex(0);
    setActivePlayer(1);
    setP1Time(INITIAL_TIME);
    setP2Time(INITIAL_TIME);
    setPassRemaining(0);
    setP1Score(0);
    setP2Score(0);
    setP1Passes(0);
    setP2Passes(0);
    setWinner(null);
    lastTickRef.current = Date.now();
    setPhase('playing');
  }, [buildDeck]);

  const currentItem = items[cardIndex] || null;

  // Preload next 2 cards
  useEffect(() => {
    if (phase !== 'playing' || !items.length) return;
    for (let offset = 1; offset <= 2; offset++) {
      const nextItem = items[(cardIndex + offset) % items.length];
      if (nextItem?.imageUrl && !nextItem.imageUrl.startsWith('data:')) {
        const img = new Image();
        img.decoding = 'async';
        img.src = resolveAssetUrl(nextItem.imageUrl);
      }
    }
  }, [phase, items, cardIndex]);

  const advanceCard = useCallback(() => {
    setCardIndex(prev => (prev + 1 >= items.length ? 0 : prev + 1));
  }, [items.length]);

  const handleCorrect = useCallback(() => {
    if (phase !== 'playing' || passRemaining > 0) return;
    sound.playCorrect();
    if (activePlayer === 1) {
      setP1Score(s => s + 1);
      setActivePlayer(2);
    } else {
      setP2Score(s => s + 1);
      setActivePlayer(1);
    }
    lastTickRef.current = Date.now();
    advanceCard();
  }, [phase, passRemaining, activePlayer, advanceCard]);

  const handlePass = useCallback(() => {
    if (phase !== 'playing' || passRemaining > 0) return;
    sound.playPass();
    if (activePlayer === 1) {
      setP1Passes(p => p + 1);
    } else {
      setP2Passes(p => p + 1);
    }
    setPassRemaining(PASS_PENALTY_SECONDS);
  }, [phase, passRemaining, activePlayer]);

  // High-accuracy delta timer (50ms intervals using Date.now)
  useEffect(() => {
    if (phase !== 'playing') return;
    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      if (dt <= 0 || dt > 0.5) return;

      if (activePlayer === 1) {
        setP1Time(prev => {
          const next = Math.max(0, prev - dt);
          if (next <= 0) {
            setWinner(2);
            setPhase('finished');
            sound.playVictory();
            return 0;
          }
          return next;
        });
      } else {
        setP2Time(prev => {
          const next = Math.max(0, prev - dt);
          if (next <= 0) {
            setWinner(1);
            setPhase('finished');
            sound.playVictory();
            return 0;
          }
          return next;
        });
      }

      setPassRemaining(prevPass => {
        if (prevPass <= 0) return 0;
        const nextPass = prevPass - dt;
        if (nextPass <= 0) {
          advanceCard();
          return 0;
        }
        return nextPass;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [phase, activePlayer, advanceCard]);

  const { isSupported: speechSupported, isListening, transcript } = useSpeechRecognition({
    active: phase === 'playing' && voiceEnabled && passRemaining === 0,
    currentItem,
    onCorrect: handleCorrect,
    onPass: handlePass,
  });

  if (phase === 'setup') {
    const selectedObj = selectedCategory === 'all' ? null : categories.find(c => c.id === selectedCategory);
    const totalCards = selectedCategory === 'all'
      ? categories.reduce((s, c) => s + (c.items?.length || 0), 0)
      : (selectedObj?.items?.length || 0);

    return (
      <div className="flex flex-col h-full min-h-0 justify-between gap-3 overflow-y-auto px-1 pb-2 scrollbar-none">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black uppercase tracking-wider text-white">Pojedynek 1 vs 1 (TV)</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Każdy gracz ma <strong className="text-white">45 s</strong>. Poprawna odpowiedź zatrzymuje Twój zegar i oddaje turę przeciwnikowi. <strong className="text-rose-400">PAS</strong> to 3 s kary na Twoim zegarze i kolejna karta dla Ciebie.
          </p>
        </div>

        {/* Category selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Kategoria ({totalCards} haseł)
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-bold outline-none"
          >
            <option value="all">Wszystkie kategorie ({categories.reduce((s, c) => s + (c.items?.length || 0), 0)} haseł)</option>
            {sortedCategories.map(c => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name} ({c.items?.length || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Player names */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-3 flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Gracz 1</span>
            <input
              type="text"
              value={p1Name}
              onChange={(e) => setP1Name(e.target.value)}
              maxLength={16}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-bold outline-none"
            />
          </div>
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-3 flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Gracz 2</span>
            <input
              type="text"
              value={p2Name}
              onChange={(e) => setP2Name(e.target.value)}
              maxLength={16}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-bold outline-none"
            />
          </div>
        </div>

        {/* Answer mode toggle */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              {voiceEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-slate-500" />}
              <span>Rozpoznawanie głosu (pl-PL)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {speechSupported
                ? 'Opcjonalne: zalicza po głosie lub „pas”, przyciski działają zawsze.'
                : 'Przeglądarka nie wspiera mikrofonu — użyj przycisków ZALICZ / PAS.'}
            </p>
          </div>
          <button
            type="button"
            disabled={!speechSupported}
            onClick={() => setVoiceEnabled(v => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 border transition-all ${
              voiceEnabled
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            {voiceEnabled ? 'WŁ.' : 'WYŁ.'}
          </button>
        </div>

        <button
          onClick={startDuel}
          className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-lg tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Play className="w-6 h-6" />
          <span>START POJEDYNKU</span>
        </button>
      </div>
    );
  }

  if (phase === 'finished') {
    const winName = winner === 1 ? (p1Name || 'Gracz 1') : (p2Name || 'Gracz 2');
    const winTime = winner === 1 ? p1Time : p2Time;
    return (
      <div className="flex flex-col h-full justify-between gap-4 px-2 py-2">
        <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-900 border border-amber-500/40 rounded-3xl p-6 gap-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">Zwycięzca pojedynku</span>
            <h2 className="text-3xl font-black text-white mt-1">{winName}</h2>
            <p className="text-sm font-mono text-emerald-400 mt-1">
              Pozostały czas: {winTime.toFixed(1)} s
            </p>
          </div>

          <div className="w-full grid grid-cols-2 gap-2.5 mt-2">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
              <div className="text-xs font-bold text-amber-400 truncate">{p1Name || 'Gracz 1'}</div>
              <div className="text-xl font-black text-white mt-1">{p1Score} pkt</div>
              <div className="text-[11px] text-slate-400">Pas: {p1Passes}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
              <div className="text-xs font-bold text-indigo-400 truncate">{p2Name || 'Gracz 2'}</div>
              <div className="text-xl font-black text-white mt-1">{p2Score} pkt</div>
              <div className="text-[11px] text-slate-400">Pas: {p2Passes}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={startDuel}
            className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-base tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>REWANŻ (NOWE KARTY)</span>
          </button>
          <button
            onClick={() => setPhase('setup')}
            className="w-full py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm cursor-pointer"
          >
            Zmień kategorię lub graczy
          </button>
        </div>
      </div>
    );
  }

  // PLAYING PHASE
  const isPassing = passRemaining > 0;

  return (
    <div className="flex flex-col h-full min-h-0 justify-between pb-1 gap-2">
      {/* Dual Clocks (like TV) */}
      <div className="grid grid-cols-2 gap-2 px-1 shrink-0">
        <div className={`rounded-2xl p-2.5 border transition-all ${
          activePlayer === 1
            ? 'bg-amber-400/15 border-amber-400 shadow-md'
            : 'bg-slate-900 border-slate-800 opacity-60'
        }`}>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-black uppercase truncate text-amber-300">{p1Name || 'Gracz 1'}</span>
            <span className="text-[10px] font-mono text-slate-400">{p1Score} pkt</span>
          </div>
          <div className={`text-2xl font-mono font-black mt-0.5 ${p1Time <= 10 && activePlayer === 1 ? 'text-rose-400' : 'text-white'}`}>
            {p1Time.toFixed(1)}s
          </div>
        </div>

        <div className={`rounded-2xl p-2.5 border transition-all ${
          activePlayer === 2
            ? 'bg-indigo-600/25 border-indigo-400 shadow-md'
            : 'bg-slate-900 border-slate-800 opacity-60'
        }`}>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-black uppercase truncate text-indigo-300">{p2Name || 'Gracz 2'}</span>
            <span className="text-[10px] font-mono text-slate-400">{p2Score} pkt</span>
          </div>
          <div className={`text-2xl font-mono font-black mt-0.5 ${p2Time <= 10 && activePlayer === 2 ? 'text-rose-400' : 'text-white'}`}>
            {p2Time.toFixed(1)}s
          </div>
        </div>
      </div>

      {/* Category + Judge peek + Mic status */}
      <div className="flex items-center justify-between gap-2 px-2 shrink-0">
        {currentItem?.categoryName ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 truncate min-w-0">
            <span>{currentItem.categoryEmoji}</span>
            <span className="truncate">{currentItem.categoryName}</span>
          </span>
        ) : <span />}

        <div className="flex items-center gap-1.5 shrink-0">
          {voiceEnabled && (
            <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${
              isListening ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              {isListening ? 'MIC ON' : 'MIC'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setJudgePeek(v => !v)}
            className={`p-1.5 rounded-lg border text-xs ${
              judgePeek ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Podgląd hasła dla sędziego"
          >
            {judgePeek ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setPhase('setup')}
            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400"
          >
            Stop
          </button>
        </div>
      </div>

      {/* Card Image */}
      {currentItem && (
        <div className="flex-1 min-h-0 flex items-center justify-center px-2">
          <div className={`relative w-[280px] h-[280px] sm:w-[310px] sm:h-[310px] shrink-0 p-1.5 rounded-3xl transition-all ${
            isPassing ? 'ring-4 ring-rose-500' : activePlayer === 1 ? 'ring-4 ring-amber-400/80' : 'ring-4 ring-indigo-500'
          }`}>
            <SmartImage
              src={isPassing && currentItem.revealedImageUrl ? currentItem.revealedImageUrl : currentItem.imageUrl}
              alt="Karta pojedynku"
              cardBg="bg-white"
              className="w-full h-full shadow-2xl border border-slate-800/80"
            />
          </div>
        </div>
      )}

      {/* Status / Pass penalty / Judge Peek */}
      <div className="mx-2 min-h-[54px] shrink-0 bg-slate-900 border border-slate-800 rounded-2xl px-3 py-1.5 flex flex-col items-center justify-center text-center">
        {isPassing ? (
          <>
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-400">
              KARA PAS: {passRemaining.toFixed(1)}s
            </span>
            <span className="text-base font-black text-white leading-tight truncate max-w-full">
              {currentItem?.name}
            </span>
          </>
        ) : judgePeek && currentItem ? (
          <span className="text-xs font-bold text-indigo-300 truncate max-w-full">
            Sędzia: {currentItem.name}
          </span>
        ) : voiceEnabled && transcript ? (
          <span className="text-[11px] text-slate-400 truncate max-w-full">
            Słyszę: „{transcript}”
          </span>
        ) : (
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Tura: {activePlayer === 1 ? (p1Name || 'Gracz 1') : (p2Name || 'Gracz 2')}
          </span>
        )}
      </div>

      {/* Action Buttons: ZALICZ / PAS */}
      <div className="grid grid-cols-2 gap-2.5 px-2 shrink-0">
        <button
          type="button"
          disabled={isPassing}
          onClick={handlePass}
          className="py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-40 text-white font-black text-base tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
        >
          <SkipForward className="w-5 h-5" />
          <span>{isPassing ? `${passRemaining.toFixed(1)}s` : 'PAS (3s)'}</span>
        </button>

        <button
          type="button"
          disabled={isPassing}
          onClick={handleCorrect}
          className="py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 text-slate-950 font-black text-base tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>ZALICZ</span>
        </button>
      </div>
    </div>
  );
}
