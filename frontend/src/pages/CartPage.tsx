import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { Cart } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from '../utils/toast';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Format price with thousands separator
  const formatPrice = (price: number): string => {
    return price.toLocaleString('id-ID');
  };

  useEffect(() => {
    if (!user) {
      navigate('/register');
      return;
    }
    loadCart();
  }, [user, navigate]);

  const loadCart = async () => {
    try {
      const data = await cartApi.getCart();
      setCart(data.cart);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setUpdating(itemId);
    try {
      const data = await cartApi.updateCartItem(itemId, quantity);
      setCart(data.cart);
      await refreshCart(); // Update cart count in navbar
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to update quantity';
      toast.error(errorMsg);
      loadCart(); // Reload to reset to actual quantity
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remove this item from cart?')) return;

    setUpdating(itemId);
    try {
      const data = await cartApi.removeFromCart(itemId);
      setCart(data.cart);
      await refreshCart(); // Update cart count in navbar
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Clear entire cart?')) return;

    try {
      const data = await cartApi.clearCart();
      setCart(data.cart);
      await refreshCart(); // Update cart count in navbar
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-4" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
          <div className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>Loading cart...</div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="rounded-2xl shadow-xl p-12 text-center" style={{ backgroundColor: 'var(--color-panel)' }}>
            <svg className="w-24 h-24 mx-auto mb-6" style={{ color: 'var(--color-border)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Your Cart is Empty</h1>
            <p className="mb-8 text-lg" style={{ color: 'var(--color-text-secondary)' }}>Start building your collection by adding some cards</p>
            <Link to="/catalog" className="inline-flex items-center px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105" style={{ background: `linear-gradient(to right, var(--color-accent), var(--color-highlight))`, color: 'var(--color-panel)' }}>
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Cards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total price with fallback to current inventory price if stored price is 0
  const totalPrice = cart.items.reduce((sum, item) => {
    const inventoryItem = item.card.inventory[item.inventoryIndex];
    let currentPrice = item.price || inventoryItem?.sellPrice || 0;
    
    // If price is still 0, search for matching condition/finish with stock
    if (currentPrice === 0 && inventoryItem) {
      const matchingWithPrice = item.card.inventory.find(inv => 
        inv.condition === inventoryItem.condition &&
        inv.finish === inventoryItem.finish &&
        inv.sellPrice > 0 &&
        inv.quantityForSale > 0
      );
      if (matchingWithPrice) {
        currentPrice = matchingWithPrice.sellPrice;
      }
    }
    
    return sum + currentPrice * item.quantity;
  }, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Shopping Cart</h1>
            <p className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
              {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <button 
            onClick={handleClearCart} 
            className="px-4 py-2 rounded-lg text-sm font-semibold border-2 hover:opacity-80 transition-all self-start sm:self-auto"
            style={{ borderColor: 'var(--color-text-secondary)', color: 'var(--color-text)' }}
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => {
              const inventoryItem = item.card.inventory[item.inventoryIndex];
              
              // Find the best price: stored price > current inventory price > any matching inventory with stock > 0
              let currentPrice = item.price || inventoryItem?.sellPrice || 0;
              
              // If price is still 0, search for matching condition/finish with stock
              if (currentPrice === 0 && inventoryItem) {
                const matchingWithPrice = item.card.inventory.find(inv => 
                  inv.condition === inventoryItem.condition &&
                  inv.finish === inventoryItem.finish &&
                  inv.sellPrice > 0 &&
                  inv.quantityForSale > 0
                );
                if (matchingWithPrice) {
                  currentPrice = matchingWithPrice.sellPrice;
                }
              }
              
              return (
                <div 
                  key={item._id} 
                  className="rounded-xl shadow-lg p-4 md:p-6 border hover:shadow-xl transition-all"
                  style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-text-secondary)' }}
                >
                  <div className="flex gap-4">
                    {/* Card Image */}
                    <Link to={`/cards/${item.card._id}`} className="flex-shrink-0 group">
                      <div className="w-20 h-28 md:w-28 md:h-40 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow" style={{ backgroundColor: 'var(--color-background)' }}>
                        {item.card.imageUrl ? (
                          <img src={item.card.imageUrl} alt={item.card.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8 md:w-12 md:h-12" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Card Info */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <Link to={`/cards/${item.card._id}`} className="font-bold text-base md:text-xl hover:opacity-80 transition-opacity mb-1" style={{ color: 'var(--color-text)' }}>
                        {item.card.name}
                      </Link>
                      <p className="text-xs md:text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                        {item.card.setName} • #{item.card.collectorNumber}
                      </p>
                      
                      <div className="flex gap-2 mb-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>
                          {inventoryItem?.condition || 'N/A'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize" style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-panel)' }}>
                          {inventoryItem?.finish || 'N/A'}
                        </span>
                      </div>

                      <div className="mt-auto grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium mr-2" style={{ color: 'var(--color-text-secondary)' }}>Qty:</span>
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updating === item._id}
                            className="w-9 h-9 rounded-lg font-bold shadow hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                          >
                            −
                          </button>
                          <span className="w-12 text-center text-lg font-bold" style={{ color: 'var(--color-text)' }}>{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                            disabled={updating === item._id}
                            className="w-9 h-9 rounded-lg font-bold shadow hover:shadow-md disabled:opacity-40 transition-all"
                            style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-left sm:text-center">
                          <div className="text-xs md:text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Rp. {formatPrice(currentPrice)} × {item.quantity}</div>
                          <div className="font-bold text-lg md:text-xl" style={{ color: 'var(--color-accent)' }}>Rp. {formatPrice(currentPrice * item.quantity)}</div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          disabled={updating === item._id}
                          className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-80 disabled:opacity-40 transition-all flex items-center justify-center gap-2 sm:ml-auto"
                          style={{ backgroundColor: '#EF4444', color: 'white' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-xl shadow-xl p-6 border lg:sticky lg:top-4" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-text-secondary)' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'var(--color-text-secondary)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Subtotal ({cart.items.length} items)</span>
                  <span className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>Rp. {formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'var(--color-text-secondary)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Shipping</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Calculated at checkout</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'var(--color-text-secondary)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Tax</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Included</span>
                </div>
              </div>

              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Total</span>
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>Rp. {formatPrice(totalPrice)}</span>
                </div>
              </div>

              <button className="w-full py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] mb-4" style={{ background: `linear-gradient(to right, var(--color-accent), var(--color-highlight))`, color: 'var(--color-panel)' }}>
                <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Proceed to Checkout
              </button>
              
              <Link to="/catalog" className="block text-center font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--color-accent)' }}>
                <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
