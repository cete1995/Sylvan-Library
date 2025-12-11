import React from 'react';
import { Card } from '../types';
import { Link } from 'react-router-dom';

interface CardCardProps {
  card: Card;
}

const CardCard: React.FC<CardCardProps> = ({ card }) => {
  // Get inventory data
  const inventory = card.inventory || [];
  
  // Find Near Mint nonfoil
  const nmNonfoil = inventory.find(item => item.condition === 'NM' && item.finish === 'nonfoil');
  const nmNonfoilStock = nmNonfoil?.quantityForSale || 0;
  const nmNonfoilPrice = nmNonfoil?.sellPrice || 0;
  
  // Find Near Mint foil
  const nmFoil = inventory.find(item => item.condition === 'NM' && item.finish === 'foil');
  const nmFoilStock = nmFoil?.quantityForSale || 0;
  const nmFoilPrice = nmFoil?.sellPrice || 0;

  // Check if ANY condition has stock available
  const totalForSale = inventory.reduce((sum, item) => sum + item.quantityForSale, 0);
  const isAvailable = totalForSale > 0;
  
  // Format price with thousands separator
  const formatPrice = (price: number): string => {
    return price.toLocaleString('id-ID');
  };
  
  // Rarity colors
  const getRarityColor = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'uncommon': return 'bg-green-500 text-white';
      case 'rare': return 'bg-yellow-400 text-gray-900';
      case 'mythic': return 'bg-orange-500 text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <Link to={`/cards/${card._id}`} className={`rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden block ${!isAvailable ? 'opacity-60' : ''}`} style={{ backgroundColor: 'var(--color-panel)' }}>
      {/* Card Image */}
      <div className="aspect-[5/7] relative overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className={`w-full h-full object-cover ${!isAvailable ? 'grayscale' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="text-sm px-3 py-1 rounded font-bold" style={{ backgroundColor: '#DC2626', color: 'var(--color-panel)' }}>
              UNAVAILABLE
            </span>
          </div>
        )}
      </div>
      
      {/* Card Info */}
      <div className="p-1.5 md:p-2.5">
        {/* Card Name and Set */}
        <h3 className="font-bold text-xs md:text-sm mb-1 line-clamp-2 min-h-[2rem] md:min-h-[2.5rem]" style={{ color: 'var(--color-text)' }}>{card.name}</h3>
        <p className="text-xs mb-2 truncate" style={{ color: 'var(--color-text-secondary)' }}>{card.setName}_{card.collectorNumber}</p>
        
        {/* Rarity Pill and Special Pills */}
        <div className="mb-2 md:mb-3 flex gap-1 md:gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <span className={`inline-block px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getRarityColor(card.rarity)}`}>
            {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
          </span>
          {card.borderColor === 'borderless' && (
            <span className="inline-block px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>
              Borderless
            </span>
          )}
          {card.frameEffects?.includes('extendedart') && (
            <span className="inline-block px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-panel)' }}>
              Extended Art
            </span>
          )}
        </div>

        {/* Stock and Price Info */}
        <div className="space-y-1.5 md:space-y-2 pt-2 md:pt-3">
          {/* Near Mint Stock */}
          <div className="flex justify-between items-center text-xs md:text-sm">
            <span style={{ color: 'var(--color-text-secondary)' }}>Near Mint :</span>
            <span className={nmNonfoilStock > 0 ? 'text-green-600 font-semibold' : 'text-red-600'}>
              {nmNonfoilStock}
            </span>
          </div>

          {/* Foil Stock */}
          <div className="flex justify-between items-center text-xs md:text-sm">
            <span style={{ color: 'var(--color-text-secondary)' }}>Foil :</span>
            <span className={nmFoilStock > 0 ? 'text-green-600 font-semibold' : 'text-red-600'}>
              {nmFoilStock}
            </span>
          </div>

          {/* Prices */}
          <div className="space-y-1 pt-1.5 md:pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Near Mint</span>
              <span className="text-xs md:text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                {nmNonfoilPrice > 0 ? `Rp. ${formatPrice(nmNonfoilPrice)}` : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Foil</span>
              <span className="text-xs md:text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                {nmFoilPrice > 0 ? `Rp. ${formatPrice(nmFoilPrice)}` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CardCard;
