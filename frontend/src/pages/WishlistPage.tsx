import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { wishlistApi } from '../api/wishlist';
import { Card } from '../types';
import { toast } from '../utils/toast';

const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    wishlistApi.getWishlist()
      .then(c => { setCards(c); setLoading(false); })
      .catch((err: any) => {
        if (err.response?.status === 401) { navigate('/login'); return; }
        toast.error('Failed to load wishlist');
        setLoading(false);
      });
  }, []);

  const handleRemove = async (cardId: string) => {
    setRemoving(cardId);
    try {
      await wishlistApi.removeFromWishlist(cardId);
      setCards(prev => prev.filter(c => c._id !== cardId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div
      className="min-h-screen pb-28 md:pb-8"
      style={{ background: 'linear-gradient(135deg, #060918, #0d1440, #111e55)' }}
    >
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm mb-4 flex items-center gap-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white mb-1">My Wishlist</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {cards.length} card{cards.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden animate-pulse" style={{ background: 'var(--color-panel)' }}>
              <div className="aspect-[5/7]" style={{ background: 'var(--color-border)' }} />
              <div className="p-2 space-y-2">
                <div className="h-3 rounded w-3/4" style={{ background: 'var(--color-border)' }} />
                <div className="h-3 rounded w-1/2" style={{ background: 'var(--color-border)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && cards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="text-6xl">🤍</span>
          <p className="text-lg font-semibold text-white">Your wishlist is empty</p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Tap the heart icon on any card to save it here
          </p>
          <Link
            to="/catalog"
            className="mt-2 px-6 py-2 rounded-full text-sm font-semibold text-white"
            style={{ background: 'var(--color-accent)' }}
          >
            Browse Cards
          </Link>
        </div>
      )}

      {!loading && cards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-4">
          {cards.map(card => {
            const inventory = card.inventory || [];
            const nmNonfoilItems = inventory.filter(i => i.condition === 'NM' && i.finish === 'nonfoil');
            const nmNonfoilStock = nmNonfoilItems.reduce((s, i) => s + i.quantityForSale, 0);
            const nmNonfoilPrice = nmNonfoilItems.find(i => i.quantityForSale > 0)?.sellPrice || nmNonfoilItems[0]?.sellPrice || 0;

            return (
              <div key={card._id} className="relative rounded-lg overflow-hidden shadow" style={{ background: 'var(--color-panel)' }}>
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(card._id)}
                  disabled={removing === card._id}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: removing === card._id ? '#666' : '#E31E24' }}
                  aria-label="Remove from wishlist"
                >
                  {removing === card._id ? '…' : '✕'}
                </button>

                <Link to={`/cards/${card._id}`}>
                  <div className="aspect-[5/7] relative overflow-hidden" style={{ background: 'var(--color-background)' }}>
                    {card.imageUrl ? (
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--color-text-secondary)' }}>
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {nmNonfoilStock === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: '#DC2626', color: 'white' }}>OUT OF STOCK</span>
                      </div>
                    )}
                  </div>

                  <div className="p-2">
                    <h3 className="font-bold text-xs line-clamp-2 min-h-[2rem]" style={{ color: 'var(--color-text)' }}>{card.name}</h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {card.setCode} #{card.collectorNumber}
                    </p>
                    <p className="text-xs font-bold mt-1" style={{ color: 'var(--color-accent)' }}>
                      {nmNonfoilPrice > 0 ? `Rp ${nmNonfoilPrice.toLocaleString('id-ID')}` : 'Price TBD'}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
