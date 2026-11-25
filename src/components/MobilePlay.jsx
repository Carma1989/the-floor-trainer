import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, ArrowRight, ChevronLeft, Keyboard, Shuffle } from 'lucide-react';
import { SmartImage } from './SmartImage';
import { checkAnswerMatch } from '../data/categories';
import { sound } from '../utils/audio';

export function MobilePlay({ categories, selectedCategory, onSelectCategory }) {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [textInput, setTextInput] = useState('');

  const inputRef = useRef(null);

  // Build shuffled pool for selected category
  const shufflePool = useCallback(() => {
    let pool = [];
    if (selectedCategory === 'all') {
      categories.forEach(c => pool.push(...(c.items || [])));
    } else {
      const match = categories.find(c => c.id === selectedCategory);
      if (match) pool = [...(match.items || [])];
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setItems(shuffled);
    setCurrentIndex(0);
    setRevealed(false);
    setTextInput('');
  }, [selectedCategory, categories]);

  useEffect(() => {
    shufflePool();
  }, [shufflePool]);

  const currentItem = items[currentIndex] || null;

  // Preload next 5 images in background
  useEffect(() => {
    if (!items.length) return;
    for (let offset = 1; offset <= 5; offset++) {
      const nextItem = items[(currentIndex + offset) % items.length];
      if (nextItem?.imageUrl && !nextItem.imageUrl.startsWith('data:')) {
        const img = new Image();
        img.src = nextItem.imageUrl;
      }
    }
  }, [items, currentIndex]);

  const goNext = useCallback(() => {
    if (!items.length) return;
    setCurrentIndex(prev => (prev + 1 >= items.length ? 0 : prev + 1));
    setRevealed(false);
    setTextInput('');
  }, [items.length]);

  const goPrev = useCallback(() => {
    if (!items.length) return;
    setCurrentIndex(prev => (prev - 1 < 0 ? items.length - 1 : prev - 1));
    setRevealed(false);
    setTextInput('');
  }, [items.length]);

  const handleRevealOrNext = useCallback(() => {
    if (!currentItem) return;
    if (!revealed) {
      sound.playCorrect();
      setRevealed(true);
    } else {
      goNext();
    }
  }, [currentItem, revealed, goNext]);

  // Keyboard shortcut: Space/Enter reveals then advances
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !showInput) {
        e.preventDefault();
        handleRevealOrNext();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInput, handleRevealOrNext, goNext, goPrev]);

  return (
    <div className="flex flex-col h-full min-h-0 justify-between pb-1">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 px-1 scrollbar-none mb-1 shrink-0 min-h-[42px]">
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400'
          }`}
        >
          Wszystko
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {currentItem && (
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-2">
          {/* Top Bar: Counter + Controls */}
          <div className="flex items-center justify-between px-2 py-0.5 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                className="p-2 rounded-xl border bg-slate-900 border-slate-800 text-slate-400 hover:text-white transition-all"
                title="Poprzednia karta"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-sm font-black text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                {currentIndex + 1} / {items.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={shufflePool}
                className="p-2 rounded-xl border bg-slate-900 border-slate-800 text-slate-400 hover:text-white transition-all"
                title="Tasuj talię"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setShowInput(!showInput);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`p-2 rounded-xl border transition-all ${
                  showInput ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
                title="Wpisywanie z klawiatury"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card Image Frame (strictly bounded 1:1 square so it never overflows on iOS Safari) */}
          <div className="flex-1 min-h-0 flex items-center justify-center px-2">
            <div
              onClick={handleRevealOrNext}
              className={`relative w-[280px] h-[280px] sm:w-[310px] sm:h-[310px] shrink-0 p-1.5 transition-all duration-200 rounded-3xl cursor-pointer select-none ${
                revealed ? 'ring-4 ring-amber-400/80' : ''
              }`}
            >
              <SmartImage
                src={revealed && currentItem.revealedImageUrl ? currentItem.revealedImageUrl : currentItem.imageUrl}
                alt="Karta do odgadnięcia"
                cardBg="bg-white"
                className="w-full h-full shadow-2xl border border-slate-800/80"
              />
            </div>
          </div>

          {/* Answer Box BELOW the image frame */}
          <div className="mx-2 min-h-[68px] shrink-0 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 flex flex-col items-center justify-center text-center shadow-lg">
            {revealed ? (
              <>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-0.5">
                  Prawidłowa odpowiedź
                </span>
                <p className="text-lg font-black text-white leading-tight">
                  {currentItem.name}
                </p>
              </>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Kliknij ODPOWIEDŹ, aby zobaczyć hasło
              </span>
            )}
          </div>

          {/* Optional Text Input */}
          {showInput && (
            <div className="px-2 mb-2">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setTextInput(val);
                  if (checkAnswerMatch(val, currentItem)) {
                    sound.playCorrect();
                    setRevealed(true);
                  }
                }}
                placeholder="Wpisz odpowiedź..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-indigo-500 text-white text-center font-bold outline-none"
              />
            </div>
          )}

          {/* Single Primary Action Button: ODPOWIEDŹ -> NASTĘPNA KARTA */}
          <div className="px-2 pt-0.5 shrink-0">
            {!revealed ? (
              <button
                onClick={handleRevealOrNext}
                className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-lg tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Eye className="w-6 h-6 stroke-[2.5]" />
                <span>ODPOWIEDŹ</span>
              </button>
            ) : (
              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-lg tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>NASTĘPNA KARTA</span>
                <ArrowRight className="w-6 h-6 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
