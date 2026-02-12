import React, { useState, useEffect } from 'react';

type ActiveTab = 'category' | 'price-inventory';

const AdminTikTokDebugPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('category');
  
  // Category update state
  const [productIds, setProductIds] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [categoryResponse, setCategoryResponse] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Price/Inventory update state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string>('');
  const [priceResponse, setPriceResponse] = useState('');
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceProgress, setPriceProgress] = useState({ current: 0, total: 0, percentage: 0, successful: 0, failed: 0 });

  // Shared TikTok Shop credentials - Load from localStorage
  const [appKey, setAppKey] = useState(localStorage.getItem('tiktok_app_key') || '');
  const [appSecret, setAppSecret] = useState(localStorage.getItem('tiktok_app_secret') || '');
  const [accessToken, setAccessToken] = useState(localStorage.getItem('tiktok_access_token') || '');
  const [shopCipher, setShopCipher] = useState(localStorage.getItem('tiktok_shop_cipher') || '');

  // Save credentials to localStorage when they change
  useEffect(() => {
    if (appKey) localStorage.setItem('tiktok_app_key', appKey);
    else localStorage.removeItem('tiktok_app_key');
  }, [appKey]);

  useEffect(() => {
    if (appSecret) localStorage.setItem('tiktok_app_secret', appSecret);
    else localStorage.removeItem('tiktok_app_secret');
  }, [appSecret]);

  useEffect(() => {
    if (accessToken) localStorage.setItem('tiktok_access_token', accessToken);
    else localStorage.removeItem('tiktok_access_token');
  }, [accessToken]);

  useEffect(() => {
    if (shopCipher) localStorage.setItem('tiktok_shop_cipher', shopCipher);
    else localStorage.removeItem('tiktok_shop_cipher');
  }, [shopCipher]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      const ids = lines
        .slice(lines[0].toLowerCase().includes('product') ? 1 : 0)
        .map(line => line.split(',')[0].trim())
        .filter(id => id && !isNaN(Number(id)));
      
      setProductIds(ids);
      setCategoryResponse(`✅ Loaded ${ids.length} product IDs from CSV:\n${ids.slice(0, 10).join('\n')}${ids.length > 10 ? `\n... and ${ids.length - 10} more` : ''}`);
    };
    reader.readAsText(file);
  };

  const handlePriceInventoryCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(0, 6);
      setCsvPreview(lines.join('\n'));
    };
    reader.readAsText(file);
  };

  const handleBulkPriceInventoryUpdate = async () => {
    if (!appKey || !appSecret || !accessToken) {
      alert('Please fill in all credentials');
      return;
    }

    if (!csvFile) {
      alert('Please upload a CSV file');
      return;
    }

    setPriceLoading(true);
    setPriceResponse('Uploading CSV and processing updates...\n\n');
    setPriceProgress({ current: 0, total: 0, percentage: 0, successful: 0, failed: 0 });

    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('appKey', appKey);
      formData.append('appSecret', appSecret);
      formData.append('accessToken', accessToken);
      if (shopCipher) {
        formData.append('shopCipher', shopCipher);
      }

      // Use fetch to upload, then connect to SSE
      const uploadRes = await fetch('/api/admin/tiktok/bulk-update-csv-stream', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        setPriceResponse(`❌ Error: ${errorData.error}\n\n${JSON.stringify(errorData, null, 2)}`);
        setPriceLoading(false);
        return;
      }

      // Read SSE stream
      const reader = uploadRes.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let detailedLog = '';

      if (!reader) {
        throw new Error('Could not get reader from response');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.substring(6));

            if (data.type === 'start') {
              setPriceProgress({
                current: 0,
                total: data.totalProducts,
                percentage: 0,
                successful: 0,
                failed: 0
              });
              setPriceResponse(
                `📦 Starting bulk update...\n` +
                `Total Products: ${data.totalProducts}\n` +
                `Total Rows: ${data.totalRows}\n\n` +
                `${'='.repeat(60)}\n\n`
              );
              detailedLog = '';

            } else if (data.type === 'progress') {
              setPriceProgress({
                current: data.processed,
                total: data.total,
                percentage: data.percentage,
                successful: data.successful,
                failed: data.failed
              });

              const status = data.status === 'success' ? '✅' : '❌';
              const productDisplay = data.productName || `Product ${data.productId}`;
              const logEntry = `${status} ${productDisplay} (${data.skuCount || 0} SKUs) - ${data.status}\n`;
              
              if (data.status === 'failed') {
                detailedLog += logEntry + `   Error: ${data.error}\n`;
              } else {
                detailedLog += logEntry;
              }

              setPriceResponse(prev => 
                prev.split('='.repeat(60))[0] + 
                `${'='.repeat(60)}\n\n` +
                `Progress: ${data.processed}/${data.total} (${data.percentage}%)\n` +
                `✅ Successful: ${data.successful} | ❌ Failed: ${data.failed}\n\n` +
                detailedLog
              );

            } else if (data.type === 'complete') {
              setPriceProgress({
                current: data.totalProducts,
                total: data.totalProducts,
                percentage: 100,
                successful: data.successful,
                failed: data.failed
              });

              setPriceResponse(
                `${'='.repeat(60)}\n` +
                `✅ BULK UPDATE COMPLETED\n` +
                `${'='.repeat(60)}\n\n` +
                `Total Products: ${data.totalProducts}\n` +
                `✅ Successful: ${data.successful}\n` +
                `❌ Failed: ${data.failed}\n` +
                `Success Rate: ${((data.successful / data.totalProducts) * 100).toFixed(1)}%\n\n` +
                `${'='.repeat(60)}\n\n` +
                detailedLog +
                `\n\n📊 Full Results:\n${JSON.stringify(data.results, null, 2)}`
              );

              setPriceLoading(false);
            } else if (data.type === 'error') {
              setPriceResponse(`❌ Error: ${data.error}`);
              setPriceLoading(false);
            }

          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }

    } catch (error: any) {
      setPriceResponse(`❌ Upload Failed: ${error.message}`);
      setPriceLoading(false);
    }
  };

  const handleBulkUpdateCategory = async () => {
    if (!appKey || !appSecret || !accessToken || !categoryId) {
      alert('Please fill in all credentials and category ID');
      return;
    }

    if (productIds.length === 0) {
      alert('Please upload a CSV file with product IDs');
      return;
    }

    setCategoryLoading(true);
    setCategoryResponse('');
    setProgress({ current: 0, total: productIds.length });

    const results: any[] = [];

    try {
      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i];
        setProgress({ current: i + 1, total: productIds.length });
        setCategoryResponse(`Processing ${i + 1}/${productIds.length}: Product ID ${productId}...`);

        try {
          const res = await fetch('/api/admin/tiktok/update-category', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              productId,
              categoryId,
              appKey,
              appSecret,
              accessToken,
              shopCipher
            })
          });

          const data = await res.json();

          if (res.ok) {
            results.push({
              productId,
              success: true,
              message: 'Category updated successfully'
            });
          } else {
            results.push({
              productId,
              success: false,
              error: data.error || 'Unknown error'
            });
          }
        } catch (error: any) {
          results.push({
            productId,
            success: false,
            error: error.message
          });
        }

        if (i < productIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      let summary = `\n${'='.repeat(60)}\n`;
      summary += `✅ COMPLETED: ${successful}/${productIds.length} products updated\n`;
      summary += `❌ FAILED: ${failed}\n`;
      summary += `${'='.repeat(60)}\n\n`;

      summary += 'DETAILED RESULTS:\n\n';
      results.forEach((result, idx) => {
        const status = result.success ? '✅' : '❌';
        const productDisplay = result.productName || `Product ${result.productId}`;
        summary += `${idx + 1}. ${status} ${productDisplay}\n`;
        if (!result.success) {
          summary += `   Error: ${JSON.stringify(result.error)}\n`;
        }
      });

      setCategoryResponse(summary);
    } catch (error: any) {
      setCategoryResponse(`Fatal error: ${error.message}`);
    } finally {
      setCategoryLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            🛠️ TikTok Shop API Management
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Bulk update tools for TikTok Shop products
          </p>
        </div>

        {/* Credentials Section - Shared Across All Features */}
        <div className="mb-8 p-6 rounded-lg shadow-lg border-2 border-blue-500" style={{ backgroundColor: 'var(--color-panel)' }}>
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🔑</span>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              API Credentials (Shared)
            </h2>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            These credentials will be used for all TikTok Shop API operations below
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                App Key
              </label>
              <input
                type="text"
                value={appKey}
                onChange={(e) => setAppKey(e.target.value)}
                placeholder="38abcd..."
                className="w-full px-4 py-2 border rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                App Secret
              </label>
              <input
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                placeholder="Your app secret"
                className="w-full px-4 py-2 border rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                Access Token
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="TTP_pwSm2A..."
                className="w-full px-4 py-2 border rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                Shop Cipher (Optional)
              </label>
              <input
                type="text"
                value={shopCipher}
                onChange={(e) => setShopCipher(e.target.value)}
                placeholder="GCP_XF90i..."
                className="w-full px-4 py-2 border rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
              />
            </div>
          </div>
          
          {/* Credential Management Info */}
          <div className="mt-4 flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-sm">💾 Credentials are auto-saved to your browser</span>
            </div>
            <button
              onClick={() => {
                if (confirm('Clear all saved TikTok Shop credentials?')) {
                  setAppKey('');
                  setAppSecret('');
                  setAccessToken('');
                  setShopCipher('');
                }
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ 
                backgroundColor: '#ef4444',
                color: 'white'
              }}
            >
              🗑️ Clear All Credentials
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-4 border-b-2" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('category')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'category' 
                ? 'border-b-4 border-orange-500' 
                : 'opacity-50 hover:opacity-100'
            }`}
            style={{ color: 'var(--color-text)' }}
          >
            📁 Category Update
          </button>
          <button
            onClick={() => setActiveTab('price-inventory')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'price-inventory' 
                ? 'border-b-4 border-purple-500' 
                : 'opacity-50 hover:opacity-100'
            }`}
            style={{ color: 'var(--color-text)' }}
          >
            💰 Price & Inventory Update
          </button>
        </div>

        {/* Category Update Tab */}
        {activeTab === 'category' && (
          <div className="space-y-6">
            <div className="p-6 rounded-lg shadow-lg border-l-4 border-orange-500" style={{ backgroundColor: 'var(--color-panel)' }}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                📁 Bulk Category Update
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Update the category for multiple products at once
              </p>

              {/* Category ID Input */}
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Target Category ID
                </label>
                <input
                  type="text"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  placeholder="Enter category ID (e.g., 600001)"
                  className="w-full px-4 py-3 border rounded-lg text-lg"
                  style={{ 
                    backgroundColor: 'var(--color-panel)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)'
                  }}
                />
                <div className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  💡 All products will be updated to this category ID
                </div>
              </div>

              {/* CSV Upload */}
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Upload Product IDs (CSV)
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={categoryLoading}
                  className="w-full px-4 py-3 border rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--color-panel)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)'
                  }}
                />
                <div className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <p>📄 CSV Format: First column should contain product IDs</p>
                  <p className="mt-1">Example:</p>
                  <pre className="mt-2 p-2 rounded" style={{ backgroundColor: 'var(--color-panel)' }}>
