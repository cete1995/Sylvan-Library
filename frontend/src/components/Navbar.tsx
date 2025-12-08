import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount, refreshCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      refreshCart();
    }
  }, [isAuthenticated, user, refreshCart]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            MTG Inventory
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/catalog" className="text-gray-700 hover:text-primary-600 font-medium">
              Browse Cards
            </Link>

            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" className="text-gray-700 hover:text-primary-600 font-medium">
                    Dashboard
                  </Link>
                )}
                {user?.role === 'customer' && (
                  <Link to="/cart" className="relative text-gray-700 hover:text-primary-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{user?.email}</span>
                  <button onClick={handleLogout} className="btn-secondary text-sm">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600 font-medium">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
