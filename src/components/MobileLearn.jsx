import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Eye, RotateCw } from 'lucide-react';
import { SmartImage } from './SmartImage';

export function MobileLearn({ categories, selectedCategory, onSelectCategory }) {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let pool = [];
    if (selectedCategory === 'all') {
      categories.forEach(c => pool.push(...(c.items || [])));
    } else {
      const match = categories.find(c => c.id === selectedCategory);
      if (match) pool = [...(match.items || [])];
    }
    setItems(pool);
    setIndex(0);
    setRevealed(false);
  }, [selectedCategory, categories]);

  const currentItem = items[index] || null;

  const next = () => {
    setIndex(i => (i + 1 >= items.length ? 0 : i + 1));
    setRevealed(false);
  };

  const prev = () => {
    setIndex(i => (i - 1 < 0 ? items.length - 1 : i - 1));
    setRevealed(false);
  };

  return (
    <div className="flex flex-col h-full justify-between pb-2">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none mb-2">
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
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-3">
            <span>{index + 1} / {items.length}</span>
            <span className="text-slate-400">Dotknij karty, aby odkryć</span>
          </div>

          {/* Flashcard Box */}
          <div className="my-auto w-full flex flex-col items-center gap-3 px-2">
            <div
              onClick={() => setRevealed(!revealed)}
              className="w-full aspect-square max-h-[310px] max-w-[310px] cursor-pointer select-none"
            >
              <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 transition-all duration-300">
                <SmartImage
                  src={currentItem.imageUrl}
                  alt="Logo"
                  cardBg="bg-white"
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Revealed Answer BELOW the image frame */}
            <div
              onClick={() => setRevealed(!revealed)}
              className="w-full max-w-[340px] min-h-[76px] rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 flex flex-col items-center justify-center text-center cursor-pointer"
            >
              {revealed ? (
                <>
                  <h3 className="text-xl font-black text-white tracking-wide uppercase leading-tight">
                    {currentItem.name}
                  </h3>
                  {currentItem.aliases && currentItem.aliases.length > 1 && (
                    <span className="text-xs text-slate-400 font-mono mt-1 block">
                      Synonimy: {currentItem.aliases.join(', ')}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Dotknij zdjęcia lub tutaj, aby odkryć odpowiedź
                </span>
              )}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="grid grid-cols-2 gap-3 px-2 pt-2">
            <button
              onClick={prev}
              className="py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>POPRZEDNIE</span>
            </button>

            <button
              onClick={next}
              className="py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"
            >
              <span>NASTĘPNE</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
