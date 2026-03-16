import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { boardgameApi, BoardGame } from '../api/boardgames';

// ─── Constants ───────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  Easy:   { bg: 'rgba(52,211,153,0.18)',  text: '#34d399' },
  Medium: { bg: 'rgba(251,191,36,0.18)',  text: '#fbbf24' },
  Hard:   { bg: 'rgba(239,68,68,0.18)',   text: '#f87171' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <div
    className="flex flex-col items-center justify-center p-3 rounded-2xl text-center"
    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
  >
    <span className="text-xl mb-1">{icon}</span>
    <span className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
    <span className="text-sm font-bold text-white leading-tight">{value}</span>
  </div>
);

const SectionHeading: React.FC<{ children: React.ReactNode; accentColor?: string }> = ({
  children,
  accentColor = '#E31E24',
}) => (
  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
    <span
      className="w-1 h-6 rounded-full shrink-0 inline-block"
      style={{ backgroundColor: accentColor }}
    />
    {children}
  </h2>
);

// ─── Lightbox ─────────────────────────────────────────────────────────────────

const Lightbox: React.FC<{
  images: string[];
  index: number;
  gameName: string;
  onClose: () => void;
  onNav: (idx: number) => void;
}> = ({ images, index, gameName, onClose, onNav }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
    onClick={onClose}
  >
    {/* Close */}
    <button
      className="absolute top-4 right-4 text-white text-3xl leading-none opacity-70 hover:opacity-100 transition-opacity"
      onClick={onClose}
      aria-label="Close"
    >
      ×
    </button>

    {/* Prev */}
    {index > 0 && (
      <button
        className="absolute left-4 text-white text-4xl leading-none opacity-70 hover:opacity-100 transition-opacity select-none"
        onClick={(e) => { e.stopPropagation(); onNav(index - 1); }}
        aria-label="Previous"
      >
        ‹
      </button>
    )}

    {/* Image */}
    <img
      src={images[index]}
      alt={`${gameName} – photo ${index + 1}`}
      className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />

    {/* Next */}
    {index < images.length - 1 && (
      <button
        className="absolute right-4 text-white text-4xl leading-none opacity-70 hover:opacity-100 transition-opacity select-none"
        onClick={(e) => { e.stopPropagation(); onNav(index + 1); }}
        aria-label="Next"
      >
        ›
      </button>
    )}

    {/* Counter */}
    <div
      className="absolute bottom-6 text-xs font-semibold px-3 py-1 rounded-full"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.7)' }}
    >
      {index + 1} / {images.length}
    </div>
  </div>
);

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const DetailSkeleton: React.FC = () => (
  <div
    className="min-h-screen pb-28 md:pb-0"
    style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1440 45%, #111e55 100%)' }}
  >
    <div className="h-64 md:h-80 w-full animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
    <div className="container mx-auto px-4 max-w-3xl mt-6 space-y-4">
      <div className="h-8 w-2/3 rounded animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        <div className="h-5 w-20 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 rounded animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.05)', width: i % 2 === 0 ? '80%' : '95%' }} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const BoardgameDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<BoardGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    try {
      const g = await boardgameApi.getOne(id);
      setGame(g);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIdx === null || !game) return;
    const allImages = [game.imageUrl, ...(game.gallery ?? [])].filter(Boolean);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight' && lightboxIdx < allImages.length - 1) setLightboxIdx(lightboxIdx + 1);
      if (e.key === 'ArrowLeft' && lightboxIdx > 0) setLightboxIdx(lightboxIdx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, game]);

  if (loading) return <DetailSkeleton />;

  if (notFound || !game) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4 pb-28 md:pb-0"
        style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1440 45%, #111e55 100%)' }}
      >
        <span className="text-6xl">🎲</span>
        <p className="text-xl font-bold text-white">Game not found</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          It may have been removed or is no longer available.
        </p>
        <Link
          to="/boardgames"
          className="mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: '#E31E24', color: '#fff' }}
        >
          ← Browse All Games
        </Link>
      </div>
    );
  }

  const diff = DIFFICULTY_COLORS[game.difficulty] ?? DIFFICULTY_COLORS.Medium;
  const allImages = [game.imageUrl, ...(game.gallery ?? [])].filter(Boolean);

  // Build stats — only show fields that have data
  const stats: { icon: string; label: string; value: string }[] = [
    { icon: '👥', label: 'Players', value: `${game.minPlayers}–${game.maxPlayers}` },
    { icon: '⏱', label: 'Duration', value: `${game.durationMinutes} min` },
    ...(game.age ? [{ icon: '🎯', label: 'Age', value: game.age }] : []),
    ...(game.designer ? [{ icon: '✏️', label: 'Designer', value: game.designer }] : []),
    ...(game.publisher ? [{ icon: '🏷️', label: 'Publisher', value: game.publisher }] : []),
  ];

  return (
    <div
      className="min-h-screen pb-28 md:pb-0"
      style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1440 45%, #111e55 100%)' }}
    >
      {/* ── Hero Image ──────────────────────────────────────────────────────── */}
      <div className="relative">
        {game.imageUrl ? (
          <div className="relative h-64 md:h-96 overflow-hidden">
            <img
              src={game.imageUrl}
              alt={game.name}
              className="w-full h-full object-cover"
            />
            {/* Bottom-fade overlay so the title reads cleanly against the image */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(6,9,24,0.15) 0%, rgba(6,9,24,0.85) 80%, rgba(6,9,24,1) 100%)',
              }}
            />
          </div>
        ) : (
          /* No-image placeholder */
          <div
            className="h-40 md:h-52 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          >
            <span className="text-7xl select-none">🎲</span>
          </div>
        )}

        {/* Back button */}
        <Link
          to="/boardgames"
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl backdrop-blur-sm transition-opacity opacity-80 hover:opacity-100"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }}
        >
          ← Boardgames
        </Link>

        {/* Featured badge */}
        {game.featured && (
          <div className="absolute top-4 right-4">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#E31E24', color: '#fff' }}
            >
              ⭐ Featured
            </span>
          </div>
        )}
      </div>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 max-w-3xl">

        {/* Title block — overlaps hero image via negative margin */}
        <div className={game.imageUrl ? '-mt-20 relative z-10 pb-6' : 'pt-8 pb-6'}>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight drop-shadow-lg">
            {game.name}
          </h1>
          <div className="flex flex-wrap gap-2">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: diff.bg, color: diff.text }}
            >
              {game.difficulty}
            </span>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}
            >
              {game.category}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className={`grid gap-3 mb-8 grid-cols-${Math.min(stats.length, 4)}`}
          style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))` }}
        >
          {stats.map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
          ))}
        </div>

        {/* About */}
        {game.description && (
          <section className="mb-10">
            <SectionHeading accentColor="#E31E24">About this Game</SectionHeading>
            <p
              className="text-base leading-relaxed whitespace-pre-wrap"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              {game.description}
            </p>
          </section>
        )}

        {/* How to Play */}
        {game.howToPlay && (
          <section className="mb-10">
            <SectionHeading accentColor="#1B3A8A">How to Play</SectionHeading>
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: 'rgba(27,58,138,0.12)', border: '1px solid rgba(27,58,138,0.3)' }}
            >
              <p
                className="text-base leading-relaxed whitespace-pre-wrap"
                style={{ color: 'rgba(255,255,255,0.78)' }}
              >
                {game.howToPlay}
              </p>
            </div>
          </section>
        )}

        {/* Gallery */}
        {allImages.length > 1 && (
          <section className="mb-10">
            <SectionHeading accentColor="#fbbf24">Gallery</SectionHeading>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {allImages.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIdx(i)}
                  className="shrink-0 rounded-xl overflow-hidden transition-transform hover:scale-105 focus:outline-none focus:ring-2"
                  style={{ width: 160, height: 120, flexShrink: 0, '--tw-ring-color': '#fbbf24' } as React.CSSProperties}
                  aria-label={`View photo ${i + 1}`}
                >
                  <img
                    src={url}
                    alt={`${game.name} – photo ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Tap a photo to view full size
            </p>
          </section>
        )}

        {/* CTA */}
        <section
          className="mb-10 p-6 rounded-2xl text-center"
          style={{
            backgroundColor: 'rgba(227,30,36,0.08)',
            border: '1px solid rgba(227,30,36,0.22)',
          }}
        >
          <p className="text-lg font-bold text-white mb-1">
            Ready to play{' '}
            <span style={{ color: '#fca5a5' }}>{game.name}</span>?
          </p>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.52)' }}>
            Visit us at Boardgame Time — we have this game on the shelf and ready to play.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://wa.me/6281333667147"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition hover:opacity-90"
              style={{ backgroundColor: '#E31E24', color: '#fff' }}
            >
              📞 Book via WhatsApp
            </a>
            <Link
              to="/cafe"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition hover:opacity-90"
              style={{ backgroundColor: 'rgba(255,255,255,0.09)', color: '#fff' }}
            >
              View Café Info
            </Link>
            <Link
              to="/boardgames"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}
            >
              Browse All Games
            </Link>
          </div>
        </section>

      </div>

      {/* ── Lightbox ────────────────────────────────────────────────────────── */}
      {lightboxIdx !== null && (
        <Lightbox
          images={allImages}
          index={lightboxIdx}
          gameName={game.name}
          onClose={() => setLightboxIdx(null)}
          onNav={setLightboxIdx}
        />
      )}
    </div>
  );
};

export default BoardgameDetailPage;
