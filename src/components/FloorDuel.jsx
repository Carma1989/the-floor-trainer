import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Check, 
  X, 
  RotateCcw, 
  Flame, 
  Swords, 
  Clock, 
  User, 
  Bot,
  Trophy
} from 'lucide-react';
import { SmartImage } from './SmartImage';
import { checkAnswerMatch } from '../data/categories';
import { sound } from '../utils/audio';
import { saveStats } from '../utils/storage';

export function FloorDuel({ category, categories, onBack, onComplete }) {
  // Game Setup
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameMode, setGameMode] = useState('duel'); // 'duel' or 'solo'
  
  // Clocks
  const [playerTime, setPlayerTime] = useState(45.0);
  const [botTime, setBotTime] = useState(45.0);
  const [activeTurn, setActiveTurn] = useState('player');
  const [gameState, setGameState] = useState('playing'); // Natychmiast gramy!
  const [winner, setWinner] = useState(null);

  // Input & Feedback
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);

  // Stats tracking
  const [correctList, setCorrectList] = useState([]);
  const [passedList, setPassedList] = useState([]);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const botTurnRef = useRef(null);

  // Prepare items and start immediately
  useEffect(() => {
    let pool = [];
    if (category === 'all') {
      categories.forEach(c => {
        pool.push(...(c.items || []));
      });
    } else {
      const match = categories.find(c => c.id === category);
      if (match) pool = [...(match.items || [])];
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setItems(shuffled);
    setCurrentIndex(0);
    setPlayerTime(45.0);
    setBotTime(45.0);
    setActiveTurn('player');
    setGameState('playing');
    setWinner(null);
    setStreak(0);
    setCorrectList([]);
    setPassedList([]);
  }, [category, categories]);

  // Focus input automatically
  useEffect(() => {
    if (gameState === 'playing' && activeTurn === 'player') {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 30);
    }
  }, [gameState, activeTurn, currentIndex]);

  // Clock Loop (no annoying sound ticks)
  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      if (gameMode === 'solo' || activeTurn === 'player') {
        setPlayerTime((prev) => {
          const next = Math.max(0, parseFloat((prev - 0.1).toFixed(1)));
          if (next <= 0) {
            handleGameOver('bot');
            return 0;
          }
          return next;
        });
      } else if (gameMode === 'duel' && activeTurn === 'bot') {
        setBotTime((prev) => {
          const next = Math.max(0, parseFloat((prev - 0.1).toFixed(1)));
          if (next <= 0) {
            handleGameOver('player');
            return 0;
          }
          return next;
        });
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, activeTurn, gameMode]);

  const advanceCard = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      return next >= items.length ? 0 : next;
    });
    setUserInput('');
  }, [items.length]);

  // Bot AI Turn in 1v1 duel
  useEffect(() => {
    if (gameState !== 'playing' || gameMode !== 'duel' || activeTurn !== 'bot') {
      if (botTurnRef.current) clearTimeout(botTurnRef.current);
      return;
    }

    const botThinkTime = 2000 + Math.random() * 2200;
    botTurnRef.current = setTimeout(() => {
      const botPass = Math.random() < 0.15;
      if (botPass) {
        sound.playPass();
        setBotTime(t => Math.max(0, parseFloat((t - 3.0).toFixed(1))));
      } else {
        sound.playCorrect();
      }
      advanceCard();
      setActiveTurn('player');
    }, botThinkTime);

    return () => {
      if (botTurnRef.current) clearTimeout(botTurnRef.current);
    };
  }, [gameState, gameMode, activeTurn, currentIndex, advanceCard]);

  const restartGame = () => {
    setPlayerTime(45.0);
    setBotTime(45.0);
    setActiveTurn('player');
    setGameState('playing');
    setWinner(null);
    setStreak(0);
    setCorrectList([]);
    setPassedList([]);
    setUserInput('');
  };

  const handleGameOver = (winningSide) => {
    setGameState('ended');
    setWinner(winningSide);

    if (winningSide === 'player') {
      sound.playVictory();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } else {
      sound.playDefeat();
    }

    saveStats(s => ({
      ...s,
      duelsPlayed: (s.duelsPlayed || 0) + 1,
      duelsWon: winningSide === 'player' ? (s.duelsWon || 0) + 1 : (s.duelsWon || 0),
      totalCorrect: (s.totalCorrect || 0) + correctList.length,
      totalPassed: (s.totalPassed || 0) + passedList.length
    }));
  };

  const currentItem = items[currentIndex] || null;

  // Player Success
  const handlePlayerSuccess = useCallback(() => {
    if (!currentItem || gameState !== 'playing' || activeTurn !== 'player') return;

    sound.playCorrect();
    setFeedback('correct');
    setStreak(s => s + 1);
    setCorrectList(prev => [...prev, currentItem]);

    setTimeout(() => {
      setFeedback(null);
      advanceCard();
      if (gameMode === 'duel') {
        setActiveTurn('bot');
      }
    }, 220);
  }, [currentItem, gameState, activeTurn, gameMode, advanceCard]);

  // Player Pass (-3s)
  const handlePlayerPass = useCallback(() => {
    if (!currentItem || gameState !== 'playing' || activeTurn !== 'player') return;

    sound.playPass();
    setFeedback('pass');
    setStreak(0);
    setPassedList(prev => [...prev, currentItem]);
    setPlayerTime(t => Math.max(0, parseFloat((t - 3.0).toFixed(1))));

    setTimeout(() => {
      setFeedback(null);
      advanceCard();
      if (gameMode === 'duel') {
        setActiveTurn('bot');
      }
    }, 250);
  }, [currentItem, gameState, activeTurn, gameMode, advanceCard]);

  // Real-time Input Auto-Match
  const handleInputChange = (e) => {
    const val = e.target.value;
    setUserInput(val);

    if (currentItem && checkAnswerMatch(val, currentItem)) {
      handlePlayerSuccess();
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing' || activeTurn !== 'player') return;

      if (e.code === 'Space' && !userInput.trim()) {
        e.preventDefault();
        handlePlayerSuccess();
      } else if (e.code === 'Escape' || (e.key.toLowerCase() === 'p' && !userInput.trim())) {
        e.preventDefault();
        handlePlayerPass();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activeTurn, userInput, handlePlayerSuccess, handlePlayerPass]);

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 animate-fadeIn">
      {/* Top minimal controls */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Kategorie</span>
        </button>

        {/* Duel vs Solo switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => { setGameMode('duel'); restartGame(); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              gameMode === 'duel' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Pojedynek 1v1</span>
          </button>
          <button
            onClick={() => { setGameMode('solo'); restartGame(); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              gameMode === 'solo' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Solo 45s</span>
          </button>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300">
          <Flame className={`w-3.5 h-3.5 ${streak > 1 ? 'text-amber-400' : 'text-slate-500'}`} />
          <span>Seria: <strong className="text-white">{streak}</strong></span>
        </div>
      </div>

      {/* CLOCKS SCOREBOARD */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Player Clock */}
        <div 
          className={`p-3.5 rounded-2xl border transition-all duration-200 ${
            activeTurn === 'player' && gameState === 'playing'
              ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500 shadow-lg'
              : 'bg-slate-900/50 border-slate-800/80 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>TY</span>
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              Trafione: <strong className="text-white">{correctList.length}</strong>
            </span>
          </div>

          <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white">
            {playerTime.toFixed(1)}
            <span className="text-sm text-slate-400 ml-1">s</span>
          </div>
        </div>

        {/* Opponent Clock */}
        <div 
          className={`p-3.5 rounded-2xl border transition-all duration-200 ${
            activeTurn === 'bot' && gameState === 'playing'
              ? 'bg-gradient-to-br from-rose-950/80 to-slate-900 border-rose-500 shadow-lg'
              : 'bg-slate-900/50 border-slate-800/80 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              {gameMode === 'duel' ? <Bot className="w-3.5 h-3.5 text-rose-400" /> : <Clock className="w-3.5 h-3.5 text-amber-400" />}
              <span>{gameMode === 'duel' ? 'RYWAL' : 'LIMIT'}</span>
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              {gameMode === 'duel' ? 'Zegar bota' : '45.0s'}
            </span>
          </div>

          <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-slate-300">
            {gameMode === 'duel' ? botTime.toFixed(1) : '45.0'}
            <span className="text-sm text-slate-500 ml-1">s</span>
          </div>
        </div>
      </div>

      {/* GAME ARENA */}
      {gameState === 'playing' && currentItem && (
        <div className={`relative bg-slate-900/90 border rounded-3xl p-5 sm:p-6 shadow-2xl transition-all duration-200 ${
          feedback === 'correct' 
            ? 'border-emerald-500 bg-emerald-950/20 ring-4 ring-emerald-500/30'
            : feedback === 'pass'
            ? 'border-rose-500 bg-rose-950/20 ring-4 ring-rose-500/30'
            : 'border-slate-800'
        }`}>
          {/* Item index */}
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-500">
            <span>#{currentIndex + 1}</span>
            <span>{category === 'all' ? 'Wielki Mix' : ''}</span>
          </div>

          {/* Central Image - strictly no giveaway text! */}
          <div className="h-64 sm:h-72 w-full max-w-md mx-auto mb-5 flex items-center justify-center p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 relative">
            <SmartImage
              src={currentItem.imageUrl}
              alt="Element The Floor"
              fallbackText="?"
              hideLabel={true}
              badgeColor={currentItem.badgeColor || '#4f46e5'}
              className="w-full h-full max-h-64"
            />

            {/* Subtle bot thinking overlay */}
            {activeTurn === 'bot' && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs rounded-2xl flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 border border-rose-500/40 text-xs font-bold text-rose-300">
                  <div className="w-3 h-3 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
                  <span>Ruch rywala...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input & Direct Actions */}
          <div className="max-w-md mx-auto space-y-3">
            <input
              ref={inputRef}
              type="text"
              disabled={activeTurn !== 'player'}
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (checkAnswerMatch(userInput, currentItem)) {
                    handlePlayerSuccess();
                  } else if (userInput.trim().length > 0) {
                    sound.playPass();
                    setFeedback('pass');
                    setTimeout(() => setFeedback(null), 250);
                  }
                }
              }}
              placeholder={activeTurn === 'player' ? "Wpisz nazwę (lub powiedz i [SPACJA])..." : "Ruch przeciwnika..."}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border-2 border-indigo-500/40 focus:border-amber-400 text-white placeholder-slate-500 text-base font-semibold outline-none transition-all text-center"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={activeTurn !== 'player'}
                onClick={handlePlayerSuccess}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wide shadow-md active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>WIEM!</span>
                <span className="text-[10px] opacity-70 ml-1 font-mono">[SPACJA]</span>
              </button>

              <button
                disabled={activeTurn !== 'player'}
                onClick={handlePlayerPass}
                className="py-3 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-sm uppercase tracking-wide shadow-md active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[3]" />
                <span>PAS (-3s)</span>
                <span className="text-[10px] opacity-70 ml-1 font-mono">[ESC]</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT SCREEN */}
      {gameState === 'ended' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center max-w-lg mx-auto shadow-2xl animate-fadeIn">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
            winner === 'player' ? 'bg-amber-500 text-slate-950' : 'bg-rose-900 text-rose-300'
          }`}>
            {winner === 'player' ? <Trophy className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
          </div>

          <h3 className="text-2xl font-black text-white uppercase mb-4">
            {winner === 'player' ? 'WYGRANA!' : 'KONIEC CZASU!'}
          </h3>

          <div className="grid grid-cols-3 gap-2.5 mb-6 text-center text-xs">
            <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Trafione</span>
              <strong className="text-emerald-400 text-xl font-mono">{correctList.length}</strong>
            </div>
            <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Pasy</span>
              <strong className="text-rose-400 text-xl font-mono">{passedList.length}</strong>
            </div>
            <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Czas</span>
              <strong className="text-amber-400 text-xl font-mono">{playerTime.toFixed(1)}s</strong>
            </div>
          </div>

          {passedList.length > 0 && (
            <div className="text-left mb-6 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wide block mb-2">
                Spasowane w tej rundzie:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {passedList.map((item, idx) => (
                  <span key={idx} className="px-2 py-1 bg-slate-900 rounded text-xs text-white border border-slate-800 font-semibold">
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={restartGame}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all"
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
