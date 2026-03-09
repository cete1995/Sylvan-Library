import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin';

const AdminMissingImagesPage: React.FC = () => {
  const [sets, setSets] = useState<Array<{setCode: string; setName: string; cardCount: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [importingSet, setImportingSet] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Bulk download state
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkAbort, setBulkAbort] = useState(false);
  const bulkAbortRef = React.useRef(false);
  const [bulkDone, setBulkDone] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkCurrentSet, setBulkCurrentSet] = useState<string>('');
  const [bulkLog, setBulkLog] = useState<Array<{ setCode: string; ok: boolean; msg: string }>>([]);

  // Cleanup duplicate names state
  const [cleaningUp, setCleaningUp] = useState(false);
  const [cleanupMsg, setCleanupMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSetsWithMissingImages();
  }, []);

  const handleImportAll = async () => {
    if (sets.length === 0) return;
    setBulkImporting(true);
    setBulkAbort(false);
    bulkAbortRef.current = false;
    setBulkDone(0);
    setBulkTotal(sets.length);
    setBulkCurrentSet('');
    setBulkLog([]);

    for (let i = 0; i < sets.length; i++) {
      if (bulkAbortRef.current) break;
      const set = sets[i];
      setBulkCurrentSet(set.setCode);
      setBulkDone(i);
      try {
        const result = await adminApi.importSetFromMTGJson(set.setCode);
        setBulkLog(prev => [...prev, { setCode: set.setCode, ok: true, msg: `✅ ${set.setName} — ${result.imported}/${result.totalCards} cards` }]);
        setImportResults(prev => ({ ...prev, [set.setCode]: { success: true, message: `✅ ${result.imported}/${result.totalCards}` } }));
      } catch (err: any) {
        const msg = err.response?.data?.error || err.message || 'Import failed';
        setBulkLog(prev => [...prev, { setCode: set.setCode, ok: false, msg: `❌ ${set.setName} — ${msg}` }]);
        setImportResults(prev => ({ ...prev, [set.setCode]: { success: false, message: `❌ ${msg}` } }));
      }
    }

    setBulkDone(prev => bulkAbortRef.current ? prev : sets.length);
    setBulkCurrentSet('');
    setBulkImporting(false);
    // Refresh list
    setTimeout(() => loadSetsWithMissingImages(), 1000);
  };

  const handleImportFromMTGJson = async (setCode: string) => {
    setImportingSet(setCode);
    setImportResults(prev => ({ ...prev, [setCode]: { success: false, message: '' } }));
    try {
      const result = await adminApi.importSetFromMTGJson(setCode);
      setImportResults(prev => ({
        ...prev,
        [setCode]: { success: true, message: `✅ Imported ${result.imported}/${result.totalCards} cards` }
      }));
      // Refresh the list after a moment
      setTimeout(() => loadSetsWithMissingImages(), 1500);
    } catch (err: any) {
      setImportResults(prev => ({
        ...prev,
        [setCode]: { success: false, message: `❌ ${err.response?.data?.error || err.message || 'Import failed'}` }
      }));
    } finally {
      setImportingSet(null);
    }
  };

  const loadSetsWithMissingImages = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getSetsWithMissingImages();
      setSets(data.sets);
    } catch {
      // error shown via empty state
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupCombinedNames = async () => {
    setCleaningUp(true);
    setCleanupMsg(null);
    try {
      const result = await adminApi.cleanupCombinedNames();
      setCleanupMsg(`✅ ${result.message}`);
      setTimeout(() => loadSetsWithMissingImages(), 1000);
    } catch (err: any) {
      setCleanupMsg(`❌ ${err.response?.data?.error || err.message || 'Cleanup failed'}`);
    } finally {
      setCleaningUp(false);
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
                  Sets with Missing Images
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Cards that need image URLs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Cleanup duplicate combined names button */}
              <button
                onClick={handleCleanupCombinedNames}
                disabled={cleaningUp || bulkImporting}
                className="px-3 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-40 text-sm"
                style={{ backgroundColor: '#f59e0b', color: 'white' }}
                title="Remove duplicate cards created by old imports (e.g. 'A // B' vs 'A')"
              >
                {cleaningUp ? '⏳' : '🧹'} Fix Names
              </button>
              {/* Download All button */}
              {!bulkImporting ? (
                <button
                  onClick={handleImportAll}
                  disabled={loading || sets.length === 0}
                  className="px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40"
                  style={{ backgroundColor: '#6366f1', color: 'white' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download All ({sets.length})
                </button>
              ) : (
                <button
                  onClick={() => { bulkAbortRef.current = true; setBulkAbort(true); }}
                  className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                >
                  ⏹ Stop
                </button>
              )}
              <button
                onClick={loadSetsWithMissingImages}
                className="px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}
                disabled={loading || bulkImporting}
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cleanup result message */}
      {cleanupMsg && (
        <div className="px-4 py-2 border-b" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
          <div className="max-w-7xl mx-auto">
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>{cleanupMsg}</p>
          </div>
        </div>
      )}

      {/* Bulk Import Progress Panel */}
      {(bulkImporting || bulkLog.length > 0) && (
        <div className="border-b px-4 py-4" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
          <div className="max-w-7xl mx-auto">
            {/* Status line */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {bulkImporting
                  ? `⬇️ Downloading ${bulkCurrentSet ? `${bulkCurrentSet}…` : '…'}`
                  : bulkAbort ? '⏹ Stopped' : '✅ All done!'}
              </span>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {bulkDone} / {bulkTotal} sets
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full rounded-full h-3 overflow-hidden mb-3" style={{ backgroundColor: 'var(--color-background)' }}>
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{
                  width: bulkTotal > 0 ? `${Math.round((bulkDone / bulkTotal) * 100)}%` : '0%',
                  backgroundColor: bulkAbort ? '#ef4444' : bulkImporting ? '#6366f1' : '#10b981',
                }}
              />
            </div>

            {/* Log */}
            {bulkLog.length > 0 && (
              <div
                className="max-h-32 overflow-y-auto rounded-lg px-3 py-2 text-xs font-mono space-y-0.5"
                style={{ backgroundColor: 'var(--color-background)' }}
              >
                {[...bulkLog].reverse().map((entry, i) => (
                  <div key={i} style={{ color: entry.ok ? '#10b981' : '#ef4444' }}>
                    {entry.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-accent)' }}></div>
          </div>
        ) : sets.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'var(--color-panel)' }}>
            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              All Clear!
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              All cards have images. Great job!
            </p>
          </div>
        ) : (
          <div>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="rounded-xl shadow-md p-6 border-l-4" style={{ backgroundColor: 'var(--color-panel)', borderColor: '#ef4444' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      Total Sets
                    </p>
                    <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
                      {sets.length}
                    </p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rounded-xl shadow-md p-6 border-l-4" style={{ backgroundColor: 'var(--color-panel)', borderColor: '#f59e0b' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      Total Cards
                    </p>
                    <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
                      {sets.reduce((sum, set) => sum + set.cardCount, 0)}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rounded-xl shadow-md p-6 border-l-4" style={{ backgroundColor: 'var(--color-panel)', borderColor: '#8b5cf6' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      Avg per Set
                    </p>
                    <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
                      {sets.length > 0 ? Math.round(sets.reduce((sum, set) => sum + set.cardCount, 0) / sets.length) : 0}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Sets List */}
            <div className="rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: 'var(--color-panel)' }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  Sets ({sets.length})
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Click on a set to view and manage cards without images
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {sets.map((set) => (
                  <div
                    key={set.setCode}
                    className="flex items-center px-6 py-4 transition-all"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-background)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Set icon */}
                    <div className="flex-shrink-0 mr-4">
                      <i
                        className={`ss ss-${set.setCode.toLowerCase()} ss-3x`}
                        style={{ color: 'var(--color-text)' }}
                      ></i>
                    </div>

                    {/* Set info — clicking navigates */}
                    <Link
                      to={`/admin/cards?set=${set.setCode}&missingImages=true`}
                      className="flex-1 min-w-0 group"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg truncate" style={{ color: 'var(--color-text)' }}>
                          {set.setName}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Missing Images
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          {set.setCode.toUpperCase()}
                        </span>
                        <span className="text-sm flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {set.cardCount} card{set.cardCount !== 1 ? 's' : ''} without images
                        </span>
                      </div>
                    </Link>

                    {/* Import result message */}
                    {importResults[set.setCode]?.message && (
                      <span
                        className="text-xs font-medium mr-3 max-w-[160px] text-right"
                        style={{ color: importResults[set.setCode].success ? '#10b981' : '#ef4444' }}
                      >
                        {importResults[set.setCode].message}
                      </span>
                    )}

                    {/* Import button */}
                    <button
                      onClick={() => handleImportFromMTGJson(set.setCode)}
                      disabled={importingSet === set.setCode}
                      className="flex-shrink-0 ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#6366f1', color: 'white' }}
                      title={`Fetch https://mtgjson.com/api/v5/${set.setCode.toUpperCase()}.json and import`}
                    >
                      {importingSet === set.setCode ? '⏳ Importing...' : '⬇️ Import JSON'}
                    </button>

                    {/* Navigate arrow */}
                    <div className="flex-shrink-0 ml-3">
                      <Link to={`/admin/cards?set=${set.setCode}&missingImages=true`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-secondary)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMissingImagesPage;
