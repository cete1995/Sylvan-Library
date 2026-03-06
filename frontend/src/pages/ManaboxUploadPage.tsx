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

      {/* â”€â”€ Header â”€â”€ */}
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
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">ðŸ“¦ Manabox CSV Upload</h1>
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
            <span className="text-lg">ðŸ“‹</span> How to export from Manabox
          </h3>
          <ol className="space-y-2">
            {[
              'Open the Manabox app on your device',
              'Go to your collection',
              'Tap the menu (â‹®) â†’ Export â†’ CSV format',
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
                  {(file.size / 1024).toFixed(1)} KB Â· Tap to change file
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
              âŒ {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-3.5 rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
          >
            {uploading ? 'â³ Uploading...' : 'ðŸš€ Upload Collection'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <span>âœ…</span> Upload Results
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
                  âš ï¸ {result.stats.errors} errors occurred
                </p>
                {result.errors?.length > 0 && (
                  <ul className="text-xs space-y-1" style={{ color: '#f87171' }}>
                    {result.errors.map((err: any, idx: number) => (
                      <li key={idx}>Row {err.row}: {err.name} â€” {err.error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              ðŸ’¡ Upload complete! Prices are calculated automatically based on your pricing tiers.
            </p>
          </div>
        )}

        {/* What happens card */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <span>â„¹ï¸</span> What happens when you upload?
          </h3>
          <ul className="space-y-2">
            {[
              ['ðŸ’±', 'Currency Conversion', 'USD prices are converted to IDR (~Rp 15,500/USD)'],
              ['ðŸ“Š', 'Condition Mapping', 'Near Mint â†’ NM, Light Played â†’ LP'],
              ['âœ¨', 'Foil Detection', 'Normal â†’ Nonfoil, Foil â†’ Foil, Etched â†’ Etched'],
              ['ðŸ“¦', 'Inventory Tracking', 'Cards are added to your seller inventory'],
              ['ðŸ’°', 'Pricing', 'Sell prices calculated based on admin pricing tiers'],
              ['ðŸ”„', 'Deduplication', 'If card exists, quantity is added to existing stock'],
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
