import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Carousel from '../components/Carousel';
import FeaturedSection from '../components/FeaturedSection';
import { carouselApi } from '../api/carousel';
import { useAuth } from '../contexts/AuthContext';

const offerings = [
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
    gradient: 'from-blue-500 to-indigo-700',
    emoji: '🎮',
    title: 'PS5 Rental',
    desc: 'Play the latest PlayStation 5 titles with your crew. Big screen, great sound, no console needed — just show up.',
  },
  {
    gradient: 'from-red-400 to-rose-600',
    emoji: '🕹️',
    title: 'Nintendo Switch Rental',
    desc: 'Mario Kart, Smash Bros, party games and more. Rent a Switch by the session and game with everyone.',
  },
  {
    gradient: 'from-sky-400 to-blue-600',
    emoji: '💸',
    title: 'Flat Entry Fee',
    desc: 'No hourly charges, no surprises. Pay once and enjoy board games, consoles, Mahjong, and more all day.',
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
  { emoji: '🎮', value: 'PS5', label: 'Console Rental' },
  { emoji: '🕹️', value: 'Switch', label: 'Console Rental' },
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
    <div className="min-h-screen pb-28 md:pb-0" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* Carousel */}
      {carouselImages.length > 0 && (
        <Carousel images={carouselImages} autoPlay={true} interval={5000} />
      )}

      {/* ── Hero — Café First ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1440 40%, #111e55 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] rounded-full opacity-[0.08]" style={{ backgroundColor: '#E31E24' }} />
        <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full opacity-[0.08]" style={{ backgroundColor: '#fbbf24' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] rounded-full opacity-[0.03]" style={{ backgroundColor: '#fff' }} />

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center text-white">

            {/* Pill badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)' }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#E31E24' }} />
              Boardgame Café  ·  Mahjong  ·  PS5 & Switch Rental  ·  MTG Singles
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              Your Local{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(to right, #E31E24, #fbbf24)' }}
              >
                Hobby Hub
              </span>
            </h1>

            <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto" style={{ color: '#fca5a5' }}>
              100+ board games, Mahjong tables, PS5 &amp; Nintendo Switch rentals, and thousands of MTG singles — all under one roof.
              One flat entry fee. No hourly charge. Just good times.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              {/* Primary: Café */}
              <Link
                to="/cafe"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                style={{ backgroundColor: '#E31E24', color: '#fff' }}
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
              <p className="mt-5 text-sm" style={{ color: '#fca5a5' }}>
                Welcome back,{' '}
                <span className="font-semibold text-white">{user?.name || user?.email}</span>! 👋
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div style={{ backgroundColor: '#0d1440', color: '#fff' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-white/20">
            {statsBar.map(({ emoji, value, label }) => (
              <div key={`${value}-${label}`} className="flex flex-col items-center justify-center py-4 px-2 gap-0.5">
                <span className="text-xl">{emoji}</span>
                <span className="font-extrabold text-base leading-tight">{value}</span>
                <span className="text-xs font-medium opacity-75 text-center">{label}</span>
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ backgroundColor: 'var(--color-panel)', color: '#E31E24', border: '1px solid #E31E2440' }}>
            ★ Our Main Attraction
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: 'var(--color-text)' }}>
            Everything We Offer
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            Board games, consoles, Mahjong, and MTG — Boardgame Time is your all-in-one hobby destination.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {offerings.map(({ gradient, emoji, title, desc }) => (
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
            style={{ backgroundColor: '#E31E24', color: '#fff' }}
          >
            <span className="text-xl">🎲</span>
            See Full Café Info & Hours
          </Link>
        </div>
      </section>

      {/* ── Four Pillars ── */}
      <section className="border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-panel)' }}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* Café — primary */}
            <Link
              to="/cafe"
              className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 block xl:col-span-1"
              style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1440 60%, #1B3A8A 100%)' }}
            >
              <div className="p-7 flex flex-col h-full min-h-[200px]">
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-4xl">🎲</span>
                  <span className="mt-1.5 inline-flex px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: '#E31E24', color: '#fff' }}>Main</span>
                </div>
                <h3 className="text-xl font-extrabold text-white mb-2">Boardgame Café & Mahjong</h3>
                <p className="text-sm mb-4 flex-1" style={{ color: '#fca5a5' }}>100+ board games, dedicated Mahjong tables. Flat entry fee.</p>
                <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: '#fbbf24' }}>
                  View details
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </span>
              </div>
            </Link>

            {/* PS5 Rental */}
            <Link
              to="/consoles"
              className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 block"
              style={{ background: 'linear-gradient(135deg, #0c1445 0%, #1e2d7d 100%)' }}
            >
              <div className="p-7 flex flex-col h-full min-h-[200px]">
                <div className="text-4xl mb-3">🎮</div>
                <h3 className="text-xl font-extrabold text-white mb-2">PS5 Rental</h3>
                <p className="text-sm mb-4 flex-1" style={{ color: '#bfdbfe' }}>Latest PlayStation 5 titles on a big screen. Just show up and play.</p>
                <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: '#60a5fa' }}>
                  See rental info
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </span>
              </div>
            </Link>

            {/* Nintendo Switch Rental */}
            <Link
              to="/consoles"
              className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 block"
              style={{ background: 'linear-gradient(135deg, #4a0505 0%, #b91c1c 100%)' }}
            >
              <div className="p-7 flex flex-col h-full min-h-[200px]">
                <div className="text-4xl mb-3">🕹️</div>
                <h3 className="text-xl font-extrabold text-white mb-2">Nintendo Switch Rental</h3>
                <p className="text-sm mb-4 flex-1" style={{ color: '#fecaca' }}>Mario Kart, Smash, party games and more — rent a Switch by the session.</p>
                <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: '#fca5a5' }}>
                  See rental info
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </span>
              </div>
            </Link>

            {/* MTG shop */}
            <Link
              to="/catalog"
              className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 block"
              style={{ background: 'linear-gradient(135deg, #0f2744 0%, #1e3a5f 100%)' }}
            >
              <div className="p-7 flex flex-col h-full min-h-[200px]">
                <div className="text-4xl mb-3">🃏</div>
                <h3 className="text-xl font-extrabold text-white mb-2">MTG Singles Store</h3>
                <p className="text-sm mb-4 flex-1" style={{ color: '#bfdbfe' }}>Thousands of graded Magic singles — commons to mythic rares, on-site.</p>
                <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: '#34d399' }}>
                  Browse catalog
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
        style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1440 50%, #1B3A8A 100%)' }}
      >
        <div className="container mx-auto px-4 text-center max-w-2xl">
          {/* Decorative */}
          <div className="flex justify-center gap-3 text-5xl mb-5">🎲 🎮 🕹️ 🀄</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Come Hang Out at Boardgame Time
          </h2>
          <p className="text-base mb-8" style={{ color: '#fca5a5' }}>
            Board games, PS5 &amp; Switch rentals, Mahjong, and MTG — one flat entry fee, endless fun.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/cafe"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-white"
              style={{ color: '#E31E24' }}
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
