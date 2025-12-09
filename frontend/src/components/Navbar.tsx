import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount, refreshCart } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      refreshCart();
    }
  }, [isAuthenticated, user, refreshCart]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="bg-white shadow-md">
      {/* Top Bar - Logo, Search, User Actions */}
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="text-3xl font-bold text-white">
              MTG Store
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for singles..."
                  className="w-full px-4 py-3 pr-12 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 text-white p-2 rounded-md hover:bg-primary-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* User Actions */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {user?.role === 'customer' && (
                    <>
                      <Link to="/profile" className="text-white hover:text-primary-400">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </Link>
                      <Link to="/cart" className="relative text-white hover:text-primary-400">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {cartCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {cartCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-300">{user?.email}</span>
                    <button onClick={handleLogout} className="bg-white text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100">
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-white hover:text-primary-400 font-medium">
                    Log in
                  </Link>
                  <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-8 h-14">
            <Link to="/" className="text-gray-700 hover:text-primary-600 font-medium">
              HOME
            </Link>
            <Link to="/catalog" className="text-gray-700 hover:text-primary-600 font-medium">
              MAGIC: THE GATHERING PRODUCT
            </Link>
            <Link to="/accessories" className="text-gray-700 hover:text-primary-600 font-medium">
              ACCESSORIES
            </Link>
            <Link to="/events" className="text-gray-700 hover:text-primary-600 font-medium">
              EVENT
            </Link>
            <Link to="/sell" className="text-gray-700 hover:text-primary-600 font-medium">
              SELL US YOUR CARDS
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="text-primary-600 hover:text-primary-700 font-bold ml-auto">
                ADMIN DASHBOARD
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
