import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sellerApi, Seller } from '../api/seller';

const AdminSellerManagementPage: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [editFormData, setEditFormData] = useState({
    email: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    setLoading(true);
    try {
      const data = await sellerApi.getSellers();
      setSellers(data.sellers);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await sellerApi.createSeller(formData);
      setSuccess('Seller created successfully');
      setFormData({ email: '', password: '', name: '' });
      setShowCreateForm(false);
      loadSellers();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create seller');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSeller = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete seller "${email}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await sellerApi.deleteSeller(id);
      setSuccess('Seller deleted successfully');
      loadSellers();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete seller');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSeller = (seller: Seller) => {
    setEditingSeller(seller);
    setEditFormData({
      email: seller.email,
      name: seller.name || '',
    });
    setError('');
    setSuccess('');
  };

  const handleUpdateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeller) return;

    setError('');
    setSuccess('');

    if (!editFormData.email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    try {
      await sellerApi.updateSeller(editingSeller._id, editFormData);
      setSuccess('Seller updated successfully');
      setEditingSeller(null);
      loadSellers();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update seller');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (id: string, email: string) => {
    const newPassword = prompt(`Enter new password for "${email}":`);
    if (!newPassword) return;

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await sellerApi.updateSellerPassword(id, newPassword);
      setSuccess('Password updated successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSellerStock = async (id: string, name: string) => {
    const confirm1 = window.confirm(
      `⚠️ WARNING: This will DELETE ALL inventory stock for "${name}"!\n\nThis action cannot be undone. Are you sure?`
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      'This is your last chance. Click OK to permanently delete all stock for this seller.'
    );
    if (!confirm2) return;

    setLoading(true);
    try {
      const result = await sellerApi.deleteSellerStock(id);
      setSuccess(`${result.message}. Removed ${result.totalRemoved} inventory items from ${result.cardsUpdated} cards.`);
      loadSellers();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete seller stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/admin/dashboard"
                className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
                style={{ backgroundColor: 'var(--color-background)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  Seller Management
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Manage seller accounts who can add inventory to existing cards
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Alerts */}
        {error && (
          <div className="rounded-xl shadow-md p-4 mb-6" style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444' }}>
            <p style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-xl shadow-md p-4 mb-6" style={{ backgroundColor: '#dcfce7', border: '1px solid #22c55e' }}>
            <p style={{ color: '#166534' }}>{success}</p>
          </div>
        )}

        {/* Create Seller Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 rounded-lg font-semibold transition-colors shadow-md"
            style={{
              backgroundColor: showCreateForm ? '#64748b' : 'var(--color-accent)',
              color: 'white',
            }}
          >
            {showCreateForm ? 'Cancel' : '+ Create New Seller'}
          </button>
        </div>

        {/* Edit Seller Modal */}
        {editingSeller && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
            onClick={() => setEditingSeller(null)}
          >
            <div 
              className="rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" 
              style={{ backgroundColor: 'var(--color-panel)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
                Edit Seller
              </h2>
              <form onSubmit={handleUpdateSeller} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)',
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)',
                    }}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-2 rounded-lg font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  >
                    {loading ? 'Updating...' : 'Update Seller'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSeller(null)}
                    className="flex-1 px-6 py-2 rounded-lg font-semibold text-white"
                    style={{ backgroundColor: '#64748b' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Seller Form */}
        {showCreateForm && (
          <div className="rounded-xl shadow-md p-6 mb-8" style={{ backgroundColor: 'var(--color-panel)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              Create New Seller
            </h2>
            <form onSubmit={handleCreateSeller} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)',
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Password * (min 6 characters)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)',
                  }}
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)',
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-lg font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  {loading ? 'Creating...' : 'Create Seller'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: '#64748b' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sellers Table */}
        <div className="rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: 'var(--color-panel)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && sellers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                      Loading...
                    </td>
                  </tr>
                ) : sellers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                      No sellers found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  sellers.map((seller) => (
                    <tr
                      key={seller._id}
                      className="border-t"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <td className="px-6 py-4" style={{ color: 'var(--color-text)' }}>
                        {seller.email}
                      </td>
                      <td className="px-6 py-4" style={{ color: 'var(--color-text)' }}>
                        {seller.name || '-'}
                      </td>
                      <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>
                        {new Date(seller.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => handleEditSeller(seller)}
                            className="px-3 py-1 rounded text-sm font-semibold text-white disabled:opacity-50"
                            style={{ backgroundColor: 'var(--color-accent)' }}
                            disabled={loading}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleResetPassword(seller._id, seller.email)}
                            className="px-3 py-1 rounded text-sm font-semibold text-white disabled:opacity-50"
                            style={{ backgroundColor: '#8b5cf6' }}
                            disabled={loading}
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleDeleteSellerStock(seller._id, seller.name || seller.email)}
                            className="px-3 py-1 rounded text-sm font-semibold text-white disabled:opacity-50"
                            style={{ backgroundColor: '#f59e0b' }}
                            disabled={loading}
                            title="Delete all inventory stock for this seller"
                          >
                            🗑️ Delete Stock
                          </button>
                          <button
                            onClick={() => handleDeleteSeller(seller._id, seller.email)}
                            className="px-3 py-1 rounded text-sm font-semibold text-white disabled:opacity-50"
                            style={{ backgroundColor: '#dc2626' }}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSellerManagementPage;
