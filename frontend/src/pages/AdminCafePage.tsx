import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cafeApi, CafeSettings, CafeHour, CafeGame } from '../api/cafe';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_SETTINGS: CafeSettings = {
  name: 'Sylvan Library Boardgame Café',
  tagline: 'Play More. Stress Less.',
  address: '',
  mapUrl: 'https://maps.google.com',
  whatsapp: 'https://wa.me/62XXXXXXXXXX',
  instagram: 'https://instagram.com/sylvanlibrary',
  entranceFee: 'Rp 30.000',
  entranceDesc: 'Flat entry fee includes access to our full game library. No hourly charge.',
  gameCount: '100+',
  hours: DAYS.map(day => ({ day, time: '10:00 – 22:00', closed: false })),
  mahjong: { tables: 4, sessionPrice: 'Rp 20.000 / person / session', desc: '' },
  games: [],
};

/* ── Small field component ── */
const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
    />
  </div>
);

const Textarea: React.FC<{
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}> = ({ label, value, onChange, rows = 3 }) => (
  <div>
    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 resize-y"
      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
    />
  </div>
);

const SectionHeader: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
    <div className="w-2 h-5 rounded-full" style={{ backgroundColor: color }} />
    <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>{children}</h2>
  </div>
);

/* ══════════════════════════════════ MAIN PAGE ══════════════════════════════════ */
const AdminCafePage: React.FC = () => {
  const [settings, setSettings] = useState<CafeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [newGame, setNewGame] = useState<CafeGame>({ name: '', players: '', duration: '', icon: '🎲' });

  useEffect(() => {
    cafeApi.getSettings()
      .then(data => setSettings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof CafeSettings>(key: K, value: CafeSettings[K]) =>
    setSettings(s => ({ ...s, [key]: value }));

  const updateHour = (idx: number, field: keyof CafeHour, value: string | boolean) =>
    setSettings(s => {
      const hours = [...s.hours];
      hours[idx] = { ...hours[idx], [field]: value };
      return { ...s, hours };
    });

  const updateMahjong = (field: string, value: string | number) =>
    setSettings(s => ({ ...s, mahjong: { ...s.mahjong, [field]: value } }));

  const addGame = () => {
    if (!newGame.name.trim()) return;
    setSettings(s => ({ ...s, games: [...s.games, { ...newGame }] }));
    setNewGame({ name: '', players: '', duration: '', icon: '🎲' });
  };

  const removeGame = (idx: number) =>
    setSettings(s => ({ ...s, games: s.games.filter((_, i) => i !== idx) }));

  const moveGame = (idx: number, dir: -1 | 1) =>
    setSettings(s => {
      const games = [...s.games];
      const to = idx + dir;
      if (to < 0 || to >= games.length) return s;
      [games[idx], games[to]] = [games[to], games[idx]];
      return { ...s, games };
    });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await cafeApi.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--color-accent)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Link to="/admin/dashboard" className="text-sm mb-2 inline-flex items-center gap-1 hover:opacity-70"
              style={{ color: 'var(--color-text-secondary)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <span>🎲</span> Boardgame Café
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Manage café name, hours, games, Mahjong info, and contact links
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/cafe" target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-80 transition-all"
              style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Preview Page
            </Link>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all shadow"
              style={{ backgroundColor: '#16a34a' }}>
              {saving
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving…</>
                : saved
                  ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Saved!</>
                  : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Save Changes</>
              }
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
            {error}
          </div>
        )}

        <div className="space-y-8">

          {/* ── General Info ── */}
          <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: 'var(--color-panel)' }}>
            <SectionHeader color="#3B82F6">General Info</SectionHeader>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Café Name" value={settings.name} onChange={v => update('name', v)} />
              <Field label="Tagline" value={settings.tagline} onChange={v => update('tagline', v)} placeholder="Play More. Stress Less." />
              <div className="sm:col-span-2">
                <Textarea label="Address" value={settings.address} onChange={v => update('address', v)} rows={2} />
              </div>
              <Field label="Google Maps URL" value={settings.mapUrl} onChange={v => update('mapUrl', v)} placeholder="https://maps.google.com/..." />
              <Field label="WhatsApp Link" value={settings.whatsapp} onChange={v => update('whatsapp', v)} placeholder="https://wa.me/62..." />
              <Field label="Instagram URL" value={settings.instagram} onChange={v => update('instagram', v)} placeholder="https://instagram.com/..." />
            </div>
          </div>

          {/* ── Entry Fee ── */}
          <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: 'var(--color-panel)' }}>
            <SectionHeader color="#10B981">Entry Fee</SectionHeader>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Entry Fee" value={settings.entranceFee} onChange={v => update('entranceFee', v)} placeholder="Rp 30.000" />
              <Field label="Game Count Label" value={settings.gameCount} onChange={v => update('gameCount', v)} placeholder="100+" />
              <div className="sm:col-span-2">
                <Textarea label="Entry Fee Description" value={settings.entranceDesc} onChange={v => update('entranceDesc', v)} rows={2} />
              </div>
            </div>
          </div>

          {/* ── Operating Hours ── */}
          <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: 'var(--color-panel)' }}>
            <SectionHeader color="#8B5CF6">Operating Hours</SectionHeader>
            <div className="space-y-2">
              {settings.hours.map((h, idx) => (
                <div key={h.day} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-background)' }}>
                  <span className="w-28 text-sm font-semibold flex-shrink-0" style={{ color: 'var(--color-text)' }}>{h.day}</span>
                  <label className="flex items-center gap-1.5 text-xs flex-shrink-0 cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={h.closed}
                      onChange={e => updateHour(idx, 'closed', e.target.checked)}
                      className="w-3.5 h-3.5 rounded"
                    />
                    Closed
                  </label>
                  {h.closed
                    ? <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>Closed</span>
                    : <input
                        type="text"
                        value={h.time}
                        onChange={e => updateHour(idx, 'time', e.target.value)}
                        placeholder="10:00 – 22:00"
                        className="flex-1 px-3 py-1.5 rounded-lg text-sm focus:outline-none"
                        style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                      />
                  }
                </div>
              ))}
            </div>
          </div>

          {/* ── Mahjong ── */}
          <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: 'var(--color-panel)' }}>
            <SectionHeader color="#DC2626">🀄 Mahjong Tables</SectionHeader>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Number of Tables</label>
                <input
                  type="number"
                  min={0}
                  value={settings.mahjong.tables}
                  onChange={e => updateMahjong('tables', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                />
              </div>
              <Field label="Session Price" value={settings.mahjong.sessionPrice} onChange={v => updateMahjong('sessionPrice', v)} placeholder="Rp 20.000 / person" />
              <div className="sm:col-span-2">
                <Textarea label="Description" value={settings.mahjong.desc} onChange={v => updateMahjong('desc', v)} rows={2} />
              </div>
            </div>
          </div>

          {/* ── Game Library ── */}
          <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: 'var(--color-panel)' }}>
            <SectionHeader color="#F97316">🎲 Game Library</SectionHeader>

            {/* Add new game */}
            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: 'var(--color-background)', border: '1px dashed var(--color-border)' }}>
              <p className="text-xs font-bold mb-3" style={{ color: 'var(--color-text-secondary)' }}>ADD GAME</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <input type="text" value={newGame.icon} onChange={e => setNewGame(g => ({ ...g, icon: e.target.value }))}
                  placeholder="🎲" className="px-2 py-1.5 rounded-lg text-sm text-center focus:outline-none w-full"
                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                <input type="text" value={newGame.name} onChange={e => setNewGame(g => ({ ...g, name: e.target.value }))}
                  placeholder="Game name" className="sm:col-span-1 px-3 py-1.5 rounded-lg text-sm focus:outline-none w-full"
                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                  onKeyDown={e => e.key === 'Enter' && addGame()} />
                <input type="text" value={newGame.players} onChange={e => setNewGame(g => ({ ...g, players: e.target.value }))}
                  placeholder="2–4 players" className="px-3 py-1.5 rounded-lg text-sm focus:outline-none w-full"
                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                <input type="text" value={newGame.duration} onChange={e => setNewGame(g => ({ ...g, duration: e.target.value }))}
                  placeholder="30 min" className="px-3 py-1.5 rounded-lg text-sm focus:outline-none w-full"
                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }} />
                <button onClick={addGame} disabled={!newGame.name.trim()}
                  className="px-3 py-1.5 rounded-lg text-sm font-bold text-white disabled:opacity-40 hover:opacity-90 transition-all"
                  style={{ backgroundColor: '#16a34a' }}>
                  + Add
                </button>
              </div>
            </div>

            {/* Games list */}
            {settings.games.length === 0
              ? <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-secondary)' }}>No games added yet.</p>
              : (
                <div className="space-y-1.5">
                  {settings.games.map((g, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl"
                      style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                      <span className="text-xl w-7 text-center flex-shrink-0">{g.icon}</span>
                      <span className="font-semibold text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--color-text)' }}>{g.name}</span>
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>{g.players}</span>
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>{g.duration}</span>
                      <div className="flex gap-1 ml-1 flex-shrink-0">
                        <button onClick={() => moveGame(idx, -1)} disabled={idx === 0}
                          className="w-7 h-7 rounded flex items-center justify-center hover:opacity-70 disabled:opacity-20 transition-all"
                          style={{ backgroundColor: 'var(--color-panel)' }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button onClick={() => moveGame(idx, 1)} disabled={idx === settings.games.length - 1}
                          className="w-7 h-7 rounded flex items-center justify-center hover:opacity-70 disabled:opacity-20 transition-all"
                          style={{ backgroundColor: 'var(--color-panel)' }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        <button onClick={() => removeGame(idx)}
                          className="w-7 h-7 rounded flex items-center justify-center hover:opacity-70 transition-all"
                          style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
            <p className="text-xs mt-3" style={{ color: 'var(--color-text-secondary)' }}>
              {settings.games.length} game{settings.games.length !== 1 ? 's' : ''} in library · Use arrows to reorder
            </p>
          </div>

        </div>

        {/* Sticky save bar */}
        <div className="mt-8 flex justify-end gap-4">
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
            style={{ backgroundColor: '#16a34a' }}>
            {saving
              ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving Changes…</>
              : saved
                ? '✅ Changes Saved!'
                : 'Save All Changes'
            }
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminCafePage;
