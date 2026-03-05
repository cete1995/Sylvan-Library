import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cafeApi, CafeSettings } from '../api/cafe';

const CafePage: React.FC = () => {
  const [info, setInfo] = useState<CafeSettings | null>(null);
  const [loadError, setLoadError] = useState(false);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  useEffect(() => {
    cafeApi.getSettings()
      .then(setInfo)
      .catch(() => setLoadError(true));
  }, []);

  if (!info && !loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--color-accent)' }} />
      </div>
    );
  }

  if (loadError || !info) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <span className="text-5xl">🎲</span>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Boardgame Café</h2>
        <p className="max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
          Café info is currently unavailable. Please check back soon or contact us on WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a2e1a 0%, #2d4a1e 45%, #1e3a2e 100%)' }}
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: '#86efac' }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: '#fbbf24' }} />

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#86efac' }} />
              Boardgame Cafe & Mahjong Tables
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight tracking-tight">
              {info.tagline.includes('.') ? (
                <>
                  {info.tagline.split('.')[0]}.{' '}
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #86efac, #fbbf24)' }}>
                    {info.tagline.split('.').slice(1).join('.').trim()}
                  </span>
                </>
              ) : (
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #86efac, #fbbf24)' }}>
                  {info.tagline}
                </span>
              )}
            </h1>

            <p className="text-lg mb-8 leading-relaxed max-w-2xl mx-auto" style={{ color: '#bbf7d0' }}>
              A cozy corner for board game lovers, Mahjong enthusiasts, and MTG players.
              Hundreds of games, dedicated Mahjong tables, great company.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={info.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                style={{ backgroundColor: '#16a34a', color: '#fff' }}
              >
                Book via WhatsApp
              </a>
              {info.mapUrl && (
                <a
                  href={info.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  Get Directions
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick stats bar */}
      <div style={{ backgroundColor: '#166534', color: '#fff' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/20">
            {[
              { icon: '', value: info.gameCount, label: 'Board Games' },
              { icon: '', value: String(info.mahjong.tables), label: 'Mahjong Tables' },
              { icon: '', value: 'MTG', label: 'Cards Available' },
              { icon: '', value: info.entranceFee, label: 'Entry Fee' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center py-4 px-2 gap-0.5">
                <span className="text-xl">{s.icon}</span>
                <span className="font-extrabold text-lg leading-tight">{s.value}</span>
                <span className="text-xs font-medium opacity-80">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16 space-y-16">

        {/* Hours & Info */}
        <section className="grid md:grid-cols-2 gap-8">
          {/* Operating Hours */}
          <div className="rounded-2xl p-6 shadow" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: 'rgba(134,239,172,0.15)' }}></div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Operating Hours</h2>
            </div>
            <div className="space-y-2">
              {info.hours.map(({ day, time, closed }) => {
                const isToday = day === today;
                return (
                  <div
                    key={day}
                    className="flex justify-between items-center px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: isToday ? 'rgba(134,239,172,0.12)' : 'transparent',
                      border: isToday ? '1px solid rgba(134,239,172,0.3)' : '1px solid transparent',
                    }}
                  >
                    <span className="font-medium text-sm" style={{ color: isToday ? '#16a34a' : 'var(--color-text)' }}>
                      {day}
                      {isToday && (
                        <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#16a34a', color: '#fff' }}>
                          TODAY
                        </span>
                      )}
                    </span>
                    {closed ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>Closed</span>
                    ) : (
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{time}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visit Info */}
          <div className="space-y-5">
            {/* Entry Fee */}
            <div className="rounded-2xl p-6 shadow" style={{ backgroundColor: 'var(--color-panel)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: 'rgba(251,191,36,0.15)' }}>💸</div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Entry Fee</h2>
              </div>
              {info.boardgamePricing?.length > 0 ? (
                <div className="space-y-2">
                  {info.boardgamePricing.map(({ label, price }) => (
                    <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</span>
                      <span className="text-lg font-extrabold" style={{ color: '#16a34a' }}>{price}</span>
                    </div>
                  ))}
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>{info.entranceDesc}</p>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-extrabold mb-1" style={{ color: '#16a34a' }}>{info.entranceFee}</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{info.entranceDesc}</p>
                </>
              )}
            </div>

            {/* Location */}
            {(info.address || info.mapUrl) && (
              <div className="rounded-2xl p-6 shadow" style={{ backgroundColor: 'var(--color-panel)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: 'rgba(96,165,250,0.15)' }}></div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Location</h2>
                </div>
                {info.address && <p className="text-sm mb-3" style={{ color: 'var(--color-text)' }}>{info.address}</p>}
                <div className="flex gap-3 flex-wrap">
                  {info.mapUrl && (
                    <a
                      href={info.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                      style={{ backgroundColor: '#3b82f6', color: '#fff' }}
                    >
                      Open in Maps
                    </a>
                  )}
                  {info.instagram && (
                    <a
                      href={info.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                      style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)', color: '#fff' }}
                    >
                      Follow Us
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Mahjong Section */}
        <section>
          <div className="rounded-2xl overflow-hidden shadow" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="px-6 py-5 md:px-8" style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' }}>
              <div className="flex items-center gap-3">
                <span className="text-4xl"></span>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Mahjong Tables</h2>
                  <p className="text-sm text-red-200">{info.mahjong.tables} dedicated tables  Full equipment included</p>
                </div>
              </div>
            </div>
            <div className="p-6 md:p-8 grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Tables Available</p>
                <p className="text-3xl font-extrabold" style={{ color: 'var(--color-text)' }}>{info.mahjong.tables}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Per Session</p>
                {info.mahjong.pricing?.length > 0 ? (
                  <div className="space-y-1.5 mt-1">
                    {info.mahjong.pricing.map(({ label, price }) => (
                      <div key={label} className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(220,38,38,0.08)' }}>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{label}</span>
                        <span className="text-sm font-extrabold" style={{ color: '#dc2626' }}>{price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xl font-extrabold" style={{ color: '#dc2626' }}>{info.mahjong.sessionPrice}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>About</p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{info.mahjong.desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Console Rental teaser → link to /consoles */}
        {(info.ps5?.enabled || info.nintendoSwitch?.enabled) && (
          <section>
            <div
              className="rounded-3xl overflow-hidden shadow-lg"
              style={{ background: 'linear-gradient(135deg, #0c0c2e 0%, #1a1060 40%, #2e0a45 100%)' }}
            >
              {/* Decorative blob */}
              <div className="relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: '#818cf8' }} />
                <div className="relative px-6 py-8 md:px-10 md:py-10">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Left: text */}
                    <div className="flex-1 text-white">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
                        style={{ backgroundColor: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                        ⭐ Happy Hour Deals Available
                      </div>
                      <h2 className="text-2xl md:text-3xl font-extrabold mb-2">Console Rental</h2>
                      <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        Rent a PS5 or Nintendo Switch by the hour. Happy hour pricing every evening.
                      </p>
                      {/* Mini price pills */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {info.ps5?.enabled && (
                          <span className="px-3 py-1.5 rounded-full text-sm font-bold"
                            style={{ backgroundColor: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.35)' }}>
                            🎮 PS5 — {info.ps5.hourlyRate}/hr
                          </span>
                        )}
                        {info.nintendoSwitch?.enabled && (
                          <span className="px-3 py-1.5 rounded-full text-sm font-bold"
                            style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)' }}>
                            🕹️ Switch — {info.nintendoSwitch.hourlyRate}/hr
                          </span>
                        )}
                      </div>
                      <Link
                        to="/consoles"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
                      >
                        See Full Console Info
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                    {/* Right: console emoji badges */}
                    <div className="hidden md:flex items-center gap-6 shrink-0">
                      {info.ps5?.enabled && (
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg"
                          style={{ background: 'rgba(59,130,246,0.15)', border: '1.5px solid rgba(59,130,246,0.3)' }}>🎮</div>
                      )}
                      {info.nintendoSwitch?.enabled && (
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg"
                          style={{ background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.3)' }}>🕹️</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Game Library */}
        {info.games.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: 'rgba(134,239,172,0.15)' }}></div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Game Library</h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{info.gameCount} titles available  just ask a staff member</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {info.games.map((game) => (
                <div
                  key={game.name}
                  className="rounded-xl p-4 text-center transition-all hover:scale-105 cursor-default shadow-sm"
                  style={{ backgroundColor: 'var(--color-panel)' }}
                >
                  <div className="text-3xl mb-2">{game.icon}</div>
                  <p className="font-bold text-sm leading-tight mb-1" style={{ color: 'var(--color-text)' }}>{game.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{game.players} players</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{game.duration}</p>
                </div>
              ))}
              <div
                className="rounded-xl p-4 text-center flex flex-col items-center justify-center shadow-sm"
                style={{ backgroundColor: 'var(--color-panel)', border: '2px dashed var(--color-accent)', opacity: 0.7 }}
              >
                <div className="text-2xl mb-1">+</div>
                <p className="font-bold text-sm" style={{ color: 'var(--color-text-secondary)' }}>Many more</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Ask staff</p>
              </div>
            </div>
          </section>
        )}

        {/* MTG at the Cafe */}
        <section
          className="rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8"
          style={{ background: 'linear-gradient(135deg, #0f2744 0%, #1a3a2a 100%)' }}
        >
          <div className="text-6xl shrink-0"></div>
          <div className="flex-1 text-white">
            <h2 className="text-2xl font-extrabold mb-2">MTG Singles  In Store</h2>
            <p className="mb-5" style={{ color: '#bfdbfe' }}>
              Browsing our physical store? We carry a wide selection of Magic: The Gathering singles.
              Check out our online catalog to see what's in stock  or ask staff during your visit.
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
              style={{ backgroundColor: '#34d399', color: '#064e3b' }}
            >
              Browse MTG Catalog
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pb-4">
          <h2 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--color-text)' }}>Come hang out</h2>
          <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            Whether you're a seasoned board gamer, a Mahjong regular, or just curious  there's a seat at the table for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={info.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all hover:scale-105"
              style={{ backgroundColor: '#16a34a', color: '#fff' }}
            >
              Chat on WhatsApp
            </a>
            {info.instagram && (
              <a
                href={info.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)', color: '#fff' }}
              >
                Follow on Instagram
              </a>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default CafePage;
