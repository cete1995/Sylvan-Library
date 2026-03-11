import React, { useState, useEffect, useCallback, useRef } from 'react';
import { boardgameApi, BoardGame } from '../api/boardgames';
import { toast } from '../utils/toast';

interface FormState {
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  imageUrl: string;
  available: boolean;
  featured: boolean;
  sortOrder: number;
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  minPlayers: 2,
  maxPlayers: 4,
  durationMinutes: 60,
  category: 'General',
  difficulty: 'Medium',
  imageUrl: '',
  available: true,
  featured: false,
  sortOrder: 0,
};

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string }> = {
  Easy:   { bg: '#d1fae5', text: '#065f46' },
  Medium: { bg: '#fef3c7', text: '#92400e' },
  Hard:   { bg: '#fee2e2', text: '#991b1b' },
};

// ─── Modal ──────────────────────────────────────────────
const GameFormModal: React.FC<{
  game: BoardGame | null;
  onClose: () => void;
  onSaved: (game: BoardGame) => void;
}> = ({ game, onClose, onSaved }) => {
  const [form, setForm] = useState<FormState>(game ? {
    name: game.name,
    description: game.description,
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    durationMinutes: game.durationMinutes,
    category: game.category,
    difficulty: game.difficulty,
    imageUrl: game.imageUrl,
    available: game.available,
    featured: game.featured,
    sortOrder: game.sortOrder,
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const saved = game
        ? await boardgameApi.update(game._id, form)
        : await boardgameApi.create(form);
      toast.success(game ? 'Game updated' : 'Game added');
      onSaved(saved);
    } catch {
      toast.error('Failed to save game');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
  };
  const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        style={{ backgroundColor: '#0d1440', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h2 className="text-xl font-bold text-white">{game ? 'Edit Game' : 'Add Game'}</h2>
          <button onClick={onClose} className="text-white opacity-50 hover:opacity-100 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Name */}
          <div>
            <p style={labelStyle}>Name *</p>
            <input style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Catan" required />
          </div>

          {/* Description */}
          <div>
            <p style={labelStyle}>Description</p>
            <textarea
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Short description about the game..."
            />
          </div>

          {/* Image URL */}
          <div>
            <p style={labelStyle}>Image URL</p>
            <input style={inputStyle} value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
          </div>

          {/* Players row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={labelStyle}>Min Players</p>
              <input type="number" min={1} max={20} style={inputStyle} value={form.minPlayers} onChange={(e) => set('minPlayers', Number(e.target.value))} />
            </div>
            <div>
              <p style={labelStyle}>Max Players</p>
              <input type="number" min={1} max={20} style={inputStyle} value={form.maxPlayers} onChange={(e) => set('maxPlayers', Number(e.target.value))} />
            </div>
          </div>

          {/* Duration + Sort Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={labelStyle}>Duration (minutes)</p>
              <input type="number" min={1} style={inputStyle} value={form.durationMinutes} onChange={(e) => set('durationMinutes', Number(e.target.value))} />
            </div>
            <div>
              <p style={labelStyle}>Sort Order</p>
              <input type="number" style={inputStyle} value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} />
            </div>
          </div>

          {/* Category */}
          <div>
            <p style={labelStyle}>Category</p>
            <input style={inputStyle} value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Strategy, Party, Co-op…" />
          </div>

          {/* Difficulty */}
          <div>
            <p style={labelStyle}>Difficulty</p>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.difficulty}
              onChange={(e) => set('difficulty', e.target.value as FormState['difficulty'])}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            {([
              { key: 'available', label: 'Available' },
              { key: 'featured', label: 'Featured' },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key] as boolean}
                  onChange={(e) => set(key, e.target.checked)}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="text-sm text-white">{label}</span>
              </label>
            ))}
          </div>
        </form>

        <div className="px-6 py-4 flex gap-3 justify-end border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={handleSubmit}
            className="px-6 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ backgroundColor: '#E31E24', color: '#fff' }}
          >
            {saving ? 'Saving…' : game ? 'Update' : 'Add Game'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────
const AdminBoardgamesPage: React.FC = () => {
  const [games, setGames] = useState<BoardGame[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [modalGame, setModalGame] = useState<BoardGame | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<BoardGame | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await boardgameApi.adminGetAll({ q: debouncedSearch || undefined });
      setGames(res.games);
      setTotal(res.pagination.total);
    } catch {
      toast.error('Failed to load games');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSaved = (saved: BoardGame) => {
    setGames((prev) => {
      const idx = prev.findIndex((g) => g._id === saved._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setTotal((t) => t + (games.findIndex((g) => g._id === saved._id) < 0 ? 1 : 0));
    setModalGame(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await boardgameApi.delete(deleteTarget._id);
      setGames((prev) => prev.map((g) => g._id === deleteTarget._id ? { ...g, available: false } : g));
      toast.success('Game hidden from catalogue');
    } catch {
      toast.error('Failed to hide game');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const toggleAvailable = async (game: BoardGame) => {
    try {
      const updated = await boardgameApi.update(game._id, { available: !game.available });
      setGames((prev) => prev.map((g) => g._id === updated._id ? updated : g));
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const panel = 'var(--color-panel)';
  const border = '1px solid rgba(255,255,255,0.08)';

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>Boardgame Catalogue</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {total} {total === 1 ? 'game' : 'games'} total
          </p>
        </div>
        <button
          onClick={() => setModalGame('new')}
          className="px-5 py-2.5 rounded-xl font-bold text-sm"
          style={{ backgroundColor: '#E31E24', color: '#fff' }}
        >
          + Add Game
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search games by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: panel, border, color: 'var(--color-text)' }}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden shadow" style={{ backgroundColor: panel, border }}>
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[1fr_120px_100px_100px_100px_140px] gap-4 px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)', borderBottom: border }}>
          <span>Game</span>
          <span>Category</span>
          <span>Difficulty</span>
          <span>Players</span>
          <span>Duration</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#E31E24', borderTopColor: 'transparent' }} />
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">🎲</span>
            <p className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>No games yet. Add your first one!</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {games.map((game) => {
              const diff = DIFFICULTY_STYLES[game.difficulty] ?? DIFFICULTY_STYLES.Medium;
              return (
                <div key={game._id} className="px-4 py-3 grid md:grid-cols-[1fr_120px_100px_100px_100px_140px] gap-4 items-center">
                  {/* Name + availability indicator */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    >
                      {game.imageUrl ? (
                        <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">🎲</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{game.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: game.available ? '#34d399' : '#f87171' }}
                        />
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {game.available ? 'On Shelf' : 'Hidden'}
                          {game.featured && ' · ⭐ Featured'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <span className="text-sm hidden md:block" style={{ color: 'var(--color-text-secondary)' }}>{game.category}</span>

                  {/* Difficulty badge */}
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full hidden md:inline-block w-fit"
                    style={{ backgroundColor: diff.bg, color: diff.text }}
                  >
                    {game.difficulty}
                  </span>

                  {/* Players */}
                  <span className="text-sm hidden md:block" style={{ color: 'var(--color-text-secondary)' }}>
                    {game.minPlayers}–{game.maxPlayers}
                  </span>

                  {/* Duration */}
                  <span className="text-sm hidden md:block" style={{ color: 'var(--color-text-secondary)' }}>
                    {game.durationMinutes} min
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2 md:justify-end flex-wrap">
                    <button
                      onClick={() => toggleAvailable(game)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                      style={
                        game.available
                          ? { backgroundColor: 'rgba(52,211,153,0.15)', color: '#34d399' }
                          : { backgroundColor: 'rgba(248,113,113,0.15)', color: '#f87171' }
                      }
                    >
                      {game.available ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => setModalGame(game)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(game)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#f87171' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalGame !== null && (
        <GameFormModal
          game={modalGame === 'new' ? null : modalGame}
          onClose={() => setModalGame(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl" style={{ backgroundColor: '#0d1440', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-lg font-bold text-white mb-2">Remove Game?</h3>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
              "{deleteTarget.name}" will be hidden from the customer catalogue. You can show it again later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ backgroundColor: '#E31E24', color: '#fff' }}
              >
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBoardgamesPage;
