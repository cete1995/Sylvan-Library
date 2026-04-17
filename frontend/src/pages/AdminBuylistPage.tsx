import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { buylistApi, BuylistItem } from '../api/buylist';

const CONDITIONS = ['NM', 'LP', 'P'] as const;
const FINISHES = ['nonfoil', 'foil', 'etched'] as const;

const emptyForm = (): Partial<BuylistItem> => ({
  cardName: '',
  setCode: '',
  setName: '',
  imageUrl: '',
  condition: 'NM',
  finish: 'nonfoil',
  buyPrice: 0,
  notes: '',
  sortOrder: 0,
  isActive: true,
});

const AdminBuylistPage: React.FC = () => {
  const [items, setItems] = useState<BuylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({
    page: 1, limit: 50, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<BuylistItem>>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadItems = async (q: string, page: number) => {
    setLoading(true);
    try {
      const data = await buylistApi.getAll({ q: q || undefined, page, limit: 50 });
      setItems(data.items);
      setPagination(data.pagination);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(search, 1); }, [search]);

  const handleSave = async () => {
    if (!form.cardName?.trim() || !form.condition || !form.finish || form.buyPrice == null) {
      setSavingError('Card name, condition, finish, and buy price are required.');
      return;
    }
    setSaving(true);
    setSavingError('');
    try {
      if (editingId) {
        await buylistApi.update(editingId, form as any);
      } else {
        await buylistApi.create(form as any);
      }
      setShowForm(false);
      setForm(emptyForm());
      setEditingId(null);
      await loadItems(search, pagination.page);
    } catch (err: any) {
      setSavingError(err.response?.data?.error || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: BuylistItem) => {
    setForm({ ...item });
    setEditingId(item._id);
    setShowForm(true);
    setSavingError('');
  };

  const handleDelete = async (id: string) => {
    try {
      await buylistApi.delete(id);
      setDeleteConfirm(null);
      await loadItems(search, pagination.page);
    } catch (err: any) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleActive = async (item: BuylistItem) => {
    try {
      await buylistApi.update(item._id, { isActive: !item.isActive });
      await loadItems(search, pagination.page);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-5 hover:opacity-80" style={{ color: 'var(--color-accent)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>💰 Buylist Management</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Manage the public buylist — prices shown to customers who want to sell cards.</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/buylist"
              target="_blank"
              className="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-panel)' }}
            >
              🔗 View Public Page
            </Link>
            <button
              onClick={() => { setForm(emptyForm()); setEditingId(null); setShowForm(true); setSavingError(''); }}
              className="px-5 py-2 rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              + Add Entry
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-6 p-6 rounded-xl border-2 shadow-lg" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-accent)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              {editingId ? 'Edit Entry' : 'Add New Entry'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Card Name *</label>
                <input
                  type="text"
                  value={form.cardName ?? ''}
                  onChange={e => setForm(f => ({ ...f, cardName: e.target.value }))}
                  placeholder="e.g. Lightning Bolt"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Set Code</label>
                <input
                  type="text"
                  value={form.setCode ?? ''}
                  onChange={e => setForm(f => ({ ...f, setCode: e.target.value }))}
                  placeholder="e.g. M10"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Set Name</label>
                <input
                  type="text"
                  value={form.setName ?? ''}
                  onChange={e => setForm(f => ({ ...f, setName: e.target.value }))}
                  placeholder="e.g. Magic 2010"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Condition *</label>
                <select
                  value={form.condition}
                  onChange={e => setForm(f => ({ ...f, condition: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                >
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Finish *</label>
                <select
                  value={form.finish}
                  onChange={e => setForm(f => ({ ...f, finish: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                >
                  {FINISHES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Buy Price (Rp) *</label>
                <input
                  type="number"
                  min={0}
                  value={form.buyPrice ?? ''}
                  onChange={e => setForm(f => ({ ...f, buyPrice: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Image URL</label>
                <input
                  type="text"
                  value={form.imageUrl ?? ''}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Notes</label>
                <input
                  type="text"
                  value={form.notes ?? ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Any edition"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Sort Order</label>
                <input
                  type="number"
                  value={form.sortOrder ?? 0}
                  onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive !== false}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Active (visible on public buylist)</span>
            </label>

            {savingError && (
              <p className="mb-3 text-sm text-red-500">{savingError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Entry'}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setSavingError(''); }}
                className="px-5 py-2 rounded-lg text-sm font-semibold border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-background)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            value={searchInput}
            onChange={e => {
              setSearchInput(e.target.value);
              clearTimeout((window as any).__buylistDebounce);
              (window as any).__buylistDebounce = setTimeout(() => setSearch(e.target.value), 400);
            }}
            placeholder="Search card name..."
            className="w-full max-w-sm px-4 py-2.5 border rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--color-panel)' }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--color-text-secondary)' }}>
            <p className="text-4xl mb-3">📋</p>
            <p className="font-bold text-lg mb-1" style={{ color: 'var(--color-text)' }}>No entries yet</p>
            <p className="text-sm">Add buylist entries using the button above.</p>
          </div>
        ) : (
          <>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>{pagination.total} entries</p>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-panel)', borderBottom: '1px solid var(--color-border)' }}>
                      {['Card Name', 'Set', 'Condition', 'Finish', 'Buy Price', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {items.map(item => (
                      <tr key={item._id} style={{ backgroundColor: item.isActive ? 'var(--color-background)' : 'var(--color-panel)', opacity: item.isActive ? 1 : 0.6 }}>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>
                          <div className="flex items-center gap-2">
                            {item.imageUrl && <img src={item.imageUrl} alt="" className="w-6 h-8 object-cover rounded flex-shrink-0" />}
                            <span>{item.cardName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.setCode || '—'}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>{item.condition}</span></td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text)' }}>{item.finish}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--color-accent)' }}>Rp {item.buyPrice.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleActive(item)}
                            className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{ backgroundColor: item.isActive ? '#dcfce7' : '#fee2e2', color: item.isActive ? '#166534' : '#991b1b' }}
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(item)} className="text-xs px-3 py-1 rounded font-medium" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>Edit</button>
                            {deleteConfirm === item._id ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleDelete(item._id)} className="text-xs px-2 py-1 rounded font-bold bg-red-600 text-white">Confirm</button>
                                <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(item._id)} className="text-xs px-3 py-1 rounded font-medium text-red-600 hover:bg-red-50">Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-4 flex gap-2 justify-center">
                <button disabled={!pagination.hasPrevPage} onClick={() => loadItems(search, pagination.page - 1)} className="px-4 py-2 rounded-lg text-sm disabled:opacity-40" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>← Prev</button>
                <span className="px-4 py-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Page {pagination.page} / {pagination.totalPages}</span>
                <button disabled={!pagination.hasNextPage} onClick={() => loadItems(search, pagination.page + 1)} className="px-4 py-2 rounded-lg text-sm disabled:opacity-40" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminBuylistPage;
