import React, { useState } from 'react';
import { adminApi } from '../api/admin';

const AdminSetUploadPage: React.FC = () => {
  const [jsonData, setJsonData] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!jsonData.trim()) {
      setError('Please paste the set JSON data');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const data = JSON.parse(jsonData);
      const response = await adminApi.uploadSet(data);
      setResult(response);
    } catch (error: any) {
      console.error('Upload error:', error);
      if (error instanceof SyntaxError) {
        setError('Invalid JSON format');
      } else {
        setError(error.response?.data?.error || 'Failed to upload set');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonData(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Upload MTG Set JSON</h1>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Download a set JSON from <a href="https://mtgjson.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">MTGJson.com</a></li>
          <li>Either upload the file or paste the JSON content below</li>
          <li>Click "Upload Set" to import all cards</li>
          <li>Cards will be created with quantity 0 (unavailable) by default</li>
          <li>You can update quantities for individual cards later</li>
        </ol>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload File</h2>
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Or Paste JSON</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <textarea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder='Paste MTGJson set data here...'
          rows={20}
          className="w-full p-4 border rounded font-mono text-sm"
        />
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={handleUpload}
          disabled={uploading || !jsonData.trim()}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Set'}
        </button>
      </div>

      {result && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Upload Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-100 p-4 rounded">
              <div className="text-sm text-gray-600">Set Code</div>
              <div className="text-2xl font-bold">{result.setCode}</div>
            </div>
            <div className="bg-blue-100 p-4 rounded">
              <div className="text-sm text-gray-600">Total Cards</div>
              <div className="text-2xl font-bold">{result.totalCards}</div>
            </div>
            <div className="bg-green-100 p-4 rounded">
              <div className="text-sm text-gray-600">Imported</div>
              <div className="text-2xl font-bold">{result.imported}</div>
            </div>
            <div className="bg-red-100 p-4 rounded">
              <div className="text-sm text-gray-600">Errors</div>
              <div className="text-2xl font-bold">{result.errors}</div>
            </div>
          </div>

          {result.errorDetails && result.errorDetails.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Errors:</h3>
              <div className="bg-red-50 p-4 rounded max-h-64 overflow-y-auto">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.errorDetails.map((err: any, idx: number) => (
                    <li key={idx} className="text-red-800">
                      <strong>{err.card}:</strong> {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSetUploadPage;
