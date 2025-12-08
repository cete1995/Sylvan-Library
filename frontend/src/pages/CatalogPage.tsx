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
    setMinPrice('');
    setMaxPrice('');
    setSortBy('name_asc');
    setSearchParams({});
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Browse Cards</h1>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Filters</h2>
            
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Search */}
              <div>
                <label className="label">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Card name..."
                  className="input"
                />
              </div>

              {/* Set */}
              <div>
                <label className="label">Set</label>
                <select
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                  className="input"
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
                <label className="label">Rarity</label>
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="input"
                >
                  <option value="">All Rarities</option>
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="mythic">Mythic</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="label">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="input"
                    step="0.01"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="input"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="label">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input"
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

              <button type="submit" className="btn-primary w-full">
                Apply Filters
              </button>
              
              <button type="button" onClick={clearFilters} className="btn-secondary w-full">
                Clear Filters
              </button>
            </form>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-xl">Loading cards...</div>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">No cards found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-gray-600">
                Found {pagination.total} card{pagination.total !== 1 ? 's' : ''}
              </div>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
  );
};

export default CatalogPage;
