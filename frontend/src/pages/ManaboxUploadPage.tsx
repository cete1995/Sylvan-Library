import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ManaboxUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    setUploading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('/api/manabox/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setResult(response.data);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen pb-28 md:pb-10" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* ── Header ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: '#a78bfa' }} />
        <div className="relative container mx-auto px-4 py-7 max-w-3xl">
          <Link
            to="/seller/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold mb-5 transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Seller Dashboard
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#c4b5fd' }}>Seller Tools</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">📦 Manabox CSV Upload</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Upload your collection export to add inventory automatically
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-5">

        {/* How to export instructions */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--color-panel)', border: '1.5px solid rgba(99,102,241,0.4)' }}
        >
          <h3 className="font-bold text-base mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <span className="text-lg">📋</span> How to export from Manabox
          </h3>
          <ol className="space-y-2">
            {[
              'Open the Manabox app on your device',
              'Go to your collection',
              'Tap the menu (⋮) → Export → CSV format',
              'Save or share the CSV file to this device',
              'Upload the file using the form below',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Upload form */}
        <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--color-text)' }}>Upload CSV File</h2>

          {/* Drag / pick area */}
          <label
            className="flex flex-col items-center justify-center w-full rounded-xl cursor-pointer transition-all py-8 px-4 text-center mb-4"
            style={{
              border: `2px dashed ${file ? '#6366f1' : 'var(--color-border)'}`,
              backgroundColor: file ? 'rgba(99,102,241,0.06)' : 'var(--color-background)',
            }}
          >
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            {file ? (
              <>
                <svg className="w-10 h-10 mb-3" style={{ color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="font-bold text-sm" style={{ color: '#6366f1' }}>{file.name}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {(file.size / 1024).toFixed(1)} KB · Tap to change file
                </p>
              </>
            ) : (
              <>
                <svg className="w-10 h-10 mb-3" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Tap to select CSV file</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Only .csv files are accepted</p>
              </>
            )}
          </label>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
              ❌ {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-3.5 rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
          >
            {uploading ? '⏳ Uploading...' : '🚀 Upload Collection'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <span>✅</span> Upload Results
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Total Rows',  value: result.stats.totalRows,  bg: 'rgba(99,102,241,0.12)',  color: '#818cf8' },
                { label: 'Processed',   value: result.stats.processed,  bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
                { label: 'Added',       value: result.stats.added,      bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa' },
                { label: 'Updated',     value: result.stats.updated,    bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24' },
              ].map(({ label, value, bg, color }) => (
                <div key={label} className="rounded-xl p-4 text-center" style={{ backgroundColor: bg }}>
                  <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</p>
                </div>
              ))}
            </div>

            {result.stats.errors > 0 && (
              <div className="rounded-xl p-4 mb-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <p className="font-bold text-sm mb-2" style={{ color: '#ef4444' }}>
                  ⚠️ {result.stats.errors} errors occurred
                </p>
                {result.errors?.length > 0 && (
                  <ul className="text-xs space-y-1" style={{ color: '#f87171' }}>
                    {result.errors.map((err: any, idx: number) => (
                      <li key={idx}>Row {err.row}: {err.name} — {err.error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              💡 Upload complete! Prices are calculated automatically based on your pricing tiers.
            </p>
          </div>
        )}

        {/* What happens card */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <span>ℹ️</span> What happens when you upload?
          </h3>
          <ul className="space-y-2">
            {[
              ['💱', 'Currency Conversion', 'USD prices are converted to IDR (~Rp 15,500/USD)'],
              ['📊', 'Condition Mapping', 'Near Mint → NM, Light Played → LP'],
              ['✨', 'Foil Detection', 'Normal → Nonfoil, Foil → Foil, Etched → Etched'],
              ['📦', 'Inventory Tracking', 'Cards are added to your seller inventory'],
              ['💰', 'Pricing', 'Sell prices calculated based on admin pricing tiers'],
              ['🔄', 'Deduplication', 'If card exists, quantity is added to existing stock'],
            ].map(([icon, title, desc]) => (
              <li key={title as string} className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">{icon}</span>
                <div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{title}: </span>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default ManaboxUploadPage;
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/manabox/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            📦 Manabox Collection Upload
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Upload your collection from Manabox app to sell on our platform
          </p>
        </div>

        {/* Instructions Card */}
        <div className="mb-6 p-6 rounded-lg border-2 border-blue-400 bg-blue-50">
          <h3 className="font-bold text-lg mb-3 text-blue-900">📋 How to export from Manabox:</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li><strong>1.</strong> Open Manabox app on your device</li>
            <li><strong>2.</strong> Go to your collection</li>
            <li><strong>3.</strong> Tap the menu (⋮) → Export → CSV format</li>
            <li><strong>4.</strong> Save the CSV file</li>
            <li><strong>5.</strong> Upload the file here</li>
          </ol>
        </div>

        {/* Upload Card */}
        <div className="p-6 rounded-lg shadow-md mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            Upload CSV File
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              Select Manabox CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border rounded-lg"
              style={{
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
            />
            {file && (
              <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                ✅ Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <p className="font-semibold">❌ Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-3 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
          >
            {uploading ? '⏳ Uploading...' : '🚀 Upload Collection'}
          </button>
        </div>

        {/* Results Card */}
        {result && (
          <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: 'var(--color-panel)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              ✅ Upload Results
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-blue-100">
                <p className="text-sm text-blue-600 font-semibold">Total Rows</p>
                <p className="text-2xl font-bold text-blue-900">{result.stats.totalRows}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-100">
                <p className="text-sm text-green-600 font-semibold">Processed</p>
                <p className="text-2xl font-bold text-green-900">{result.stats.processed}</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-100">
                <p className="text-sm text-purple-600 font-semibold">Added</p>
                <p className="text-2xl font-bold text-purple-900">{result.stats.added}</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-100">
                <p className="text-sm text-yellow-600 font-semibold">Updated</p>
                <p className="text-2xl font-bold text-yellow-900">{result.stats.updated}</p>
              </div>
            </div>

            {result.stats.errors > 0 && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="font-bold text-red-800 mb-2">
                  ⚠️ {result.stats.errors} errors occurred
                </p>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-red-700 mb-2">First {result.errors.length} errors:</p>
                    <ul className="text-xs text-red-600 space-y-1">
                      {result.errors.map((err: any, idx: number) => (
                        <li key={idx}>
                          Row {err.row}: {err.name} - {err.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                💡 Your collection has been uploaded! Prices will be calculated automatically based on your pricing tiers.
              </p>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 p-6 rounded-lg border-2 border-gray-300" style={{ backgroundColor: 'var(--color-panel)' }}>
          <h3 className="font-bold text-lg mb-3" style={{ color: 'var(--color-text)' }}>
            ℹ️ What happens when you upload?
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <li>• <strong>Automatic Conversion:</strong> USD prices are converted to IDR (~Rp 15,500/USD)</li>
            <li>• <strong>Condition Mapping:</strong> Near Mint → NM, Light Played → LP</li>
            <li>• <strong>Foil Detection:</strong> Normal → Nonfoil, Foil → Foil, Etched → Etched</li>
            <li>• <strong>Inventory Tracking:</strong> Cards are added to your seller inventory</li>
            <li>• <strong>Pricing:</strong> Sell prices calculated based on admin pricing tiers</li>
            <li>• <strong>Deduplication:</strong> If card exists, quantity is added to existing inventory</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManaboxUploadPage;
