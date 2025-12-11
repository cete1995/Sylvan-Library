import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cart';
import { Cart } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

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
      alert(error.response?.data?.error || 'Failed to update quantity');
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
    } catch (error) {
      alert('Failed to remove item');
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
    } catch (error) {
      alert('Failed to clear cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-600">Loading cart...</div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h1 className="text-4xl font-bold mb-4 text-gray-800">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8 text-lg">Start building your collection by adding some cards</p>
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

  const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold">Shopping Cart</h1>
        <button onClick={handleClearCart} className="btn-secondary text-xs md:text-sm">
          Clear Cart
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4">
          {cart.items.map((item) => {
            const inventoryItem = item.card.inventory[item.inventoryIndex];
            return (
              <div key={item._id} className="bg-white rounded-lg shadow p-3 md:p-4">
                <div className="flex gap-2 md:gap-4">
                  {/* Card Image */}
                  <Link to={`/cards/${item.card._id}`} className="flex-shrink-0">
                    <div className="w-16 h-24 md:w-24 md:h-32 bg-gray-200 rounded overflow-hidden">
                      {item.card.imageUrl ? (
                        <img src={item.card.imageUrl} alt={item.card.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Card Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/cards/${item.card._id}`} className="font-bold text-sm md:text-lg hover:text-primary-600 block truncate">
                      {item.card.name}
                    </Link>
                    <p className="text-xs md:text-sm text-gray-600 truncate">{item.card.setName} • {item.card.collectorNumber}</p>
                    <div className="mt-1 md:mt-2 flex gap-1 md:gap-2">
                      <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-gray-100 rounded text-xs font-medium">{inventoryItem?.condition || 'N/A'}</span>
                      <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-gray-100 rounded text-xs capitalize">{inventoryItem?.finish || 'N/A'}</span>
                    </div>

                    <div className="mt-2 md:mt-4 flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 md:gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updating === item._id}
                          className="w-7 h-7 md:w-8 md:h-8 text-xs md:text-base rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="w-10 md:w-12 text-center text-sm md:text-base font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                          disabled={updating === item._id}
                          className="w-7 h-7 md:w-8 md:h-8 text-xs md:text-base rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="flex-1 text-left sm:text-right">
                        <div className="text-xs md:text-sm text-gray-600">Rp. {formatPrice(item.price)} each</div>
                        <div className="font-bold text-base md:text-lg text-primary-600">Rp. {formatPrice(item.price * item.quantity)}</div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        disabled={updating === item._id}
                        className="text-red-600 hover:text-red-800 text-xs md:text-sm disabled:opacity-50 text-left sm:text-center"
                      >
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
          <div className="bg-white rounded-lg shadow p-4 md:p-6 lg:sticky lg:top-4">
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Order Summary</h2>
            
            <div className="space-y-2 mb-3 md:mb-4">
              <div className="flex justify-between text-sm md:text-base">
                <span>Items ({cart.items.length})</span>
                <span>Rp. {formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-xs md:text-sm text-gray-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t pt-3 md:pt-4 mb-4 md:mb-6">
              <div className="flex justify-between text-lg md:text-xl font-bold">
                <span>Total</span>
                <span className="text-primary-600">Rp. {formatPrice(totalPrice)}</span>
              </div>
            </div>

            <button className="w-full btn-primary mb-2 md:mb-3 text-sm md:text-base">
              Proceed to Checkout
            </button>
            <Link to="/catalog" className="block text-center text-primary-600 hover:underline text-sm md:text-base">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
