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
    <div className="container mx-auto px-4 py-8">
      <Link to="/catalog" className="text-primary-600 hover:underline mb-4 inline-block">
        ← Back to Catalog
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Card Image */}
        <div className="flex justify-center">
          <div className="card w-4/5">
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
        </div>

        {/* Card Details */}
        <div>
          <h1 className="text-4xl font-bold mb-2">{card.name}</h1>
          <p className="text-xl text-gray-600 mb-6">{card.setName} • #{card.collectorNumber}</p>

          {card.manaCost && (
            <div className="mb-4">
              <span className="font-semibold">Mana Cost: </span>
              <span className="font-mono text-lg">{card.manaCost}</span>
            </div>
          )}

          {card.typeLine && (
            <div className="mb-4">
              <span className="font-semibold">Type: </span>
              <span>{card.typeLine}</span>
            </div>
          )}

          {card.oracleText && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="whitespace-pre-line">{card.oracleText}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="font-semibold block mb-1">Rarity</span>
              <span className="capitalize">{card.rarity}</span>
            </div>
            <div>
              <span className="font-semibold block mb-1">Language</span>
              <span>{card.language}</span>
            </div>
          </div>

          {card.colorIdentity.length > 0 && (
            <div className="mb-6">
              <span className="font-semibold block mb-2">Color Identity</span>
              <div className="flex gap-2">
                {card.colorIdentity.map((color) => (
                  <span
                    key={color}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{
                      backgroundColor:
                        color === 'W' ? '#F0E68C' :
                        color === 'U' ? '#0E68AB' :
                        color === 'B' ? '#150B00' :
                        color === 'R' ? '#D3202A' :
                        color === 'G' ? '#00733E' : '#CCC'
                    }}
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Breakdown */}
          {card.inventory && card.inventory.length > 0 && (
            <div className="mb-6 border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 font-semibold">Available Inventory</div>
              <table className="w-full">
                <thead className="bg-gray-50 text-sm">
                  <tr>
                    <th className="px-4 py-2 text-left">Condition</th>
                    <th className="px-4 py-2 text-left">Finish</th>
                    <th className="px-4 py-2 text-right">Owned</th>
                    <th className="px-4 py-2 text-right">For Sale</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {card.inventory.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2 font-medium">{item.condition}</td>
                      <td className="px-4 py-2 capitalize">{item.finish}</td>
                      <td className="px-4 py-2 text-right">{item.quantityOwned}</td>
                      <td className="px-4 py-2 text-right">{item.quantityForSale}</td>
                      <td className="px-4 py-2 text-right font-semibold">Rp. {item.sellPrice.toFixed(0)}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleAddToCart(index)}
                          disabled={item.quantityForSale === 0 || addingToCart === index}
                          className="btn-primary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingToCart === index ? 'Adding...' : item.quantityForSale === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t pt-6">
            {card.inventory && card.inventory.length > 0 ? (
              <>
                <div className="mb-4">
                  <div className="text-5xl font-bold text-primary-600 mb-2">
                    Rp. {Math.min(...card.inventory.map(i => i.sellPrice)).toFixed(0)}+
                  </div>
                  <div className="text-gray-600">
                    {card.inventory.reduce((sum, i) => sum + i.quantityForSale, 0)} total available
                  </div>
                </div>

                <button className="btn-primary w-full text-lg py-3">
                  Add to Cart
                </button>
                
                <p className="text-sm text-gray-500 mt-4 text-center">
                  (Checkout feature coming soon)
                </p>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg font-semibold mb-2">Not Available</p>
                <p>This card is not currently in stock</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailPage;
