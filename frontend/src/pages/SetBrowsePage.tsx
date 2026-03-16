import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cardApi } from '../api/cards';
import { SetInfo } from '../types';

const SetBrowsePage: React.FC = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState<SetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    cardApi.getSets().then(({ sets }) => {
      setSets(sets);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = sets.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="min-h-screen pb-28 md:pb-0"
      style={{ background: 'linear-gradient(135deg, #060918, #0d1440, #111e55)' }}
    >
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm hover:opacity-80 transition-all"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-white mb-1">Browse by Set</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {sets.length} sets available
        </p>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <input
          type="text"
          placeholder="Search sets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
          style={{
            background: 'var(--color-panel)',
            color: 'var(--color-text)',
            borderColor: 'var(--color-border)',
          }}
        />
      </div>

      {/* Grid */}
      <div className="px-4">
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-lg p-4 animate-pulse" style={{ background: 'var(--color-panel)' }}>
                <div className="h-10 w-10 rounded-full mb-3" style={{ background: 'var(--color-border)' }} />
                <div className="h-3 rounded w-3/4 mb-2" style={{ background: 'var(--color-border)' }} />
                <div className="h-3 rounded w-1/2" style={{ background: 'var(--color-border)' }} />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--color-text-secondary)' }}>
            No sets found.
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map(set => (
              <Link
                key={set.code}
                to={`/catalog?set=${set.code}`}
                className="rounded-lg p-4 flex flex-col gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-2">
                  <i
                    className={`ss ss-${set.code.toLowerCase()} ss-2x`}
                    style={{ color: 'var(--color-accent)', fontSize: '1.5rem' }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-xs font-mono uppercase font-bold"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {set.code}
                  </span>
                </div>
                <p
                  className="text-sm font-medium leading-tight line-clamp-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  {set.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {set.count} card{set.count !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SetBrowsePage;
