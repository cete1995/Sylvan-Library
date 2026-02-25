import React, { useState, useRef } from 'react';
import { Card } from '../types';
import { useNavigate } from 'react-router-dom';

interface CardFeedItemProps {
  card: Card;
  onAddToCart: (card: Card, condition: 'NM' | 'LP' | 'P') => void;
  onQuickView: (card: Card) => void;
}

const CardFeedItem: React.FC<CardFeedItemProps> = ({ card, onAddToCart, onQuickView }) => {
  const navigate = useNavigate();
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [lastTap, setLastTap] = useState(0);

  const formatPrice = (price: number): string => {
    return price.toLocaleString('id-ID');
  };

  // DFC / back-face detection via Scryfall URL
  const rawUrl = card.imageUrl || '';
  const isDfc = rawUrl.includes('scryfall.io') && (rawUrl.includes('/back/') || rawUrl.includes('/front/'));
  const frontUrl = rawUrl.replace('/back/', '/front/');
  const backUrl  = rawUrl.replace('/front/', '/back/');
  const [showFront, setShowFront] = useState(true);
  const displayUrl = isDfc ? (showFront ? frontUrl : backUrl) : rawUrl;

  // Get default condition (NM nonfoil) - aggregate from all sellers
  const getDefaultInventory = () => {
    const matchingItems = card.inventory?.filter(item => item.condition === 'NM' && item.finish === 'nonfoil') || [];
    if (matchingItems.length === 0) return null;
    
    // Aggregate quantity from all sellers
    const totalQuantity = matchingItems.reduce((sum, item) => sum + item.quantityForSale, 0);
    const firstItemWithStock = matchingItems.find(item => item.quantityForSale > 0);
    const baseItem = firstItemWithStock || matchingItems[0];
    
    return {
      ...baseItem,
      quantityForSale: totalQuantity
    };
  };

  const inventory = getDefaultInventory();
  const price = inventory?.sellPrice || (card as any).calculatedPrices?.nonfoil || 0;
  const stock = inventory?.quantityForSale || 0;
  const isAvailable = stock > 0;

  // Handle double tap
  const handleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap - open quick view
      onQuickView(card);
    }
    
    setLastTap(now);
  };

  // Handle swipe left to add to cart
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    if (diff < 0 && diff > -150) {
      setSwipeX(diff);
      setShowSwipeHint(true);
    }
  };

  const handleTouchEnd = () => {
    const diff = currentX.current - startX.current;
    
    if (diff < -100 && isAvailable) {
      // Swipe left threshold reached - add to cart
      onAddToCart(card, 'NM');
      // Visual feedback
      setSwipeX(-300);
      setTimeout(() => setSwipeX(0), 300);
    } else {
      setSwipeX(0);
    }
    
    setTimeout(() => setShowSwipeHint(false), 2000);
  };

  return (
    <div className="relative mb-4 px-4">
      {/* Card Container */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg"
        style={{ 
          transform: `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        {/* Card Image */}
        <div className="relative w-full aspect-[5/7] bg-gray-200 dark:bg-gray-800">
          <img
            src={displayUrl || 'https://via.placeholder.com/500x700?text=No+Image'}
            alt={card.name}
            className={`w-full h-full object-contain ${!isAvailable ? 'grayscale opacity-70' : ''}`}
            loading="lazy"
          />
          
          {/* Gradient Overlay at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Card Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-bold text-lg mb-1 line-clamp-2">{card.name}</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                {card.setCode} • {card.rarity}
              </span>
            </div>
          </div>

          {/* Price Badge - Top Right */}
          <div className="absolute top-4 right-4">
            <div 
              className="px-3 py-2 rounded-xl backdrop-blur-md font-bold text-white shadow-lg"
              style={{ backgroundColor: isAvailable ? '#10b981' : '#6b7280' }}
            >
              {price > 0 ? `Rp. ${formatPrice(price)}` : 'Price TBD'}
            </div>
          </div>

          {/* Condition Badge - Top Left */}
          <div className="absolute top-4 left-4">
            <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm font-semibold">NM</div>
          </div>

          {/* DFC Turn Over button - bottom center, above gradient text */}
          {isDfc && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowFront(f => !f); }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg z-10"
              style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.25)' }}
              title={showFront ? 'Show back face' : 'Show front face'}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Turn Over
            </button>
          )}

          {/* Out of Stock Overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-red-600/90 backdrop-blur-sm px-6 py-3 rounded-xl text-white font-bold text-lg shadow-xl">
                OUT OF STOCK
              </div>
            </div>
          )}

          {/* Stock Count - Bottom Right */}
          {isAvailable && (
            <div className="absolute bottom-4 right-4">
              <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-xs">
                {stock} in stock
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Bar */}
        <div 
          className="flex items-center justify-between p-3 border-t"
          style={{ 
            backgroundColor: 'var(--color-panel)',
            borderTopColor: 'var(--color-border)'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/cards/${card._id}`);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Details</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isAvailable) onAddToCart(card, 'NM');
            }}
            disabled={!isAvailable}
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: isAvailable ? '#10b981' : '#6b7280',
              color: 'white'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Add to Cart</span>
          </button>
        </div>
      </div>

      {/* Swipe Hint */}
      {showSwipeHint && swipeX !== 0 && (
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-xl flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            Add to Cart
          </div>
        </div>
      )}
    </div>
  );
};

export default CardFeedItem;
