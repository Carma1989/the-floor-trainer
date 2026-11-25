import { DEFAULT_CATEGORIES } from '../data/categories';

const STORAGE_KEYS = {
  CUSTOM_CATEGORIES: 'the_floor_custom_categories_v1',
  STATS: 'the_floor_stats_v1',
  SOUND_MUTED: 'the_floor_sound_muted_v1',
};

export function loadCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    if (!raw) return DEFAULT_CATEGORIES;
    const custom = JSON.parse(raw);
    
    // Merge: start with default categories, allow overrides and add any new ones
    const merged = DEFAULT_CATEGORIES.map(defCat => {
      const customMatch = custom.find(c => c.id === defCat.id);
      if (customMatch) {
        return {
          ...defCat,
          ...customMatch,
          items: [...defCat.items, ...(customMatch.customItems || [])]
        };
      }
      return defCat;
    });

    // Add completely new custom categories
    const brandNew = custom.filter(c => !DEFAULT_CATEGORIES.some(d => d.id === c.id));
    return [...merged, ...brandNew];
  } catch (e) {
    console.error('Failed to load categories from storage', e);
    return DEFAULT_CATEGORIES;
  }
}

export function saveCustomCategory(newCategory) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    const custom = raw ? JSON.parse(raw) : [];
    const existingIdx = custom.findIndex(c => c.id === newCategory.id);
    if (existingIdx >= 0) {
      custom[existingIdx] = newCategory;
    } else {
      custom.push(newCategory);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(custom));
  } catch (e) {
    console.error('Failed to save custom category', e);
  }
}

export function addCustomItemToCategory(categoryId, newItem) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    const custom = raw ? JSON.parse(raw) : [];
    let cat = custom.find(c => c.id === categoryId);
    if (!cat) {
      cat = { id: categoryId, customItems: [] };
      custom.push(cat);
    }
    if (!cat.customItems) cat.customItems = [];
    cat.customItems.push(newItem);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(custom));
    return true;
  } catch (e) {
    console.error('Failed to add custom item', e);
    return false;
  }
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    return raw ? JSON.parse(raw) : {
      duelsPlayed: 0,
      duelsWon: 0,
      seterraPlayed: 0,
      totalCorrect: 0,
      totalPassed: 0,
      categoryStats: {}
    };
  } catch (e) {
    return { duelsPlayed: 0, duelsWon: 0, seterraPlayed: 0, totalCorrect: 0, totalPassed: 0, categoryStats: {} };
  }
}

export function saveStats(updater) {
  try {
    const current = loadStats();
    const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save stats', e);
  }
}

export function exportDataAsJSON() {
  const categories = loadCategories();
  const stats = loadStats();
  const payload = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    categories,
    stats
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `the-floor-trainer-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importDataFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.categories && Array.isArray(data.categories)) {
      const customOnly = data.categories.filter(c => !DEFAULT_CATEGORIES.some(d => d.id === c.id));
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(customOnly));
      if (data.stats) {
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats));
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to parse import data', e);
    return false;
  }
}
