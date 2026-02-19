import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const AdminTikTokGetOrdersPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [apiResponse, setApiResponse] = useState<any>(null);
  
  // Credentials
  const [appKey, setAppKey] = useState(localStorage.getItem('tiktok_app_key') || '');
  const [appSecret, setAppSecret] = useState(localStorage.getItem('tiktok_app_secret') || '');
  const [accessToken, setAccessToken] = useState(localStorage.getItem('tiktok_access_token') || '');
  const [shopCipher, setShopCipher] = useState(localStorage.getItem('tiktok_shop_cipher') || '');
  
  // Date filters (last 7 days by default)
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const handleSaveCredentials = () => {
    localStorage.setItem('tiktok_app_key', appKey);
    localStorage.setItem('tiktok_app_secret', appSecret);
    localStorage.setItem('tiktok_access_token', accessToken);
    localStorage.setItem('tiktok_shop_cipher', shopCipher);
    alert('Credentials saved!');
  };

  const handleSyncOrders = async () => {
    if (!appKey || !appSecret || !accessToken || !shopCipher) {
      alert('Please fill in all credentials');
      return;
    }

    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    setLoading(true);
    setDebugLogs([]);
    setApiResponse(null);
    
    try {
      const requestBody = {
        appKey,
        appSecret,
        accessToken,
        shopCipher,
        startDate,
        endDate
      };

      const response = await api.post('/admin/tiktok/sync-orders', requestBody);
      
      if (response.data.success) {
        const logs = response.data.logs || [];
        
        // Separate API response from logs
        const logMessages: any[] = [];
        let rawResponse = null;
        
        for (let i = 0; i < logs.length; i++) {
          const log = logs[i];
          if (log.includes('📋 Full API Response:')) {
            if (i + 1 < logs.length) {
              try {
                rawResponse = JSON.parse(logs[i + 1]);
              } catch (e) {
                logMessages.push({ message: log });
              }
            }
          } else if (rawResponse && i > 0 && logs[i - 1].includes('📋 Full API Response:')) {
            continue;
          } else {
            logMessages.push({ message: log });
          }
        }
        
        setDebugLogs(logMessages);
        setApiResponse(rawResponse);
        setShowDebug(true);
        if (rawResponse) setShowResponse(true);
        
        const summary = response.data.summary;
        alert(`Sync completed!\n\nTotal Fetched: ${summary.totalFetched}\nNew Orders: ${summary.newOrders}\nSkipped (Duplicates): ${summary.skippedOrders}`);
      } else {
        // success: false — show logs + details from the response
        const backendLogs = (response.data.logs || []).map((l: string) => ({ message: l }));
        if (backendLogs.length === 0) {
          backendLogs.push({ message: '❌ Error: ' + (response.data.error || 'Unknown error') });
        }
        setDebugLogs(backendLogs);
        setShowDebug(true);
        if (response.data.details) {
          setApiResponse(response.data.details);
          setShowResponse(true);
        }
        alert('Failed to sync orders: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error syncing orders:', error);
      const errorData = error.response?.data;

      // Show backend logs from the error response if available
      const backendLogs: { message: string }[] = (errorData?.logs || []).map((l: string) => ({ message: l }));
      if (backendLogs.length === 0) {
        backendLogs.push({ message: '❌ Error: ' + (errorData?.error || error.message) });
        if (errorData?.details) {
          backendLogs.push({ message: '📋 TikTok API Response: ' + JSON.stringify(errorData.details, null, 2) });
        }
      }
      setDebugLogs(backendLogs);
      setShowDebug(true);

      // Show the raw TikTok API error body in the response panel
      const tikTokResponse = errorData?.details || errorData;
      if (tikTokResponse) {
        setApiResponse(tikTokResponse);
        setShowResponse(true);
      }

      alert('Error: ' + (errorData?.error || error.message));
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
                  Sync Orders from TikTok Shop
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Fetch and save orders to database from TikTok Shop API
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Credentials Section */}
        <div className="rounded-xl shadow-md p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            TikTok Shop API Credentials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                App Key
              </label>
              <input
                type="text"
                value={appKey}
                onChange={(e) => setAppKey(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
                placeholder="Enter App Key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                App Secret
              </label>
              <input
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
                placeholder="Enter App Secret"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Access Token
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
                placeholder="Enter Access Token"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Shop Cipher
              </label>
              <input
                type="text"
                value={shopCipher}
                onChange={(e) => setShopCipher(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
                placeholder="Enter Shop Cipher"
              />
            </div>
          </div>
          <button
            onClick={handleSaveCredentials}
            className="mt-4 px-6 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            Save Credentials
          </button>
        </div>

        {/* Sync Section */}
        <div className="rounded-xl shadow-md p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Sync Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSyncOrders}
                disabled={loading}
                className="w-full px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {loading ? 'Syncing...' : 'Sync to Database'}
              </button>
            </div>
          </div>
        </div>

        {/* Sync Logs */}
        {debugLogs.length > 0 && (
          <div className="rounded-xl shadow-md mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div 
              className="px-6 py-4 border-b flex items-center justify-between cursor-pointer" 
              style={{ borderColor: 'var(--color-border)' }} 
              onClick={() => setShowDebug(!showDebug)}
            >
              <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Sync Logs ({debugLogs.length})
              </h2>
              <svg className={`w-5 h-5 transition-transform ${showDebug ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {showDebug && (
              <div className="p-6">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => {
                      const text = debugLogs.map(l => l.message || JSON.stringify(l)).join('\n');
                      navigator.clipboard.writeText(text);
                      alert('Copied to clipboard!');
                    }}
                    className="px-3 py-1 rounded text-xs"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setDebugLogs([])}
                    className="px-3 py-1 rounded text-xs"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                  >
                    Clear
                  </button>
                </div>
                <div className="p-4 rounded max-h-96 overflow-y-auto" style={{ backgroundColor: '#1e1e1e' }}>
                  {debugLogs.map((log, idx) => {
                    const msg: string = log.message || JSON.stringify(log);
                    const isError = msg.includes('❌') || msg.toLowerCase().includes('error');
                    const isWarning = msg.includes('⚠️');
                    const isSuccess = msg.includes('✅');
                    const color = isError ? '#f87171' : isWarning ? '#fbbf24' : isSuccess ? '#4ade80' : '#d4d4d4';
                    return (
                      <div key={idx} className="text-xs font-mono mb-1 whitespace-pre-wrap" style={{ color }}>
                        {msg}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Response Terminal */}
        {apiResponse && (
          <div className="rounded-xl shadow-md mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div 
              className="px-6 py-4 border-b flex items-center justify-between cursor-pointer" 
              style={{ borderColor: 'var(--color-border)' }} 
              onClick={() => setShowResponse(!showResponse)}
            >
              <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                TikTok API Response
              </h2>
              <svg className={`w-5 h-5 transition-transform ${showResponse ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {showResponse && (
              <div className="p-6">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
                      alert('API Response copied to clipboard!');
                    }}
                    className="px-3 py-1 rounded text-xs"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                  >
                    Copy JSON
                  </button>
                  <button
                    onClick={() => setApiResponse(null)}
                    className="px-3 py-1 rounded text-xs"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                  >
                    Clear
                  </button>
                </div>
                <div className="p-4 rounded max-h-96 overflow-y-auto" style={{ backgroundColor: '#1e1e1e' }}>
                  <pre className="text-xs font-mono" style={{ color: '#d4d4d4' }}>
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        {!loading && debugLogs.length === 0 && (
          <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'var(--color-panel)' }}>
            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              Sync Orders
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Select a date range and click "Sync to Database" to fetch and save orders from TikTok Shop.
              <br />
              Duplicate orders will be automatically skipped.
            </p>
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center py-12 rounded-xl" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-accent)' }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTikTokGetOrdersPage;
