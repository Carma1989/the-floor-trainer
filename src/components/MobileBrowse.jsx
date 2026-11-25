import React, { useState, useMemo } from 'react';
import { Search, X, ArrowLeft, GraduationCap, ChevronRight } from 'lucide-react';
import { SmartImage } from './SmartImage';

export function MobileBrowse({ categories, onSelectAndGo }) {
  const [query, setQuery] = useState('');
  const [openedCatId, setOpenedCatId] = useState(null);

  const openedCategory = useMemo(
    () => categories.find(c => c.id === openedCatId) || null,
    [categories, openedCatId]
  );

  // Filter categories when at root view
  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.items || []).some(it => it.name.toLowerCase().includes(q))
    );
  }, [categories, query]);

  // Filter items when inside a category
  const filteredItems = useMemo(() => {
    if (!openedCategory) return [];
    const list = openedCategory.items || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.aliases && item.aliases.some(a => a.toLowerCase().includes(q)))
    );
  }, [openedCategory, query]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Bar / Back Button when inside a category */}
      {openedCategory && (
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <button
            onClick={() => {
              setOpenedCatId(null);
              setQuery('');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kategorie</span>
          </button>

          <div className="flex items-center gap-1.5">
            {onSelectAndGo && (
              <button
                onClick={() => onSelectAndGo(openedCategory.id, 'play')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Ćwicz</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-3 px-1">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={openedCategory ? `Szukaj w: ${openedCategory.name}...` : 'Szukaj kategorii lub hasła...'}
          className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold placeholder-slate-500 outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Grid View (Root) */}
      {!openedCategory && (
        <div className="flex-1 overflow-y-auto px-1 pb-4 scrollbar-none">
          <div className="grid grid-cols-1 gap-2">
            {filteredCategories.map(cat => (
              <div
                key={cat.id}
                onClick={() => {
                  setOpenedCatId(cat.id);
                  setQuery('');
                }}
                className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shrink-0">
                    {cat.emoji}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">
                      {cat.name}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {cat.items?.length || 0} haseł
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onSelectAndGo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAndGo(cat.id, 'play');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-black uppercase tracking-wide"
                    >
                      Ćwicz
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items Inside Opened Category */}
      {openedCategory && (
        <div className="flex-1 overflow-y-auto px-1 pb-4 scrollbar-none">
          <div className="mb-2 px-1 flex items-center justify-between">
            <span className="text-xs font-black text-white uppercase tracking-wider truncate">
              {openedCategory.emoji} {openedCategory.name}
            </span>
            <span className="text-xs font-mono text-slate-400 shrink-0">
              {filteredItems.length} szt.
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-col items-center justify-between"
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 bg-white flex items-center justify-center">
                  <SmartImage
                    src={item.imageUrl}
                    alt={item.name}
                    cardBg="bg-white"
                    className="w-full h-full"
                  />
                </div>
                <span className="font-bold text-white text-xs text-center line-clamp-2 w-full">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
