import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  RotateCcw, 
  Check, 
  X, 
  Clock, 
  Target, 
  Trophy 
} from 'lucide-react';
import { SmartImage } from './SmartImage';
import { sound } from '../utils/audio';
import { saveStats } from '../utils/storage';

export function SeterraGrid({ category, categories, onBack }) {
  const [gridSize, setGridSize] = useState(12);
  const [pool, setPool] = useState([]);
  const [targetItem, setTargetItem] = useState(null);
  const [foundIds, setFoundIds] = useState([]);
  const [wrongClickedId, setWrongClickedId] = useState(null);
  
  // Game stats & timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameState, setGameState] = useState('playing'); // Natychmiast gramy!

  // Pick target helper
  const pickTarget = (itemsList, alreadyFound) => {
    const remaining = itemsList.filter(item => !alreadyFound.includes(item.id));
    if (remaining.length === 0) {
      return null;
    }
    return remaining[Math.floor(Math.random() * remaining.length)];
  };

  // Prepare items and start directly
  useEffect(() => {
    let items = [];
    if (category === 'all') {
      categories.forEach(c => items.push(...(c.items || [])));
    } else {
      const match = categories.find(c => c.id === category);
      if (match) items = [...(match.items || [])];
    }

    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, Math.min(gridSize, shuffled.length));
    setPool(chosen);
    setFoundIds([]);
    setElapsedSeconds(0);
    setAttempts(0);
    setGameState('playing');

    const first = pickTarget(chosen, []);
    setTargetItem(first);
  }, [category, categories, gridSize]);

  // Timer loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  const handleTileClick = (item) => {
    if (gameState !== 'playing' || !targetItem || foundIds.includes(item.id)) return;

    setAttempts(a => a + 1);

    if (item.id === targetItem.id) {
      sound.playCorrect();
      const updatedFound = [...foundIds, item.id];
      setFoundIds(updatedFound);
      setWrongClickedId(null);

      if (updatedFound.length >= pool.length) {
        setGameState('completed');
        sound.playVictory();
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        saveStats(s => ({
          ...s,
          seterraPlayed: (s.seterraPlayed || 0) + 1,
          totalCorrect: (s.totalCorrect || 0) + pool.length
        }));
      } else {
        const next = pickTarget(pool, updatedFound);
        setTargetItem(next);
      }
    } else {
      sound.playPass();
      setWrongClickedId(item.id);
      setTimeout(() => setWrongClickedId(null), 500);
    }
  };

  const restartTraining = () => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setPool(shuffled);
    setFoundIds([]);
    setElapsedSeconds(0);
    setAttempts(0);
    setGameState('playing');
    const first = pickTarget(shuffled, []);
    setTargetItem(first);
  };

  return (
    <div className="max-w-5xl mx-auto py-4 px-4 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Kategorie</span>
        </button>

        {/* Tiles count */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          {[8, 12, 16].map(size => (
            <button
              key={size}
              onClick={() => setGridSize(size)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                gridSize === size 
                  ? 'bg-emerald-600 text-white font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {size} kafelków
            </button>
          ))}
        </div>

        {/* Timer & score */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-white font-bold">{elapsedSeconds}s</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-bold">{foundIds.length}/{pool.length}</span>
          </div>
        </div>
      </div>

      {/* TARGET BANNER: Pure target name, zero hints or giveaways */}
      {gameState === 'playing' && targetItem && (
        <div className="sticky top-16 z-20 mb-5 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border-2 border-emerald-500/60 rounded-2xl p-4 shadow-xl text-center backdrop-blur-md animate-fadeIn">
          <div className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold mb-0.5">
            WSKAŻ NA PLANSZY:
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
            {targetItem.name}
          </h2>
        </div>
      )}

      {/* GRID */}
      {gameState === 'playing' && (
        <div className={`grid gap-3 ${
          gridSize === 8 
            ? 'grid-cols-2 sm:grid-cols-4' 
            : gridSize === 12 
            ? 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6' 
            : 'grid-cols-4 sm:grid-cols-4 lg:grid-cols-8'
        }`}>
          {pool.map((item) => {
            const isFound = foundIds.includes(item.id);
            const isWrong = wrongClickedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleTileClick(item)}
                className={`relative rounded-2xl p-2.5 border transition-all duration-200 cursor-pointer aspect-square flex flex-col items-center justify-center select-none overflow-hidden ${
                  isFound
                    ? 'bg-emerald-950/40 border-emerald-500/80 opacity-75'
                    : isWrong
                    ? 'bg-rose-950/60 border-rose-500 animate-shake'
                    : 'bg-slate-900/80 border-slate-800 hover:border-emerald-400/50 hover:bg-slate-900 hover:scale-[1.03] shadow-md'
                }`}
              >
                {isFound && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center z-10">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {isWrong && (
                  <div className="absolute inset-0 bg-rose-600/40 flex items-center justify-center z-10">
                    <X className="w-10 h-10 text-white stroke-[3]" />
                  </div>
                )}

                <SmartImage
                  src={item.imageUrl}
                  alt="Kafelek The Floor"
                  fallbackText="?"
                  hideLabel={true}
                  badgeColor={item.badgeColor || '#10b981'}
                  className="w-full h-full max-h-24 sm:max-h-28"
                />

                {isFound && (
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 py-1 px-1.5 text-center">
                    <span className="text-[10px] font-bold text-emerald-300 block truncate">
                      {item.name}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* COMPLETED */}
      {gameState === 'completed' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center max-w-md mx-auto shadow-2xl animate-fadeIn">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center mb-3">
            <Trophy className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-black text-white uppercase mb-4">
            Komplet trafień!
          </h3>

          <div className="grid grid-cols-2 gap-2.5 mb-6 text-center text-xs">
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Czas</span>
              <strong className="text-amber-400 text-xl font-mono">{elapsedSeconds}s</strong>
            </div>
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Próby</span>
              <strong className="text-emerald-400 text-xl font-mono">{attempts}</strong>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={restartTraining}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              ZAGRAJ ZNÓW
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              KATEGORIE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
