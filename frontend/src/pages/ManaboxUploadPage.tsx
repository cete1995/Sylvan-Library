import React, { useState } from 'react';
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
