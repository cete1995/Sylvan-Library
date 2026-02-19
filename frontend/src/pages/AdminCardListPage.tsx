import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { Card } from '../types';

const AdminCardListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('set') || '');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [missingImages, setMissingImages] = useState(searchParams.get('missingImages') === 'true');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    loadCards();
  }, [page, includeInactive, missingImages]);

  // Load initial search from URL params
  useEffect(() => {
    const setParam = searchParams.get('set');
    const missingImagesParam = searchParams.get('missingImages');
    if (setParam) {
      setSearchQuery(setParam);
    }
    if (missingImagesParam === 'true') {
      setMissingImages(true);
    }
  }, [searchParams]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAdminCards({
        q: searchQuery || undefined,
        includeInactive,
        missingImages,
        page,
        limit: 50,
      });
      setCards(data.cards);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCards();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await adminApi.deleteCard(id);
      loadCards();
    } catch (error: any) {
      alert('Failed to delete card: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Card Inventory</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Browse and manage your MTG card collection</p>
          </div>
          <Link 
            to="/admin/cards/new" 
            className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-all transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Card
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="rounded-xl shadow-md p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Cards
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter card name..."
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-text-secondary)'
                }}
              />
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
              <input
                type="checkbox"
                id="includeInactive"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="includeInactive" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--color-text)' }}>
                Include deleted cards
              </label>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
              <input
                type="checkbox"
                id="missingImages"
                checked={missingImages}
                onChange={(e) => setMissingImages(e.target.checked)}
                className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
              />
              <label htmlFor="missingImages" className="text-sm font-medium cursor-pointer flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Missing images only
              </label>
            </div>

            <button 
              type="submit" 
              className="px-8 py-3 rounded-lg font-medium shadow-md hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}
            >
              Search
            </button>
          </form>
        </div>

        {/* Cards Table */}
        {loading ? (
          <div className="rounded-xl shadow-md p-12 text-center" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <div className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>Loading cards...</div>
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-xl shadow-md p-12 text-center" style={{ backgroundColor: 'var(--color-panel)' }}>
            <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-2xl mb-2 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>No cards found</p>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>Start building your collection by adding your first card</p>
            <Link 
              to="/admin/cards/new" 
              className="inline-flex items-center px-6 py-3 rounded-lg font-medium shadow-md hover:opacity-90"
              style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-panel)' }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Card
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: 'var(--color-panel)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-text-secondary)' }}>
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>Card Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>Set</th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
                        <div className="flex items-center justify-end gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          Owned
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
                        <div className="flex items-center justify-end gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          For Sale
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>Buy Price</th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: '#10b981' }}>
                        <div className="flex items-center justify-end gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Web Price
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: '#3b82f6' }}>
                        <div className="flex items-center justify-end gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Marketplace
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-text-secondary)' }}>
                    {cards.map((card) => {
                      const inventory = card.inventory || [];
                      const totalOwned = inventory.reduce((sum, item) => sum + item.quantityOwned, 0);
                      const totalForSale = inventory.reduce((sum, item) => sum + item.quantityForSale, 0);
                      const lowestPrice = inventory.length > 0 
                        ? Math.min(...inventory.map(item => item.sellPrice))
                        : 0;
                      const lowestMarketplacePrice = inventory.length > 0 
                        ? Math.min(...inventory.map(item => item.marketplacePrice || 0))
                        : 0;
                      
                      // Group inventory by seller (exclude admin/no-seller items)
                      const sellerInventory = inventory.reduce((acc, item) => {
                        if (!item.sellerId) return acc; // skip admin-owned items
                        const sellerKey = item.sellerId;
                        const sellerName = item.sellerName || sellerKey;
                        
                        if (!acc[sellerKey]) {
                          acc[sellerKey] = {
                            sellerId: sellerKey,
                            sellerName: sellerName,
                            items: []
                          };
                        }
                        acc[sellerKey].items.push(item);
                        return acc;
                      }, {} as Record<string, { sellerId: string; sellerName: string; items: typeof inventory }>);
                      
                      const sellers = Object.values(sellerInventory);
                      const isExpanded = expandedCards.has(card._id);
                      
                      return (
                        <React.Fragment key={card._id}>
                          <tr
                            className={!card.isActive ? 'bg-red-50 opacity-70' : 'hover:bg-blue-50 transition-colors cursor-pointer'}
                            onClick={() => toggleCardExpansion(card._id)}
                          >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {/* Expand/Collapse Indicator */}
                              <div className="flex-shrink-0">
                                <svg 
                                  className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                  style={{ color: 'var(--color-text-secondary)' }}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              {/* Card Image */}
                              <div className="flex-shrink-0">
                                {card.imageUrl ? (
                                  <img 
                                    src={card.imageUrl} 
                                    alt={card.name}
                                    className="w-12 h-16 object-cover rounded border-2"
                                    style={{ borderColor: 'var(--color-text-secondary)' }}
                                  />
                                ) : (
                                  <div className="w-12 h-16 rounded border-2 flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-text-secondary)' }}>
                                    <svg className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                  {card.name}
                                </div>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {sellers.length > 0 && (
                                    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                                      {sellers.length} seller{sellers.length !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {!card.imageUrl && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      No Image
                                    </span>
                                  )}
                                </div>
                                {!card.isActive && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Deleted
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <i className={`ss ss-${card.setCode.toLowerCase()} ss-${card.rarity.toLowerCase()} ss-2x`} style={{ color: card.rarity.toLowerCase() === 'common' ? 'var(--color-text)' : undefined }}></i>
                              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                {card.setCode}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                              {totalOwned}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                              {totalForSale}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm" style={{ color: 'var(--color-text-secondary)' }}>-</td>
                          <td className="px-6 py-4 text-right font-semibold" style={{ color: '#10b981' }}>
                            Rp {lowestPrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold" style={{ color: '#3b82f6' }}>
                            Rp {lowestMarketplacePrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                              <Link
                                to={`/admin/cards/edit/${card._id}`}
                                className="inline-flex items-center px-3 py-1.5 rounded-md hover:opacity-80 text-sm font-medium"
                                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)', opacity: 0.9 }}
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </Link>
                              {card.isActive && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(card._id, card.name);
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 rounded-md hover:opacity-80 text-sm font-medium"
                                  style={{ backgroundColor: '#DC2626', color: 'var(--color-panel)', opacity: 0.9 }}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Seller Details Row (Expanded) */}
                        {isExpanded && sellers.length > 0 && (
                          <tr className="bg-blue-50">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="ml-8">
                                <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  Seller Inventory Breakdown
                                </h4>
                                <div className="grid gap-3">
                                  {sellers.map((seller) => {
                                    const sellerOwned = seller.items.reduce((sum, item) => sum + item.quantityOwned, 0);
                                    const sellerForSale = seller.items.reduce((sum, item) => sum + item.quantityForSale, 0);
                                    
                                    return (
                                      <div 
                                        key={seller.sellerId} 
                                        className="p-4 rounded-lg border-2"
                                        style={{ 
                                          backgroundColor: 'var(--color-panel)', 
                                          borderColor: 'var(--color-text-secondary)',
                                          opacity: 0.95
                                        }}
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                                              {seller.sellerName}
                                            </span>
                                          </div>
                                          <div className="flex gap-3">
                                            <div className="text-center">
                                              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Owned</div>
                                              <div className="font-bold text-lg" style={{ color: '#7c3aed' }}>{sellerOwned}</div>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>For Sale</div>
                                              <div className="font-bold text-lg" style={{ color: '#10b981' }}>{sellerForSale}</div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Inventory Items */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                          {seller.items.map((item, idx) => (
                                            <div 
                                              key={idx}
                                              className="p-3 rounded border text-sm"
                                              style={{ 
                                                backgroundColor: 'var(--color-background)',
                                                borderColor: 'var(--color-text-secondary)'
                                              }}
                                            >
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                    item.condition === 'NM' ? 'bg-green-100 text-green-800' :
                                                    item.condition === 'LP' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-orange-100 text-orange-800'
                                                  }`}>
                                                    {item.condition}
                                                  </span>
                                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                    item.finish === 'foil' ? 'bg-purple-100 text-purple-800' :
                                                    item.finish === 'etched' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                  }`}>
                                                    {item.finish}
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                  <div style={{ color: 'var(--color-text-secondary)' }}>Owned:</div>
                                                  <div className="font-semibold" style={{ color: 'var(--color-text)' }}>{item.quantityOwned}</div>
                                                </div>
                                                <div>
                                                  <div style={{ color: 'var(--color-text-secondary)' }}>For Sale:</div>
                                                  <div className="font-semibold" style={{ color: 'var(--color-text)' }}>{item.quantityForSale}</div>
                                                </div>
                                                <div>
                                                  <div style={{ color: 'var(--color-text-secondary)' }}>Buy:</div>
                                                  <div className="font-semibold" style={{ color: 'var(--color-text)' }}>Rp {item.buyPrice.toLocaleString()}</div>
                                                </div>
                                                <div>
                                                  <div style={{ color: 'var(--color-text-secondary)' }}>Web:</div>
                                                  <div className="font-semibold text-green-600">Rp {item.sellPrice.toLocaleString()}</div>
                                                </div>
                                                <div>
                                                  <div style={{ color: 'var(--color-text-secondary)' }}>Marketplace:</div>
                                                  <div className="font-semibold text-blue-600">Rp {(item.marketplacePrice || 0).toLocaleString()}</div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 rounded-xl shadow-md p-4" style={{ backgroundColor: 'var(--color-panel)' }}>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Showing page <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{page}</span> of <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center px-4 py-2 rounded-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    style={{ 
                      backgroundColor: 'var(--color-background)', 
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-text-secondary)'
                    }}
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center px-4 py-2 rounded-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    style={{ 
                      backgroundColor: 'var(--color-background)', 
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-text-secondary)'
                    }}
                  >
                    Next
                    <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCardListPage;
