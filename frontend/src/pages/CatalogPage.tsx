import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { cardApi, CardGroup } from '../api/cards';
import { Card, SetInfo } from '../types';
import CardCard from '../components/CardCard';
import Pagination from '../components/Pagination';

const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [cards, setCards] = useState<Card[]>([]);
  const [groups, setGroups] = useState<CardGroup[]>([]);
  const [groupedMode, setGroupedMode] = useState(false);
  const [sets, setSets] = useState<SetInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const hasInitialized = useRef(false);
  const isRestoring = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Form state - sync with URL params
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // On mount, restore from sessionStorage if URL has no params
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      
      const currentParams = Object.fromEntries(searchParams.entries());
      const hasParams = Object.keys(currentParams).length > 0;
      
      // If no params in URL, try to restore from sessionStorage
      if (!hasParams) {
        const savedUrl = sessionStorage.getItem('catalogLastUrl');
        
        if (savedUrl) {
          const url = new URL(savedUrl, window.location.origin);
          const savedParams = Object.fromEntries(url.searchParams.entries());
          
          if (Object.keys(savedParams).length > 0) {
            isRestoring.current = true;
            setSearchParams(savedParams, { replace: true });
            return; // Exit early, loadCards will run after params are set
          }
        }
      }
    }
  }, []);

  // Save current URL to sessionStorage whenever searchParams change
  useEffect(() => {
    if (Object.keys(Object.fromEntries(searchParams.entries())).length > 0) {
      const fullUrl = `${location.pathname}${location.search}`;
      sessionStorage.setItem('catalogLastUrl', fullUrl);
    }
  }, [searchParams, location]);

  // Save scroll position to sessionStorage
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('catalogScrollY', window.scrollY.toString());
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync form state with URL params whenever they change
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedSet(searchParams.get('set') || '');
    setSelectedRarity(searchParams.get('rarity') || '');
    setSelectedTags(searchParams.get('tags') ? searchParams.get('tags')!.split(',') : []);
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setSortBy(searchParams.get('sort') || 'name_asc');
    setOnlyInStock(searchParams.get('instock') === 'true');
  }, [searchParams]);

  // Restore scroll position after cards load
  useEffect(() => {
    if (!loading && cards.length > 0) {
      const savedScrollY = sessionStorage.getItem('catalogScrollY');
      if (savedScrollY) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScrollY, 10));
        }, 100);
        sessionStorage.removeItem('catalogScrollY');
      }
    }
  }, [cards, loading]);

  useEffect(() => {
    loadSets();
  }, []);

  useEffect(() => {
    // Don't load if we're in the middle of restoring params
    if (isRestoring.current) {
      isRestoring.current = false;
      return;
    }
    
    if (groupedMode) {
      loadGroupedCards();
    } else {
      loadCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, groupedMode]);

  const loadSets = async () => {
    try {
      const data = await cardApi.getSets();
      setSets(data.sets);
    } catch {
      // sets load silently — catalog still works without filter list
    }
  };

  const loadCards = async () => {
    setLoading(true);
    try {
      const params = {
        q: searchParams.get('q') || undefined,
        set: searchParams.get('set') || undefined,
        rarity: searchParams.get('rarity') || undefined,
        tags: searchParams.get('tags') || undefined,
        minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
        maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
        instock: searchParams.get('instock') || undefined,
        page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
        limit: 25,
        sort: (searchParams.get('sort') as any) || 'name_asc',
      };

      const data = await cardApi.getCards(params);
      setCards(data.cards);
      setPagination(data.pagination);
    } catch {
      // error shown via empty state
    } finally {
      setLoading(false);
    }
  };

  const loadGroupedCards = async () => {
    setLoading(true);
    try {
      const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
      const data = await cardApi.getGroupedCards({
        q: searchParams.get('q') || undefined,
        instock: searchParams.get('instock') || undefined,
        page,
        limit: 25,
      });
      setGroups(data.groups);
      setPagination(data.pagination);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback((overrides: { q?: string } = {}) => {
    const q = overrides.q !== undefined ? overrides.q : searchQuery;
    const params: Record<string, string> = { page: '1' };
    if (q) params.q = q;
    if (selectedSet) params.set = selectedSet;
    if (selectedRarity) params.rarity = selectedRarity;
    if (selectedTags.length > 0) params.tags = selectedTags.join(',');
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sortBy) params.sort = sortBy;
    if (onlyInStock) params.instock = 'true';
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchQuery, selectedSet, selectedRarity, selectedTags, minPrice, maxPrice, sortBy, onlyInStock, setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const handlePageChange = (page: number) => {
    const params = Object.fromEntries(searchParams.entries());
    params.page = page.toString();
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSet('');
    setSelectedRarity('');
    setSelectedTags([]);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('name_asc');
    setOnlyInStock(false);
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* ── Branded header banner ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1440 60%, #111e55 100%)' }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-[0.07]" style={{ backgroundColor: '#E31E24' }} />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#fca5a5' }}>MTG Singles</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-3">
                🃏 Card Catalog
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Browse our complete collection of Magic: The Gathering singles</p>
            </div>
            {/* Mini nav pills */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {['🎲 Board Games', '🎮 PS5', '🕹️ Switch', '🀄 Mahjong'].map(label => (
                <span key={label} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-xl shadow-xl lg:sticky lg:top-4" style={{ backgroundColor: 'var(--color-panel)' }}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full flex items-center justify-between px-6 py-5 hover:opacity-90 transition-opacity border-b"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Filters</h2>
                </div>
                <svg
                  className={`w-6 h-6 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--color-text)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isFilterOpen && (
                <div className="p-6">
                  <form onSubmit={handleSearch} className="space-y-5">
                {/* Search */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                      searchDebounceRef.current = setTimeout(() => {
                        applyFilters({ q: val });
                      }, 500);
                    }}
                    placeholder="Card name..."
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition-all"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)', '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties}
                  />
                </div>

                {/* Set */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Set
                  </label>
                  <select
                    value={selectedSet}
                    onChange={(e) => setSelectedSet(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition-all"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)', '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties}
                  >
                    <option value="">All Sets</option>
                    {sets.map((set) => (
                      <option key={set.code} value={set.code}>
                        {set.name} ({set.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rarity */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Rarity
                  </label>
                  <select
                    value={selectedRarity}
                    onChange={(e) => setSelectedRarity(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition-all"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)', '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties}
                  >
                    <option value="">All Rarities</option>
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="mythic">Mythic</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Special Tags
                  </label>
                  <div className="space-y-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                    <label className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes('Borderless')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTags([...selectedTags, 'Borderless']);
                          } else {
                            setSelectedTags(selectedTags.filter(t => t !== 'Borderless'));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Borderless</span>
                    </label>
                    <label className="flex items-center cursor-pointer p-2 rounded transition-colors" style={{}}>
                      <input
                        type="checkbox"
                        checked={selectedTags.includes('Extended Art')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTags([...selectedTags, 'Extended Art']);
                          } else {
                            setSelectedTags(selectedTags.filter(t => t !== 'Extended Art'));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Extended Art</span>
                    </label>
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)', '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties}
                      step="0.01"
                    />
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)', '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties}
                      step="0.01"
                    />
                  </div>
                </div>

                {/* In Stock Only */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Availability
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 border-2 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-all" style={{ borderColor: onlyInStock ? '#10b981' : 'var(--color-text-secondary)', backgroundColor: onlyInStock ? '#ecfdf5' : 'var(--color-background)' }}>
                    <input
                      type="checkbox"
                      checked={onlyInStock}
                      onChange={(e) => setOnlyInStock(e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-sm font-semibold" style={{ color: onlyInStock ? '#059669' : 'var(--color-text)' }}>Show In Stock Only</span>
                  </label>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition-all"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)', '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties}
                  >
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                    <option value="number_asc">Number (Low to High)</option>
                    <option value="number_desc">Number (High to Low)</option>
                    <option value="price_asc">Price (Low to High)</option>
                    <option value="price_desc">Price (High to Low)</option>
                    <option value="set_new">Set (Newest First)</option>
                    <option value="set_old">Set (Oldest First)</option>
                  </select>
                </div>

                <button type="submit" className="w-full px-6 py-3.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(to right, var(--color-accent), var(--color-highlight))', color: 'var(--color-panel)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Apply Filters
                </button>
                
                <button type="button" onClick={clearFilters} className="w-full border-2 px-6 py-3.5 rounded-lg font-semibold hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2" style={{ borderColor: 'var(--color-text-secondary)', color: 'var(--color-text)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All
                </button>
              </form>
                </div>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="rounded-lg overflow-hidden animate-pulse" style={{ backgroundColor: 'var(--color-panel)' }}>
                    <div className="aspect-[5/7]" style={{ backgroundColor: 'var(--color-border)' }} />
                    <div className="p-2.5 space-y-2">
                      <div className="h-3 rounded w-3/4" style={{ backgroundColor: 'var(--color-border)' }} />
                      <div className="h-3 rounded w-1/2" style={{ backgroundColor: 'var(--color-border)' }} />
                      <div className="h-3 rounded w-2/3" style={{ backgroundColor: 'var(--color-border)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : cards.length === 0 ? (
              <div className="rounded-xl shadow-lg p-16 text-center" style={{ backgroundColor: 'var(--color-panel)' }}>
                <svg className="w-28 h-28 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-2xl mb-3 font-bold" style={{ color: 'var(--color-text)' }}>No cards found</p>
                <p className="mb-8 text-base" style={{ color: 'var(--color-text-secondary)' }}>
                  {onlyInStock ? 'No cards in stock match your filters.' : 'Try adjusting your filters or search terms'}
                </p>
                <button onClick={clearFilters} className="inline-flex items-center px-6 py-3.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300" style={{ background: 'linear-gradient(to right, var(--color-accent), var(--color-highlight))', color: 'var(--color-panel)' }}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-xl shadow-lg px-5 py-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3" style={{ backgroundColor: 'var(--color-panel)' }}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg">
                      <div className="text-sm flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>{pagination.total}</span>
                          <span className="ml-1.5">{groupedMode ? 'unique name' : 'card'}{pagination.total !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    {onlyInStock && (
                      <div className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
                        <span className="text-xs font-semibold text-green-800 dark:text-green-200">
                          ✓ In Stock Only
                        </span>
                      </div>
                    )}
                    {/* Grouped mode toggle */}
                    <button
                      onClick={() => {
                        const params = Object.fromEntries(searchParams.entries());
                        params.page = '1';
                        setSearchParams(params);
                        setGroupedMode(prev => !prev);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      style={groupedMode
                        ? { backgroundColor: 'var(--color-accent)', color: 'white' }
                        : { backgroundColor: 'var(--color-background)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }
                      }
                      title={groupedMode ? 'Show all printings' : 'Group by card name'}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      {groupedMode ? 'Grouped' : 'Group by name'}
                    </button>
                  </div>
                  <div className="text-sm font-medium px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                </div>
                
                {groupedMode ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {groups.map(group => (
                      <div
                        key={group._id}
                        className="rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
                        onClick={() => {
                          setGroupedMode(false);
                          setSearchParams({ q: group.name, page: '1' });
                        }}
                      >
                        {group.imageUrl ? (
                          <img src={group.imageUrl} alt={group.name} className="w-full aspect-[5/7] object-cover" />
                        ) : (
                          <div className="w-full aspect-[5/7] flex items-center justify-center" style={{ backgroundColor: 'var(--color-border)' }}>
                            <span className="text-3xl">🃏</span>
                          </div>
                        )}
                        <div className="p-2.5 space-y-1">
                          <p className="font-semibold text-xs leading-tight line-clamp-2" style={{ color: 'var(--color-text)' }}>{group.name}</p>
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-secondary)' }}>
                              {group.printingCount} printing{group.printingCount !== 1 ? 's' : ''}
                            </span>
                            {group.hasFoil && (
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'linear-gradient(90deg,#f59e0b,#ec4899)', color: 'white' }}>✨</span>
                            )}
                          </div>
                          {group.minSellPrice != null && group.minSellPrice > 0 ? (
                            <p className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>
                              from Rp {group.minSellPrice.toLocaleString('id-ID')}
                            </p>
                          ) : (
                            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {group.totalStock > 0 ? `${group.totalStock} in stock` : 'Out of stock'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {cards.map((card) => (
                    <CardCard key={card._id} card={card} />
                  ))}
                </div>
                )}

                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  hasNextPage={pagination.hasNextPage}
                  hasPrevPage={pagination.hasPrevPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
