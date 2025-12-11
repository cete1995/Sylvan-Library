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
  const [activeTab, setActiveTab] = useState<'NM' | 'LP' | 'P'>('NM');
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

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
    const quantity = quantities[inventoryIndex] || 1;
    try {
      await cartApi.addToCart(card._id, inventoryIndex, quantity);
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

  const getConditionLabel = (condition: string): string => {
    switch (condition) {
      case 'NM': return 'Near Mint';
      case 'LP': return 'Lightly Played';
      case 'P': return 'Played';
      default: return condition;
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const currentQty = quantities[index] || 1;
    const newQty = Math.max(1, currentQty + delta);
    const maxQty = card?.inventory[index]?.quantityForSale || 1;
    setQuantities({ ...quantities, [index]: Math.min(newQty, maxQty) });
  };

  const handleQuantityChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 1;
    const maxQty = card?.inventory[index]?.quantityForSale || 1;
    setQuantities({ ...quantities, [index]: Math.min(Math.max(1, numValue), maxQty) });
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
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl" style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      <Link to="/catalog" className="inline-block mb-4 md:mb-6 font-bold py-2 px-4 md:px-6 rounded text-sm md:text-base hover:opacity-90" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>
        Back
      </Link>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 md:gap-6">
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
            <table className="w-full text-xs md:text-sm">
              <tbody>
                <tr>
                  <td className="font-bold py-1.5 md:py-2 px-2 md:px-3 w-20 md:w-24" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>Name</td>
                  <td className="py-1.5 md:py-2 px-2 md:px-3" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>{card.name}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1.5 md:py-2 px-2 md:px-3" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>Rarity</td>
                  <td className="py-1.5 md:py-2 px-2 md:px-3 capitalize" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>{card.rarity}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1.5 md:py-2 px-2 md:px-3" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>Type</td>
                  <td className="py-1.5 md:py-2 px-2 md:px-3" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>{card.typeLine || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1.5 md:py-2 px-2 md:px-3" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>Cost</td>
                  <td className="py-1.5 md:py-2 px-2 md:px-3 font-mono" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>{card.manaCost || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1.5 md:py-2 px-2 md:px-3" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>P/T</td>
                  <td className="py-1.5 md:py-2 px-2 md:px-3" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>
                    {card.typeLine?.includes('Creature') ? (card.oracleText?.match(/\d+\/\d+/) || 'N/A') : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold py-1.5 md:py-2 px-2 md:px-3" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>Edition</td>
                  <td className="py-1.5 md:py-2 px-2 md:px-3" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>{card.setName}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1.5 md:py-2 px-2 md:px-3" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>Illust</td>
                  <td className="py-1.5 md:py-2 px-2 md:px-3" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Inventory Tabs */}
        <div>
          {card.inventory && card.inventory.length > 0 ? (
            <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-text-secondary)' }}>
              {/* Tab Headers */}
              <div className="flex border-b" style={{ borderColor: 'var(--color-text-secondary)' }}>
                {['NM', 'LP', 'P'].map((condition) => {
                  const hasInventory = card.inventory.some(item => item.condition === condition && item.finish === 'nonfoil');
                  return (
                    <button
                      key={condition}
                      onClick={() => setActiveTab(condition as 'NM' | 'LP' | 'P')}
                      disabled={!hasInventory}
                      className={`flex-1 py-3 px-4 font-bold text-sm md:text-base transition-colors ${
                        activeTab === condition 
                          ? 'border-b-4' 
                          : 'opacity-60'
                      } ${!hasInventory ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-100'}`}
                      style={{ 
                        backgroundColor: activeTab === condition ? 'var(--color-accent)' : 'var(--color-panel)',
                        color: activeTab === condition ? 'var(--color-panel)' : 'var(--color-text)',
                        borderBottomColor: activeTab === condition ? 'var(--color-highlight)' : 'transparent'
                      }}
                    >
                      {condition}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="p-4 md:p-6" style={{ backgroundColor: 'var(--color-panel)' }}>
                {(() => {
                  const nonfoilItem = card.inventory.find(item => item.condition === activeTab && item.finish === 'nonfoil');
                  const foilItem = card.inventory.find(item => item.condition === activeTab && item.finish === 'foil');
                  const nonfoilIndex = card.inventory.findIndex(item => item.condition === activeTab && item.finish === 'nonfoil');
                  const foilIndex = card.inventory.findIndex(item => item.condition === activeTab && item.finish === 'foil');

                  if (!nonfoilItem && !foilItem) {
                    return (
                      <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                        <p className="text-lg font-semibold">No inventory available for {getConditionLabel(activeTab)}</p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px]">
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>
                            <th className="py-3 px-4 text-center text-sm md:text-base font-bold border-r border-white">Quality</th>
                            <th className="py-3 px-4 text-center text-sm md:text-base font-bold border-r border-white">Price</th>
                            <th className="py-3 px-4 text-center text-sm md:text-base font-bold border-r border-white">Stock</th>
                            <th className="py-3 px-4 text-center text-sm md:text-base font-bold border-r border-white">Quantity</th>
                            <th className="py-3 px-4 text-center text-sm md:text-base font-bold">Add to Cart</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nonfoilItem && (
                            <tr className="border-t" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-text-secondary)' }}>
                              <td className="py-3 px-4 text-center text-sm md:text-base font-semibold border-r" style={{ color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)' }}>
                                {getConditionLabel(activeTab)} (Non Foil)
                              </td>
                              <td className="py-3 px-4 text-center text-sm md:text-base border-r" style={{ color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)' }}>
                                Rp. {formatPrice(nonfoilItem.sellPrice)}
                              </td>
                              <td className="py-3 px-4 text-center border-r" style={{ borderColor: 'var(--color-text-secondary)' }}>
                                <span className={nonfoilItem.quantityForSale > 0 ? 'text-emerald-500 font-bold text-sm md:text-base' : 'text-red-600 font-semibold text-sm md:text-base'}>
                                  {nonfoilItem.quantityForSale}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center border-r" style={{ borderColor: 'var(--color-text-secondary)' }}>
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => updateQuantity(nonfoilIndex, -1)}
                                    className="w-8 h-8 text-base font-bold rounded hover:opacity-90" 
                                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}
                                  >
                                    −
                                  </button>
                                  <input 
                                    type="number" 
                                    value={quantities[nonfoilIndex] || 1}
                                    onChange={(e) => handleQuantityChange(nonfoilIndex, e.target.value)}
                                    min="1"
                                    max={nonfoilItem.quantityForSale}
                                    className="w-16 text-sm md:text-base text-center border rounded py-1"
                                    style={{ 
                                      borderColor: 'var(--color-text-secondary)',
                                      backgroundColor: 'var(--color-panel)',
                                      color: 'var(--color-text)'
                                    }}
                                  />
                                  <button 
                                    onClick={() => updateQuantity(nonfoilIndex, 1)}
                                    className="w-8 h-8 text-base font-bold rounded hover:opacity-90" 
                                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleAddToCart(nonfoilIndex)}
                                  disabled={nonfoilItem.quantityForSale === 0 || addingToCart === nonfoilIndex}
                                  className="font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto text-sm md:text-base hover:opacity-90"
                                  style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-panel)' }}
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          )}
                          {foilItem && (
                            <tr className="border-t" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-text-secondary)' }}>
                              <td className="py-3 px-4 text-center text-sm md:text-base font-semibold border-r" style={{ color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)' }}>
                                {getConditionLabel(activeTab)} (Foil)
                              </td>
                              <td className="py-3 px-4 text-center text-sm md:text-base border-r" style={{ color: 'var(--color-text)', borderColor: 'var(--color-text-secondary)' }}>
                                Rp. {formatPrice(foilItem.sellPrice)}
                              </td>
                              <td className="py-3 px-4 text-center border-r" style={{ borderColor: 'var(--color-text-secondary)' }}>
                                <span className={foilItem.quantityForSale > 0 ? 'text-emerald-500 font-bold text-sm md:text-base' : 'text-red-600 font-semibold text-sm md:text-base'}>
                                  {foilItem.quantityForSale}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center border-r" style={{ borderColor: 'var(--color-text-secondary)' }}>
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => updateQuantity(foilIndex, -1)}
                                    className="w-8 h-8 text-base font-bold rounded hover:opacity-90" 
                                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}
                                  >
                                    −
                                  </button>
                                  <input 
                                    type="number" 
                                    value={quantities[foilIndex] || 1}
                                    onChange={(e) => handleQuantityChange(foilIndex, e.target.value)}
                                    min="1"
                                    max={foilItem.quantityForSale}
                                    className="w-16 text-sm md:text-base text-center border rounded py-1"
                                    style={{ 
                                      borderColor: 'var(--color-text-secondary)',
                                      backgroundColor: 'var(--color-panel)',
                                      color: 'var(--color-text)'
                                    }}
                                  />
                                  <button 
                                    onClick={() => updateQuantity(foilIndex, 1)}
                                    className="w-8 h-8 text-base font-bold rounded hover:opacity-90" 
                                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleAddToCart(foilIndex)}
                                  disabled={foilItem.quantityForSale === 0 || addingToCart === foilIndex}
                                  className="font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto text-sm md:text-base hover:opacity-90"
                                  style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-panel)' }}
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-xl font-semibold text-gray-600 mb-2">Not Available</p>
              <p className="text-gray-500">This card is not currently in stock</p>
            </div>
          )}

          {/* Notice Text */}
          <div className="mt-4 md:mt-6 p-3 md:p-4 border-2 border-yellow-400 rounded-lg bg-yellow-50">
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
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
