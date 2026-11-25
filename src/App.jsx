import React, { useState } from 'react';
import { MobilePlay } from './components/MobilePlay';
import { MobileBrowse } from './components/MobileBrowse';
import { MobileDuel2P } from './components/MobileDuel2P';
import { DEFAULT_CATEGORIES } from './data/categories';
import { Volume2, VolumeX, GraduationCap, Grid, Swords } from 'lucide-react';
import { sound } from './utils/audio';

export default function App() {
  const [tab, setTab] = useState('play'); // 'play' | 'browse'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isMuted, setIsMuted] = useState(true);

  const toggleSound = () => {
    sound.muted = !isMuted;
    setIsMuted(!isMuted);
    if (isMuted) {
      sound.playCorrect();
    }
  };

  return (
    <div className="w-full min-h-[100dvh] bg-slate-950 text-slate-100 flex items-center justify-center sm:p-4">
      {/* Phone container */}
      <div className="w-full max-w-[440px] h-[100dvh] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[40px] bg-slate-950 sm:border-4 sm:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden relative safe-area-shell">
        {/* Top Minimal Bar */}
        <header className="px-4 py-3 border-b border-slate-900 flex items-center justify-between z-10 bg-slate-950/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
              TW
            </div>
            <span className="font-black tracking-wider text-base uppercase text-white">
              THE WIEDZA
            </span>
          </div>

          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            title={isMuted ? 'Włącz dźwięk' : 'Wycisz'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-600" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </header>

        {/* Dynamic View */}
        <main className="flex-1 p-3 overflow-hidden flex flex-col">
          {tab === 'play' && (
            <MobilePlay
              categories={DEFAULT_CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          )}

          {tab === 'duel' && (
            <MobileDuel2P
              categories={DEFAULT_CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          )}

          {tab === 'browse' && (
            <MobileBrowse
              categories={DEFAULT_CATEGORIES}
              onSelectAndGo={(catId, targetTab) => {
                setSelectedCategory(catId);
                setTab(targetTab);
              }}
            />
          )}
        </main>

        {/* Bottom Mobile Tab Bar */}
        <nav className="border-t border-slate-900 bg-slate-950/95 px-6 py-2.5 flex items-center justify-around z-10">
          <button
            onClick={() => setTab('play')}
            className={`flex flex-col items-center gap-1 transition-all ${
              tab === 'play' ? 'text-amber-400 scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-wider">Ćwicz</span>
          </button>

          <button
            onClick={() => setTab('duel')}
            className={`flex flex-col items-center gap-1 transition-all ${
              tab === 'duel' ? 'text-rose-400 scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Swords className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-wider">Pojedynek 2P</span>
          </button>

          <button
            onClick={() => setTab('browse')}
            className={`flex flex-col items-center gap-1 transition-all ${
              tab === 'browse' ? 'text-emerald-400 scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-wider">Katalog</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
