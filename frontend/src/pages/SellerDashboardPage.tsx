import React, { useState, useEffect } from 'react';
import { cardApi } from '../api/cards';
import { Card } from '../types';
import { Link } from 'react-router-dom';

const SellerDashboardPage: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadCards();
  }, [page]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await cardApi.getCards({
        q: searchQuery || undefined,
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Seller Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Add inventory to existing cards in the system</p>
        </div>

        {/* Search */}
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
            <p style={{ color: 'var(--color-text-secondary)' }}>No cards available in the system</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: 'var(--color-panel)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-background)' }}>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Card</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Set</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Rarity</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Current Stock</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((card) => {
                      const totalStock = card.inventory?.reduce((sum, inv) => sum + inv.quantityForSale, 0) || 0;
                      
                      return (
                        <tr key={card._id} className="border-t hover:bg-opacity-50 hover:bg-gray-500 transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {card.imageUrl && (
                                <img src={card.imageUrl} alt={card.name} className="w-12 h-16 object-cover rounded shadow-sm" />
                              )}
                              <div>
                                <div className="font-semibold" style={{ color: 'var(--color-text)' }}>{card.name}</div>
                                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>#{card.collectorNumber}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium" style={{ color: 'var(--color-text)' }}>{card.setCode}</div>
                              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{card.setName}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              card.rarity === 'common' ? 'bg-gray-100 text-gray-800' :
                              card.rarity === 'uncommon' ? 'bg-green-500 text-white' :
                              card.rarity === 'rare' ? 'bg-yellow-400 text-gray-900' :
                              'bg-orange-500 text-white'
                            }`}>
                              {card.rarity.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-bold ${totalStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {totalStock}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              to={`/seller/cards/${card._id}/inventory`}
                              className="inline-flex items-center px-4 py-2 rounded-lg font-medium shadow-sm hover:opacity-90 transition-all"
                              style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add Inventory
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}
                >
                  Previous
                </button>
                <span className="px-4 py-2" style={{ color: 'var(--color-text)' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SellerDashboardPage;
