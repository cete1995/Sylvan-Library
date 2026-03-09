import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cardApi } from '../api/cards';
import { cartApi } from '../api/cart';
import { Card, SetInfo } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from '../utils/toast';
import CardFeedItem from '../components/CardFeedItem';
import BottomSheet from '../components/BottomSheet';

const MobileCatalogFeed: React.FC = () => {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [searchParams] = useSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [sets, setSets] = useState<SetInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver>();
  
  // Bottom sheets
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewCard, setQuickViewCard] = useState<Card | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedSet, setSelectedSet] = useState(searchParams.get('set') || '');
  const [selectedRarity, setSelectedRarity] = useState(searchParams.get('rarity') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'price_desc');

  const lastCardRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    loadSets();
  }, []);

  useEffect(() => {
    setCards([]);
    setPage(1);
    setHasMore(true);
  }, [searchParams, searchQuery, selectedSet, selectedRarity, sortBy]);

  useEffect(() => {
    loadCards();
  }, [page]);

  const loadSets = async () => {
    try {
      const data = await cardApi.getSets();
      setSets(data.sets);
    } catch {
      // sets load silently
    }
  };

  const loadCards = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const params = {
        q: searchQuery || undefined,
        set: selectedSet || undefined,
        rarity: selectedRarity || undefined,
        page,
        limit: 20,
        sort: sortBy as any,
      };

      const data = await cardApi.getCards(params);
      
      if (page === 1) {
        setCards(data.cards);
      } else {
        setCards(prev => [...prev, ...data.cards]);
      }
      
      setHasMore(data.pagination.hasNextPage);
    } catch {
      // error shown via empty state
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (card: Card, condition: 'NM' | 'LP' | 'P') => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    // Find items matching condition/finish, prioritize those with stock
    const matchingIndexes = card.inventory
      ?.map((item, index) => ({ item, index }))
      .filter(({ item }) => item.condition === condition && item.finish === 'nonfoil');

    if (!matchingIndexes || matchingIndexes.length === 0) {
      alert('This condition is not available');
      return;
    }

    // Prefer item with stock > 0
    const itemWithStock = matchingIndexes.find(({ item }) => item.quantityForSale > 0);
    const inventoryIndex = itemWithStock ? itemWithStock.index : matchingIndexes[0].index;

    try {
      await cartApi.addToCart(card._id, inventoryIndex, 1);
      await refreshCart();
      toast.success('Added to cart');
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Failed to add to cart');
    }
  };

  const handleQuickView = (card: Card) => {
    setQuickViewCard(card);
    setShowQuickView(true);
  };

  const applyFilters = () => {
    setShowFilters(false);
    setCards([]);
    setHasMore(true);
    // Avoid double-load: if page > 1, setPage(1) triggers the page effect which calls loadCards.
    // If page is already 1, the page effect won't fire, so call loadCards directly.
    if (page !== 1) {
      setPage(1);
    } else {
      loadCards();
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSet('');
    setSelectedRarity('');
    setSortBy('price_desc');
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('id-ID');
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Sticky Search Header */}
      <div 
        className="sticky top-0 z-40 border-b shadow-sm"
        style={{ 
          backgroundColor: 'var(--color-panel)',
          borderBottomColor: 'var(--color-border)'
        }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full pl-10 pr-4 py-2 rounded-full border-2 focus:outline-none focus:border-blue-500"
              style={{ 
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setCards([]);
                  setHasMore(true);
                  // Avoid double-load: same logic as applyFilters
                  if (page !== 1) {
                    setPage(1);
                  } else {
                    loadCards();
                  }
                }
              }}
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
              style={{ color: 'var(--color-text-secondary)' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <button
            onClick={() => setShowFilters(true)}
            className="p-2 rounded-full"
            style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card Feed */}
      <div className="py-4">
        {cards.length === 0 && !loading && (
          <div className="text-center py-12 px-4">
            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>No cards found</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Try adjusting your filters</p>
          </div>
        )}

        {cards.map((card, index) => {
          if (cards.length === index + 1) {
            return (
              <div key={card._id} ref={lastCardRef}>
                <CardFeedItem
                  card={card}
                  onAddToCart={handleAddToCart}
                  onQuickView={handleQuickView}
                />
              </div>
            );
          } else {
            return (
              <CardFeedItem
                key={card._id}
                card={card}
                onAddToCart={handleAddToCart}
                onQuickView={handleQuickView}
              />
            );
          }
        })}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading more cards...</p>
          </div>
        )}

        {!hasMore && cards.length > 0 && (
          <div className="text-center py-8">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              You've reached the end!
            </p>
          </div>
        )}
      </div>

      {/* Filters Bottom Sheet */}
      <BottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        height="half"
      >
        <div className="p-6 space-y-6">
          {/* Set Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              Set / Edition
            </label>
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500"
              style={{ 
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
            >
              <option value="">All Sets</option>
              {sets.map(set => (
                <option key={set.code} value={set.code}>{set.name}</option>
              ))}
            </select>
          </div>

          {/* Rarity Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              Rarity
            </label>
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500"
              style={{ 
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
            >
              <option value="">All Rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="mythic">Mythic</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500"
              style={{ 
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
            >
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="name_asc">Name: A-Z</option>
              <option value="name_desc">Name: Z-A</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={resetFilters}
              className="flex-1 py-3 rounded-lg font-semibold border-2"
              style={{ 
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="flex-1 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Quick View Bottom Sheet */}
      <BottomSheet
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        title={quickViewCard?.name || ''}
        height="half"
      >
        {quickViewCard && (
          <div className="p-6">
            <div className="flex gap-4 mb-4">
              <img 
                src={quickViewCard.imageUrl || ''} 
                alt={quickViewCard.name}
                className="w-32 h-44 object-contain rounded-lg border"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <div className="flex-1">
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {quickViewCard.setName}
                </p>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {quickViewCard.typeLine}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
                    {quickViewCard.rarity}
                  </span>
                </div>
              </div>
            </div>
            
            {quickViewCard.oracleText && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Oracle Text</h4>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {quickViewCard.oracleText}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {(() => {
                // Aggregate inventory by condition for nonfoil items
                const nonfoilInventory = quickViewCard.inventory?.filter(inv => inv.finish === 'nonfoil') || [];
                const calculatedPrices = (quickViewCard as any).calculatedPrices;
                
                const aggregated = ['NM', 'LP', 'P']
                  .map(condition => {
                    const matchingItems = nonfoilInventory.filter(inv => inv.condition === condition);
                    if (matchingItems.length === 0) {
                      // If no inventory but we have calculated prices, create a virtual item
                      if (condition === 'NM' && calculatedPrices?.nonfoil) {
                        return {
                          condition,
                          sellPrice: calculatedPrices.nonfoil,
                          quantityForSale: 0,
                          hasMultipleSellers: false
                        };
                      }
                      return null;
                    }
                    
                    const totalQuantity = matchingItems.reduce((sum, item) => sum + item.quantityForSale, 0);
                    const firstItemWithStock = matchingItems.find(item => item.quantityForSale > 0);
                    const baseItem = firstItemWithStock || matchingItems[0];
                    
                    return {
                      condition,
                      sellPrice: baseItem.sellPrice || (condition === 'NM' ? calculatedPrices?.nonfoil : 0) || 0,
                      quantityForSale: totalQuantity,
                      hasMultipleSellers: matchingItems.length > 1
                    };
                  })
                  .filter((item): item is NonNullable<typeof item> => item !== null);

                return aggregated.map((inv, idx) => (
                  <div 
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-lg border"
                    style={{ 
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                        {inv.condition}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {inv.quantityForSale} in stock
                        {inv.hasMultipleSellers && <span className="ml-1 text-xs">(multiple sellers)</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: 'var(--color-accent)' }}>
                        {inv.sellPrice > 0 ? `Rp. ${formatPrice(inv.sellPrice)}` : 'Price TBD'}
                      </p>
                      {inv.quantityForSale > 0 && (
                        <button
                          onClick={() => {
                            handleAddToCart(quickViewCard, inv.condition as 'NM' | 'LP' | 'P');
                            setShowQuickView(false);
                          }}
                          className="mt-2 px-4 py-1 rounded-full text-sm font-semibold text-white"
                          style={{ backgroundColor: '#10b981' }}
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default MobileCatalogFeed;
