import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ubPricingApi, PriceTier } from '../api/ubPricing';

const AdminUBSettingsPage: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Settings state
  const [ubSets, setUbSets] = useState<string[]>([]);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([
    { maxPrice: 5, multiplier: 20000 },
    { maxPrice: 999999, multiplier: 15000 }
  ]);

  // Form state
  const [newSetCode, setNewSetCode] = useState('');
  const [newTierMaxPrice, setNewTierMaxPrice] = useState<number>(10);
  const [newTierMultiplier, setNewTierMultiplier] = useState<number>(18000);

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
        setPriceTiers(result.settings.priceTiers || [
          { maxPrice: 5, multiplier: 20000 },
          { maxPrice: 999999, multiplier: 15000 }
        ]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load UB settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePriceTiers = async () => {
    if (!token) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await ubPricingApi.updatePriceTiers(token, priceTiers);
      if (result.success) {
        setMessage('Price tiers updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update price tiers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTier = () => {
    if (newTierMaxPrice <= 0 || newTierMultiplier <= 0) {
      setError('Max price and multiplier must be positive numbers');
      return;
    }

    const newTiers = [...priceTiers, { maxPrice: newTierMaxPrice, multiplier: newTierMultiplier }];
    // Sort by maxPrice ascending
    newTiers.sort((a, b) => a.maxPrice - b.maxPrice);
    setPriceTiers(newTiers);
    setNewTierMaxPrice(10);
    setNewTierMultiplier(18000);
    setError('');
  };

  const handleRemoveTier = (index: number) => {
    if (priceTiers.length <= 1) {
      setError('Cannot remove the last tier. At least one tier is required.');
      return;
    }
    const newTiers = priceTiers.filter((_, i) => i !== index);
    setPriceTiers(newTiers);
  };

  const handleUpdateTier = (index: number, field: 'maxPrice' | 'multiplier', value: number) => {
    const newTiers = [...priceTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    
    // Re-sort if maxPrice changed
    if (field === 'maxPrice') {
      newTiers.sort((a, b) => a.maxPrice - b.maxPrice);
    }
    
    setPriceTiers(newTiers);
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
        <h1 className="text-4xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
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
            Price Multiplier Tiers
          </h2>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Configure tiered multipliers based on CardKingdom price ranges for Universe Beyond sets.
            Prices are matched to the first tier where CK price ≤ max price.
          </p>

          {/* Add New Tier Form */}
          <div className="mb-6 p-4 rounded border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              Add New Tier
            </h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                  Max CK Price ($)
                </label>
                <input
                  type="number"
                  value={newTierMaxPrice}
                  onChange={(e) => setNewTierMaxPrice(Number(e.target.value))}
                  className="input w-full"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g., 10"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                  Multiplier (IDR)
                </label>
                <input
                  type="number"
                  value={newTierMultiplier}
                  onChange={(e) => setNewTierMultiplier(Number(e.target.value))}
                  className="input w-full"
                  min="1"
                  step="100"
                  placeholder="e.g., 18000"
                />
              </div>
              <button
                onClick={handleAddTier}
                disabled={loading}
                className="px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50"
                style={{ 
                  backgroundColor: 'var(--color-highlight)',
                  color: 'var(--color-panel)'
                }}
              >
                Add Tier
              </button>
            </div>
          </div>

          {/* Current Tiers Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              Current Price Tiers
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background)' }}>
                    <th className="p-3 text-left border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      Max CK Price
                    </th>
                    <th className="p-3 text-left border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      Multiplier
                    </th>
                    <th className="p-3 text-left border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      Example (CK $2)
                    </th>
                    <th className="p-3 text-left border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {priceTiers.map((tier, index) => (
                    <tr key={index} style={{ backgroundColor: 'var(--color-panel)' }}>
                      <td className="p-3 border" style={{ borderColor: 'var(--color-border)' }}>
                        <input
                          type="number"
                          value={tier.maxPrice}
                          onChange={(e) => handleUpdateTier(index, 'maxPrice', Number(e.target.value))}
                          className="input w-32"
                          min="0.01"
                          step="0.01"
                        />
                      </td>
                      <td className="p-3 border" style={{ borderColor: 'var(--color-border)' }}>
                        <input
                          type="number"
                          value={tier.multiplier}
                          onChange={(e) => handleUpdateTier(index, 'multiplier', Number(e.target.value))}
                          className="input w-32"
                          min="1"
                          step="100"
                        />
                      </td>
                      <td className="p-3 border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        Rp. {(2 * tier.multiplier).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 border" style={{ borderColor: 'var(--color-border)' }}>
                        <button
                          onClick={() => handleRemoveTier(index)}
                          disabled={loading || priceTiers.length <= 1}
                          className="text-red-600 hover:text-red-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove tier"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'var(--color-background)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <strong>How it works:</strong> When calculating prices, the system finds the first tier where 
                the CK price is ≤ the max price. For your highest tier, use a very large number (e.g., 999999) 
                to catch all remaining cards.
              </p>
            </div>
          </div>

          <button
            onClick={handleUpdatePriceTiers}
            disabled={loading}
            className="px-6 py-3 rounded font-semibold transition-colors disabled:opacity-50 text-lg"
            style={{ 
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-panel)'
            }}
          >
            {loading ? 'Saving...' : 'Save All Price Tiers'}
          </button>
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
