import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ubPricingApi } from '../api/ubPricing';

const AdminUBSettingsPage: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Settings state
  const [ubSets, setUbSets] = useState<string[]>([]);
  const [multiplierUnder5, setMultiplierUnder5] = useState(20000);
  const [multiplier5AndAbove, setMultiplier5AndAbove] = useState(15000);

  // Form state
  const [newSetCode, setNewSetCode] = useState('');

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const result = await ubPricingApi.getUBSettings(token);
      if (result.success && result.settings) {
        setUbSets(result.settings.ubSets || []);
        setMultiplierUnder5(result.settings.multiplierUnder5 || 20000);
        setMultiplier5AndAbove(result.settings.multiplier5AndAbove || 15000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load UB settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMultipliers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await ubPricingApi.updateMultipliers(token, multiplierUnder5, multiplier5AndAbove);
      if (result.success) {
        setMessage('Multipliers updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update multipliers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newSetCode.trim()) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await ubPricingApi.addUBSet(token, newSetCode.trim());
      if (result.success) {
        setMessage(`Set code ${newSetCode.toUpperCase()} added successfully!`);
        setUbSets(result.ubSets || []);
        setNewSetCode('');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add set code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSet = async (setCode: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to remove ${setCode} from UB sets?`)) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await ubPricingApi.removeUBSet(token, setCode);
      if (result.success) {
        setMessage(`Set code ${setCode} removed successfully!`);
        setUbSets(result.ubSets || []);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove set code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6" style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
          🌌 UB Settings Configuration
        </h1>

        {/* Messages */}
        {message && (
          <div className="mb-4 alert-success">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 alert-error">
            {error}
          </div>
        )}

        {/* Multipliers Section */}
        <div className="mb-8 p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--color-panel)' }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            Price Multipliers
          </h2>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Configure how CardKingdom prices are converted to Rupiah for Universe Beyond sets.
          </p>

          <form onSubmit={handleUpdateMultipliers} className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold" style={{ color: 'var(--color-text)' }}>
                Multiplier for CK Price {'<'} $5
              </label>
              <input
                type="number"
                value={multiplierUnder5}
                onChange={(e) => setMultiplierUnder5(Number(e.target.value))}
                className="input"
                min="1"
                step="100"
                required
              />
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Example: CK $2.50 × {multiplierUnder5.toLocaleString()} = Rp. {(2.5 * multiplierUnder5).toLocaleString('id-ID')}
              </p>
            </div>

            <div>
              <label className="block mb-2 font-semibold" style={{ color: 'var(--color-text)' }}>
                Multiplier for CK Price ≥ $5
              </label>
              <input
                type="number"
                value={multiplier5AndAbove}
                onChange={(e) => setMultiplier5AndAbove(Number(e.target.value))}
                className="input"
                min="1"
                step="100"
                required
              />
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Example: CK $8.00 × {multiplier5AndAbove.toLocaleString()} = Rp. {(8 * multiplier5AndAbove).toLocaleString('id-ID')}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded font-semibold transition-colors disabled:opacity-50"
              style={{ 
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-panel)'
              }}
            >
              {loading ? 'Updating...' : 'Update Multipliers'}
            </button>
          </form>
        </div>

        {/* UB Sets Management Section */}
        <div className="mb-8 p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--color-panel)' }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            Universe Beyond Sets
          </h2>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Manage which set codes are considered Universe Beyond sets for special pricing.
          </p>

          {/* Add Set Form */}
          <form onSubmit={handleAddSet} className="mb-6 flex gap-2">
            <input
              type="text"
              value={newSetCode}
              onChange={(e) => setNewSetCode(e.target.value.toUpperCase())}
              placeholder="Enter set code (e.g., SPE)"
              className="input flex-1"
              maxLength={10}
            />
            <button
              type="submit"
              disabled={loading || !newSetCode.trim()}
              className="px-6 py-2 rounded font-semibold transition-colors disabled:opacity-50"
              style={{ 
                backgroundColor: 'var(--color-highlight)',
                color: 'var(--color-panel)'
              }}
            >
              Add Set
            </button>
          </form>

          {/* Sets Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ubSets.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)' }}>No UB sets configured yet.</p>
            ) : (
              ubSets.map((setCode) => (
                <div
                  key={setCode}
                  className="flex items-center justify-between p-3 rounded border"
                  style={{ 
                    backgroundColor: 'var(--color-background)',
                    borderColor: 'var(--color-border)'
                  }}
                >
                  <span className="font-mono font-bold" style={{ color: 'var(--color-text)' }}>
                    {setCode}
                  </span>
                  <button
                    onClick={() => handleRemoveSet(setCode)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800 font-bold disabled:opacity-50"
                    title="Remove set"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <p className="mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Total UB Sets: {ubSets.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminUBSettingsPage;
