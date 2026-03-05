import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Carousel from '../components/Carousel';
import FeaturedSection from '../components/FeaturedSection';
import { carouselApi } from '../api/carousel';
import { useAuth } from '../contexts/AuthContext';

const cafeFeatures = [
  {
    gradient: 'from-emerald-400 to-green-600',
    emoji: '🎲',
    title: '100+ Board Games',
    desc: 'From quick party games to deep strategy titles — there\'s something for every group and every mood.',
  },
  {
    gradient: 'from-yellow-400 to-amber-500',
    emoji: '🀄',
    title: 'Mahjong Tables',
    desc: 'Dedicated Mahjong tables always ready. Bring your friends and enjoy a proper session in a comfortable space.',
  },
  {
    gradient: 'from-sky-400 to-blue-600',
    emoji: '🙌',
    title: 'Flat Entry Fee',
    desc: 'No hourly charges, no surprises. Pay once and play all day — games, tables, and community included.',
  },
  {
    gradient: 'from-purple-400 to-violet-600',
    emoji: '🃏',
    title: 'MTG-Friendly Space',
    desc: 'Drafts, Commander nights, or just sleeving up your new singles. MTG players are always welcome here.',
  },
  {
    gradient: 'from-rose-400 to-pink-600',
    emoji: '👥',
    title: 'Community Hub',
    desc: 'Meet fellow hobbyists, join game nights, and be part of a growing local community that shares your passion.',
  },
  {
    gradient: 'from-teal-400 to-cyan-600',
    emoji: '📦',
    title: 'MTG Singles On-Site',
    desc: 'Browse and buy thousands of Magic: The Gathering singles right here at the café. Build your deck the same day.',
  },
];

const statsBar = [
  { emoji: '🎲', value: '100+', label: 'Board Games' },
  { emoji: '🀄', value: '4+', label: 'Mahjong Tables' },
  { emoji: '🃏', value: '10,000+', label: 'MTG Singles' },
  { emoji: '💸', value: 'Flat Fee', label: 'No Hourly Charge' },
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

      {/* ── Hero — Café First ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d2818 0%, #1a3d1a 40%, #14391f 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] rounded-full opacity-[0.08]" style={{ backgroundColor: '#86efac' }} />
        <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full opacity-[0.08]" style={{ backgroundColor: '#fbbf24' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] rounded-full opacity-[0.03]" style={{ backgroundColor: '#fff' }} />

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center text-white">

            {/* Pill badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)' }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#86efac' }} />
              Boardgame Café  ·  Mahjong  ·  MTG Singles
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              Your Local{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(to right, #86efac, #fbbf24)' }}
              >
                Hobby Hub
              </span>
            </h1>

            <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto" style={{ color: '#bbf7d0' }}>
              A cozy boardgame café with 100+ games and Mahjong tables — plus thousands of MTG singles available on-site.
              One flat entry fee. No hourly charge. Just good games and great company.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              {/* Primary: Café */}
              <Link
                to="/cafe"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                style={{ backgroundColor: '#16a34a', color: '#fff' }}
              >
                <span className="text-xl">🎲</span>
                Visit the Café
              </Link>

              {/* Secondary: Cards */}
              <Link
                to="/catalog"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)' }}
              >
                <span className="text-xl">🃏</span>
                Browse MTG Singles
              </Link>

              {isAuthenticated ? (
                <Link
                  to="/orders"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:bg-white/10"
                  style={{ border: '2px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.75)' }}
                >
                  My Orders
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:bg-white/10"
                  style={{ border: '2px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.75)' }}
                >
                  Create Account
                </Link>
              )}
            </div>

            {isAuthenticated && (
              <p className="mt-5 text-sm" style={{ color: '#bbf7d0' }}>
                Welcome back,{' '}
                <span className="font-semibold text-white">{user?.name || user?.email}</span>! 👋
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div style={{ backgroundColor: '#14532d', color: '#fff' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/20">
            {statsBar.map(({ emoji, value, label }) => (
              <div key={label} className="flex flex-col items-center justify-center py-4 px-2 gap-0.5">
                <span className="text-xl">{emoji}</span>
                <span className="font-extrabold text-lg leading-tight">{value}</span>
                <span className="text-xs font-medium opacity-75">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured */}
      <FeaturedSection />

      {/* ── Café Showcase ── */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ backgroundColor: 'var(--color-panel)', color: '#16a34a', border: '1px solid #16a34a40' }}>
            ★ Our Main Attraction
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: 'var(--color-text)' }}>
            The Boardgame Café Experience
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            Everything that makes Sylvan Library the go-to spot for hobby lovers in our community.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cafeFeatures.map(({ gradient, emoji, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl shadow-md p-7 flex flex-col hover:shadow-xl transition-all hover:-translate-y-1"
              style={{ backgroundColor: 'var(--color-panel)' }}
            >
              <div className={`bg-gradient-to-br ${gradient} w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md text-2xl`}>
                {emoji}
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>{title}</h3>
              <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--color-text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/cafe"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            style={{ backgroundColor: '#16a34a', color: '#fff' }}
          >
            <span className="text-xl">🎲</span>
            See Full Café Info & Hours
          </Link>
        </div>
      </section>

      {/* ── Two Pillars ── */}
      <section className="border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-panel)' }}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-6">

            {/* Café pillar — primary */}
            <Link
              to="/cafe"
              className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 block"
              style={{ background: 'linear-gradient(135deg, #0d2818 0%, #1a3d1a 60%, #1e4d20 100%)' }}
            >
              <div className="p-8 flex flex-col h-full min-h-[220px]">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-5xl">🎲</span>
                  <span className="mt-2 inline-flex px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: '#16a34a', color: '#fff' }}>Main</span>
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-2">Boardgame Café & Mahjong</h3>
                <p className="text-sm mb-6 flex-1" style={{ color: '#bbf7d0' }}>
                  100+ board games, dedicated Mahjong tables, and a welcoming space to hang out.
                  Flat entry fee — no hourly charges.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: '#fbbf24' }}>
                  View café details
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </span>
              </div>
            </Link>

            {/* MTG shop pillar — secondary */}
            <Link
              to="/catalog"
              className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 block"
              style={{ background: 'linear-gradient(135deg, #0f2744 0%, #1e3a5f 100%)' }}
            >
              <div className="p-8 flex flex-col h-full min-h-[220px]">
                <div className="text-5xl mb-4">🃏</div>
                <h3 className="text-2xl font-extrabold text-white mb-2">MTG Singles Store</h3>
                <p className="text-sm mb-6 flex-1" style={{ color: '#bfdbfe' }}>
                  Thousands of graded Magic: The Gathering singles — from commons to mythic rares,
                  always accurately priced and available on-site.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: '#34d399' }}>
                  Browse the catalog
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </span>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ── Bottom CTA — Café ── */}
      <section
        className="py-16 md:py-20"
        style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)' }}
      >
        <div className="container mx-auto px-4 text-center max-w-2xl">
          {/* Decorative */}
          <div className="text-6xl mb-4">🎲</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Come Hang Out at Sylvan Library
          </h2>
          <p className="text-base mb-8" style={{ color: '#bbf7d0' }}>
            Grab a seat, pick a game, and enjoy the company. Board games, Mahjong, and MTG — all under one roof.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/cafe"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-white"
              style={{ color: '#15803d' }}
            >
              See Café Info & Hours
            </Link>
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              🃏 Browse MTG Singles
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
