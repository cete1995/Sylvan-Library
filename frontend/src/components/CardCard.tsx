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
    <Link to={`/cards/${card._id}`} className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden block ${!isAvailable ? 'opacity-60' : ''}`}>
      {/* Card Image */}
      <div className="aspect-[5/7] bg-gray-200 relative overflow-hidden">
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
            <span className="bg-red-600 text-white text-sm px-3 py-1 rounded font-bold">
              UNAVAILABLE
            </span>
          </div>
        )}
      </div>
      
      {/* Card Info */}
      <div className="p-3">
        {/* Card Name and Set */}
        <h3 className="font-bold text-sm mb-1 line-clamp-2 min-h-[2.5rem]">{card.name}</h3>
        <p className="text-xs text-gray-500 mb-2">{card.setName}_{card.collectorNumber}</p>
        
        {/* Rarity Pill and Special Pills */}
        <div className="mb-3 flex flex-wrap gap-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRarityColor(card.rarity)}`}>
            {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
          </span>
          {card.borderColor === 'borderless' && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
              Borderless
            </span>
          )}
          {card.frameEffects?.includes('extendedart') && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-500 text-white">
              Extended Art
            </span>
          )}
        </div>

        {/* Stock and Price Info */}
        <div className="space-y-2 border-t pt-3">
          {/* Near Mint Stock */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">Near Mint :</span>
            <span className={nmNonfoilStock > 0 ? 'text-green-600 font-semibold' : 'text-red-600'}>
              {nmNonfoilStock}
            </span>
          </div>

          {/* Foil Stock */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">Foil :</span>
            <span className={nmFoilStock > 0 ? 'text-green-600 font-semibold' : 'text-red-600'}>
              {nmFoilStock}
            </span>
          </div>

          {/* Prices */}
          <div className="space-y-1 pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Near Mint</span>
              <span className="text-sm font-bold text-blue-600">
                {nmNonfoilPrice > 0 ? `Rp. ${formatPrice(nmNonfoilPrice)}` : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Foil</span>
              <span className="text-sm font-bold text-blue-600">
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
