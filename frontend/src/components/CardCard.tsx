import React from 'react';
import { Card } from '../types';
import { Link } from 'react-router-dom';

interface CardCardProps {
  card: Card;
}

const CardCard: React.FC<CardCardProps> = ({ card }) => {
  const getManaSymbols = (manaCost?: string) => {
    if (!manaCost) return null;
    // Simple mana cost display - you can enhance this with actual symbols later
    return manaCost.replace(/{/g, '').replace(/}/g, ' ').trim();
  };

  // Calculate total quantities from inventory (handle missing inventory field for old data)
  const inventory = card.inventory || [];
  const totalOwned = inventory.reduce((sum, item) => sum + item.quantityOwned, 0);
  const totalForSale = inventory.reduce((sum, item) => sum + item.quantityForSale, 0);
  
  // Get the lowest sell price from inventory
  const prices = inventory.map(item => item.sellPrice).filter(price => price > 0);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;

  const isAvailable = totalOwned > 0;

  return (
    <Link to={`/cards/${card._id}`} className={`card hover:shadow-lg transition-shadow ${!isAvailable ? 'opacity-60' : ''}`}>
      <div className="aspect-[5/7] bg-gray-200 relative overflow-hidden">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className={`w-full h-full object-cover ${!isAvailable ? 'grayscale' : ''}`}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${!isAvailable ? 'text-gray-300' : 'text-gray-400'}`}>
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
        {inventory.some(item => item.finish !== 'nonfoil') && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded font-bold">
            FOIL
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1">{card.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{card.setName} • {card.collectorNumber}</p>
        
        {card.manaCost && (
          <p className="text-sm text-gray-700 mb-2 font-mono">{getManaSymbols(card.manaCost)}</p>
        )}

        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600 capitalize">{card.rarity}</span>
          {totalOwned > 0 && (
            <span className="text-sm text-gray-600">{totalOwned} owned</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-2xl font-bold text-primary-600">
            {lowestPrice > 0 ? `Rp. ${lowestPrice.toFixed(0)}` : 'N/A'}
          </span>
          <span className="text-sm text-gray-600">{totalForSale} available</span>
        </div>
      </div>
    </Link>
  );
};

export default CardCard;
