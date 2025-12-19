import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { cardApi } from '../api/cards';
import { cartApi } from '../api/cart';
import { Card, SetInfo } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const CatalogPageV2: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [sets, setSets] = useState<SetInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showQuantitySelector, setShowQuantitySelector] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<{ [key: string]: number }>({});
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [activeCondition, setActiveCondition] = useState<{ [key: string]: 'NM' | 'LP' | 'P' }>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Form state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedSet, setSelectedSet] = useState(searchParams.get('set') || '');
  const [selectedRarity, setSelectedRarity] = useState(searchParams.get('rarity') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'price_high');
  const [perPage, setPerPage] = useState(100);

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
        page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
        limit: perPage,
        sort: (searchParams.get('sort') as any) || 'price_desc',
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

  const handleSearch = () => {
    const params: any = { page: '1' };
    
    if (searchQuery) params.q = searchQuery;
    if (selectedSet) params.set = selectedSet;
    if (selectedRarity) params.rarity = selectedRarity;
    if (sortBy) params.sort = sortBy;

    setSearchParams(params);
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('id-ID');
  };

  const getCardConditions = (card: Card) => {
    const inventory = card.inventory || [];
    const conditions = {
      NM: inventory.find(item => item.condition === 'NM' && item.finish === 'nonfoil'),
      LP: inventory.find(item => item.condition === 'LP' && item.finish === 'nonfoil'),
      P: inventory.find(item => item.condition === 'P' && item.finish === 'nonfoil'),
    };
    return conditions;
  };

  const getCardStock = (card: Card): number => {
    const inventory = card.inventory || [];
    return inventory.reduce((sum, item) => sum + item.quantityForSale, 0);
  };

  const handleAddToCart = async (cardId: string, inventoryIndex: number, quantity: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!user) {
      navigate('/register');
      return;
    }

    const key = `${cardId}-${inventoryIndex}`;
    setAddingToCart(key);
    try {
      await cartApi.addToCart(cardId, inventoryIndex, quantity);
      await refreshCart();
      alert('Item added to cart!');
      setShowQuantitySelector(null);
    } catch (error: any) {
      alert(error.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const toggleQuantitySelector = (cardId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setShowQuantitySelector(showQuantitySelector === cardId ? null : cardId);
  };

  const selectQuantity = (cardId: string, inventoryIndex: number, quantity: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const key = `${cardId}-${inventoryIndex}`;
    setSelectedQuantity({ ...selectedQuantity, [key]: quantity });
    handleAddToCart(cardId, inventoryIndex, quantity, event);
  };

  const setCardCondition = (cardId: string, condition: 'NM' | 'LP' | 'P', event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveCondition({ ...activeCondition, [cardId]: condition });
  };

  const getActiveCondition = (cardId: string, conditions: any): 'NM' | 'LP' | 'P' => {
    const saved = activeCondition[cardId];
    if (saved && conditions[saved]) return saved;
    if (conditions.NM) return 'NM';
    if (conditions.LP) return 'LP';
    if (conditions.P) return 'P';
    return 'NM';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-6 max-w-[1400px]">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Search Results</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b" style={{ borderColor: 'var(--color-text-secondary)' }}>
          <button className="px-4 py-2 font-semibold border-b-2" style={{ color: 'var(--color-text)', borderColor: 'var(--color-accent)' }}>
            Singles ({pagination.total})
          </button>
          <button className="px-4 py-2 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Foils (0)
          </button>
          <button className="px-4 py-2 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Sealed (0)
          </button>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          {/* Card Name Search */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Card Name</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search"
              className="w-full px-3 py-2 border rounded"
              style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)' }}
            />
          </div>

          {/* Edition */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Edition</label>
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)' }}
            >
              <option value="">All Editions</option>
              {sets.map((set) => (
                <option key={set.code} value={set.code}>
                  {set.name}
                </option>
              ))}
            </select>
          </div>

          {/* Format (Placeholder) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Format</label>
            <select className="w-full px-3 py-2 border rounded" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)' }}>
              <option>All Formats</option>
            </select>
          </div>

          {/* Availability */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Availability</label>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="instock" className="w-4 h-4" />
              <label htmlFor="instock" className="text-sm" style={{ color: 'var(--color-text)' }}>In-Stock</label>
            </div>
          </div>

          {/* Rarity (Card Color) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Rarity</label>
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)' }}
            >
              <option value="">All</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="mythic">Mythic</option>
            </select>
          </div>
        </div>

        {/* Results Info & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="text-sm" style={{ color: 'var(--color-text)' }}>
            <span className="font-semibold">1 - {Math.min(perPage, pagination.total)} of {pagination.total} results</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
                style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)' }}
              >
                <option value="price_desc">Price High to Low</option>
                <option value="price_asc">Price Low to High</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Show:</label>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="px-3 py-1 border rounded text-sm"
                style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)' }}
              >
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>

            <div className="flex items-center gap-1 border rounded" style={{ borderColor: 'var(--color-text-secondary)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-200' : ''}`}
                style={{ color: 'var(--color-text)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-200' : ''}`}
                style={{ color: 'var(--color-text)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Cards Display */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <div className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>Loading cards...</div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {cards.map((card) => {
              const conditions = getCardConditions(card);
              const stock = getCardStock(card);
              const isAvailable = stock > 0;
              const activeTab = getActiveCondition(card._id, conditions);
              const activeInventoryItem = conditions[activeTab];
              const activeInventoryIndex = card.inventory?.findIndex(
                item => item.condition === activeTab && item.finish === 'nonfoil'
              );
              const isShowingSelector = showQuantitySelector === card._id;

              return (
                <div
                  key={card._id}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow relative"
                  style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-text-secondary)' }}
                >
                  <Link to={`/cards/${card._id}`}>
                    {/* Card Image */}
                    <div className="aspect-[5/7] relative" style={{ backgroundColor: 'var(--color-background)' }}>
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white text-xs font-bold bg-red-600 px-2 py-1 rounded">Out of stock</span>
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="p-2">
                      <h3 className="text-sm font-semibold mb-2 line-clamp-2" style={{ color: 'var(--color-text)' }}>{card.name}</h3>
                    </div>
                  </Link>

                  {/* Condition Tabs */}
                  <div className="px-2">
                    <div className="flex gap-1 mb-2 border rounded" style={{ borderColor: 'var(--color-text-secondary)' }}>
                      {['NM', 'LP', 'P'].map((condition) => {
                        const hasCondition = conditions[condition as 'NM' | 'LP' | 'P'];
                        const isActive = activeTab === condition;
                        return (
                          <button
                            key={condition}
                            onClick={(e) => setCardCondition(card._id, condition as 'NM' | 'LP' | 'P', e)}
                            disabled={!hasCondition}
                            className={`flex-1 py-1 px-2 text-xs font-semibold transition-colors ${
                              !hasCondition ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            style={{
                              backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
                              color: isActive ? 'var(--color-panel)' : 'var(--color-text)',
                            }}
                          >
                            {condition}
                          </button>
                        );
                      })}
                    </div>

                    {/* Price and Stock for Active Condition */}
                    {activeInventoryItem && (
                      <>
                        <div className="text-center text-lg font-bold text-blue-600 mb-1">
                          {activeInventoryItem.sellPrice > 0 ? `Rp. ${formatPrice(activeInventoryItem.sellPrice)}` : 'Price TBD'}
                        </div>
                        <div className={`text-center text-sm font-semibold mb-2 ${activeInventoryItem.quantityForSale > 0 ? 'text-emerald-500' : 'text-red-600'}`}>
                          {activeInventoryItem.quantityForSale > 0 ? `${activeInventoryItem.quantityForSale} in stock` : 'Out of stock'}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  {activeInventoryItem && activeInventoryItem.quantityForSale > 0 && activeInventoryIndex !== undefined && activeInventoryIndex >= 0 && (
                    <div className="px-2 pb-2">
                      <button
                        onClick={(e) => toggleQuantitySelector(card._id, e)}
                        disabled={addingToCart === `${card._id}-${activeInventoryIndex}`}
                        className="w-full text-white font-semibold py-1.5 px-3 rounded text-xs hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
                        style={{ backgroundColor: 'var(--color-highlight)' }}
                      >
                        Add to Cart
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Quantity Selector Dropdown */}
                      {isShowingSelector && (
                        <div 
                          className="absolute bottom-14 left-2 right-2 border-2 rounded-lg shadow-lg z-10 p-3"
                          style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-accent)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-2 pb-2 border-b" style={{ borderColor: 'var(--color-text-secondary)' }}>
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-accent)' }}>
                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                              </svg>
                              <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Select Qty</span>
                            </div>
                            <button
                              onClick={(e) => toggleQuantitySelector(card._id, e)}
                              className="text-xs"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((qty) => (
                              <button
                                key={qty}
                                onClick={(e) => selectQuantity(card._id, activeInventoryIndex, qty, e)}
                                disabled={qty > activeInventoryItem.quantityForSale}
                                className="py-2 px-3 border rounded text-sm font-semibold hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ 
                                  backgroundColor: 'var(--color-background)',
                                  color: 'var(--color-text)',
                                  borderColor: 'var(--color-text-secondary)'
                                }}
                              >
                                {qty}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map((card) => {
              const conditions = getCardConditions(card);
              const stock = getCardStock(card);
              const isAvailable = stock > 0;

              return (
                <Link
                  key={card._id}
                  to={`/cards/${card._id}`}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:shadow-md transition-shadow"
                  style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-text-secondary)' }}
                >
                  {/* Small Image */}
                  <div className="w-20 h-28 flex-shrink-0" style={{ backgroundColor: 'var(--color-background)' }}>
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Card Details */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text)' }}>{card.name}</h3>
                    <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>{card.setName}</p>
                    <div className="flex gap-2">
                      {conditions.NM && (
                        <span className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--color-text-secondary)', color: 'var(--color-text)' }}>
                          NM
                        </span>
                      )}
                      {conditions.LP && (
                        <span className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--color-text-secondary)', color: 'var(--color-text)' }}>
                          LP
                        </span>
                      )}
                      {conditions.P && (
                        <span className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--color-text-secondary)', color: 'var(--color-text)' }}>
                          P
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Stock */}
                  <div className="text-right">
                    <div className="font-bold text-lg text-blue-600 mb-1">
                      {conditions.NM?.sellPrice && conditions.NM.sellPrice > 0 ? `Rp. ${formatPrice(conditions.NM.sellPrice)}` :
                       conditions.LP?.sellPrice && conditions.LP.sellPrice > 0 ? `Rp. ${formatPrice(conditions.LP.sellPrice)}` :
                       conditions.P?.sellPrice && conditions.P.sellPrice > 0 ? `Rp. ${formatPrice(conditions.P.sellPrice)}` : 'Price TBD'}
                    </div>
                    <div className="text-sm font-semibold">
                      {isAvailable ? (
                        <span className="text-emerald-500">
                          {conditions.NM && conditions.NM.quantityForSale > 0 ? `${conditions.NM.quantityForSale} in stock` : 'In stock'}
                        </span>
                      ) : (
                        <span className="text-red-600">Out of stock</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => {
                const params = Object.fromEntries(searchParams.entries());
                params.page = (pagination.page - 1).toString();
                setSearchParams(params);
              }}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 border rounded disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)' }}
            >
              Previous
            </button>
            <span className="px-4 py-2" style={{ color: 'var(--color-text)' }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => {
                const params = Object.fromEntries(searchParams.entries());
                params.page = (pagination.page + 1).toString();
                setSearchParams(params);
              }}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 border rounded disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogPageV2;
