import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { boardgameApi, BoardGame } from '../api/boardgames';

const CATEGORIES = ['All', 'Strategy', 'Party', 'Family', 'Co-op', 'General'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'] as const;

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  Easy:   { bg: 'rgba(52,211,153,0.15)',  text: '#34d399' },
  Medium: { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
  Hard:   { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
};

const GameCard: React.FC<{ game: BoardGame }> = ({ game }) => {
  const diff = DIFFICULTY_COLORS[game.difficulty] ?? DIFFICULTY_COLORS.Medium;
  return (
    <Link
      to={`/boardgames/${game._id}`}
      className="rounded-2xl overflow-hidden shadow flex flex-col transition-transform hover:scale-[1.02]"
      style={{ backgroundColor: 'var(--color-panel)', textDecoration: 'none' }}
    >
      {/* Image */}
      <div
        className="relative h-36 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
      >
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-5xl select-none">🎲</span>
        )}
        {game.featured && (
          <div
            className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#E31E24', color: '#fff' }}
          >
            Featured
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-base leading-tight" style={{ color: 'var(--color-text)' }}>
          {game.name}
        </h3>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: diff.bg, color: diff.text }}
          >
            {game.difficulty}
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}
          >
            {game.category}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-auto pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            👥 {game.minPlayers}–{game.maxPlayers}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            ⏱ {game.durationMinutes} min
          </span>
        </div>
      </div>
    </Link>
  );
};

const SkeletonCard: React.FC = () => (
  <div className="rounded-2xl overflow-hidden shadow animate-pulse" style={{ backgroundColor: 'var(--color-panel)' }}>
    <div className="h-36" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
    <div className="p-4 space-y-2">
      <div className="h-4 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.08)', width: '70%' }} />
      <div className="h-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)', width: '50%' }} />
    </div>
  </div>
);

const BoardgameCataloguePage: React.FC = () => {
  const [games, setGames] = useState<BoardGame[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDifficulty, setActiveDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchGames = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await boardgameApi.getAll({
        q: debouncedSearch || undefined,
        category: activeCategory !== 'All' ? activeCategory : undefined,
        difficulty: activeDifficulty !== 'All' ? activeDifficulty : undefined,
        page: pageNum,
        limit: 24,
      });
      setGames(res.games);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeCategory, activeDifficulty]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeCategory, activeDifficulty]);

  useEffect(() => {
    fetchGames(page);
  }, [fetchGames, page]);

  const handleCategoryChange = (cat: string) => setActiveCategory(cat);
  const handleDifficultyChange = (diff: typeof activeDifficulty) => setActiveDifficulty(diff);

  return (
    <div
      className="min-h-screen pb-28 md:pb-0"
      style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1440 45%, #111e55 100%)' }}
    >
      {/* Hero */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: '#E31E24' }} />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full opacity-10" style={{ backgroundColor: '#fbbf24' }} />

        <div className="relative container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center text-white">
            <Link
              to="/cafe"
              className="inline-flex items-center gap-1.5 text-sm mb-5 opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: '#fca5a5' }}
            >
              ← Back to Café
            </Link>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              Our Game Library
            </h1>
            <p className="text-lg mb-2" style={{ color: '#fca5a5' }}>
              Browse our full collection of boardgames available at Sylvan Library.
            </p>
            {!loading && (
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {total} {total === 1 ? 'game' : 'games'} available
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <div
        className="sticky top-0 z-20 backdrop-blur-sm border-b"
        style={{ backgroundColor: 'rgba(6,9,24,0.85)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="container mx-auto px-4 py-3 space-y-2">
          {/* Search */}
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              backgroundColor: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
            }}
          />

          {/* Category + Difficulty pills */}
          <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
            {/* Category */}
            <div className="flex gap-1.5 shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                  style={
                    activeCategory === cat
                      ? { backgroundColor: '#E31E24', color: '#fff' }
                      : { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="w-px self-stretch" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />

            {/* Difficulty */}
            <div className="flex gap-1.5 shrink-0">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  onClick={() => handleDifficultyChange(diff)}
                  className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                  style={
                    activeDifficulty === diff
                      ? { backgroundColor: '#1B3A8A', color: '#fff' }
                      : { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }
                  }
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {error ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">😕</span>
            <p className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Could not load games. Please try again.
            </p>
            <button
              onClick={() => fetchGames(page)}
              className="mt-4 px-6 py-2 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: '#E31E24', color: '#fff' }}
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">🎲</span>
            <p className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
              No games found{search ? ` for "${search}"` : ''}.
            </p>
            {(search || activeCategory !== 'All' || activeDifficulty !== 'All') && (
              <button
                onClick={() => { setSearch(''); setActiveCategory('All'); setActiveDifficulty('All'); }}
                className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {games.map((game) => <GameCard key={game._id} game={game} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                >
                  ← Prev
                </button>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BoardgameCataloguePage;
