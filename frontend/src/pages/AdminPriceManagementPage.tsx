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
              total: progressData.totalCards
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/admin/dashboard" className="hover:underline mb-4 inline-block" style={{ color: 'var(--color-accent)' }}>
        ← Back to Dashboard
      </Link>

      <h1 className="text-4xl font-bold mb-8" style={{ color: 'var(--color-text)' }}>Price Data Management</h1>

      {/* Current Status */}
      <div className="rounded-lg shadow p-6 mb-8" style={{ backgroundColor: 'var(--color-panel)' }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Import Status</h2>
        
        {loading ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        ) : status ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--color-text)' }}>Status:</span>
              <span className={`font-semibold ${status.hasDataForToday ? 'text-green-600' : 'text-yellow-600'}`}>
                {status.hasDataForToday ? '✓ Up to date' : '⚠ No data for today'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--color-text)' }}>Cards with price data today:</span>
              <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {status.todayCount.toLocaleString()}
              </span>
            </div>

            {status.latestImportDate && (
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--color-text)' }}>Latest import:</span>
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  {new Date(status.latestImportDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-red-600">Failed to load status</p>
        )}
      </div>

      {/* Import Section */}
      <div className="rounded-lg shadow p-6 mb-8" style={{ backgroundColor: 'var(--color-panel)' }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Import Latest Prices</h2>
        
        {/* Progress Indicator */}
        {importing && progress && (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: 'var(--color-text)' }}>
                  {progress.status === 'downloading' ? 'Downloading...' : 
                   progress.status === 'processing' ? 'Processing cards...' :
                   progress.status === 'completed' ? 'Completed!' : 'Importing...'}
                </span>
                <span style={{ color: 'var(--color-text)' }}>
                  {progress.currentCard.toLocaleString()} / {progress.totalCards.toLocaleString()} ({progress.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${progress.percentage}%`,
                    backgroundColor: 'var(--color-accent)'
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              <span>Imported: {progress.imported.toLocaleString()}</span>
              <span>Skipped: {progress.skipped.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)', borderLeft: '4px solid var(--color-accent)' }}>
          <h3 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>About Price Imports</h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <li>• Downloads price data from MTGJson's AllPricesToday.json</li>
            <li>• Includes CardKingdom retail and buylist prices</li>
            <li>• Includes TCGPlayer retail prices</li>
            <li>• Process may take 3-5 minutes for ~50,000+ cards</li>
            <li>• Only imports new data (won't duplicate today's data)</li>
          </ul>
        </div>

        <button
          onClick={handleImport}
          disabled={importing}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Importing Prices...
            </span>
          ) : (
            '📥 Import Price Data from MTGJson'
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="rounded-lg p-6 bg-green-50 border border-green-200">
          <h2 className="text-2xl font-bold mb-4 text-green-800">Import Completed!</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-bold text-green-600">{result.imported.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Imported</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-600">{result.skipped.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Skipped (already exists)</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{result.total.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Processed</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Import Date: {new Date(result.date).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminPriceManagementPage;
