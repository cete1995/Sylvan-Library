import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { priceApi } from '../api/price';
import { useAuth } from '../contexts/AuthContext';

const AdminPriceManagementPage: React.FC = () => {
  const { token } = useAuth();
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const data = await priceApi.getImportStatus(token);
      setStatus(data);
    } catch (error) {
      console.error('Failed to load status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!token) return;
    
    if (!confirm('This will download and import the latest price data from MTGJson. This may take several minutes. Continue?')) {
      return;
    }

    setImporting(true);
    setResult(null);
    setProgress(null);

    try {
      // Start import
      const importResponse = await priceApi.importPrices(token);
      console.log('Import started:', importResponse);
      
      // Connect to SSE for progress updates (EventSource doesn't support custom headers, so we pass token as query param)
      const eventSource = new EventSource(`http://localhost:5000/api/prices/import-progress?token=${encodeURIComponent(token)}`);

      eventSource.onopen = () => {
        console.log('SSE connection opened');
      };

      eventSource.onmessage = (event) => {
        console.log('Progress update:', event.data);
        try {
          const progressData = JSON.parse(event.data);
          setProgress(progressData);
          
          // Close connection when complete
          if (!progressData.isImporting && progressData.status === 'completed') {
            console.log('Import completed');
            eventSource.close();
            setImporting(false);
            setResult({
              success: true,
              imported: progressData.imported,
              skipped: progressData.skipped,
              total: progressData.totalCards,
              date: new Date().toISOString()
            });
            loadStatus(); // Refresh status
          } else if (progressData.status === 'error') {
            console.error('Import error from progress');
            eventSource.close();
            setImporting(false);
            alert('Import failed. Check console for details.');
          }
        } catch (err) {
          console.error('Failed to parse progress data:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        setImporting(false);
        alert('Connection to progress updates failed. Import may still be running in background.');
      };

    } catch (error: any) {
      console.error('Import error:', error);
      alert('Failed to start import: ' + (error.response?.data?.message || error.message));
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-lg hover:opacity-80 transition-all" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-accent)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Price Data Management</h1>
        <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>Import and manage MTG card pricing from MTGJson</p>

        {/* Current Status Card */}
        <div className="rounded-xl shadow-lg p-6 mb-6 border-t-4 border-blue-500" style={{ backgroundColor: 'var(--color-panel)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Import Status</h2>
            {loading && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <p style={{ color: 'var(--color-text-secondary)' }}>Loading status...</p>
              </div>
            </div>
          ) : status ? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: status.hasDataForToday ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)' }}>
                <div className="text-3xl mb-2">
                  {status.hasDataForToday ? '✓' : '⚠'}
                </div>
                <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Status</div>
                <div className={`font-semibold ${status.hasDataForToday ? 'text-green-600' : 'text-yellow-600'}`}>
                  {status.hasDataForToday ? 'Up to date' : 'Needs update'}
                </div>
              </div>

              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                <div className="text-3xl font-bold mb-2 text-blue-600">
                  {status.todayCount.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Cards with price data today
                </div>
              </div>

              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Latest import</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  {status.latestImportDate ? new Date(status.latestImportDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }) : 'Never'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600">Failed to load status. Please try again.</p>
            </div>
          )}
        </div>

        {/* Import Section */}
        <div className="rounded-xl shadow-lg p-6 border-t-4 border-green-500" style={{ backgroundColor: 'var(--color-panel)' }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Import Latest Prices</h2>
          
          {/* Progress Indicator */}
          {importing && progress && (
            <div className="mb-6 p-5 rounded-lg border-2" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-accent)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-accent)' }}></div>
                  <div>
                    <div className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
                      {progress.status === 'downloading' ? '📥 Downloading price data...' : 
                       progress.status === 'processing' ? '⚙️ Processing cards...' :
                       progress.status === 'completed' ? '✅ Completed!' : '🔄 Importing...'}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {progress.currentCard.toLocaleString()} of {progress.totalCards.toLocaleString()} cards
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                    {progress.percentage}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <div 
                  className="h-full transition-all duration-300 ease-out rounded-full"
                  style={{ 
                    width: `${progress.percentage}%`,
                    background: 'linear-gradient(to right, #10B981, #059669)',
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                  }}
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Imported</div>
                  <div className="text-xl font-bold text-green-600">{progress.imported.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Skipped</div>
                  <div className="text-xl font-bold text-gray-600">{progress.skipped.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* About Section */}
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)', borderLeft: '4px solid var(--color-accent)' }}>
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About Price Imports
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Downloads price data from MTGJson's AllPricesToday.json</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Includes CardKingdom retail and buylist prices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Includes TCGPlayer retail prices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Process may take 3-5 minutes for ~50,000+ cards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Only imports new data (won't duplicate today's data)</span>
              </li>
            </ul>
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            style={{ 
              backgroundColor: importing ? 'var(--color-text-secondary)' : 'var(--color-accent)',
              color: 'white'
            }}
          >
            {importing ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Importing Prices...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import Price Data from MTGJson
              </span>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="rounded-xl shadow-lg p-6 mt-6 border-t-4 border-green-500" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-600">Import Completed!</h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(result.date).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
                <div className="text-4xl font-bold text-white mb-2">
                  {result.imported.toLocaleString()}
                </div>
                <div className="text-sm text-green-100">Imported</div>
              </div>

              <div className="p-5 rounded-xl text-center" style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)' }}>
                <div className="text-4xl font-bold text-gray-600 mb-2">
                  {result.skipped.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Skipped (already exists)</div>
              </div>

              <div className="p-5 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
                <div className="text-4xl font-bold text-white mb-2">
                  {result.total.toLocaleString()}
                </div>
                <div className="text-sm text-blue-100">Total Processed</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPriceManagementPage;
