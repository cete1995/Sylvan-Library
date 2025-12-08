import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin';

const AdminBulkUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const data = await adminApi.bulkUpload(file);
      setResult(data);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('csvFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      alert('Upload failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,setCode,setName,collectorNumber,language,condition,finish,quantityOwned,quantityForSale,buyPrice,sellPrice,rarity,colorIdentity,imageUrl,scryfallId,typeLine,oracleText,manaCost,notes
"Lightning Bolt",LEA,"Limited Edition Alpha",161,EN,NM,nonfoil,4,2,150.00,200.00,common,R,,,Instant,"Lightning Bolt deals 3 damage to any target.",{R},"First printing"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mtg-cards-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/admin/dashboard" className="text-primary-600 hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>

      <h1 className="text-4xl font-bold mb-8">Bulk Upload Cards</h1>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="font-bold text-lg mb-3">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Download the CSV template below</li>
          <li>Fill in your card data (one card per row)</li>
          <li>Save the file as CSV format</li>
          <li>Upload the file using the form below</li>
        </ol>

        <button onClick={downloadTemplate} className="btn-primary mt-4">
          Download CSV Template
        </button>
      </div>

      {/* CSV Format Reference */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="font-bold text-xl mb-4">CSV Format</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Column</th>
                <th className="text-left py-2 px-2">Required</th>
                <th className="text-left py-2 px-2">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr><td className="py-2 px-2 font-mono">name</td><td>Yes</td><td>Lightning Bolt</td></tr>
              <tr><td className="py-2 px-2 font-mono">setCode</td><td>Yes</td><td>LEA</td></tr>
              <tr><td className="py-2 px-2 font-mono">setName</td><td>Yes</td><td>Limited Edition Alpha</td></tr>
              <tr><td className="py-2 px-2 font-mono">collectorNumber</td><td>Yes</td><td>161</td></tr>
              <tr><td className="py-2 px-2 font-mono">language</td><td>No</td><td>EN</td></tr>
              <tr><td className="py-2 px-2 font-mono">condition</td><td>No</td><td>NM, SP, MP, HP, DMG</td></tr>
              <tr><td className="py-2 px-2 font-mono">finish</td><td>No</td><td>nonfoil, foil, etched</td></tr>
              <tr><td className="py-2 px-2 font-mono">quantityOwned</td><td>Yes</td><td>4</td></tr>
              <tr><td className="py-2 px-2 font-mono">quantityForSale</td><td>Yes</td><td>2</td></tr>
              <tr><td className="py-2 px-2 font-mono">buyPrice</td><td>Yes</td><td>150.00</td></tr>
              <tr><td className="py-2 px-2 font-mono">sellPrice</td><td>Yes</td><td>200.00</td></tr>
              <tr><td className="py-2 px-2 font-mono">rarity</td><td>No</td><td>common, uncommon, rare, mythic</td></tr>
              <tr><td className="py-2 px-2 font-mono">colorIdentity</td><td>No</td><td>W,U,B,R,G (comma-separated)</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="font-bold text-xl mb-4">Upload File</h2>
        <form onSubmit={handleUpload}>
          <div className="mb-4">
            <label className="label">Select CSV File</label>
            <input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload and Import'}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className={`rounded-lg p-6 ${
          result.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <h2 className="font-bold text-xl mb-4">Import Results</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-green-600 text-3xl font-bold">{result.imported}</div>
              <div className="text-gray-600">Cards Imported</div>
            </div>
            <div>
              <div className="text-red-600 text-3xl font-bold">{result.failed}</div>
              <div className="text-gray-600">Failed</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Errors:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
              {result.failed > result.errors.length && (
                <p className="text-sm text-gray-600 mt-2">
                  ... and {result.failed - result.errors.length} more errors
                </p>
              )}
            </div>
          )}

          <Link to="/admin/cards" className="btn-primary inline-block mt-4">
            View Imported Cards
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdminBulkUploadPage;
