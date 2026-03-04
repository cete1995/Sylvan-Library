import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { cardApi } from '../api/cards';
import { cartApi } from '../api/cart';
import { Card } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import ManaSymbols from '../components/ManaSymbols';
import { toast } from '../utils/toast';

const CardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'NM' | 'LP' | 'P'>('NM');
  const [activeFinish, setActiveFinish] = useState<'nonfoil' | 'foil'>('nonfoil');
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [isMobile, setIsMobile] = useState(false);
  const [calculatedPrices, setCalculatedPrices] = useState<{ nonfoil: number; foil: number } | null>(null);
  const [showFront, setShowFront] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);

  const handleFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => {
      setShowFront(f => !f);
      setIsFlipping(false);
    }, 220);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      setCalculatedPrices(data.calculatedPrices || null);
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
      toast.success('Item added to cart!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Failed to add to cart');
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

  // Get current inventory item - prioritize items with stock
  const getCurrentInventoryItem = () => {
    if (!card) return null;
    // Find all matching items
    const matchingItems = card.inventory.filter(item => item.condition === activeTab && item.finish === activeFinish);
    if (matchingItems.length === 0) return null;
    
    // If there are multiple sellers, aggregate the data
    if (matchingItems.length > 1) {
      const totalQuantity = matchingItems.reduce((sum, item) => sum + item.quantityForSale, 0);
      const firstItemWithStock = matchingItems.find(item => item.quantityForSale > 0);
      const baseItem = firstItemWithStock || matchingItems[0];
      
      // Return aggregated item
      return {
        ...baseItem,
        quantityForSale: totalQuantity,
        sellerName: matchingItems.length > 1 ? `Multiple sellers (${matchingItems.length})` : baseItem.sellerName
      };
    }
    
    return matchingItems[0];
  };

  const getCurrentInventoryIndex = () => {
    if (!card) return -1;
    // Find first item with stock, or first matching item
    const matchingItems = card.inventory
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.condition === activeTab && item.finish === activeFinish);
    
    if (matchingItems.length === 0) return -1;
    
    const itemWithStock = matchingItems.find(({ item }) => item.quantityForSale > 0);
    return itemWithStock ? itemWithStock.index : matchingItems[0].index;
  };

  const currentItem = getCurrentInventoryItem();
  const currentIndex = getCurrentInventoryIndex();

  // DFC detection via layout field (transform, modal_dfc, reversible_card, flip).
  // Falls back to name ' // ' check for cards imported before layout was stored.
  const rawUrl = card?.imageUrl || '';
  const DFC_LAYOUTS = ['transform', 'modal_dfc', 'reversible_card', 'flip'];
  const isDfc = !!card && (DFC_LAYOUTS.includes(card.layout || '') || card.name.includes(' // '));
  const frontUrl = rawUrl.includes('/back/') ? rawUrl.replace('/back/', '/front/') : rawUrl;
  const backUrl  = frontUrl.replace('/front/', '/back/');
  const displayUrl = isDfc ? (showFront ? frontUrl : backUrl) : rawUrl;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-4" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
          <div className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Card Not Found</h1>
          <Link to="/catalog" className="btn-primary">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--color-background)' }}>
        {/* Header */}
        <div 
          className="sticky top-0 z-30 px-4 py-3 border-b flex items-center gap-3"
          style={{ 
            backgroundColor: 'var(--color-panel)',
            borderBottomColor: 'var(--color-border)'
          }}
        >
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full"
            style={{ backgroundColor: 'var(--color-background)' }}
          >
            <svg className="w-6 h-6" style={{ color: 'var(--color-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold truncate flex-1" style={{ color: 'var(--color-text)' }}>
            {card.name}
          </h1>
        </div>

        {/* Card Image - Mobile */}
        <div className="px-4 py-4">
          <div className="max-w-sm mx-auto">
            <div
              className="border-4 border-yellow-400 rounded-xl shadow-lg overflow-hidden"
              style={{ transition: 'transform 0.22s ease-in-out', transform: isFlipping ? 'scaleX(0)' : 'scaleX(1)' }}
            >
              {card.imageUrl ? (
                <img src={displayUrl} alt={card.name} className="w-full block" />
              ) : (
                <div className="aspect-[5/7] flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
                  <svg className="w-24 h-24" style={{ color: 'var(--color-text-secondary)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {isDfc && (
              <button
                onClick={handleFlip}
                disabled={isFlipping}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm shadow"
                style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '2px solid var(--color-border)' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                {showFront ? 'Turn Over — See Back Face' : 'Turn Over — See Front Face'}
              </button>
            )}
          </div>
        </div>

        {/* Card Info */}
        <div className="px-4 py-3">
          <div 
            className="rounded-xl overflow-hidden shadow-md"
            style={{ backgroundColor: 'var(--color-panel)' }}
          >
            <div className="grid grid-cols-2 divide-x divide-y" style={{ borderColor: 'var(--color-border)' }}>
              <div className="p-3">
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Rarity</div>
                <div className="text-sm font-bold capitalize" style={{ color: 'var(--color-text)' }}>{card.rarity}</div>
              </div>
              <div className="p-3">
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Set</div>
                <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{card.setCode}</div>
              </div>
              <div className="p-3">
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Type</div>
                <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{card.typeLine || 'N/A'}</div>
              </div>
              <div className="p-3">
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Mana Cost</div>
                <div className="text-sm font-bold"><ManaSymbols cost={card.manaCost || ''} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Condition Selector */}
        <div className="px-4 py-3">
          <div className="text-sm font-bold mb-2" style={{ color: 'var(--color-text)' }}>Condition</div>
          <div className="grid grid-cols-3 gap-2">
            {['NM', 'LP', 'P'].map((condition) => {
              const hasInventory = card.inventory.some(item => item.condition === condition);
              return (
                <button
                  key={condition}
                  onClick={() => setActiveTab(condition as 'NM' | 'LP' | 'P')}
                  disabled={!hasInventory}
                  className={`py-3 px-4 rounded-lg font-bold transition-all ${
                    !hasInventory ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                  style={{
                    backgroundColor: activeTab === condition ? 'var(--color-accent)' : 'var(--color-panel)',
                    color: activeTab === condition ? 'white' : 'var(--color-text)',
                    border: `2px solid ${activeTab === condition ? 'var(--color-accent)' : 'var(--color-border)'}`
                  }}
                >
                  {condition}
                </button>
              );
            })}
          </div>
        </div>

        {/* Finish Selector */}
        <div className="px-4 py-3">
          <div className="text-sm font-bold mb-2" style={{ color: 'var(--color-text)' }}>Finish</div>
          <div className="grid grid-cols-2 gap-2">
            {['nonfoil', 'foil'].map((finish) => {
              const hasInventory = card.inventory.some(item => item.condition === activeTab && item.finish === finish);
              return (
                <button
                  key={finish}
                  onClick={() => setActiveFinish(finish as 'nonfoil' | 'foil')}
                  disabled={!hasInventory}
                  className={`py-3 px-4 rounded-lg font-bold capitalize transition-all ${
                    !hasInventory ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                  style={{
                    backgroundColor: activeFinish === finish ? 'var(--color-accent)' : 'var(--color-panel)',
                    color: activeFinish === finish ? 'white' : 'var(--color-text)',
                    border: `2px solid ${activeFinish === finish ? 'var(--color-accent)' : 'var(--color-border)'}`
                  }}
                >
                  {finish}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price & Stock Card */}
        {currentItem && (
          <div className="px-4 py-3">
            <div 
              className="rounded-xl p-4 shadow-md"
              style={{ backgroundColor: 'var(--color-panel)' }}
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Price</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                    Rp. {formatPrice(currentItem.sellPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Stock</div>
                  <div className={`text-2xl font-bold ${currentItem.quantityForSale > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {currentItem.quantityForSale}
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              {currentItem.quantityForSale > 0 && (
                <div className="flex items-center justify-center gap-4 py-3">
                  <button
                    onClick={() => updateQuantity(currentIndex, -1)}
                    className="w-12 h-12 text-2xl font-bold rounded-lg"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantities[currentIndex] || 1}
                    onChange={(e) => handleQuantityChange(currentIndex, e.target.value)}
                    min="1"
                    max={currentItem.quantityForSale}
                    className="w-20 text-2xl text-center border-2 rounded-lg py-2 font-bold"
                    style={{
                      borderColor: 'var(--color-accent)',
                      backgroundColor: 'white',
                      color: '#1F2937'
                    }}
                  />
                  <button
                    onClick={() => updateQuantity(currentIndex, 1)}
                    className="w-12 h-12 text-2xl font-bold rounded-lg"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notice */}
        <div className="px-4 py-3">
          <div className="p-4 border-2 border-yellow-400 rounded-lg bg-yellow-50">
            <ul className="space-y-2 text-xs">
              <li>• Single cards are drawn from booster packs or purchased from others.</li>
              <li>• If the ordered card is unavailable, we'll contact you as fast as we can.</li>
              <li className="text-red-600 font-semibold">• Cancellation or Exchange are unavailable.</li>
              <li className="text-red-600 font-semibold">• If you order more than 100 cards, we need 2~3 days to prepare the order.</li>
            </ul>
          </div>
        </div>

        {/* Sticky Add to Cart Bar */}
        {currentItem && currentItem.quantityForSale > 0 && (
          <div 
            className="fixed bottom-16 left-0 right-0 p-4 border-t shadow-lg z-20"
            style={{ 
              backgroundColor: 'var(--color-panel)',
              borderTopColor: 'var(--color-border)'
            }}
          >
            <button
              onClick={() => handleAddToCart(currentIndex)}
              disabled={addingToCart === currentIndex}
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              {addingToCart === currentIndex ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout (existing code)
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <Link 
          to="/catalog" 
          className="inline-flex items-center gap-2 mb-6 font-bold py-3 px-6 rounded-lg text-base hover:opacity-90 shadow-md transition-all" 
          style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Catalog
        </Link>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8">
          {/* Left Column - Card Image and Info */}
          <div>
            {/* Card Image with Yellow Border - Desktop */}
            <div className="mb-6">
              <div
                className="border-4 border-yellow-400 rounded-xl shadow-lg overflow-hidden"
                style={{ transition: 'transform 0.22s ease-in-out', transform: isFlipping ? 'scaleX(0)' : 'scaleX(1)' }}
              >
                {card.imageUrl ? (
                  <img src={displayUrl} alt={card.name} className="w-full block" />
                ) : (
                  <div className="aspect-[5/7] bg-gray-200 flex items-center justify-center">
                    <svg className="w-32 h-32 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {isDfc && (
                <button
                  onClick={handleFlip}
                  disabled={isFlipping}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm shadow"
                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '2px solid var(--color-border)' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  {showFront ? 'Turn Over — See Back Face' : 'Turn Over — See Front Face'}
                </button>
              )}
            </div>

            {/* Card Info Table */}
            <div className="border-2 border-yellow-400 rounded-xl overflow-hidden shadow-md">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-yellow-200">
                    <td className="font-bold py-3 px-4 text-sm" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>Name</td>
                    <td className="py-3 px-4 font-medium" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>{card.name}</td>
                  </tr>
                  <tr className="border-b border-yellow-200">
                    <td className="font-bold py-3 px-4 text-sm" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>Rarity</td>
                    <td className="py-3 px-4 capitalize font-medium" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>{card.rarity}</td>
                  </tr>
                  <tr className="border-b border-yellow-200">
                    <td className="font-bold py-3 px-4 text-sm" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>Type</td>
                    <td className="py-3 px-4 font-medium" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>{card.typeLine || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-yellow-200">
                    <td className="font-bold py-3 px-4 text-sm" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>Cost</td>
                    <td className="py-3 px-4" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>
                      <ManaSymbols cost={card.manaCost || ''} />
                    </td>
                  </tr>
                  <tr className="border-b border-yellow-200">
                    <td className="font-bold py-3 px-4 text-sm" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>P/T</td>
                    <td className="py-3 px-4 font-medium" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>
                      {card.typeLine?.includes('Creature') ? (card.oracleText?.match(/\d+\/\d+/) || 'N/A') : 'N/A'}
                    </td>
                  </tr>
                  <tr className="border-b border-yellow-200">
                    <td className="font-bold py-3 px-4 text-sm" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>Edition</td>
                    <td className="py-3 px-4 font-medium" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>{card.setName}</td>
                  </tr>
                  <tr>
                    <td className="font-bold py-3 px-4 text-sm" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>Illust</td>
                    <td className="py-3 px-4 font-medium" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column - Inventory Tabs */}
          <div>
            {card.inventory && card.inventory.length > 0 ? (
              <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: 'var(--color-panel)' }}>
                {/* Tab Headers */}
                <div className="flex border-b-2" style={{ borderColor: 'var(--color-border)' }}>
                  {['NM', 'LP', 'P'].map((condition) => {
                    const hasInventory = card.inventory.some(item => item.condition === condition && item.finish === 'nonfoil');
                  return (
                    <button
                      key={condition}
                      onClick={() => setActiveTab(condition as 'NM' | 'LP' | 'P')}
                      disabled={!hasInventory}
                      className={`flex-1 py-4 px-6 font-bold text-lg transition-all ${
                        !hasInventory ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'
                      }`}
                      style={{ 
                        backgroundColor: activeTab === condition ? 'var(--color-accent)' : 'var(--color-panel)',
                        color: activeTab === condition ? 'white' : 'var(--color-text)',
                        borderBottom: activeTab === condition ? '3px solid var(--color-highlight)' : 'none'
                      }}
                    >
                      {condition === 'NM' ? 'Near Mint' : condition === 'LP' ? 'Lightly Played' : 'Played'}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="p-4 md:p-6" style={{ backgroundColor: 'var(--color-panel)' }}>
                {(() => {
                  // Aggregate inventory by finish type
                  const nonfoilItems = card.inventory.filter(item => item.condition === activeTab && item.finish === 'nonfoil');
                  const foilItems = card.inventory.filter(item => item.condition === activeTab && item.finish === 'foil');
                  
                  const nonfoilItem = nonfoilItems.length > 0 ? {
                    ...nonfoilItems[0],
                    quantityForSale: nonfoilItems.reduce((sum, item) => sum + item.quantityForSale, 0),
                    sellPrice: nonfoilItems.find(i => i.quantityForSale > 0)?.sellPrice || nonfoilItems[0].sellPrice || (calculatedPrices?.nonfoil || 0),
                    sellerName: nonfoilItems.length > 1 ? `Multiple sellers (${nonfoilItems.length})` : nonfoilItems[0].sellerName
                  } : null;
                  
                  const foilItem = foilItems.length > 0 ? {
                    ...foilItems[0],
                    quantityForSale: foilItems.reduce((sum, item) => sum + item.quantityForSale, 0),
                    sellPrice: foilItems.find(i => i.quantityForSale > 0)?.sellPrice || foilItems[0].sellPrice || (calculatedPrices?.foil || 0),
                    sellerName: foilItems.length > 1 ? `Multiple sellers (${foilItems.length})` : foilItems[0].sellerName
                  } : (calculatedPrices?.foil ? {
                    condition: activeTab,
                    finish: 'foil' as const,
                    quantityOwned: 0,
                    quantityForSale: 0,
                    buyPrice: 0,
                    sellPrice: calculatedPrices.foil,
                    sellerName: undefined
                  } : null);
                  
                  // Find first item with stock for each finish type
                  const nonfoilWithStock = nonfoilItems.find(i => i.quantityForSale > 0) || nonfoilItems[0];
                  const nonfoilIndex = nonfoilWithStock
                    ? card.inventory.findIndex(item => 
                        item.condition === activeTab && 
                        item.finish === 'nonfoil' && 
                        item.sellerId === nonfoilWithStock.sellerId &&
                        item.sellPrice === nonfoilWithStock.sellPrice &&
                        item.quantityForSale === nonfoilWithStock.quantityForSale
                      )
                    : -1;
                  
                  const foilWithStock = foilItems.find(i => i.quantityForSale > 0) || foilItems[0];
                  const foilIndex = foilWithStock
                    ? card.inventory.findIndex(item => 
                        item.condition === activeTab && 
                        item.finish === 'foil' && 
                        item.sellerId === foilWithStock.sellerId &&
                        item.sellPrice === foilWithStock.sellPrice &&
                        item.quantityForSale === foilWithStock.quantityForSale
                      )
                    : -1;

                  if (!nonfoilItem && !foilItem) {
                    return (
                      <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                        <p className="text-lg font-semibold">No inventory available for {getConditionLabel(activeTab)}</p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                            <th className="py-4 px-6 text-center text-base font-bold border-r border-white/30">Quality</th>
                            <th className="py-4 px-6 text-center text-base font-bold border-r border-white/30">Price</th>
                            <th className="py-4 px-6 text-center text-base font-bold border-r border-white/30">Stock</th>
                            <th className="py-4 px-6 text-center text-base font-bold border-r border-white/30">Quantity</th>
                            <th className="py-4 px-6 text-center text-base font-bold">Add to Cart</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nonfoilItem && (
                            <tr className="border-b" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                              <td className="py-4 px-6 text-center text-base font-semibold border-r" style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
                                {getConditionLabel(activeTab)} (Non Foil)
                              </td>
                              <td className="py-4 px-6 text-center text-base font-bold border-r" style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
                                Rp. {formatPrice(nonfoilItem.sellPrice)}
                              </td>
                              <td className="py-4 px-6 text-center border-r" style={{ borderColor: 'var(--color-border)' }}>
                                <span className={nonfoilItem.quantityForSale > 0 ? 'text-emerald-500 font-bold text-lg' : 'text-red-600 font-semibold text-lg'}>
                                  {nonfoilItem.quantityForSale}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center border-r" style={{ borderColor: 'var(--color-border)' }}>
                                <div className="flex items-center justify-center gap-3">
                                  <button 
                                    onClick={() => updateQuantity(nonfoilIndex, -1)}
                                    className="w-10 h-10 text-lg font-bold rounded-lg hover:opacity-90 shadow-sm transition-all" 
                                    style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                                  >
                                    −
                                  </button>
                                  <input 
                                    type="number" 
                                    value={quantities[nonfoilIndex] || 1}
                                    onChange={(e) => handleQuantityChange(nonfoilIndex, e.target.value)}
                                    min="1"
                                    max={nonfoilItem.quantityForSale}
                                    className="w-20 text-base text-center border-2 rounded-lg py-2 font-semibold"
                                    style={{ 
                                      borderColor: 'var(--color-accent)',
                                      backgroundColor: 'white',
                                      color: '#1F2937'
                                    }}
                                  />
                                  <button 
                                    onClick={() => updateQuantity(nonfoilIndex, 1)}
                                    className="w-10 h-10 text-lg font-bold rounded-lg hover:opacity-90 shadow-sm transition-all" 
                                    style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <button
                                  onClick={() => handleAddToCart(nonfoilIndex)}
                                  disabled={nonfoilItem.quantityForSale === 0 || addingToCart === nonfoilIndex}
                                  className="font-bold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto text-base hover:opacity-90 shadow-md transition-all"
                                  style={{ backgroundColor: '#10b981', color: 'white' }}
                                >
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          )}
                          {foilItem && (
                            <tr className="border-b" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                              <td className="py-4 px-6 text-center text-base font-semibold border-r" style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
                                {getConditionLabel(activeTab)} (Foil)
                              </td>
                              <td className="py-4 px-6 text-center text-base font-bold border-r" style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
                                Rp. {formatPrice(foilItem.sellPrice)}
                              </td>
                              <td className="py-4 px-6 text-center border-r" style={{ borderColor: 'var(--color-border)' }}>
                                <span className={foilItem.quantityForSale > 0 ? 'text-emerald-500 font-bold text-lg' : 'text-red-600 font-semibold text-lg'}>
                                  {foilItem.quantityForSale}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center border-r" style={{ borderColor: 'var(--color-border)' }}>
                                <div className="flex items-center justify-center gap-3">
                                  <button 
                                    onClick={() => updateQuantity(foilIndex, -1)}
                                    className="w-10 h-10 text-lg font-bold rounded-lg hover:opacity-90 shadow-sm transition-all" 
                                    style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                                  >
                                    −
                                  </button>
                                  <input 
                                    type="number" 
                                    value={quantities[foilIndex] || 1}
                                    onChange={(e) => handleQuantityChange(foilIndex, e.target.value)}
                                    min="1"
                                    max={foilItem.quantityForSale}
                                    className="w-20 text-base text-center border-2 rounded-lg py-2 font-semibold"
                                    style={{ 
                                      borderColor: 'var(--color-accent)',
                                      backgroundColor: 'white',
                                      color: '#1F2937'
                                    }}
                                  />
                                  <button 
                                    onClick={() => updateQuantity(foilIndex, 1)}
                                    className="w-10 h-10 text-lg font-bold rounded-lg hover:opacity-90 shadow-sm transition-all" 
                                    style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <button
                                  onClick={() => handleAddToCart(foilIndex)}
                                  disabled={foilItem.quantityForSale === 0 || addingToCart === foilIndex}
                                  className="font-bold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto text-base hover:opacity-90 shadow-md transition-all"
                                  style={{ backgroundColor: '#10b981', color: 'white' }}
                                >
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
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
          <div className="mt-6 p-5 border-2 border-yellow-400 rounded-xl shadow-md" style={{ backgroundColor: 'rgba(254, 243, 199, 0.5)' }}>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span style={{ color: 'var(--color-text)' }}>Single cards are drawn from booster packs or purchased from others.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span style={{ color: 'var(--color-text)' }}>If the ordered card is unavailable, we'll contact you as fast as we can.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5 font-bold">•</span>
                <span className="text-red-600 font-semibold">Cancellation or Exchange are unavailable.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5 font-bold">•</span>
                <span className="text-red-600 font-semibold">If you order more than 100 cards, we need 2–3 days to prepare the order.</span>
              </li>
            </ul>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailPage;
