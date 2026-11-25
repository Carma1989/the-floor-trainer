import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, RotateCcw, SkipForward, Trophy, Swords, Wifi, Smartphone, Copy, Check, LogIn } from 'lucide-react';
import { SmartImage } from './SmartImage';
import { sound } from '../utils/audio';
import { resolveAssetUrl } from '../utils/assets';
import { buildSmartChoices } from '../utils/choices';
import { connectOnlineRoom, generateRoomCode } from '../utils/onlineRoom';

const INITIAL_TIME = 45.0;
const PASS_PENALTY_SECONDS = 3.0;
const OPTION_LABELS = ['A', 'B', 'C'];

export function MobileDuel2P({ categories, selectedCategory, onSelectCategory }) {
  const urlRoom = useMemo(() => new URLSearchParams(window.location.search).get('room') || '', []);

  // Mode: 'local' (1 phone) | 'online' (2 phones anywhere)
  const [duelMode, setDuelMode] = useState(urlRoom ? 'online' : 'local');
  const [phase, setPhase] = useState('setup'); // 'setup' | 'lobby' | 'playing' | 'finished'

  // Players
  const [p1Name, setP1Name] = useState('Gracz 1');
  const [p2Name, setP2Name] = useState('Gracz 2');
  const [myName, setMyName] = useState('Gracz');

  // Online room state
  const [onlineRole, setOnlineRole] = useState(urlRoom ? 'guest' : 'host'); // 'host' | 'guest'
  const [roomCode, setRoomCode] = useState(urlRoom);
  const [joinCode, setJoinCode] = useState(urlRoom);
  const [connStatus, setConnStatus] = useState('idle'); // 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  const [guestJoined, setGuestJoined] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Game state
  const [items, setItems] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [activePlayer, setActivePlayer] = useState(1); // 1 | 2
  const [p1Time, setP1Time] = useState(INITIAL_TIME);
  const [p2Time, setP2Time] = useState(INITIAL_TIME);
  const [passRemaining, setPassRemaining] = useState(0);
  const [pickedWrongId, setPickedWrongId] = useState(null);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Passes, setP1Passes] = useState(0);
  const [p2Passes, setP2Passes] = useState(0);
  const [winner, setWinner] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);

  // Guest-synced remote state
  const [remoteState, setRemoteState] = useState(null);

  const [clientId] = useState(() => Math.random().toString(36).slice(2, 10));
  const clientIdRef = useRef(clientId);
  const roomConnRef = useRef(null);
  const lastTickRef = useRef(null);
  const lastBroadcastRef = useRef(0);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' }));
  }, [categories]);

  const buildDeck = useCallback(() => {
    let pool = [];
    if (selectedCategory === 'all') {
      categories.forEach(c => {
        (c.items || []).forEach(it => {
          pool.push({ ...it, categoryId: c.id, categoryName: c.name, categoryEmoji: c.emoji });
        });
      });
    } else {
      const match = categories.find(c => c.id === selectedCategory);
      if (match) {
        pool = (match.items || []).map(it => ({
          ...it,
          categoryId: match.id,
          categoryName: match.name,
          categoryEmoji: match.emoji,
        }));
      }
    }
    return [...pool].sort(() => Math.random() - 0.5);
  }, [categories, selectedCategory]);

  const currentItem = useMemo(() => {
    if (duelMode === 'online' && onlineRole === 'guest') {
      if (!remoteState?.cardItemId) return null;
      const cat = categories.find(c => c.id === remoteState.cardCategoryId);
      const found = cat?.items?.find(it => it.id === remoteState.cardItemId);
      if (!found) return null;
      return {
        ...found,
        categoryId: cat.id,
        categoryName: cat.name,
        categoryEmoji: cat.emoji,
      };
    }
    return items[cardIndex] || null;
  }, [duelMode, onlineRole, remoteState, categories, items, cardIndex]);

  const choices = useMemo(() => {
    if (duelMode === 'online' && onlineRole === 'guest') {
      return remoteState?.choices || [];
    }
    if (!currentItem) return [];
    const sameCat = categories.find(c => c.id === currentItem.categoryId)?.items || [];
    return buildSmartChoices(currentItem, sameCat, items);
  }, [duelMode, onlineRole, remoteState, currentItem, categories, items]);

  // Cleanup online room on unmount
  useEffect(() => {
    return () => {
      if (roomConnRef.current) {
        roomConnRef.current.close();
        roomConnRef.current = null;
      }
    };
  }, []);

  const broadcastState = useCallback((override = {}) => {
    if (duelMode !== 'online' || onlineRole !== 'host' || !roomConnRef.current) return;
    const item = override.item !== undefined ? override.item : currentItem;
    const opts = override.choices !== undefined ? override.choices : choices;
    roomConnRef.current.send({
      type: 'state',
      phase: override.phase ?? phase,
      p1Name: override.p1Name ?? p1Name,
      p2Name: override.p2Name ?? p2Name,
      p1Time: override.p1Time ?? p1Time,
      p2Time: override.p2Time ?? p2Time,
      p1Score: override.p1Score ?? p1Score,
      p2Score: override.p2Score ?? p2Score,
      p1Passes: override.p1Passes ?? p1Passes,
      p2Passes: override.p2Passes ?? p2Passes,
      activePlayer: override.activePlayer ?? activePlayer,
      passRemaining: override.passRemaining ?? passRemaining,
      pickedWrongId: override.pickedWrongId !== undefined ? override.pickedWrongId : pickedWrongId,
      winner: override.winner !== undefined ? override.winner : winner,
      lastEvent: override.lastEvent !== undefined ? override.lastEvent : lastEvent,
      cardCategoryId: item?.categoryId || null,
      cardItemId: item?.id || null,
      choices: opts.map(o => ({ id: o.id, name: o.name })),
    });
  }, [
    duelMode, onlineRole, phase, p1Name, p2Name, p1Time, p2Time,
    p1Score, p2Score, p1Passes, p2Passes, activePlayer, passRemaining,
    pickedWrongId, winner, lastEvent, currentItem, choices
  ]);

  const startLocalOrHostDuel = useCallback(() => {
    const deck = buildDeck();
    if (!deck.length) return;
    const firstItem = deck[0];
    const sameCat = categories.find(c => c.id === firstItem.categoryId)?.items || [];
    const firstChoices = buildSmartChoices(firstItem, sameCat, deck);

    setItems(deck);
    setCardIndex(0);
    setActivePlayer(1);
    setP1Time(INITIAL_TIME);
    setP2Time(INITIAL_TIME);
    setPassRemaining(0);
    setPickedWrongId(null);
    setP1Score(0);
    setP2Score(0);
    setP1Passes(0);
    setP2Passes(0);
    setWinner(null);
    setLastEvent(null);
    lastTickRef.current = Date.now();
    setPhase('playing');

    if (duelMode === 'online' && onlineRole === 'host') {
      broadcastState({
        phase: 'playing',
        p1Time: INITIAL_TIME,
        p2Time: INITIAL_TIME,
        p1Score: 0,
        p2Score: 0,
        p1Passes: 0,
        p2Passes: 0,
        activePlayer: 1,
        passRemaining: 0,
        pickedWrongId: null,
        winner: null,
        lastEvent: null,
        item: firstItem,
        choices: firstChoices,
      });
    }
  }, [buildDeck, categories, duelMode, onlineRole, broadcastState]);

  const advanceCard = useCallback(() => {
    setPickedWrongId(null);
    setCardIndex(prev => (prev + 1 >= items.length ? 0 : prev + 1));
  }, [items.length]);

  const triggerPenaltyPass = useCallback((wrongId = null, eventInfo = null) => {
    if (phase !== 'playing' || passRemaining > 0) return;
    sound.playPass();
    setPickedWrongId(wrongId);
    if (activePlayer === 1) {
      setP1Passes(p => p + 1);
    } else {
      setP2Passes(p => p + 1);
    }
    if (eventInfo) setLastEvent(eventInfo);
    setPassRemaining(PASS_PENALTY_SECONDS);
  }, [phase, passRemaining, activePlayer]);

  const handleSelectOption = useCallback((option, optionIdx) => {
    const activePhase = duelMode === 'online' && onlineRole === 'guest' ? remoteState?.phase : phase;
    const activePass = duelMode === 'online' && onlineRole === 'guest' ? (remoteState?.passRemaining || 0) : passRemaining;
    const turn = duelMode === 'online' && onlineRole === 'guest' ? remoteState?.activePlayer : activePlayer;

    if (activePhase !== 'playing' || activePass > 0 || !currentItem) return;

    // In online mode, only the active player can click
    if (duelMode === 'online') {
      const myPlayerNum = onlineRole === 'host' ? 1 : 2;
      if (turn !== myPlayerNum) return;
      if (onlineRole === 'guest') {
        roomConnRef.current?.send({ type: 'action', action: 'pick', optionName: option.name, optionId: option.id, optionIdx });
        return;
      }
    }

    const label = OPTION_LABELS[optionIdx] || '';
    const isCorrect = option.name.toLowerCase() === currentItem.name.toLowerCase();
    const actorName = activePlayer === 1 ? (p1Name || 'Gracz 1') : (p2Name || 'Gracz 2');

    if (isCorrect) {
      sound.playCorrect();
      setLastEvent({ player: activePlayer, playerName: actorName, label, choiceName: option.name, correct: true });
      if (activePlayer === 1) {
        setP1Score(s => s + 1);
        setActivePlayer(2);
      } else {
        setP2Score(s => s + 1);
        setActivePlayer(1);
      }
      lastTickRef.current = Date.now();
      advanceCard();
    } else {
      triggerPenaltyPass(option.id || option.name, {
        player: activePlayer,
        playerName: actorName,
        label,
        choiceName: option.name,
        correct: false,
      });
    }
  }, [duelMode, onlineRole, remoteState, phase, passRemaining, activePlayer, currentItem, p1Name, p2Name, advanceCard, triggerPenaltyPass]);

  const handlePassButton = useCallback(() => {
    if (duelMode === 'online') {
      const myPlayerNum = onlineRole === 'host' ? 1 : 2;
      const turn = onlineRole === 'guest' ? remoteState?.activePlayer : activePlayer;
      if (turn !== myPlayerNum) return;
      if (onlineRole === 'guest') {
        roomConnRef.current?.send({ type: 'action', action: 'pass' });
        return;
      }
    }
    const actorName = activePlayer === 1 ? (p1Name || 'Gracz 1') : (p2Name || 'Gracz 2');
    triggerPenaltyPass(null, { player: activePlayer, playerName: actorName, pass: true });
  }, [duelMode, onlineRole, remoteState, activePlayer, p1Name, p2Name, triggerPenaltyPass]);

  // Ref for host to process incoming guest actions cleanly
  const hostActionRef = useRef(null);
  useEffect(() => {
    hostActionRef.current = (msg) => {
      if (duelMode !== 'online' || onlineRole !== 'host') return;
      if (msg.type === 'join') {
        const guestNm = (msg.name || 'Gracz 2').trim() || 'Gracz 2';
        setP2Name(guestNm);
        setGuestJoined(true);
        roomConnRef.current?.send({ type: 'host_hello', p1Name: p1Name || 'Gracz 1', p2Name: guestNm });
        if (phase === 'playing') {
          broadcastState({ p2Name: guestNm });
        }
      } else if (msg.type === 'action' && phase === 'playing' && activePlayer === 2 && passRemaining <= 0) {
        if (msg.action === 'pass') {
          triggerPenaltyPass(null, { player: 2, playerName: p2Name || 'Gracz 2', pass: true });
        } else if (msg.action === 'pick' && currentItem) {
          const opt = choices.find(c => c.name === msg.optionName) || { id: msg.optionId, name: msg.optionName };
          const label = OPTION_LABELS[msg.optionIdx] || '';
          const isCorrect = opt.name.toLowerCase() === currentItem.name.toLowerCase();
          if (isCorrect) {
            sound.playCorrect();
            setLastEvent({ player: 2, playerName: p2Name || 'Gracz 2', label, choiceName: opt.name, correct: true });
            setP2Score(s => s + 1);
            setActivePlayer(1);
            lastTickRef.current = Date.now();
            advanceCard();
          } else {
            triggerPenaltyPass(opt.id || opt.name, {
              player: 2,
              playerName: p2Name || 'Gracz 2',
              label,
              choiceName: opt.name,
              correct: false,
            });
          }
        }
      }
    };
  }, [duelMode, onlineRole, phase, activePlayer, passRemaining, p1Name, p2Name, currentItem, choices, advanceCard, triggerPenaltyPass, broadcastState]);

  const openHostRoom = () => {
    const code = generateRoomCode();
    const hostNm = myName.trim() || 'Gracz 1';
    setP1Name(hostNm);
    setP2Name('Oczekiwanie...');
    setOnlineRole('host');
    setRoomCode(code);
    setGuestJoined(false);
    setPhase('lobby');

    if (roomConnRef.current) roomConnRef.current.close();
    roomConnRef.current = connectOnlineRoom({
      roomCode: code,
      clientId: clientIdRef.current,
      onStatus: setConnStatus,
      onMessage: (msg) => hostActionRef.current?.(msg),
    });
  };

  const joinGuestRoom = () => {
    const code = joinCode.trim();
    if (code.length < 4) return;
    const guestNm = myName.trim() || 'Gracz 2';
    setOnlineRole('guest');
    setRoomCode(code);
    setRemoteState(null);
    setPhase('lobby');

    if (roomConnRef.current) roomConnRef.current.close();
    roomConnRef.current = connectOnlineRoom({
      roomCode: code,
      clientId: clientIdRef.current,
      onStatus: (st) => {
        setConnStatus(st);
        if (st === 'connected') {
          roomConnRef.current?.send({ type: 'join', name: guestNm });
        }
      },
      onMessage: (msg) => {
        if (msg.type === 'host_hello') {
          setP1Name(msg.p1Name || 'Gracz 1');
          setP2Name(msg.p2Name || guestNm);
        } else if (msg.type === 'state') {
          setRemoteState(msg);
          if (msg.phase === 'playing') setPhase('playing');
          else if (msg.phase === 'finished') setPhase('finished');
        }
      },
    });
  };

  const leaveOnlineRoom = () => {
    if (roomConnRef.current) {
      roomConnRef.current.close();
      roomConnRef.current = null;
    }
    setConnStatus('idle');
    setGuestJoined(false);
    setRemoteState(null);
    setPhase('setup');
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Preload next 2 cards
  useEffect(() => {
    if (phase !== 'playing' || !items.length) return;
    if (duelMode === 'online' && onlineRole === 'guest') return;
    for (let offset = 1; offset <= 2; offset++) {
      const nextItem = items[(cardIndex + offset) % items.length];
      if (nextItem?.imageUrl && !nextItem.imageUrl.startsWith('data:')) {
        const img = new Image();
        img.decoding = 'async';
        img.src = resolveAssetUrl(nextItem.imageUrl);
      }
    }
  }, [phase, items, cardIndex, duelMode, onlineRole]);

  // Broadcast immediately on card/turn/phase changes (Host)
  useEffect(() => {
    if (duelMode === 'online' && onlineRole === 'host' && (phase === 'playing' || phase === 'finished')) {
      broadcastState();
    }
  }, [duelMode, onlineRole, phase, cardIndex, activePlayer, pickedWrongId, winner, broadcastState]);

  // High-accuracy delta timer (Host or Local)
  useEffect(() => {
    if (phase !== 'playing') return;
    if (duelMode === 'online' && onlineRole === 'guest') return;
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

      if (duelMode === 'online' && onlineRole === 'host' && now - lastBroadcastRef.current >= 400) {
        lastBroadcastRef.current = now;
        broadcastState();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [phase, duelMode, onlineRole, activePlayer, advanceCard, broadcastState]);

  // Guest smooth local clock interpolation between host syncs
  useEffect(() => {
    if (duelMode !== 'online' || onlineRole !== 'guest' || phase !== 'playing') return;
    let last = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      if (dt <= 0 || dt > 0.5) return;
      setRemoteState(prev => {
        if (!prev || prev.phase !== 'playing') return prev;
        return {
          ...prev,
          p1Time: prev.activePlayer === 1 ? Math.max(0, prev.p1Time - dt) : prev.p1Time,
          p2Time: prev.activePlayer === 2 ? Math.max(0, prev.p2Time - dt) : prev.p2Time,
          passRemaining: prev.passRemaining > 0 ? Math.max(0, prev.passRemaining - dt) : 0,
        };
      });
    }, 50);
    return () => clearInterval(interval);
  }, [duelMode, onlineRole, phase]);

  // SETUP SCREEN
  if (phase === 'setup') {
    const selectedObj = selectedCategory === 'all' ? null : categories.find(c => c.id === selectedCategory);
    const totalCards = selectedCategory === 'all'
      ? categories.reduce((s, c) => s + (c.items?.length || 0), 0)
      : (selectedObj?.items?.length || 0);

    return (
      <div className="flex flex-col h-full min-h-0 justify-between gap-2.5 overflow-y-auto px-1 pb-2 scrollbar-none">
        {/* Local vs Online Switch */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setDuelMode('local')}
            className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              duelMode === 'local' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Na 1 telefonie</span>
          </button>
          <button
            type="button"
            onClick={() => setDuelMode('online')}
            className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              duelMode === 'online' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Online (2 telefony)</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              {duelMode === 'online' ? 'Pojedynek Online (2 różne sieci)' : 'Pojedynek 1 vs 1 (A / B / C)'}
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {duelMode === 'online'
              ? 'Gracie z dwóch różnych miejsc (LTE/5G/Wi-Fi). Widzicie te same karty, zegary 45s i na żywo odpowiedzi drugiej osoby.'
              : 'Każdy gracz ma 45s. Poprawna odpowiedź A/B/C zatrzymuje zegar i oddaje turę. Błąd lub PAS to 3s kary.'}
          </p>
        </div>

        {duelMode === 'local' ? (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1.5">
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

            <button
              onClick={startLocalOrHostDuel}
              className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-lg tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Play className="w-6 h-6" />
              <span>START POJEDYNKU</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Twoje imię</span>
              <input
                type="text"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                maxLength={16}
                placeholder="Wpisz swoje imię..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-bold outline-none"
              />
            </div>

            {/* Create room (Host) */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-3 flex flex-col gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                1. Stwórz nowy pokój (Ty wybierasz kategorię)
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => onSelectCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold outline-none"
              >
                <option value="all">Wszystkie kategorie ({categories.reduce((s, c) => s + (c.items?.length || 0), 0)} haseł)</option>
                {sortedCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name} ({c.items?.length || 0})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={openHostRoom}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-sm tracking-wider cursor-pointer transition-all"
              >
                STWÓRZ POKÓJ ONLINE
              </button>
            </div>

            {/* Join room (Guest) */}
            <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-3 flex flex-col gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">
                2. Lub dołącz do pokoju znajomego
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Kod pokoju (np. 4829)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono font-bold outline-none text-center"
                />
                <button
                  type="button"
                  onClick={joinGuestRoom}
                  disabled={joinCode.trim().length < 4}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black text-xs flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>DOŁĄCZ</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ONLINE LOBBY
  if (phase === 'lobby') {
    return (
      <div className="flex flex-col h-full justify-between gap-4 px-2 py-2">
        <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-900 border border-slate-800 rounded-3xl p-5 gap-4">
          <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-300">
            Status: {connStatus === 'connected' ? 'Połączono Online' : connStatus === 'error' ? 'Błąd połączenia' : 'Łączenie...'}
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Kod pokoju</span>
            <div className="text-5xl font-mono font-black text-amber-400 tracking-widest mt-1">
              {roomCode}
            </div>
          </div>

          {onlineRole === 'host' ? (
            <>
              <button
                type="button"
                onClick={copyInviteLink}
                className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{copiedLink ? 'Skopiowano link!' : 'Kopiuj link zaproszenia'}</span>
              </button>

              <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs">
                {guestJoined ? (
                  <span className="text-emerald-400 font-bold">
                    Dołączył gracz: {p2Name}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Czekam na drugiego gracza (wyślij kod lub link)...
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-300">
              Połączono z pokojem <strong className="text-white">{roomCode}</strong>. Czekaj, aż gospodarz kliknie START...
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {onlineRole === 'host' && (
            <button
              type="button"
              disabled={!guestJoined || connStatus !== 'connected'}
              onClick={startLocalOrHostDuel}
              className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black text-base tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Play className="w-5 h-5" />
              <span>START POJEDYNKU</span>
            </button>
          )}
          <button
            type="button"
            onClick={leaveOnlineRoom}
            className="w-full py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm cursor-pointer"
          >
            Wyjdź z pokoju
          </button>
        </div>
      </div>
    );
  }

  // View state (either local/host or guest remoteState)
  const view = duelMode === 'online' && onlineRole === 'guest' && remoteState ? remoteState : {
    phase, p1Name, p2Name, p1Time, p2Time, p1Score, p2Score, p1Passes, p2Passes,
    activePlayer, passRemaining, pickedWrongId, winner, lastEvent
  };

  if (view.phase === 'finished') {
    const winName = view.winner === 1 ? (view.p1Name || 'Gracz 1') : (view.p2Name || 'Gracz 2');
    const winTime = view.winner === 1 ? view.p1Time : view.p2Time;
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
              Pozostały czas: {Number(winTime).toFixed(1)} s
            </p>
          </div>

          <div className="w-full grid grid-cols-2 gap-2.5 mt-2">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
              <div className="text-xs font-bold text-amber-400 truncate">{view.p1Name || 'Gracz 1'}</div>
              <div className="text-xl font-black text-white mt-1">{view.p1Score} pkt</div>
              <div className="text-[11px] text-slate-400">Pas/błąd: {view.p1Passes}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
              <div className="text-xs font-bold text-indigo-400 truncate">{view.p2Name || 'Gracz 2'}</div>
              <div className="text-xl font-black text-white mt-1">{view.p2Score} pkt</div>
              <div className="text-[11px] text-slate-400">Pas/błąd: {view.p2Passes}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {(duelMode === 'local' || onlineRole === 'host') ? (
            <button
              onClick={startLocalOrHostDuel}
              className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-base tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              <span>REWANŻ (NOWE KARTY)</span>
            </button>
          ) : (
            <div className="w-full py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-center text-xs font-bold">
              Czekaj na rewanż od gospodarza...
            </div>
          )}
          <button
            onClick={duelMode === 'online' ? leaveOnlineRoom : () => setPhase('setup')}
            className="w-full py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm cursor-pointer"
          >
            {duelMode === 'online' ? 'Wyjdź z pokoju' : 'Zmień kategorię lub graczy'}
          </button>
        </div>
      </div>
    );
  }

  // PLAYING PHASE (A / B / C)
  const isPassing = view.passRemaining > 0;
  const isMyTurn = duelMode === 'local' || (onlineRole === 'host' ? view.activePlayer === 1 : view.activePlayer === 2);

  return (
    <div className="flex flex-col h-full min-h-0 justify-between pb-1 gap-1.5">
      {/* Dual Clocks */}
      <div className="grid grid-cols-2 gap-2 px-1 shrink-0">
        <div className={`rounded-2xl p-2 border transition-all ${
          view.activePlayer === 1
            ? 'bg-amber-400/15 border-amber-400 shadow-md'
            : 'bg-slate-900 border-slate-800 opacity-60'
        }`}>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-black uppercase truncate text-amber-300">{view.p1Name || 'Gracz 1'}</span>
            <span className="text-[10px] font-mono text-slate-400">{view.p1Score} pkt</span>
          </div>
          <div className={`text-xl font-mono font-black ${view.p1Time <= 10 && view.activePlayer === 1 ? 'text-rose-400' : 'text-white'}`}>
            {Number(view.p1Time).toFixed(1)}s
          </div>
        </div>

        <div className={`rounded-2xl p-2 border transition-all ${
          view.activePlayer === 2
            ? 'bg-indigo-600/25 border-indigo-400 shadow-md'
            : 'bg-slate-900 border-slate-800 opacity-60'
        }`}>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-black uppercase truncate text-indigo-300">{view.p2Name || 'Gracz 2'}</span>
            <span className="text-[10px] font-mono text-slate-400">{view.p2Score} pkt</span>
          </div>
          <div className={`text-xl font-mono font-black ${view.p2Time <= 10 && view.activePlayer === 2 ? 'text-rose-400' : 'text-white'}`}>
            {Number(view.p2Time).toFixed(1)}s
          </div>
        </div>
      </div>

      {/* Category + Live Opponent Event + Stop */}
      <div className="flex items-center justify-between gap-2 px-2 shrink-0">
        {currentItem?.categoryName ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 truncate min-w-0">
            <span>{currentItem.categoryEmoji}</span>
            <span className="truncate">{currentItem.categoryName}</span>
          </span>
        ) : <span />}

        <button
          type="button"
          onClick={duelMode === 'online' ? leaveOnlineRoom : () => setPhase('setup')}
          className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 shrink-0"
        >
          Stop
        </button>
      </div>

      {/* Live Action Banner (shows opponent's choice live!) */}
      {view.lastEvent && (
        <div className="mx-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-center text-[11px] font-bold truncate shrink-0">
          {view.lastEvent.pass ? (
            <span className="text-rose-400">{view.lastEvent.playerName}: PAS (-3s)</span>
          ) : view.lastEvent.correct ? (
            <span className="text-emerald-400">{view.lastEvent.playerName} wybrał {view.lastEvent.label}: {view.lastEvent.choiceName} ✓</span>
          ) : (
            <span className="text-rose-400">{view.lastEvent.playerName} wybrał {view.lastEvent.label}: {view.lastEvent.choiceName} ✕ (-3s)</span>
          )}
        </div>
      )}

      {/* Card Image */}
      {currentItem && (
        <div className="flex-1 min-h-0 flex items-center justify-center px-2">
          <div className={`relative w-[225px] h-[225px] sm:w-[255px] sm:h-[255px] shrink-0 p-1 rounded-3xl transition-all ${
            isPassing ? 'ring-4 ring-rose-500' : view.activePlayer === 1 ? 'ring-4 ring-amber-400/80' : 'ring-4 ring-indigo-500'
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

      {/* A / B / C Answer Buttons */}
      <div className="flex flex-col gap-1.5 px-2 shrink-0">
        {!isMyTurn && !isPassing && (
          <div className="text-center text-[11px] font-black uppercase tracking-wider text-slate-400 py-0.5">
            Tura: {view.activePlayer === 1 ? view.p1Name : view.p2Name} (patrzysz na żywo)
          </div>
        )}

        {choices.map((opt, idx) => {
          const isCorrectOpt = currentItem && opt.name.toLowerCase() === currentItem.name.toLowerCase();
          const isPickedWrong = isPassing && view.pickedWrongId && (opt.id === view.pickedWrongId || opt.name === view.pickedWrongId);

          let btnStyle = 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800';
          if (isPassing) {
            if (isCorrectOpt) {
              btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
            } else if (isPickedWrong) {
              btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
            } else {
              btnStyle = 'bg-slate-900 border-slate-800 text-slate-500 opacity-60';
            }
          } else if (!isMyTurn) {
            btnStyle = 'bg-slate-900 border-slate-800 text-slate-400 opacity-75';
          }

          return (
            <button
              key={`${opt.id || opt.name}-${idx}`}
              type="button"
              disabled={isPassing || !isMyTurn}
              onClick={() => handleSelectOption(opt, idx)}
              className={`w-full px-3 py-2 rounded-xl border text-left flex items-center gap-2.5 transition-all active:scale-[0.99] cursor-pointer ${btnStyle}`}
            >
              <span className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-black text-amber-400 shrink-0">
                {OPTION_LABELS[idx]}
              </span>
              <span className="text-sm font-bold truncate">{opt.name}</span>
            </button>
          );
        })}

        {/* PAS (3s) button */}
        <button
          type="button"
          disabled={isPassing || !isMyTurn}
          onClick={handlePassButton}
          className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-50 text-white font-black text-sm tracking-wider shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
        >
          <SkipForward className="w-4 h-4" />
          <span>{isPassing ? `KARA PAS: ${Number(view.passRemaining).toFixed(1)}s` : 'PAS (3s)'}</span>
        </button>
      </div>
    </div>
  );
}
