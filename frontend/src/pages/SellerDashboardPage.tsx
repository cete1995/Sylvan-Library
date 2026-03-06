import React, { useState, useEffect } from 'react';
import { cardApi } from '../api/cards';
import { Card } from '../types';
import { Link } from 'react-router-dom';

const rarityStyle = (rarity: string) => {
  switch (rarity) {
    case 'uncommon': return { backgroundColor: '#22c55e', color: '#fff' };
    case 'rare':     return { backgroundColor: '#eab308', color: '#111' };
    case 'mythic':   return { backgroundColor: '#f97316', color: '#fff' };
    default:         return { backgroundColor: '#e5e7eb', color: '#374151' };
  }
};

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
    <div className="min-h-screen pb-24 md:pb-8" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* â”€â”€ Header banner â”€â”€ */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: '#a78bfa' }} />
        <div className="container mx-auto px-4 py-7 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#c4b5fd' }}>Seller Tools</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">ðŸª Seller Dashboard</h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Add inventory to existing cards in the system</p>
            </div>
            <Link
              to="/seller/manabox-upload"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all whitespace-nowrap self-start sm:self-auto"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', color: '#fff' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              ðŸ“¦ Manabox Upload
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">

        {/* Search */}
        <div className="rounded-2xl shadow-sm p-4 md:p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search card name..."
                className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:outline-none transition-all text-sm"
                style={{
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl font-semibold text-sm shrink-0 hover:opacity-90 active:scale-95 transition-all"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}
            >
              Search
            </button>
          </form>
        </div>

        {/* Card list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--color-accent)' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--color-panel)' }}>
            <p className="text-xl font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>No cards found</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Try a different search term</p>
          </div>
        ) : (
          <>
            {/* â”€â”€ Mobile: card list â”€â”€ */}
            <div className="md:hidden space-y-3">
              {cards.map((card) => {
                const totalStock = card.inventory?.reduce((sum, inv) => sum + inv.quantityForSale, 0) || 0;
                return (
                  <div
                    key={card._id}
                    className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
                  >
                    {/* Card image */}
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.name} className="w-10 h-14 object-cover rounded-lg shadow-sm shrink-0" />
                    ) : (
                      <div className="w-10 h-14 rounded-lg flex items-center justify-center shrink-0 text-xl" style={{ backgroundColor: 'var(--color-background)' }}>ðŸƒ</div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--color-text)' }}>{card.name}</p>
                      <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                        {card.setCode} Â· #{card.collectorNumber}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={rarityStyle(card.rarity)}>
                          {card.rarity.toUpperCase()}
                        </span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: totalStock > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
                            color: totalStock > 0 ? '#16a34a' : '#ef4444',
                          }}
                        >
                          Stock: {totalStock}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <Link
                      to={`/seller/cards/${card._id}/inventory`}
                      className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm hover:opacity-80 transition-all active:scale-90"
                      style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                      title="Add Inventory"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* â”€â”€ Desktop: table â”€â”€ */}
            <div className="hidden md:block rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--color-panel)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-background)' }}>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Card</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Set</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Rarity</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Stock</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((card) => {
                      const totalStock = card.inventory?.reduce((sum, inv) => sum + inv.quantityForSale, 0) || 0;
                      return (
                        <tr key={card._id} className="border-t hover:opacity-90 transition-opacity" style={{ borderColor: 'var(--color-border)' }}>
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
                            <div className="font-medium" style={{ color: 'var(--color-text)' }}>{card.setCode}</div>
                            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{card.setName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold" style={rarityStyle(card.rarity)}>
                              {card.rarity.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold" style={{ color: totalStock > 0 ? '#22c55e' : '#ef4444' }}>
                            {totalStock}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              to={`/seller/cards/${card._id}/inventory`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium shadow-sm hover:opacity-90 transition-all"
                              style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="flex justify-center items-center gap-3 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl font-medium text-sm disabled:opacity-40 transition-all active:scale-95"
                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                  â† Prev
                </button>
                <span className="text-sm font-semibold px-3" style={{ color: 'var(--color-text-secondary)' }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl font-medium text-sm disabled:opacity-40 transition-all active:scale-95"
                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                  Next â†’
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
