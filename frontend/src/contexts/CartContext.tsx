import React, { createContext, useContext, useState, useCallback } from 'react';
import { cartApi } from '../api/cart';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartCount: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated, user } = useAuth();

  const refreshCart = useCallback(async () => {
    if (isAuthenticated && user?.role === 'customer') {
      try {
        const data = await cartApi.getCart();
        const count = data.cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartCount(count);
      } catch (error) {
        console.error('Failed to load cart count:', error);
        setCartCount(0);
      }
    } else {
      setCartCount(0);
    }
  }, [isAuthenticated, user]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
