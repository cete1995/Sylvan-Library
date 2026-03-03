import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Carousel from '../components/Carousel';
import FeaturedSection from '../components/FeaturedSection';
import { carouselApi } from '../api/carousel';
import { useAuth } from '../contexts/AuthContext';

const features = [
  {
    gradient: 'from-emerald-400 to-teal-600',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    ),
    title: 'Graded & Authentic',
    desc: 'Every single is manually inspected and accurately graded — NM, LP, or Played — before listing. 100% authentic guaranteed.',
  },
  {
    gradient: 'from-blue-400 to-indigo-600',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
    ),
    title: 'Powerful Search',
    desc: 'Filter by set, rarity, condition, finish, and price. Find exactly what your deck needs in seconds.',
  },
  {
    gradient: 'from-purple-400 to-pink-600',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    title: 'Fair Pricing',
    desc: 'Transparent, competitive prices based on real market data. Great value from commons to mythic rares.',
  },
];

const trustBadges = [
  { icon: '🃏', value: '10,000+', label: 'Singles In Stock' },
  { icon: '✅', value: '100%', label: 'Authentic Cards' },
  { icon: '📦', value: 'Secure', label: 'Safe Packaging' },
  { icon: '💬', value: 'Friendly', label: 'Customer Service' },
];

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [carouselImages, setCarouselImages] = useState<{ imageUrl: string; altText?: string }[]>([]);

  useEffect(() => {
    carouselApi.getImages().then(setCarouselImages).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* Carousel */}
      {carouselImages.length > 0 && (
        <Carousel images={carouselImages} autoPlay={true} interval={5000} />
      )}

      {/* Featured */}
      <FeaturedSection />

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2744 0%, #1a3a2a 50%, #0d1b4b 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full opacity-[0.08]" style={{ backgroundColor: '#7c3aed' }} />
        <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full opacity-[0.08]" style={{ backgroundColor: '#0891b2' }} />

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center text-white">

            {/* Pill badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Indonesia's Premier MTG Singles Store
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              Welcome to{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(to right, #34d399, #60a5fa)' }}
              >
                Sylvan Library
              </span>
            </h1>

            <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto" style={{ color: '#bfdbfe' }}>
              Thousands of carefully graded Magic: The Gathering singles — from budget staples to top-tier mythics, ready to complete your deck.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/catalog"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                style={{ backgroundColor: '#34d399', color: '#064e3b' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Cards
              </Link>

              {isAuthenticated ? (
                <Link
                  to="/orders"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:bg-white/10"
                  style={{ border: '2px solid rgba(255,255,255,0.35)', color: 'white' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  My Orders
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:bg-white/10"
                  style={{ border: '2px solid rgba(255,255,255,0.35)', color: 'white' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Account
                </Link>
              )}
            </div>

            {isAuthenticated && (
              <p className="mt-5 text-sm" style={{ color: '#bfdbfe' }}>
                Welcome back,{' '}
                <span className="font-semibold text-white">{user?.name || user?.email}</span>! 👋
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section className="border-y" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {trustBadges.map(({ icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <span className="text-3xl">{icon}</span>
                <span className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>{value}</span>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Sylvan Library ── */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            Why Sylvan Library?
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            Everything you need to grow your collection with confidence.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ gradient, icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl shadow-lg p-7 flex flex-col items-center text-center hover:shadow-xl transition-all hover:-translate-y-1"
              style={{ backgroundColor: 'var(--color-panel)' }}
            >
              <div className={`bg-gradient-to-br ${gradient} w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-md`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section
        className="py-16 md:py-20"
        style={{ background: 'linear-gradient(to right, var(--color-accent), var(--color-highlight))' }}
      >
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--color-panel)' }}>
            Ready to Build Your Perfect Deck?
          </h2>
          <p className="text-base mb-8" style={{ color: 'var(--color-panel)', opacity: 0.85 }}>
            Browse our full collection and add your favourite singles to cart today.
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-accent)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            View All Cards
          </Link>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
