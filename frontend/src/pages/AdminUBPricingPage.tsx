import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ubPricingApi } from '../api/ubPricing';
import { UB_SETS } from '../utils/ubPricing';

const AdminUBPricingPage: React.FC = () => {
  const { token } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedSet, setSelectedSet] = useState('');

  const handleSyncAll = async () => {
    if (!token) return;

    try {
      setSyncing(true);
      setResult(null);
      const data = await ubPricingApi.syncUBPrices(token);
      setResult(data);
    } catch (err: any) {
      setResult({
        success: false,
        error: err.response?.data?.error || 'Failed to sync prices'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSet = async () => {
    if (!token || !selectedSet) return;

    try {
      setSyncing(true);
      setResult(null);
      const data = await ubPricingApi.syncUBPrices(token, { setCode: selectedSet });
      setResult(data);
    } catch (err: any) {
      setResult({
        success: false,
        error: err.response?.data?.error || 'Failed to sync prices'
      });
    } finally {
      setSyncing(false);
    }
  };

  const ubSetsArray = Array.from(UB_SETS).sort();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        to="/admin/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm hover:opacity-80 transition-all"
        style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3" style={{ color: 'var(--color-text)' }}>
          <span className="px-4 py-2 rounded-lg" style={{ background: 'linear-gradient(to right, #8B5CF6, #EC4899)', color: 'white' }}>
            🌌
          </span>
          UB Pricing Management
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Sync Universe Beyond set prices based on CardKingdom prices
        </p>
      </div>

      {/* Pricing Rules */}
      <div className="rounded-xl shadow-lg p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Pricing Rules</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
            <div className="text-2xl">📊</div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--color-text)' }}>CK Price &lt; $5</div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Sell Price = CK Price × 20,000</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
            <div className="text-2xl">📈</div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--color-text)' }}>CK Price ≥ $5</div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Sell Price = CK Price × 15,000</div>
            </div>
          </div>
        </div>
      </div>

      {/* UB Sets List */}
      <div className="rounded-xl shadow-lg p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Universe Beyond Sets</h2>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {ubSetsArray.map(setCode => (
            <div 
              key={setCode} 
              className="px-3 py-2 rounded-lg text-center font-bold text-sm"
              style={{ 
                background: selectedSet === setCode 
                  ? 'linear-gradient(to right, #8B5CF6, #EC4899)' 
                  : 'var(--color-background)',
                color: selectedSet === setCode ? 'white' : 'var(--color-text)'
              }}
            >
              {setCode}
            </div>
          ))}
        </div>
      </div>

      {/* Sync Options */}
      <div className="rounded-xl shadow-lg p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Sync Prices</h2>
        
        <div className="space-y-4">
          {/* Sync All */}
          <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>Sync All UB Sets</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              This will update prices for all cards in all UB sets based on latest CardKingdom prices
            </p>
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="w-full px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(to right, #8B5CF6, #EC4899)', color: 'white' }}
            >
              {syncing ? '⏳ Syncing All Sets...' : '🔄 Sync All UB Sets'}
            </button>
          </div>

          {/* Sync Specific Set */}
          <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>Sync Specific Set</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Select a set and sync only that set's prices
            </p>
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg mb-3 focus:ring-2 focus:border-transparent"
              style={{ 
                backgroundColor: 'var(--color-background)', 
                color: 'var(--color-text)', 
                borderColor: 'var(--color-text-secondary)' 
              }}
            >
              <option value="">-- Select a UB Set --</option>
              {ubSetsArray.map(setCode => (
                <option key={setCode} value={setCode}>{setCode}</option>
              ))}
            </select>
            <button
              onClick={handleSyncSet}
              disabled={syncing || !selectedSet}
              className="w-full px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(to right, #8B5CF6, #EC4899)', color: 'white' }}
            >
              {syncing ? `⏳ Syncing ${selectedSet}...` : `🔄 Sync ${selectedSet || 'Set'}`}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className={`rounded-xl shadow-lg p-6 ${result.success ? 'border-2' : 'border-2'}`} 
          style={{ 
            backgroundColor: 'var(--color-panel)',
            borderColor: result.success ? '#10B981' : '#EF4444'
          }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: result.success ? '#10B981' : '#EF4444' }}>
            {result.success ? '✅ Sync Complete' : '❌ Sync Failed'}
          </h2>
          
          {result.success ? (
            <div className="space-y-3">
              <p style={{ color: 'var(--color-text)' }}>{result.message}</p>
              
              {result.stats && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--color-background)' }}>
                    <div className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>{result.stats.total}</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Cards</div>
                  </div>
                  <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--color-background)' }}>
                    <div className="text-3xl font-bold" style={{ color: '#10B981' }}>{result.stats.updated}</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Updated</div>
                  </div>
                  <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--color-background)' }}>
                    <div className="text-3xl font-bold" style={{ color: 'var(--color-text-secondary)' }}>{result.stats.skipped}</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Skipped</div>
                  </div>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>Errors ({result.errors.length}):</h3>
                  <div className="max-h-40 overflow-y-auto p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-background)' }}>
                    {result.errors.map((err: string, idx: number) => (
                      <div key={idx} className="mb-1" style={{ color: '#EF4444' }}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#EF4444' }}>{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUBPricingPage;
