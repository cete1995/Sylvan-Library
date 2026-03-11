import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../api/client';

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
  const [showAllResults, setShowAllResults] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Store completion data for rebuilding response
  const [completionData, setCompletionData] = useState<{
    summary: string;
    failed: string;
    detailed: string;
    json: string;
  } | null>(null);

  // Store failed rows for retry
  const [failedRows, setFailedRows] = useState<Array<{
    productId: string;
    skuId: string;
    productName?: string;
    price?: string; // Keep as string to preserve exact CSV format
    stock?: string; // Keep as string to preserve exact CSV format
    error: string;
  }>>([]);

  // Shared TikTok Shop credentials - Load from localStorage (cache) and DB
  const [appKey, setAppKey] = useState(localStorage.getItem('tiktok_app_key') || '');
  const [appSecret, setAppSecret] = useState(localStorage.getItem('tiktok_app_secret') || '');
  const [accessToken, setAccessToken] = useState(localStorage.getItem('tiktok_access_token') || '');
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('tiktok_refresh_token') || '');
  const [shopCipher, setShopCipher] = useState(localStorage.getItem('tiktok_shop_cipher') || '');
  const [tokenRefreshing, setTokenRefreshing] = useState(false);
  const [tokenRefreshMessage, setTokenRefreshMessage] = useState('');
  const [credsSaving, setCredsSaving] = useState(false);
  const [credsSaved, setCredsSaved] = useState(false);
  const [credsLastSaved, setCredsLastSaved] = useState<string | null>(null);

  // Save credentials to localStorage when they change (local cache)
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
    if (refreshToken) localStorage.setItem('tiktok_refresh_token', refreshToken);
    else localStorage.removeItem('tiktok_refresh_token');
  }, [refreshToken]);

  useEffect(() => {
    if (shopCipher) localStorage.setItem('tiktok_shop_cipher', shopCipher);
    else localStorage.removeItem('tiktok_shop_cipher');
  }, [shopCipher]);

  // Load credentials from database on mount (overrides localStorage cache with DB truth)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/admin/tiktok/credentials`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.found) {
          if (data.appKey)       { setAppKey(data.appKey);             localStorage.setItem('tiktok_app_key', data.appKey); }
          if (data.appSecret)    { setAppSecret(data.appSecret);       localStorage.setItem('tiktok_app_secret', data.appSecret); }
          if (data.accessToken)  { setAccessToken(data.accessToken);   localStorage.setItem('tiktok_access_token', data.accessToken); }
          if (data.refreshToken) { setRefreshToken(data.refreshToken); localStorage.setItem('tiktok_refresh_token', data.refreshToken); }
          if (data.shopCipher)   { setShopCipher(data.shopCipher);     localStorage.setItem('tiktok_shop_cipher', data.shopCipher); }
          if (data.updatedAt) setCredsLastSaved(new Date(data.updatedAt).toLocaleString('id-ID'));
        }
      })
      .catch(console.error);
  }, []);

  // Rebuild response when showAllResults toggle changes
  useEffect(() => {
    if (completionData) {
      const detailedSection = showAllResults && completionData.detailed 
        ? completionData.detailed 
        : '';
      setPriceResponse(
        completionData.summary + 
        completionData.failed + 
        detailedSection + 
        completionData.json
      );
    }
  }, [showAllResults, completionData]);

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

  const [originalCsvData, setOriginalCsvData] = useState<Array<{
    productId: string;
    skuId: string;
    productName?: string;
    price?: string;
    stock?: string;
  }>>([]);

  const handlePriceInventoryCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setFailedRows([]); // Clear previous failed rows when new file is uploaded

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      
      // Show preview
      setCsvPreview(lines.slice(0, 6).join('\n'));
      
      // Parse and store original CSV data for retry functionality - keep as strings
      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
      const parsedData: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        const row: any = {};
        
        headers.forEach((header, index) => {
          // Keep everything as string, don't remove leading apostrophe/quote
          row[header] = values[index] || '';
        });
        
        // Only skip if both productid and skuid are completely empty
        if (row.productid || row.skuid) {
          parsedData.push({
            productId: row.productid || '',
            skuId: row.skuid || '',
            productName: row.productname || '',
            price: row.price || '',
            stock: row.stock || ''
          });
        }
      }
      
      setOriginalCsvData(parsedData);
    };
    reader.readAsText(file);
  };

  // Simple CSV parser that handles quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
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
    setFailedRows([]); // Clear previous failed rows

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('appKey', appKey);
      formData.append('appSecret', appSecret);
      formData.append('accessToken', accessToken);
      if (shopCipher) {
        formData.append('shopCipher', shopCipher);
      }

      // Use fetch directly to the backend (bypasses Vite proxy which can buffer SSE streams)
      const uploadRes = await fetch(`${API_BASE_URL}/admin/tiktok/bulk-update-csv-stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
        signal: controller.signal // Add abort signal
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
      let failedLog = '';

      if (!reader) {
        throw new Error('Could not get reader from response');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Check if aborted
        if (controller.signal.aborted) {
          setPriceResponse(prev => prev + '\n\n⚠️ UPDATE STOPPED BY USER\n');
          break;
        }

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
              failedLog = '';

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
                const errorEntry = logEntry + `   Error: ${data.error}\n`;
                detailedLog += errorEntry;
                failedLog += errorEntry;
                
                // Track failed rows for retry - use EXACT data from original CSV
                const failedProductSkus = originalCsvData.filter(
                  row => row.productId == data.productId // Use == to handle string/number comparison
                );
                
                setFailedRows(prev => [
                  ...prev,
                  ...failedProductSkus.map(sku => ({
                    productId: sku.productId, // Keep original format from CSV
                    skuId: sku.skuId,
                    productName: sku.productName || data.productName,
                    price: sku.price, // Keep as string from CSV
                    stock: sku.stock, // Keep as string from CSV
                    error: data.error || 'Unknown error'
                  }))
                ]);
              } else {
                detailedLog += logEntry;
              }

              setPriceResponse(prev => 
                prev.split('='.repeat(60))[0] + 
                `${'='.repeat(60)}\n\n` +
                `Progress: ${data.processed}/${data.total} (${data.percentage}%)\n` +
                `✅ Successful: ${data.successful} | ❌ Failed: ${data.failed}\n\n` +
                (data.failed > 0 ? `FAILED PRODUCTS:\n${failedLog}\n` : 'All products updated successfully!\n')
              );

            } else if (data.type === 'complete') {
              setPriceProgress({
                current: data.totalProducts,
                total: data.totalProducts,
                percentage: 100,
                successful: data.successful,
                failed: data.failed
              });

              // Don't overwrite failedRows here - we already tracked them during progress updates

              const summarySection = 
                `${'='.repeat(60)}\n` +
                `✅ BULK UPDATE COMPLETED\n` +
                `${'='.repeat(60)}\n\n` +
                `Total Products: ${data.totalProducts}\n` +
                `✅ Successful: ${data.successful}\n` +
                `❌ Failed: ${data.failed}\n` +
                `Success Rate: ${((data.successful / data.totalProducts) * 100).toFixed(1)}%\n\n` +
                `${'='.repeat(60)}\n\n`;

              const failedSection = data.failed > 0 
                ? `❌ FAILED PRODUCTS (${data.failed}):\n\n${failedLog}\n\n${'='.repeat(60)}\n\n`
                : '✅ All products updated successfully!\n\n';

              // Detailed section for all products (only shown when showAllResults is true)
              const detailedSection = data.failed > 0 && detailedLog 
                ? `📋 ALL PRODUCTS:\n\n${detailedLog}\n\n${'='.repeat(60)}\n\n`
                : '';

              const fullResultsSection = `📊 Full Results (JSON):\n${JSON.stringify(data.results, null, 2)}`;

              // Store completion data for toggle functionality
              setCompletionData({
                summary: summarySection,
                failed: failedSection,
                detailed: detailedSection,
                json: fullResultsSection
              });

              // Initial response (without detailed section)
              setPriceResponse(summarySection + failedSection + fullResultsSection);

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
      if (error.name === 'AbortError') {
        setPriceResponse(prev => prev + '\n\n🛑 UPDATE FORCE STOPPED BY USER');
      } else {
        setPriceResponse(`❌ Upload Failed: ${error.message}`);
      }
      setPriceLoading(false);
    } finally {
      setAbortController(null);
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
          const res = await fetch(`${API_BASE_URL}/admin/tiktok/update-category`, {
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

  const handleRetryFailedRows = async () => {
    if (failedRows.length === 0) {
      alert('No failed rows to retry');
      return;
    }

    if (!appKey || !appSecret || !accessToken) {
      alert('Please fill in all credentials');
      return;
    }

    // Convert failed rows back to CSV format
    const csvHeader = 'productId,skuId,productName,price,stock\n';
    const csvRows = failedRows.map(row => {
      const price = row.price || '';
      const stock = row.stock || '';
      const productName = row.productName || '';
      return `${row.productId},${row.skuId},${productName},${price},${stock}`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    // Create a Blob and File from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const retryFile = new File([blob], 'retry-failed-rows.csv', { type: 'text/csv' });
    
    // Update originalCsvData with retry data
    const retryData = failedRows.map(row => ({
      productId: row.productId,
      skuId: row.skuId,
      productName: row.productName || '',
      price: row.price || '',
      stock: row.stock || ''
    }));
    setOriginalCsvData(retryData);
    
    // Set the retry file and clear failed rows for new attempt
    setCsvFile(retryFile);
    setCsvPreview(csvContent.split('\n').slice(0, 6).join('\n'));
    
    // Automatically trigger the bulk update with the retry file
    setPriceLoading(true);
    setPriceResponse(`Retrying ${failedRows.length} failed rows...\n\n`);
    setPriceProgress({ current: 0, total: 0, percentage: 0, successful: 0, failed: 0 });
    
    const previousFailedRows = [...failedRows]; // Store for reference
    setFailedRows([]); // Clear for new attempt

    // Create abort controller for this retry request
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const formData = new FormData();
      formData.append('file', retryFile);
      formData.append('appKey', appKey);
      formData.append('appSecret', appSecret);
      formData.append('accessToken', accessToken);
      if (shopCipher) {
        formData.append('shopCipher', shopCipher);
      }

      // Use fetch directly to the backend (bypasses Vite proxy which can buffer SSE streams)
      const uploadRes = await fetch(`${API_BASE_URL}/admin/tiktok/bulk-update-csv-stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
        signal: controller.signal // Add abort signal
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        setPriceResponse(`❌ Retry Error: ${errorData.error}\n\n${JSON.stringify(errorData, null, 2)}`);
        setFailedRows(previousFailedRows); // Restore failed rows
        setPriceLoading(false);
        return;
      }

      // Read SSE stream (same logic as handleBulkPriceInventoryUpdate)
      const reader = uploadRes.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let detailedLog = '';
      let failedLog = '';

      if (!reader) {
        throw new Error('Could not get reader from response');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Check if aborted
        if (controller.signal.aborted) {
          setPriceResponse(prev => prev + '\n\n⚠️ RETRY STOPPED BY USER\n');
          break;
        }

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
                `🔄 Retrying failed rows...\n` +
                `Total Products: ${data.totalProducts}\n` +
                `Total Rows: ${data.totalRows}\n\n` +
                `${'='.repeat(60)}\n\n`
              );
              detailedLog = '';
              failedLog = '';

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
                const errorEntry = logEntry + `   Error: ${data.error}\n`;
                detailedLog += errorEntry;
                failedLog += errorEntry;
                
                // Track failed rows for potential retry again
                const failedProductSkus = originalCsvData.filter(
                  row => row.productId == data.productId // Use == for string/number comparison
                );
                
                setFailedRows(prev => [
                  ...prev,
                  ...failedProductSkus.map(sku => ({
                    productId: sku.productId, // Keep original format from CSV
                    skuId: sku.skuId,
                    productName: sku.productName || data.productName,
                    price: sku.price, // Keep as string from CSV
                    stock: sku.stock, // Keep as string from CSV
                    error: data.error || 'Unknown error'
                  }))
                ]);
              } else {
                detailedLog += logEntry;
              }

              setPriceResponse(prev => 
                prev.split('='.repeat(60))[0] + 
                `${'='.repeat(60)}\n\n` +
                `Progress: ${data.processed}/${data.total} (${data.percentage}%)\n` +
                `✅ Successful: ${data.successful} | ❌ Failed: ${data.failed}\n\n` +
                (data.failed > 0 ? `FAILED PRODUCTS:\n${failedLog}\n` : 'All products updated successfully!\n')
              );

            } else if (data.type === 'complete') {
              setPriceProgress({
                current: data.totalProducts,
                total: data.totalProducts,
                percentage: 100,
                successful: data.successful,
                failed: data.failed
              });

              const summarySection = 
                `${'='.repeat(60)}\n` +
                `✅ RETRY COMPLETED\n` +
                `${'='.repeat(60)}\n\n` +
                `Total Products: ${data.totalProducts}\n` +
                `✅ Successful: ${data.successful}\n` +
                `❌ Failed: ${data.failed}\n` +
                `Success Rate: ${((data.successful / data.totalProducts) * 100).toFixed(1)}%\n\n` +
                `${'='.repeat(60)}\n\n`;

              const failedSection = data.failed > 0 
                ? `❌ FAILED PRODUCTS (${data.failed}):\n\n${failedLog}\n\n${'='.repeat(60)}\n\n`
                : '✅ All retried products updated successfully!\n\n';

              const detailedSection = data.failed > 0 && detailedLog 
                ? `📋 ALL PRODUCTS:\n\n${detailedLog}\n\n${'='.repeat(60)}\n\n`
                : '';

              const fullResultsSection = `📊 Full Results (JSON):\n${JSON.stringify(data.results, null, 2)}`;

              setCompletionData({
                summary: summarySection,
                failed: failedSection,
                detailed: detailedSection,
                json: fullResultsSection
              });

              setPriceResponse(summarySection + failedSection + fullResultsSection);
              setPriceLoading(false);
              
            } else if (data.type === 'error') {
              setPriceResponse(`❌ Error: ${data.error}`);
              setFailedRows(previousFailedRows); // Restore failed rows on error
              setPriceLoading(false);
            }

          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setPriceResponse(prev => prev + '\n\n🛑 RETRY FORCE STOPPED BY USER');
        setFailedRows(previousFailedRows); // Restore failed rows
      } else {
        setPriceResponse(`❌ Retry Failed: ${error.message}`);
        setFailedRows(previousFailedRows); // Restore failed rows on error
      }
      setPriceLoading(false);
    } finally {
      setAbortController(null);
    }
  };

  const handleSaveCredentials = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setCredsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/tiktok/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ appKey, appSecret, accessToken, refreshToken, shopCipher }),
      });
      const data = await res.json();
      if (data.success) {
        setCredsSaved(true);
        setCredsLastSaved(new Date().toLocaleString('id-ID'));
        setTimeout(() => setCredsSaved(false), 3000);
      } else {
        alert('Failed to save credentials: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to save credentials to database');
    } finally {
      setCredsSaving(false);
    }
  };

  const handleRefreshAccessToken = async () => {
    if (!appKey || !appSecret || !refreshToken) {
      setTokenRefreshMessage('❌ Please provide App Key, App Secret, and Refresh Token');
      return;
    }

    setTokenRefreshing(true);
    setTokenRefreshMessage('🔄 Refreshing access token...');

    try {
      const response = await fetch(`${API_BASE_URL}/admin/tiktok/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          appKey,
          appSecret,
          refreshToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setTokenRefreshMessage(`❌ Refresh failed (${response.status}): ${data.error || data.message || 'Unknown error'}\n\nDetails: ${JSON.stringify(data, null, 2)}`);
        return;
      }

      if (!data.success) {
        setTokenRefreshMessage(`❌ Refresh failed: ${data.error || 'Unknown error'}\n\nDetails: ${JSON.stringify(data, null, 2)}`);
        return;
      }

      // Update tokens
      setAccessToken(data.data.accessToken);
      setRefreshToken(data.data.refreshToken);

      const expiresInHours = Math.floor(data.data.accessTokenExpireIn / 3600);
      setTokenRefreshMessage(
        `✅ Token refreshed & saved automatically!\n` +
        `New Access Token expires in: ${expiresInHours} hours\n` +
        `Seller: ${data.data.sellerName} (${data.data.sellerBaseRegion})`
      );

      // Clear message after 10 seconds
      setTimeout(() => setTokenRefreshMessage(''), 10000);

    } catch (error: any) {
      setTokenRefreshMessage(`❌ Error: ${error.message}`);
    } finally {
      setTokenRefreshing(false);
    }
  };

  const downloadFailedRowsCsv = () => {
    if (failedRows.length === 0) {
      alert('No failed rows to download');
      return;
    }

    // Build CSV with BOM so Excel opens it with correct encoding and treats IDs as text
    const headers = ['productId', 'skuId', 'sellerSku', 'productName', 'price', 'stock', 'error'];
    const escape = (v: any) => {
      const s = String(v ?? '');
      // Prefix long-looking numeric IDs with a tab trick — or just quote+force-text via leading apostrophe in cell
      // Standard CSV quoting: wrap in quotes if contains comma/quote/newline, escape internal quotes
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const rows = failedRows.map(row => [
      // Prefix with \t to prevent Excel scientific-notation conversion on long numeric IDs
      '\t' + (row.productId ?? ''),
      '\t' + (row.skuId ?? ''),
      escape((row as any).sellerSku ?? ''),
      escape(row.productName ?? ''),
      escape(row.price ?? ''),
      escape(row.stock ?? ''),
      escape(row.error ?? ''),
    ].join(','));

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed-rows-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [autoFillMessage, setAutoFillMessage] = useState('');

  const handleAutoFillSkus = async () => {
    if (!appKey || !appSecret || !accessToken) {
      alert('Please fill in all credentials first');
      return;
    }

    if (failedRows.length === 0) {
      alert('No failed rows to auto-fill');
      return;
    }

    setAutoFillLoading(true);
    setAutoFillMessage('Fetching SKU data from TikTok Shop...');

    try {
      // Get unique product IDs from failed rows
      const uniqueProductIds = [...new Set(failedRows.map(row => row.productId))];
      const updatedRows = [...failedRows];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < uniqueProductIds.length; i++) {
        const productId = uniqueProductIds[i];
        setAutoFillMessage(`Fetching ${i + 1}/${uniqueProductIds.length}: Product ${productId}...`);

        try {
          const response = await fetch(`${API_BASE_URL}/admin/tiktok/get-product-details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              appKey,
              appSecret,
              accessToken,
              shopCipher,
              productId
            })
          });

          const data = await response.json();

          if (data.success && data.data.skus && data.data.skus.length > 0) {
            // Update failed rows with the first SKU ID and current price/stock
            const firstSku = data.data.skus[0];
            
            for (let j = 0; j < updatedRows.length; j++) {
              if (updatedRows[j].productId == productId && !updatedRows[j].skuId) { // Use == for string/number comparison
                updatedRows[j] = {
                  ...updatedRows[j],
                  skuId: String(firstSku.skuId),
                  productName: data.data.productName,
                  price: firstSku.price ? String(firstSku.price) : updatedRows[j].price,
                  stock: firstSku.stock !== undefined ? String(firstSku.stock) : updatedRows[j].stock
                };
              }
            }
            successCount++;
          } else {
            errorCount++;
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
          errorCount++;
        }
      }

      setFailedRows(updatedRows);
      setAutoFillMessage(`✅ Auto-fill complete! ${successCount} products updated, ${errorCount} errors`);
      
      // Clear message after 5 seconds
      setTimeout(() => setAutoFillMessage(''), 5000);

    } catch (error: any) {
      setAutoFillMessage(`❌ Error: ${error.message}`);
    } finally {
      setAutoFillLoading(false);
    }
  };

  const handleForceStop = () => {
    if (abortController) {
      abortController.abort();
      setPriceResponse(prev => prev + '\n\n🛑 Stopping bulk update...');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-5 hover:opacity-80" style={{ color: 'var(--color-accent)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Dashboard
          </Link>
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
                Refresh Token
              </label>
              <input
                type="password"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                placeholder="ROW_rwBm2A..."
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

          {/* Token Refresh Section */}
          <div className="mt-4 p-4 rounded-lg border-2 border-purple-400 bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-purple-900 mb-1">🔄 Access Token Refresh</h3>
                <p className="text-sm text-purple-700">
                  Use your refresh token to get a new access token when it expires
                </p>
              </div>
              <button
                onClick={handleRefreshAccessToken}
                disabled={tokenRefreshing || !appKey || !appSecret || !refreshToken}
                className="px-6 py-3 rounded-lg font-bold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#9333ea' }}
              >
                {tokenRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Access Token'}
              </button>
            </div>
            {tokenRefreshMessage && (
              <div className={`mt-3 p-3 rounded-lg ${
                tokenRefreshMessage.includes('✅') ? 'bg-green-100 text-green-800' : 
                tokenRefreshMessage.includes('🔄') ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                <pre className="text-sm whitespace-pre-wrap font-mono">{tokenRefreshMessage}</pre>
              </div>
            )}
          </div>
          
          {/* Credential Management Info */}
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-green-600 text-sm">🔒 Credentials are encrypted and saved to database</span>
                {credsLastSaved && (
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Last saved: {credsLastSaved}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveCredentials}
                  disabled={credsSaving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#10b981', color: 'white' }}
                >
                  {credsSaving ? '⏳ Saving...' : credsSaved ? '✅ Saved!' : '💾 Save to Database'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Clear all saved TikTok Shop credentials?')) {
                      setAppKey('');
                      setAppSecret('');
                      setAccessToken('');
                      setRefreshToken('');
                      setShopCipher('');
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                >
                  🗑️ Clear All Credentials
                </button>
              </div>
            </div>
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

              {/* Action Buttons */}
              <div className="mb-6 space-y-3">
                <div className="grid gap-3" style={{ gridTemplateColumns: priceLoading ? '1fr auto' : '1fr' }}>
                  <button
                    onClick={handleBulkPriceInventoryUpdate}
                    disabled={priceLoading || !csvFile || !appKey || !appSecret || !accessToken}
                    className="py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01]"
                    style={{ backgroundColor: '#9333ea', color: 'white' }}
                  >
                    {priceLoading 
                      ? `🔄 Processing ${priceProgress.current}/${priceProgress.total} products (${priceProgress.percentage}%)...` 
                      : `🚀 Bulk Update ${csvFile ? 'from ' + csvFile.name : 'Prices & Inventory'}`
                    }
                  </button>
                  
                  {priceLoading && (
                    <button
                      onClick={handleForceStop}
                      className="py-4 px-8 rounded-lg font-bold text-lg transition-all hover:scale-[1.01] whitespace-nowrap"
                      style={{ backgroundColor: '#ef4444', color: 'white' }}
                      title="Force stop the current update process"
                    >
                      🛑 STOP
                    </button>
                  )}
                </div>

                {/* Retry and Download Failed Rows Buttons */}
                {failedRows.length > 0 && !priceLoading && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={handleAutoFillSkus}
                        disabled={autoFillLoading}
                        className="py-4 rounded-lg font-bold text-lg transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#8b5cf6', color: 'white' }}
                      >
                        {autoFillLoading ? '⏳ Fetching...' : '🔧 Auto-Fill SKUs'}
                      </button>
                      <button
                        onClick={handleRetryFailedRows}
                        className="py-4 rounded-lg font-bold text-lg transition-all hover:scale-[1.01]"
                        style={{ backgroundColor: '#f59e0b', color: 'white' }}
                      >
                        🔄 Retry {failedRows.length} Failed
                      </button>
                      <button
                        onClick={downloadFailedRowsCsv}
                        className="py-4 rounded-lg font-bold text-lg transition-all hover:scale-[1.01]"
                        style={{ backgroundColor: '#3b82f6', color: 'white' }}
                      >
                        📥 Download Failed CSV
                      </button>
                    </div>
                    {autoFillMessage && (
                      <div className="p-3 rounded-lg text-center font-semibold" style={{ 
                        backgroundColor: autoFillMessage.includes('✅') ? '#d1fae5' : autoFillMessage.includes('❌') ? '#fee2e2' : '#dbeafe',
                        color: autoFillMessage.includes('✅') ? '#065f46' : autoFillMessage.includes('❌') ? '#991b1b' : '#1e40af'
                      }}>
                        {autoFillMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Response Section */}
              {priceResponse && (
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                      📊 Results
                    </h3>
                    <div className="flex gap-2">
                      {failedRows.length > 0 && !priceLoading && (
                        <div className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#fbbf24', color: '#78350f' }}>
                          ⚠️ {failedRows.length} Failed Row{failedRows.length !== 1 ? 's' : ''}
                        </div>
                      )}
                      {priceProgress.failed > 0 && priceProgress.total > 0 && (
                        <button
                          onClick={() => setShowAllResults(!showAllResults)}
                          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                          style={{ 
                            backgroundColor: showAllResults ? '#10b981' : '#6b7280',
                            color: 'white'
                          }}
                        >
                          {showAllResults ? '✅ Showing All' : '🔍 Show All Products'}
                        </button>
                      )}
                    </div>
                  </div>
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
