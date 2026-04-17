import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { buylistApi, BuylistItem } from '../api/buylist';
import Pagination from '../components/Pagination';

const CONDITION_LABEL: Record<string, string> = { NM: 'Near Mint', LP: 'Light Play', P: 'Played' };
const FINISH_LABEL: Record<string, string> = { nonfoil: 'Non-Foil', foil: 'Foil', etched: 'Etched' };

const BuylistPage: React.FC = () => {
  const [items, setItems] = useState<BuylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pagination, setPagination] = useState({
    page: 1, limit: 50, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false,
  });

  const loadItems = async (q: string, page: number) => {
    setLoading(true);
    try {
      const data = await buylistApi.getPublic({ q: q || undefined, page, limit: 50 });
      setItems(data.items);
      setPagination(data.pagination);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(search, 1); }, [search]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 400);
  };

  // Group items by card name for display
  const grouped = items.reduce<Record<string, BuylistItem[]>>((acc, item) => {
    if (!acc[item.cardName]) acc[item.cardName] = [];
    acc[item.cardName].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1440 60%, #111e55 100%)' }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-[0.07]" style={{ backgroundColor: '#E31E24' }} />
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Link to="/catalog" className="inline-flex items-center gap-1.5 text-sm mb-4 opacity-70 hover:opacity-100 transition-opacity text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Catalog
          </Link>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#fca5a5' }}>We're Buying</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-3">
            💰 Buylist
          </h1>
          <p className="text-sm mt-2 text-white/70">
            Sell your MTG singles to us — bring your cards to the store and get paid on the spot.
            Prices are in IDR. We accept NM condition unless otherwise noted.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Info banner */}
        <div className="mb-6 p-4 rounded-xl border-l-4 text-sm" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-accent)' }}>
          <p className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>How to sell to us</p>
          <ol className="list-decimal list-inside space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
            <li>Find your card in the list below and note the buy price for its condition.</li>
            <li>Bring the physical card to our store — <span style={{ color: 'var(--color-accent)' }}>Boardgame Time</span>.</li>
            <li>Our staff will inspect the card and pay you on the spot.</li>
          </ol>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by card name..."
              className="w-full pl-12 pr-4 py-3 border rounded-xl text-sm"
              style={{
                backgroundColor: 'var(--color-panel)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)',
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--color-panel)' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>No cards found</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {search ? `No buylist entries for "${search}"` : 'The buylist is currently empty. Check back soon!'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              {pagination.total} entr{pagination.total === 1 ? 'y' : 'ies'} found
            </p>

            <div className="space-y-3">
              {Object.entries(grouped).map(([cardName, cardItems]) => (
                <div key={cardName} className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
                  {/* Card header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                    {cardItems[0].imageUrl && (
                      <img src={cardItems[0].imageUrl} alt={cardName} className="w-8 h-11 object-cover rounded flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--color-text)' }}>{cardName}</p>
                      {cardItems[0].setName && (
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{cardItems[0].setName}</p>
                      )}
                    </div>
                  </div>

                  {/* Price rows */}
                  <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {cardItems.map(item => (
                      <div key={item._id} className="flex items-center justify-between px-4 py-3 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
                            {CONDITION_LABEL[item.condition] ?? item.condition}
                          </span>
                          {item.finish !== 'nonfoil' && (
                            <span
                              className="text-xs px-2 py-0.5 rounded font-medium"
                              style={{ background: item.finish === 'foil' ? 'linear-gradient(90deg,#f59e0b,#ec4899)' : 'linear-gradient(90deg,#818cf8,#c084fc)', color: 'white' }}
                            >
                              {FINISH_LABEL[item.finish] ?? item.finish}
                            </span>
                          )}
                          {item.notes && (
                            <span className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>{item.notes}</span>
                          )}
                        </div>
                        <span className="font-bold text-sm shrink-0" style={{ color: 'var(--color-accent)' }}>
                          Rp {item.buyPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={p => loadItems(search, p)}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default BuylistPage;