product_id{'\n'}
1729409636071801988{'\n'}
1729409636071801989{'\n'}
1729409636071801990
                  </pre>
                </div>

                {productIds.length > 0 && (
                  <div className="mt-4 p-4 rounded-lg border-2 border-green-500 bg-green-50">
                    <p className="font-bold text-green-800">
                      ✅ {productIds.length} product IDs loaded
                    </p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-green-700 hover:underline">
                        View all product IDs
                      </summary>
                      <div className="mt-2 max-h-60 overflow-y-auto bg-white p-3 rounded text-xs font-mono">
                        {productIds.map((id, idx) => (
                          <div key={idx}>{idx + 1}. {id}</div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {categoryLoading && (
                <div className="mb-6 p-4 rounded-lg border-2 border-orange-400 bg-orange-50">
                  <p className="font-bold text-orange-800 mb-2">
                    ⏳ Processing: {progress.current} / {progress.total}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-orange-500 h-4 rounded-full transition-all flex items-center justify-center text-xs font-bold text-white"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    >
                      {Math.round((progress.current / progress.total) * 100)}%
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mb-6">
                <button
                  onClick={handleBulkUpdateCategory}
                  disabled={categoryLoading || productIds.length === 0 || !categoryId || !appKey || !appSecret || !accessToken}
                  className="w-full py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: '#f97316', color: 'white' }}
                >
                  {categoryLoading 
                    ? `🔄 Processing ${progress.current}/${progress.total}...` 
                    : `🚀 Update ${productIds.length || 0} Products to Category ${categoryId || '...'}`
                  }
                </button>
              </div>

              {/* Response Section */}
              {categoryResponse && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--color-text)' }}>
                    📊 Results
                  </h3>
                  <pre
                    className="p-4 rounded-lg overflow-auto font-mono text-sm whitespace-pre-wrap"
                    style={{ 
                      backgroundColor: '#1e1e1e',
                      color: '#d4d4d4',
                      maxHeight: '500px'
                    }}
                  >
                    {categoryResponse}
                  </pre>
                </div>
              )}

              {/* Documentation */}
              <div className="mt-6 p-4 rounded-lg border-2 border-orange-300 bg-orange-50">
                <h3 className="font-bold text-lg mb-3 text-orange-900">📚 How to Use</h3>
                <ul className="space-y-2 text-sm text-orange-800">
                  <li>• <strong>Step 1:</strong> Enter the target category ID above</li>
                  <li>• <strong>Step 2:</strong> Upload a CSV file with product IDs in the first column</li>
                  <li>• <strong>Step 3:</strong> Click the update button to process</li>
                  <li>• <strong>Note:</strong> 500ms delay between requests to avoid rate limiting</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Price & Inventory Update Tab */}
        {activeTab === 'price-inventory' && (
          <div className="space-y-6">
            <div className="p-6 rounded-lg shadow-lg border-l-4 border-purple-500" style={{ backgroundColor: 'var(--color-panel)' }}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                💰 Bulk Price & Inventory Update
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Update prices and/or stock levels for multiple products from a CSV file
              </p>

              {/* CSV Upload for Price/Inventory */}
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handlePriceInventoryCsvUpload}
                  disabled={priceLoading}
                  className="w-full px-4 py-3 border rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--color-panel)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)'
                  }}
                />
                <div className="mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <p className="font-bold mb-2">📄 Required CSV Format:</p>
                  <pre className="p-3 rounded bg-gray-800 text-green-400 overflow-x-auto text-xs">
productId,skuId,price,stock{'\n'}
7423456789012345678,1234567890123456789,15000,10{'\n'}
7423456789012345678,1234567890123456790,18000,5{'\n'}
7423456789012345679,1234567890123456791,25000,8
                  </pre>
                  <div className="mt-3 space-y-1 text-xs">
                    <p>• <strong>productId:</strong> TikTok product ID (required)</p>
                    <p>• <strong>skuId:</strong> TikTok SKU ID (required)</p>
                    <p>• <strong>price:</strong> New price in cents/smallest currency unit (optional)</p>
                    <p>• <strong>stock:</strong> New stock quantity (optional)</p>
                    <p className="text-yellow-600 font-bold mt-2">⚠️ You can update price, stock, or both!</p>
                  </div>
                </div>

                {csvPreview && (
                  <div className="mt-4 p-4 rounded-lg border-2 border-purple-500 bg-purple-50">
                    <p className="font-bold text-purple-800 mb-2">
                      ✅ CSV File Loaded: {csvFile?.name}
                    </p>
                    <details>
                      <summary className="cursor-pointer text-sm text-purple-700 hover:underline">
                        Preview (first 5 rows)
                      </summary>
                      <pre className="mt-2 p-3 rounded bg-white text-xs font-mono overflow-x-auto">
                        {csvPreview}
                      </pre>
                    </details>
                  </div>
                )}
              </div>

              {/* Progress Bar for Price/Inventory */}
              {priceLoading && priceProgress.total > 0 && (
                <div className="mb-6 p-4 rounded-lg border-2 border-purple-400 bg-purple-50">
                  <p className="font-bold text-purple-800 mb-2">
                    ⏳ Processing: {priceProgress.current} / {priceProgress.total} products ({priceProgress.percentage}%)
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-6 mb-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-6 rounded-full transition-all flex items-center justify-center text-sm font-bold text-white shadow-lg"
                      style={{ width: `${priceProgress.percentage}%` }}
                    >
                      {priceProgress.percentage}%
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700 font-semibold">✅ Success: {priceProgress.successful}</span>
                    <span className="text-red-700 font-semibold">❌ Failed: {priceProgress.failed}</span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mb-6">
                <button
                  onClick={handleBulkPriceInventoryUpdate}
                  disabled={priceLoading || !csvFile || !appKey || !appSecret || !accessToken}
                  className="w-full py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: '#9333ea', color: 'white' }}
                >
                  {priceLoading 
                    ? `🔄 Processing ${priceProgress.current}/${priceProgress.total} products (${priceProgress.percentage}%)...` 
                    : `🚀 Bulk Update ${csvFile ? 'from ' + csvFile.name : 'Prices & Inventory'}`
                  }
                </button>
              </div>

              {/* Response Section */}
              {priceResponse && (
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--color-text)' }}>
                    📊 Results
                  </h3>
                  <pre
                    className="p-4 rounded-lg overflow-auto font-mono text-sm whitespace-pre-wrap"
                    style={{ 
                      backgroundColor: '#1e1e1e',
                      color: '#d4d4d4',
                      maxHeight: '500px'
                    }}
                  >
                    {priceResponse}
                  </pre>
                </div>
              )}

              {/* Documentation */}
              <div className="mt-6 p-4 rounded-lg border-2 border-purple-300 bg-purple-50">
                <h3 className="font-bold text-lg mb-3 text-purple-900">📚 How to Use</h3>
                <ul className="space-y-2 text-sm text-purple-800">
                  <li>• <strong>Step 1:</strong> Prepare a CSV with productId, skuId, price, and/or stock columns</li>
                  <li>• <strong>Step 2:</strong> Upload the CSV file above</li>
                  <li>• <strong>Step 3:</strong> Click the update button to process all changes</li>
                  <li>• <strong>Note:</strong> Updates are grouped by product ID for efficiency</li>
                  <li>• <strong>Template:</strong> <code className="bg-purple-200 px-2 py-1 rounded">backend/tiktok-bulk-update-template.csv</code></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTikTokDebugPage;
