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
    if (isAuthenticated) {
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
    <nav style={{ backgroundColor: 'var(--color-panel)' }} className="shadow-md">
      {/* Top Bar - Logo, Search, User Actions */}
      <div style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-3 md:h-20 gap-3 md:gap-0">
            {/* Logo and Icons Row (Mobile) */}
            <div className="flex justify-between items-center">
              <Link to="/" className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                Boardgame Time
              </Link>
              
              {/* Mobile Icons */}
              <div className="flex items-center gap-3 md:hidden">
                {isAuthenticated && (
                  <>
                    <Link to="/profile" style={{ color: 'var(--color-text)' }} className="hover:opacity-80">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </Link>
                    <Link to="/cart" className="relative hover:opacity-80" style={{ color: 'var(--color-text)' }}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-panel)' }}>
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 md:max-w-2xl md:mx-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for singles..."
                  className="w-full px-3 py-2 md:px-4 md:py-3 pr-10 md:pr-12 rounded-lg text-sm md:text-base focus:outline-none focus:ring-2"
                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-accent)' }}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-md hover:opacity-80"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* User Actions - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" style={{ color: 'var(--color-text)' }} className="hover:opacity-80">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                  <Link to="/cart" className="relative hover:opacity-80" style={{ color: 'var(--color-text)' }}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-panel)' }}>
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-sm hidden lg:inline" style={{ color: 'var(--color-text-secondary)' }}>{user?.email}</span>
                    <button onClick={handleLogout} className="px-3 md:px-4 py-1.5 md:py-2 rounded-md text-sm font-medium hover:opacity-80" style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-panel)' }}>
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="font-medium text-sm md:text-base hover:opacity-80" style={{ color: 'var(--color-text)' }}>
                    Log in
                  </Link>
                  <Link to="/register" className="px-3 md:px-4 py-1.5 md:py-2 rounded-md font-medium hover:opacity-80 text-sm md:text-base" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Auth Actions */}
            {!isAuthenticated && (
              <div className="flex md:hidden items-center gap-2">
                <Link to="/login" className="font-medium text-sm hover:opacity-80" style={{ color: 'var(--color-text)' }}>
                  Log in
                </Link>
                <Link to="/register" className="px-3 py-1.5 rounded-md font-medium hover:opacity-80 text-sm" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}>
                  Sign Up
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <div className="flex md:hidden">
                <button onClick={handleLogout} className="px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-80" style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-panel)' }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="border-b overflow-x-auto" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-accent)' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 md:gap-8 h-12 md:h-14 whitespace-nowrap">
            <Link to="/" className="font-medium text-sm md:text-base hover:opacity-80" style={{ color: 'var(--color-text-secondary)' }}>
              HOME
            </Link>
            <Link to="/catalog" className="font-medium text-sm md:text-base hover:opacity-80" style={{ color: 'var(--color-text-secondary)' }}>
              MTG SINGLES
            </Link>
            <Link to="/catalog?tags=Borderless" className="font-medium text-sm md:text-base hover:opacity-80" style={{ color: 'var(--color-text-secondary)' }}>
              SPECIAL PRODUCT
            </Link>
            <Link to="/cafe" className="font-medium text-sm md:text-base hover:opacity-80 flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              <span>🎲</span> BOARDGAME CAFÉ
            </Link>
            <Link to="/catalog" className="font-medium text-sm md:text-base hover:opacity-80" style={{ color: 'var(--color-text-secondary)' }}>
              PICK UP IN STORE
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="font-bold text-sm md:text-base ml-auto hover:opacity-80" style={{ color: 'var(--color-accent)' }}>
                ADMIN DASHBOARD
              </Link>
            )}
            {user?.role === 'seller' && (
              <Link to="/seller/dashboard" className="font-bold text-sm md:text-base ml-auto hover:opacity-80" style={{ color: 'var(--color-highlight)' }}>
                SELLER DASHBOARD
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
