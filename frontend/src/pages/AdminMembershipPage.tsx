import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin';

interface Member {
  _id: string;
  name?: string;
  email: string;
  wpnEmail?: string;
  phoneNumber?: string;
  role: string;
  storeCredit?: number;
  createdAt: string;
}

const AdminMembershipPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Create form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', wpnEmail: '', phoneNumber: '' });
  const [creating, setCreating] = useState(false);
  const [createdTempPassword, setCreatedTempPassword] = useState<{ name: string; email: string; pass: string } | null>(null);

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', wpnEmail: '', phoneNumber: '' });
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Store credit
  const [creditInputs, setCreditInputs] = useState<Record<string, string>>({});
  const [adjustingCredit, setAdjustingCredit] = useState<string | null>(null);

  const handleAdjustCredit = async (id: string, amount: number) => {
    if (!amount || isNaN(amount)) return;
    setAdjustingCredit(id);
    setError('');
    try {
      await adminApi.adjustStoreCredit(id, amount);
      setCreditInputs(prev => ({ ...prev, [id]: '' }));
      setSuccess(`Store credit ${amount > 0 ? 'added' : 'deducted'} ($${Math.abs(amount).toFixed(2)})`);
      loadMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to adjust credit');
    } finally {
      setAdjustingCredit(null);
    }
  };

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getMembers(search || undefined);
      setMembers(data.members);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) {
      setError('Name and email are required');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const result = await adminApi.createMember(createForm);
      setCreatedTempPassword({ name: result.member.name, email: result.member.email, pass: result.tempPassword });
      setCreateForm({ name: '', email: '', wpnEmail: '', phoneNumber: '' });
      setShowCreateModal(false);
      loadMembers();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create member');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (m: Member) => {
    setEditingId(m._id);
    setEditForm({ name: m.name || '', wpnEmail: m.wpnEmail || '', phoneNumber: m.phoneNumber || '' });
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    setError('');
    try {
      await adminApi.updateMember(id, editForm);
      setSuccess('Member updated');
      setEditingId(null);
      loadMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: Member) => {
    if (!confirm(`Delete member "${m.name || m.email}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteMember(m._id);
      setSuccess('Member deleted');
      loadMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to delete member');
    }
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = { admin: '#DC2626', seller: '#7C3AED', customer: '#0284c7' };
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white capitalize" style={{ backgroundColor: colors[role] || '#6b7280' }}>
        {role}
      </span>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin" className="p-2 rounded-lg hover:opacity-80" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Membership</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Manage WPN members and registered users</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => { setShowCreateModal(true); setError(''); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm shadow hover:opacity-90"
              style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Member
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
            {error}
            <button onClick={() => setError('')} className="ml-3 font-bold">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
            {success}
          </div>
        )}

        {/* Temp password banner */}
        {createdTempPassword && (
          <div className="mb-4 p-4 rounded-xl shadow" style={{ backgroundColor: '#FFF7ED', border: '2px solid #F97316' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-orange-700 mb-1">✅ Member Created — Share Credentials</p>
                <p className="text-sm text-orange-800"><strong>Name:</strong> {createdTempPassword.name}</p>
                <p className="text-sm text-orange-800"><strong>Email:</strong> {createdTempPassword.email}</p>
                <p className="text-sm text-orange-800"><strong>Temp Password:</strong>{' '}
                  <code className="bg-orange-100 px-2 py-0.5 rounded font-mono font-bold">{createdTempPassword.pass}</code>
                </p>
                <p className="text-xs text-orange-600 mt-1">⚠️ Save this password now — it won't be shown again.</p>
              </div>
              <button onClick={() => setCreatedTempPassword(null)} className="text-orange-400 hover:text-orange-700 font-bold text-lg">✕</button>
            </div>
          </div>
        )}

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name, email, WPN email, or phone..."
            className="flex-1 px-4 py-2.5 rounded-lg text-sm border"
            style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
          />
          <button type="submit" className="px-4 py-2.5 rounded-lg text-sm font-bold" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
            Search
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="px-4 py-2.5 rounded-lg text-sm font-bold" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
              Clear
            </button>
          )}
        </form>

        {/* Table */}
        <div className="rounded-xl shadow overflow-hidden" style={{ backgroundColor: 'var(--color-panel)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {loading ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''}${search ? ` matching "${search}"` : ''}`}
            </span>
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
            </div>
          ) : members.length === 0 ? (
            <div className="py-16 text-center" style={{ color: 'var(--color-text-secondary)' }}>
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              No members found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Name</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Login Email</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>WPN Email</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Phone</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Role</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Store Credit (USD)</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Joined</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m._id} className="border-b last:border-0 hover:opacity-95" style={{ borderColor: 'var(--color-border)' }}>
                      {editingId === m._id ? (
                        /* Edit row */
                        <>
                          <td className="px-4 py-2">
                            <input
                              value={editForm.name}
                              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                              className="w-full px-2 py-1.5 rounded border text-sm"
                              style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                              placeholder="Name"
                            />
                          </td>
                          <td className="px-4 py-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{m.email}</td>
                          <td className="px-4 py-2">
                            <input
                              value={editForm.wpnEmail}
                              onChange={e => setEditForm(f => ({ ...f, wpnEmail: e.target.value }))}
                              className="w-full px-2 py-1.5 rounded border text-sm"
                              style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                              placeholder="WPN email"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              value={editForm.phoneNumber}
                              onChange={e => setEditForm(f => ({ ...f, phoneNumber: e.target.value }))}
                              className="w-full px-2 py-1.5 rounded border text-sm"
                              style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                              placeholder="Phone"
                            />
                          </td>
                          <td className="px-4 py-2">{roleBadge(m.role)}</td>
                          <td className="px-4 py-2 text-sm font-semibold" style={{ color: '#16A34A' }}>
                            ${(m.storeCredit || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {new Date(m.createdAt).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSave(m._id)}
                                disabled={saving}
                                className="px-3 py-1.5 rounded text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                                style={{ backgroundColor: '#16A34A' }}
                              >
                                {saving ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 rounded text-xs font-bold hover:opacity-80"
                                style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        /* Normal row */
                        <>
                          <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>
                            {m.name || <span className="italic opacity-50">—</span>}
                          </td>
                          <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{m.email}</td>
                          <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                            {m.wpnEmail || <span className="italic opacity-40">—</span>}
                          </td>
                          <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                            {m.phoneNumber || <span className="italic opacity-40">—</span>}
                          </td>
                          <td className="px-4 py-3">{roleBadge(m.role)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-sm font-bold" style={{ color: '#16A34A' }}>
                                ${(m.storeCredit || 0).toFixed(2)}
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={creditInputs[m._id] || ''}
                                  onChange={e => setCreditInputs(prev => ({ ...prev, [m._id]: e.target.value }))}
                                  className="w-20 px-2 py-1 rounded border text-xs"
                                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                                />
                                <button
                                  onClick={() => handleAdjustCredit(m._id, parseFloat(creditInputs[m._id] || '0'))}
                                  disabled={adjustingCredit === m._id || !creditInputs[m._id]}
                                  title="Add credit"
                                  className="px-2 py-1 rounded text-xs font-bold text-white disabled:opacity-40"
                                  style={{ backgroundColor: '#16A34A' }}
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => handleAdjustCredit(m._id, -parseFloat(creditInputs[m._id] || '0'))}
                                  disabled={adjustingCredit === m._id || !creditInputs[m._id]}
                                  title="Deduct credit"
                                  className="px-2 py-1 rounded text-xs font-bold text-white disabled:opacity-40"
                                  style={{ backgroundColor: '#DC2626' }}
                                >
                                  −
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {new Date(m.createdAt).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEdit(m)}
                                className="px-3 py-1.5 rounded text-xs font-bold hover:opacity-80"
                                style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                              >
                                Edit
                              </button>
                              {m.role !== 'admin' && (
                                <button
                                  onClick={() => handleDelete(m)}
                                  className="px-3 py-1.5 rounded text-xs font-bold text-white hover:opacity-80"
                                  style={{ backgroundColor: '#DC2626' }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-6" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Add New Member</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ color: 'var(--color-text-secondary)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-xs font-medium" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>{error}</div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                  Login Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  required
                  placeholder="login@example.com"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                  WPN Account Email
                  <span className="ml-1 text-xs font-normal opacity-60">(optional)</span>
                </label>
                <input
                  type="email"
                  value={createForm.wpnEmail}
                  onChange={e => setCreateForm(f => ({ ...f, wpnEmail: e.target.value }))}
                  placeholder="wpn@example.com"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                  Phone Number
                  <span className="ml-1 text-xs font-normal opacity-60">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={createForm.phoneNumber}
                  onChange={e => setCreateForm(f => ({ ...f, phoneNumber: e.target.value }))}
                  placeholder="+62 812 3456 7890"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                A temporary password will be generated. Share it with the member so they can log in and change it.
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-lg font-bold text-sm text-white hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  {creating ? 'Creating…' : 'Create Member'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-lg font-bold text-sm hover:opacity-80"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMembershipPage;
