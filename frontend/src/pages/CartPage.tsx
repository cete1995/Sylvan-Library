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
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="text-xl">Loading cart...</div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Shopping Cart</h1>
        <p className="text-gray-600 mb-8">Your cart is empty</p>
        <Link to="/catalog" className="btn-primary">
          Browse Cards
        </Link>
      </div>
    );
  }

  const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Shopping Cart</h1>
        <button onClick={handleClearCart} className="btn-secondary text-sm">
          Clear Cart
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const inventoryItem = item.card.inventory[item.inventoryIndex];
            return (
              <div key={item._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex gap-4">
                  {/* Card Image */}
                  <Link to={`/cards/${item.card._id}`} className="flex-shrink-0">
                    <div className="w-24 h-32 bg-gray-200 rounded overflow-hidden">
                      {item.card.imageUrl ? (
                        <img src={item.card.imageUrl} alt={item.card.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Card Info */}
                  <div className="flex-1">
                    <Link to={`/cards/${item.card._id}`} className="font-bold text-lg hover:text-primary-600">
                      {item.card.name}
                    </Link>
                    <p className="text-sm text-gray-600">{item.card.setName} • {item.card.collectorNumber}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{inventoryItem?.condition || 'N/A'}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">{inventoryItem?.finish || 'N/A'}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updating === item._id}
                          className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                          disabled={updating === item._id}
                          className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="flex-1 text-right">
                        <div className="text-sm text-gray-600">Rp. {formatPrice(item.price)} each</div>
                        <div className="font-bold text-lg text-primary-600">Rp. {formatPrice(item.price * item.quantity)}</div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        disabled={updating === item._id}
                        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
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
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Items ({cart.items.length})</span>
                <span>Rp. {formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary-600">Rp. {formatPrice(totalPrice)}</span>
              </div>
            </div>

            <button className="w-full btn-primary mb-3">
              Proceed to Checkout
            </button>
            <Link to="/catalog" className="block text-center text-primary-600 hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
