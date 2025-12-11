import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cardApi } from '../api/cards';
import { Card, SetInfo } from '../types';
import CardCard from '../components/CardCard';
import Pagination from '../components/Pagination';

const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [sets, setSets] = useState<SetInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Form state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedSet, setSelectedSet] = useState(searchParams.get('set') || '');
  const [selectedRarity, setSelectedRarity] = useState(searchParams.get('rarity') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags') ? searchParams.get('tags')!.split(',') : []
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name_asc');

  useEffect(() => {
    loadSets();
  }, []);

  useEffect(() => {
    loadCards();
  }, [searchParams]);

  const loadSets = async () => {
    try {
      const data = await cardApi.getSets();
      setSets(data.sets);
    } catch (error) {
      console.error('Failed to load sets:', error);
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
        page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
        limit: 25,
        sort: (searchParams.get('sort') as any) || 'name_asc',
      };

      const data = await cardApi.getCards(params);
      setCards(data.cards);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: any = { page: '1' };
    
    if (searchQuery) params.q = searchQuery;
    if (selectedSet) params.set = selectedSet;
    if (selectedRarity) params.rarity = selectedRarity;
    if (selectedTags.length > 0) params.tags = selectedTags.join(',');
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sortBy) params.sort = sortBy;

    setSearchParams(params);
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
    setSearchParams({});
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Card Catalog</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Browse and search our complete collection of Magic: The Gathering cards</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-xl shadow-lg p-6 lg:sticky lg:top-4" style={{ backgroundColor: 'var(--color-panel)' }}>
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Filters</h2>
              </div>
              
              <form onSubmit={handleSearch} className="space-y-4">
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
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    <label className="flex items-center cursor-pointer p-2 rounded transition-colors" style={{ '&:hover': { backgroundColor: 'var(--color-background)' } }}>
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

                <button type="submit" className="w-full px-6 py-3 rounded-lg font-semibold shadow-md hover:opacity-90" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>
                  Apply Filters
                </button>
                
                <button type="button" onClick={clearFilters} className="w-full border-2 px-6 py-3 rounded-lg font-semibold hover:opacity-80" style={{ borderColor: 'var(--color-text-secondary)', color: 'var(--color-text)' }}>
                  Clear All
                </button>
              </form>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="rounded-xl shadow-md p-16 text-center" style={{ backgroundColor: 'var(--color-panel)' }}>
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: 'var(--color-accent)' }}></div>
                <div className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>Loading cards...</div>
              </div>
            ) : cards.length === 0 ? (
              <div className="rounded-xl shadow-md p-16 text-center" style={{ backgroundColor: 'var(--color-panel)' }}>
                <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-2xl mb-2 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>No cards found</p>
                <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="inline-flex items-center px-6 py-3 rounded-lg font-medium shadow-md hover:opacity-90" style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-panel)' }}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-lg shadow-sm px-4 py-3 mb-4 flex items-center justify-between" style={{ backgroundColor: 'var(--color-panel)' }}>
                  <div className="text-sm flex items-center" style={{ color: 'var(--color-text-secondary)' }}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{pagination.total}</span> 
                    <span className="ml-1">card{pagination.total !== 1 ? 's' : ''} found</span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {cards.map((card) => (
                    <CardCard key={card._id} card={card} />
                  ))}
                </div>

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
