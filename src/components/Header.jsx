import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Gamepad2, 
  Grid3x3, 
  Trophy, 
  Sparkles,
  Keyboard,
  X
} from 'lucide-react';
import { sound } from '../utils/audio';

export function Header({ currentMode, setMode, stats, isMuted, setIsMuted }) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const toggleSound = () => {
    sound.muted = !isMuted;
    setIsMuted(!isMuted);
    if (isMuted) {
      sound.playCorrect();
    }
  };

  return (
    <header className="relative z-30 border-b border-indigo-950/60 bg-slate-950/80 backdrop-blur-xl sticky top-0 px-4 lg:px-8 py-3.5 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        {/* Brand / Logo */}
        <div 
          onClick={() => setMode('duel')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-amber-400 p-[1.5px] shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-yellow-500 text-lg tracking-tighter">
                  TF
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-widest text-lg lg:text-xl text-white uppercase drop-shadow-md">
                THE FLOOR
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono">
                TRAINER
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/80 p-1.5 rounded-2xl shadow-inner">
          <button
            id="nav-duel-btn"
            onClick={() => setMode('duel')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentMode === 'duel'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Pojedynek 45s</span>
          </button>

          <button
            id="nav-seterra-btn"
            onClick={() => setMode('seterra')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentMode === 'seterra'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            <span>Trening Siatka</span>
          </button>

          <button
            id="nav-kb-btn"
            onClick={() => setMode('kb')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentMode === 'kb'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Baza Wiedzy</span>
          </button>
        </nav>

        {/* Right Tools & Sound */}
        <div className="flex items-center gap-2.5">
          {/* Keyboard shortcuts modal toggle */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/50 transition-all text-xs flex items-center gap-1.5"
            title="Skróty klawiszowe"
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden md:inline font-mono text-[11px]">Skróty</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-all ${
              !isMuted 
                ? 'bg-indigo-950/60 border-indigo-700/60 text-indigo-400 hover:bg-indigo-900/60 shadow-md shadow-indigo-950/50' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={isMuted ? 'Włącz dźwięki' : 'Wycisz dźwięki'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Stats Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Wygrane: <strong className="text-amber-300">{stats.duelsWon || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowShortcuts(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-4 text-amber-400">
              <Keyboard className="w-5 h-5" />
              <h3 className="font-bold text-lg text-white">Skróty w trybie The Floor</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-300">Zatwierdź / Sprawdź wpis</span>
                <kbd className="px-2.5 py-1 bg-slate-800 rounded font-mono text-xs text-amber-300 border border-slate-700">ENTER</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-300">Wiem! (Szybkie zaliczenie na głos)</span>
                <kbd className="px-2.5 py-1 bg-slate-800 rounded font-mono text-xs text-emerald-300 border border-slate-700">SPACJA</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-300">PAS (kara -3s jak w TV)</span>
                <kbd className="px-2.5 py-1 bg-slate-800 rounded font-mono text-xs text-rose-300 border border-slate-700">ESC / P</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-300">Pokaż podpowiedź / wskazówkę</span>
                <kbd className="px-2.5 py-1 bg-slate-800 rounded font-mono text-xs text-indigo-300 border border-slate-700">TAB / H</kbd>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400 text-center">
              Aplikacja posiada także inteligentne wykrywanie: gdy wpiszesz poprawną nazwę, od razu przechodzi dalej bez czekania!
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
