import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { cardApi } from '../api/cards';
import { cartApi } from '../api/cart';
import { Card } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const CardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadCard(id);
    }
  }, [id]);

  const loadCard = async (cardId: string) => {
    setLoading(true);
    try {
      const data = await cardApi.getCardById(cardId);
      setCard(data.card);
    } catch (error) {
      console.error('Failed to load card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (inventoryIndex: number) => {
    if (!user) {
      navigate('/register');
      return;
    }

    if (!card) return;

    setAddingToCart(inventoryIndex);
    try {
      await cartApi.addToCart(card._id, inventoryIndex, 1);
      await refreshCart(); // Update cart count in navbar
      alert('Item added to cart!');
    } catch (error: any) {
      alert(error.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  // Format price with thousands separator
  const formatPrice = (price: number): string => {
    return price.toLocaleString('id-ID');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Card Not Found</h1>
        <Link to="/catalog" className="btn-primary">
          Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link to="/catalog" className="inline-block mb-6 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded">
        Back
      </Link>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Left Column - Card Image and Info */}
        <div>
          {/* Card Image with Yellow Border */}
          <div className="border-4 border-yellow-400 rounded-lg overflow-hidden mb-4">
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className="w-full" />
            ) : (
              <div className="aspect-[5/7] bg-gray-200 flex items-center justify-center">
                <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Card Info Table */}
          <div className="border-2 border-yellow-400 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="bg-red-600 text-white font-bold py-2 px-3 w-24">Name</td>
                  <td className="py-2 px-3 bg-white">{card.name}</td>
                </tr>
                <tr className="border-b">
                  <td className="bg-red-600 text-white font-bold py-2 px-3">Rarity</td>
                  <td className="py-2 px-3 bg-white capitalize">{card.rarity}</td>
                </tr>
                <tr className="border-b">
                  <td className="bg-red-600 text-white font-bold py-2 px-3">Type</td>
                  <td className="py-2 px-3 bg-white">{card.typeLine || 'N/A'}</td>
                </tr>
                <tr className="border-b">
                  <td className="bg-red-600 text-white font-bold py-2 px-3">Cost</td>
                  <td className="py-2 px-3 bg-white font-mono">{card.manaCost || 'N/A'}</td>
                </tr>
                <tr className="border-b">
                  <td className="bg-red-600 text-white font-bold py-2 px-3">P/T</td>
                  <td className="py-2 px-3 bg-white">
                    {card.typeLine?.includes('Creature') ? (card.oracleText?.match(/\d+\/\d+/) || 'N/A') : 'N/A'}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="bg-red-600 text-white font-bold py-2 px-3">Edition</td>
                  <td className="py-2 px-3 bg-white">{card.setName}</td>
                </tr>
                <tr>
                  <td className="bg-red-600 text-white font-bold py-2 px-3">Illust</td>
                  <td className="py-2 px-3 bg-white">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Inventory Table */}
        <div>
          {card.inventory && card.inventory.length > 0 ? (
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
              {/* Table Header */}
              <table className="w-full">
                <thead>
                  <tr className="bg-red-600 text-white">
                    <th className="py-3 px-4 text-center font-bold border-r border-white">Quality</th>
                    <th className="py-3 px-4 text-center font-bold border-r border-white">Price</th>
                    <th className="py-3 px-4 text-center font-bold border-r border-white">Stock</th>
                    <th className="py-3 px-4 text-center font-bold border-r border-white">Quantity</th>
                    <th className="py-3 px-4 text-center font-bold">Add to Cart</th>
                  </tr>
                </thead>
                <tbody>
                  {card.inventory.map((item, index) => {
                    const qualityLabel = item.condition === 'NM' 
                      ? `Near Mint (${item.finish === 'foil' ? 'Foil' : 'Non Foil'})`
                      : `${item.condition} (${item.finish === 'foil' ? 'Foil' : 'Non Foil'})`;
                    return (
                      <tr key={index} className="border-t border-gray-300 bg-white hover:bg-gray-50">
                        <td className="py-3 px-4 text-center font-semibold border-r border-gray-300">
                          {qualityLabel}
                        </td>
                        <td className="py-3 px-4 text-center border-r border-gray-300">
                          {formatPrice(item.sellPrice)}
                        </td>
                        <td className="py-3 px-4 text-center border-r border-gray-300">
                          <span className={item.quantityForSale > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {item.quantityForSale}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center border-r border-gray-300">
                          <div className="flex items-center justify-center gap-2">
                            <button className="w-8 h-8 bg-red-600 text-white font-bold rounded hover:bg-red-700">
                              −
                            </button>
                            <input 
                              type="number" 
                              defaultValue="1" 
                              min="1"
                              max={item.quantityForSale}
                              className="w-16 text-center border border-gray-300 rounded py-1 appearance-none"
                              style={{ MozAppearance: 'textfield' }}
                            />
                            <button className="w-8 h-8 bg-red-600 text-white font-bold rounded hover:bg-red-700">
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleAddToCart(index)}
                            disabled={item.quantityForSale === 0 || addingToCart === index}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-xl font-semibold text-gray-600 mb-2">Not Available</p>
              <p className="text-gray-500">This card is not currently in stock</p>
            </div>
          )}

          {/* Notice Text */}
          <div className="mt-6 p-4 border-2 border-yellow-400 rounded-lg bg-yellow-50">
            <ul className="space-y-2 text-sm">
              <li>• Single cards are drawn from booster packs or purchased from others.</li>
              <li>• If the ordered card is unavailable, we'll contact you as fast as we can.</li>
              <li className="text-red-600 font-semibold">• Cancellation or Exchange are unavailable.</li>
              <li className="text-red-600 font-semibold">• If you order more than 100 cards, we need 2~3 days to prepare the order.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailPage;
