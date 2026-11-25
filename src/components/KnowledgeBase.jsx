import React, { useState, useMemo } from 'react';
import { 
  Search, 
  PlusCircle, 
  Download, 
  Upload, 
  Sparkles, 
  X, 
  Check, 
  Filter, 
  Globe, 
  Layers,
  HelpCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  RotateCw
} from 'lucide-react';
import { SmartImage } from './SmartImage';
import { addCustomItemToCategory, saveCustomCategory, exportDataAsJSON, importDataFromJSON } from '../utils/storage';

export function KnowledgeBase({ categories, onCategoriesUpdated }) {
  const [selectedCatId, setSelectedCatId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewCatModal, setShowNewCatModal] = useState(false);

  // Form states for new item
  const [newItemName, setNewItemName] = useState('');
  const [newItemAliases, setNewItemAliases] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(categories[0]?.id || 'motorcycles');
  const [newItemCountry, setNewItemCountry] = useState('');
  const [newItemHint, setNewItemHint] = useState('');
  const [newItemImageUrl, setNewItemImageUrl] = useState('');
  const [newItemColor, setNewItemColor] = useState('#6366f1');

  // Form states for new category
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('⭐');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8b5cf6');

  // Filtered Items
  const filteredItems = useMemo(() => {
    let list = [];
    if (selectedCatId === 'all') {
      categories.forEach(c => {
        (c.items || []).forEach(item => {
          list.push({ ...item, categoryName: c.name, categoryEmoji: c.emoji, categoryColor: c.color });
        });
      });
    } else {
      const match = categories.find(c => c.id === selectedCatId);
      if (match) {
        list = (match.items || []).map(item => ({
          ...item,
          categoryName: match.name,
          categoryEmoji: match.emoji,
          categoryColor: match.color
        }));
      }
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(item => 
      item.name.toLowerCase().includes(q) ||
      (item.country && item.country.toLowerCase().includes(q)) ||
      (item.hint && item.hint.toLowerCase().includes(q)) ||
      (item.aliases && item.aliases.some(a => a.toLowerCase().includes(q)))
    );
  }, [categories, selectedCatId, searchQuery]);

  // Handle Add Item Submit
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const aliasList = newItemAliases
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const itemObj = {
      id: `custom-item-${Date.now()}`,
      name: newItemName.trim(),
      aliases: aliasList.length > 0 ? aliasList : [newItemName.trim().toLowerCase()],
      country: newItemCountry.trim() || 'Ogólne',
      hint: newItemHint.trim() || 'Własna notatka do zapamiętania.',
      badgeColor: newItemColor,
      imageUrl: newItemImageUrl.trim() || ''
    };

    addCustomItemToCategory(newItemCategory, itemObj);
    onCategoriesUpdated();
    setShowAddModal(false);

    // Reset form
    setNewItemName('');
    setNewItemAliases('');
    setNewItemCountry('');
    setNewItemHint('');
    setNewItemImageUrl('');
  };

  // Handle Add Category Submit
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const catId = `cat-${Date.now()}`;
    const newCat = {
      id: catId,
      name: newCatName.trim(),
      emoji: newCatEmoji.trim() || '📁',
      description: newCatDesc.trim() || 'Kategoria użytkownika',
      color: newCatColor,
      items: [],
      customItems: []
    };

    saveCustomCategory(newCat);
    onCategoriesUpdated();
    setSelectedCatId(catId);
    setShowNewCatModal(false);

    // Reset form
    setNewCatName('');
    setNewCatDesc('');
  };

  // Handle JSON file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const ok = importDataFromJSON(content);
        if (ok) {
          onCategoriesUpdated();
          alert('Baza wiedzy została pomyślnie zaktualizowana!');
        } else {
          alert('Błąd odczytu pliku JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  const currentFlashcard = filteredItems[flashcardIndex] || null;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 animate-fadeIn">
      {/* Top Knowledge Base Bar */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <span>Baza Wiedzy The Floor</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
              {filteredItems.length} pozycji
            </span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Katalog graficzny, mnemotechniki, synonimy i fiszki do szybkiej nauki.
          </p>
        </div>

        {/* Action Buttons: Add Item, Add Category, Export, Flashcards */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsFlashcardMode(!isFlashcardMode)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isFlashcardMode
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isFlashcardMode ? 'Wyjdź z Fiszek' : 'Tryb Fiszek'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Dodaj pozycję</span>
          </button>

          <button
            onClick={() => setShowNewCatModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <span>+ Kategoria</span>
          </button>

          <button
            onClick={exportDataAsJSON}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
            title="Eksportuj bazę do JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <label
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Importuj bazę z JSON"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* FLASHCARD MODE VIEW */}
      {isFlashcardMode ? (
        <div className="max-w-xl mx-auto py-8 text-center animate-fadeIn">
          {currentFlashcard ? (
            <div className="space-y-6">
              {/* Card counter */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Fiszka {flashcardIndex + 1} z {filteredItems.length}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {currentFlashcard.categoryName}
                </span>
              </div>

              {/* Flashcard container */}
              <div 
                onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                className="cursor-pointer bg-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 rounded-3xl p-8 min-h-[360px] flex flex-col items-center justify-center relative shadow-2xl transition-all duration-300 group"
              >
                {!flashcardFlipped ? (
                  /* FRONT: Just the image */
                  <div className="flex flex-col items-center">
                    <div className="h-48 w-48 mb-4 flex items-center justify-center">
                      <SmartImage
                        src={currentFlashcard.imageUrl}
                        alt="Rozpoznaj ten element"
                        fallbackText="?"
                        badgeColor={currentFlashcard.badgeColor || '#4f46e5'}
                        className="w-full h-full max-h-44"
                      />
                    </div>
                    <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 group-hover:text-indigo-300">
                      <Eye className="w-4 h-4" />
                      <span>Kliknij, aby sprawdzić nazwę</span>
                    </span>
                  </div>
                ) : (
                  /* BACK: Revealed details */
                  <div className="animate-fadeIn space-y-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block">
                      Rozwiązanie:
                    </span>
                    <h3 className="text-3xl font-black text-white">
                      {currentFlashcard.name}
                    </h3>
                    <p className="text-slate-300 text-sm max-w-sm mx-auto leading-relaxed">
                      {currentFlashcard.hint}
                    </p>
                    <div className="pt-2 text-xs text-slate-400">
                      <span>Pochodzenie: <strong>{currentFlashcard.country}</strong></span>
                      {currentFlashcard.aliases?.length > 1 && (
                        <div className="mt-1 text-[11px] text-slate-500">
                          Akceptowane synonimy: {currentFlashcard.aliases.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={flashcardIndex === 0}
                  onClick={() => { setFlashcardIndex(i => i - 1); setFlashcardFlipped(false); }}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 disabled:opacity-40 text-slate-300 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm"
                >
                  {flashcardFlipped ? 'Ukryj odpowiedź' : 'Odkryj odpowiedź'}
                </button>

                <button
                  disabled={flashcardIndex >= filteredItems.length - 1}
                  onClick={() => { setFlashcardIndex(i => i + 1); setFlashcardFlipped(false); }}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 disabled:opacity-40 text-slate-300 hover:text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-400">Brak elementów do wyświetlenia w tej kategorii.</p>
          )}
        </div>
      ) : (
        /* STANDARD GALLERY VIEW */
        <>
          {/* Category Pills & Search */}
          <div className="space-y-4 mb-6">
            {/* Category horizontal scroll tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCatId('all')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCatId === 'all'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Wszystkie kategorie ({categories.reduce((s, c) => s + (c.items?.length || 0), 0)})
              </button>

              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    selectedCatId === cat.id
                      ? 'bg-slate-800 text-white border-indigo-500 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                  <span className="text-[10px] font-mono opacity-60">({cat.items?.length || 0})</span>
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj po nazwie, kraju, wskazówce lub synonimie..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-indigo-500 outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:bg-slate-900 flex flex-col justify-between group"
              >
                <div>
                  {/* Category Pill & Country */}
                  <div className="flex items-center justify-between text-[11px] mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold truncate max-w-[130px]">
                      {item.categoryEmoji} {item.categoryName}
                    </span>
                    <span className="text-slate-400 font-mono truncate max-w-[110px]">
                      {item.country}
                    </span>
                  </div>

                  {/* Image Stage */}
                  <div className="h-36 w-full flex items-center justify-center p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 mb-3 group-hover:border-slate-700 transition-colors">
                    <SmartImage
                      src={item.imageUrl}
                      alt={item.name}
                      fallbackText={item.name}
                      badgeColor={item.badgeColor || '#4f46e5'}
                      className="w-full h-full max-h-28"
                    />
                  </div>

                  {/* Item Title */}
                  <h4 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                    {item.name}
                  </h4>

                  {/* Hint / Memory hook */}
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {item.hint}
                  </p>
                </div>

                {/* Aliases for The Floor match */}
                {item.aliases && item.aliases.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                    <span className="text-slate-400">Synonimy:</span>
                    <span className="truncate">{item.aliases.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
              <p className="text-slate-400 text-sm">Nie znaleziono pozycji pasujących do kryteriów.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCatId('all'); }}
                className="mt-3 text-xs text-indigo-400 font-semibold hover:underline"
              >
                Wyczyść filtry
              </button>
            </div>
          )}
        </>
      )}

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-400" />
              <span>Dodaj nowy element do bazy</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Wpisz szczegóły. Element będzie natychmiast dostępny w grach i fiszkach.
            </p>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Kategoria *
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Pełna nazwa (prawidłowa odpowiedź) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Maserati, Balmain, Claude, DaVinci..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Synonimy / alternatywy (oddzielone przecinkami)
                </label>
                <input
                  type="text"
                  placeholder="np. ysl, yves saint laurent, saint laurent"
                  value={newItemAliases}
                  onChange={(e) => setNewItemAliases(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Kraj / Region
                  </label>
                  <input
                    type="text"
                    placeholder="np. Włochy, Francja, USA..."
                    value={newItemCountry}
                    onChange={(e) => setNewItemCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Kolor plakietki
                  </label>
                  <input
                    type="color"
                    value={newItemColor}
                    onChange={(e) => setNewItemColor(e.target.value)}
                    className="w-full h-10 rounded-xl bg-slate-950 border border-slate-800 p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Wskazówka mnemotechniczna / cecha rozpoznawcza
                </label>
                <textarea
                  rows="2"
                  placeholder="np. Trójząb w logo, założona w Bolonii..."
                  value={newItemHint}
                  onChange={(e) => setNewItemHint(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  URL Grafiki / Logo (opcjonalne)
                </label>
                <input
                  type="url"
                  placeholder="https://... (jeśli puste, wygenerujemy stylowy monogram)"
                  value={newItemImageUrl}
                  onChange={(e) => setNewItemImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg"
                >
                  Zapisz pozycję
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showNewCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowNewCatModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              Stwórz nową kategorię The Floor
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Możesz dodać np. Ras psa, Architektura, Samochody klasyczne, itp.
            </p>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Nazwa kategorii *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. Samochody sportowe"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Emoji
                  </label>
                  <input
                    type="text"
                    maxLength="2"
                    value={newCatEmoji}
                    onChange={(e) => setNewCatEmoji(e.target.value)}
                    className="w-full text-center px-2 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-lg focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Krótki opis kategorii
                </label>
                <input
                  type="text"
                  placeholder="np. Ikony motoryzacji i supersamochody"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Kolor motywu
                </label>
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-full h-10 rounded-xl bg-slate-950 border border-slate-800 p-1 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewCatModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg"
                >
                  Utwórz kategorię
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
