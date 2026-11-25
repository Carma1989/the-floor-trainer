import React from 'react';
import { 
  Bike, 
  Crown, 
  Bot, 
  Video, 
  Flag, 
  Shuffle, 
  Layers, 
  ChevronRight 
} from 'lucide-react';

const ICON_MAP = {
  Bike: Bike,
  Crown: Crown,
  Bot: Bot,
  Video: Video,
  Flag: Flag,
};

export function CategorySelector({ categories, onSelectCategory, onStart, modeTitle = 'Wybierz kategorię' }) {
  const getIcon = (iconName) => {
    const Component = ICON_MAP[iconName] || Layers;
    return <Component className="w-5 h-5" />;
  };

  const totalAllItems = categories.reduce((sum, c) => sum + (c.items?.length || 0), 0);

  const handleCardClick = (catId) => {
    onSelectCategory(catId);
    onStart(); // Natychmiastowe przejście do gry bez zbędnych ekranów pośrednich
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
          {modeTitle}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* MIX / Wszystkie */}
        <div
          onClick={() => handleCardClick('all')}
          className="cursor-pointer rounded-2xl p-4 border border-amber-500/40 bg-slate-900/80 hover:bg-slate-900 hover:border-amber-400 hover:scale-[1.02] transition-all duration-200 flex items-center justify-between group shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors">
                Wielki Mix
              </h3>
              <span className="text-xs font-mono text-slate-400">{totalAllItems} pozycji</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Indywidualne kategorie */}
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => handleCardClick(cat.id)}
            className="cursor-pointer rounded-2xl p-4 border border-slate-800 bg-slate-900/80 hover:bg-slate-900 hover:border-indigo-400/60 hover:scale-[1.02] transition-all duration-200 flex items-center justify-between group shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: cat.color || '#6366f1' }}
              >
                {getIcon(cat.icon)}
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors text-sm sm:text-base">
                  {cat.name}
                </h3>
                <span className="text-xs font-mono text-slate-400">{cat.items?.length || 0} pozycji</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
}
