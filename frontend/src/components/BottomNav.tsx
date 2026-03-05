import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { cartCount } = useCart();

  const navItems = [
    { path: '/', icon: 'home', label: 'Home' },
    { path: '/catalog', icon: 'search', label: 'Browse' },
    { path: '/cafe', icon: 'cafe', label: 'Café' },
    { path: '/cart', icon: 'cart', label: 'Cart', badge: cartCount },
    { path: '/profile', icon: 'user', label: 'Profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getIcon = (icon: string, active: boolean) => {
    const strokeWidth = active ? 2.5 : 2;

    switch (icon) {
      case 'home':
        return (
          <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'search':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'cart':
        return (
          <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'cafe':
        return (
          <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4H7v-4H5a2 2 0 01-2-2v-6a2 2 0 012-2h2V4a1 1 0 011-1h8a1 1 0 011 1v4z" />
          </svg>
        );
      case 'user':
        return (
          <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg md:hidden"
      style={{ 
        backgroundColor: 'var(--color-panel)',
        borderTopColor: 'var(--color-border)'
      }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full relative transition-all"
              style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
            >
              <div className="relative">
                {getIcon(item.icon, active)}
                {item.badge !== undefined && item.badge > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-xs font-bold px-1"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
              {active && (
                <div 
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 rounded-full"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
