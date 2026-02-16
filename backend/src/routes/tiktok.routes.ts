import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// TikTok Shop API base URL for SEA region
const TIKTOK_API_BASE = 'https://open-api.tiktokglobalshop.com';

// Generate HMAC-SHA256 signature for TikTok Shop API
const generateSignature = (appSecret: string, params: string): string => {
  return crypto
    .createHmac('sha256', appSecret)
    .update(params)
    .digest('hex');
};

// Edit Product - Debug endpoint
router.post('/edit-product', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      productId,
      appKey,
      appSecret,
      accessToken,
      shopCipher,
      productData
    } = req.body;

    if (!productId || !appKey || !appSecret || !accessToken) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, appKey, appSecret, accessToken'
      });
      return;
    }

    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Build query parameters
    const queryParams: any = {
      app_key: appKey,
      timestamp: timestamp.toString()
    };

    if (shopCipher) {
      queryParams.shop_cipher = shopCipher;
    }

    // Sort parameters alphabetically and create signature string
    const sortedKeys = Object.keys(queryParams).sort();
    let signString = '';
    for (const key of sortedKeys) {
      signString += `${key}${queryParams[key]}`;
    }

    // Add API path to signature
    const apiPath = `/product/202509/products/${productId}`;

    // For PUT/POST requests, signature must include the request body
    const bodyString = JSON.stringify(productData);
    
    // Build signature string: path + params + body
    const baseString = apiPath + signString + bodyString;
    
    // Wrap with app_secret on BOTH sides
    const wrappedString = appSecret + baseString + appSecret;

    // Generate signature using HMAC-SHA256
    const sign = generateSignature(appSecret, wrappedString);
    queryParams.sign = sign;

    // Build full URL
    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

    // Make API request
    const response = await axios.put(url, productData, {
      headers: {
        'x-tts-access-token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      message: 'Product edited successfully',
      data: response.data,
      debug: {
        url,
        signature: sign,
        timestamp,
        requestBody: productData
      }
    });

  } catch (error: any) {
    console.error('TikTok Shop API Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      debug: {
        status: error.response?.status,
        statusText: error.response?.statusText
      }
    });
  }
});

// Get Product - Debug endpoint
router.post('/get-product', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      productId,
      appKey,
      appSecret,
      accessToken,
      shopCipher
    } = req.body;

    if (!productId || !appKey || !appSecret || !accessToken) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const queryParams: any = {
      app_key: appKey,
      timestamp: timestamp.toString()
    };

    if (shopCipher) {
      queryParams.shop_cipher = shopCipher;
    }

    const sortedKeys = Object.keys(queryParams).sort();
    let signString = '';
    for (const key of sortedKeys) {
      signString += `${key}${queryParams[key]}`;
    }

    const apiPath = `/product/202509/products/${productId}`;
    
    // Build signature string: path + params (no body for GET)
    const baseString = apiPath + signString;
    
    // Wrap with app_secret on BOTH sides
    const wrappedString = appSecret + baseString + appSecret;
    
    const sign = generateSignature(appSecret, wrappedString);
    queryParams.sign = sign;

    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

    const response = await axios.get(url, {
      headers: {
        'x-tts-access-token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      data: response.data
    });

  } catch (error: any) {
    console.error('TikTok Shop API Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Update Category - Bulk update endpoint
router.post('/update-category', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      productId,
      categoryId,
      appKey,
      appSecret,
      accessToken,
      shopCipher
    } = req.body;

    if (!productId || !categoryId || !appKey || !appSecret || !accessToken) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, categoryId, appKey, appSecret, accessToken'
      });
      return;
    }

    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Build query parameters
    const queryParams: any = {
      app_key: appKey,
      timestamp: timestamp.toString()
    };

    if (shopCipher) {
      queryParams.shop_cipher = shopCipher;
    }

    // Sort parameters alphabetically and create signature string
    const sortedKeys = Object.keys(queryParams).sort();
    let signString = '';
    for (const key of sortedKeys) {
      signString += `${key}${queryParams[key]}`;
    }

    // Add API path to signature
    const apiPath = `/product/202509/products/${productId}`;

    // Product data with only category update
    const productData = {
      category_id: categoryId
    };

    // For PUT/POST requests, signature must include the request body
    const bodyString = JSON.stringify(productData);
    
    // Build signature string: path + params + body
    const baseString = apiPath + signString + bodyString;
    
    // Wrap with app_secret on BOTH sides
    const wrappedString = appSecret + baseString + appSecret;

    // Generate signature using HMAC-SHA256
    const sign = generateSignature(appSecret, wrappedString);
    queryParams.sign = sign;

    // Build full URL
    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

    // Make API request
    const response = await axios.put(url, productData, {
      headers: {
        'x-tts-access-token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      message: `Product ${productId} category updated to ${categoryId}`,
      data: response.data
    });

  } catch (error: any) {
    console.error('TikTok Shop API Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      debug: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        productId: req.body.productId,
        categoryId: req.body.categoryId
      }
    });
  }
});

// Update Price - Single product endpoint
router.post('/update-price', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      productId,
      skus, // Array of { id: string, amount: string, currency?: string } or { id: string, original_price: string, currency?: string }
      appKey,
      appSecret,
      accessToken,
      shopCipher,
      currency = 'IDR'
    } = req.body;

    if (!productId || !skus || !appKey || !appSecret || !accessToken) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, skus, appKey, appSecret, accessToken'
      });
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const queryParams: any = {
      app_key: appKey,
      timestamp: timestamp.toString()
    };

    if (shopCipher) {
      queryParams.shop_cipher = shopCipher;
    }

    const sortedKeys = Object.keys(queryParams).sort();
    let signString = '';
    for (const key of sortedKeys) {
      signString += `${key}${queryParams[key]}`;
    }

    const apiPath = `/product/202309/products/${productId}/prices/update`;

    // Format SKUs for price update endpoint - match TikTok API format exactly
    const formattedSkus = skus.map((sku: any) => {
      const priceObj: any = {
        amount: sku.original_price?.toString() || sku.amount?.toString(),
        currency: sku.currency || currency
      };
      
      // Add sale_price if provided (optional)
      if (sku.sale_price) {
        priceObj.sale_price = sku.sale_price.toString();
      }
      
      return {
        id: sku.id,
        price: priceObj
      };
    });

    const productData = { skus: formattedSkus };

    // For POST requests, signature must include the request body
    const bodyString = JSON.stringify(productData);
    
    // Build signature string: path + params + body
    const baseString = apiPath + signString + bodyString;
    
    // Wrap with app_secret on BOTH sides
    const wrappedString = appSecret + baseString + appSecret;
    
    const sign = generateSignature(appSecret, wrappedString);
    queryParams.sign = sign;

    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

    const response = await axios.post(url, productData, {
      headers: {
        'x-tts-access-token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      message: `Price updated for product ${productId}`,
      data: response.data
    });

  } catch (error: any) {
    console.error('TikTok Shop API Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      debug: {
        status: error.response?.status,
        statusText: error.response?.statusText
      }
    });
  }
});

// Update Inventory - Single product endpoint
router.post('/update-inventory', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      productId,
      skus, // Array of { id: string, stock_infos: [{ warehouse_id: string, available_stock: number }] }
      appKey,
      appSecret,
      accessToken,
      shopCipher
    } = req.body;

    if (!productId || !skus || !appKey || !appSecret || !accessToken) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, skus, appKey, appSecret, accessToken'
      });
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const queryParams: any = {
      app_key: appKey,
      timestamp: timestamp.toString()
    };

    if (shopCipher) {
      queryParams.shop_cipher = shopCipher;
    }

    const sortedKeys = Object.keys(queryParams).sort();
    let signString = '';
    for (const key of sortedKeys) {
      signString += `${key}${queryParams[key]}`;
    }

    const apiPath = `/product/202309/products/${productId}/inventory/update`;

    // Format SKUs for inventory update endpoint - match TikTok API format exactly
    const formattedSkus = skus.map((sku: any) => ({
      id: sku.id,
      inventory: [{
        quantity: sku.stock_infos?.[0]?.available_stock || sku.available_stock || sku.quantity
      }]
    }));

    const productData = { skus: formattedSkus };

    // For POST requests, signature must include the request body
    const bodyString = JSON.stringify(productData);
    
    // Build signature string: path + params + body
    const baseString = apiPath + signString + bodyString;
    
    // Wrap with app_secret on BOTH sides
    const wrappedString = appSecret + baseString + appSecret;
    
    const sign = generateSignature(appSecret, wrappedString);
    queryParams.sign = sign;

    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

    const response = await axios.post(url, productData, {
      headers: {
        'x-tts-access-token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      message: `Inventory updated for product ${productId}`,
      data: response.data
    });

  } catch (error: any) {
    console.error('TikTok Shop API Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      debug: {
        status: error.response?.status,
        statusText: error.response?.statusText
      }
    });
  }
});

// Bulk Update Price and Inventory from CSV data
router.post('/bulk-update', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      updates, // Array of { productId, skuId, price?, stock? }
      appKey,
      appSecret,
      accessToken,
      shopCipher,
      currency = 'IDR'
    } = req.body;

    if (!updates || !Array.isArray(updates) || !appKey || !appSecret || !accessToken) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: updates (array), appKey, appSecret, accessToken'
      });
      return;
    }

    const results = {
      successful: [] as any[],
      failed: [] as any[]
    };

    // Group updates by productId
    const groupedUpdates = updates.reduce((acc: any, update: any) => {
      if (!acc[update.productId]) {
        acc[update.productId] = [];
      }
      acc[update.productId].push(update);
      return acc;
    }, {});

    // Process each product
    for (const [productId, productUpdates] of Object.entries(groupedUpdates)) {
      try {
        const skuUpdates = productUpdates as any[];
        
        // Separate price and stock updates
        const hasPriceUpdates = skuUpdates.some(u => u.price !== undefined);
        const hasStockUpdates = skuUpdates.some(u => u.stock !== undefined);
        
        let lastResponse: any = null;

        // Update prices if needed
        if (hasPriceUpdates) {
          const timestamp = Math.floor(Date.now() / 1000);
          const queryParams: any = {
            app_key: appKey,
            timestamp: timestamp.toString()
          };

          if (shopCipher) {
            queryParams.shop_cipher = shopCipher;
          }

          const sortedKeys = Object.keys(queryParams).sort();
          let signString = '';
          for (const key of sortedKeys) {
            signString += `${key}${queryParams[key]}`;
          }

          const apiPath = `/product/202309/products/${productId}/prices/update`;

          // Build price SKU updates - match TikTok API format exactly
          const skus = skuUpdates
            .filter(u => u.price !== undefined)
            .map((update: any) => {
              const priceObj: any = {
                amount: update.price.toString(),
                currency: currency
              };
              
              // Add sale_price if provided (optional)
              if (update.salePrice) {
                priceObj.sale_price = update.salePrice.toString();
              }
              
              return {
                id: update.skuId,
                price: priceObj
              };
            });

          const productData = { skus };
          
          const bodyString = JSON.stringify(productData);
          const baseString = apiPath + signString + bodyString;
          const wrappedString = appSecret + baseString + appSecret;
          const sign = generateSignature(appSecret, wrappedString);
          queryParams.sign = sign;

          const queryString = new URLSearchParams(queryParams).toString();
          const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

          const response = await axios.post(url, productData, {
            headers: {
              'x-tts-access-token': accessToken,
              'Content-Type': 'application/json'
            }
          });

          lastResponse = response.data;
        }

        // Update inventory if needed
        if (hasStockUpdates) {
          const timestamp = Math.floor(Date.now() / 1000);
          const queryParams: any = {
            app_key: appKey,
            timestamp: timestamp.toString()
          };

          if (shopCipher) {
            queryParams.shop_cipher = shopCipher;
          }

          const sortedKeys = Object.keys(queryParams).sort();
          let signString = '';
          for (const key of sortedKeys) {
            signString += `${key}${queryParams[key]}`;
          }

          const apiPath = `/product/202309/products/${productId}/inventory/update`;

          // Build inventory SKU updates - match TikTok API format exactly
          const skus = skuUpdates
            .filter(u => u.stock !== undefined)
            .map((update: any) => ({
              id: update.skuId,
              inventory: [{
                quantity: parseInt(update.stock)
              }]
            }));

          const productData = { skus };
          
          const bodyString = JSON.stringify(productData);
          const baseString = apiPath + signString + bodyString;
          const wrappedString = appSecret + baseString + appSecret;
          const sign = generateSignature(appSecret, wrappedString);
          queryParams.sign = sign;

          const queryString = new URLSearchParams(queryParams).toString();
          const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

          const response = await axios.post(url, productData, {
            headers: {
              'x-tts-access-token': accessToken,
              'Content-Type': 'application/json'
            }
          });

          lastResponse = response.data;
        }

        results.successful.push({
          productId,
          productName: skuUpdates[0]?.productName || null,
          skuCount: skuUpdates.length,
          updatedPrice: hasPriceUpdates,
          updatedStock: hasStockUpdates,
          response: lastResponse
        });

      } catch (error: any) {
        const skuUpdates = productUpdates as any[];
        console.error('Bulk Update Error:', {
          productId,
          productName: skuUpdates[0]?.productName || null,
          fullError: error.response?.data || error.message,
          statusCode: error.response?.status
        });
        
        results.failed.push({
          productId,
          productName: skuUpdates[0]?.productName || null,
          error: error.response?.data?.message || error.message,
          errorCode: error.response?.data?.code,
          statusCode: error.response?.status,
          fullResponse: error.response?.data
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk update completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      results
    });

  } catch (error: any) {
    console.error('TikTok Shop Bulk Update Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Bulk Update from CSV File Upload with Real-time Progress (SSE)
router.post('/bulk-update-csv-stream', authenticate, requireAdmin, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { appKey, appSecret, accessToken, shopCipher, currency = 'IDR' } = req.body;

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No CSV file uploaded'
      });
      return;
    }

    if (!appKey || !appSecret || !accessToken) {
      res.status(400).json({
        success: false,
        error: 'Missing required credentials: appKey, appSecret, accessToken'
      });
      return;
    }

    // Parse CSV file
    const csvContent = req.file.buffer.toString('utf-8');
    console.log('\n=== CSV PARSING (STREAM) ===');
    console.log('CSV Content:', csvContent);
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log('Parsed Records Count:', records.length);
    console.log('Parsed Records:', JSON.stringify(records, null, 2));

    // Validate and transform CSV data - Filter out empty rows
    const updates = records
      .filter((record: any) => record.productId && record.skuId) // Skip rows with empty productId or skuId
      .map((record: any) => {
        const update: any = {
          productId: record.productId.trim().replace(/^['"]/, ''), // Remove leading apostrophe or quote
          skuId: record.skuId.trim().replace(/^['"]/, '') // Remove leading apostrophe or quote
        };

        if (record.productName) {
          update.productName = record.productName.trim();
        }

        if (record.price) {
          update.price = record.price.trim();
        }

        if (record.stock) {
          update.stock = record.stock.trim();
        }

        return update;
      });

    console.log('After Filtering - Updates Count:', updates.length);
    console.log('Filtered Updates:', JSON.stringify(updates, null, 2));
    console.log('============================\n');

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid updates found in CSV file'
      });
      return;
    }

    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendProgress = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const results = {
      successful: [] as any[],
      failed: [] as any[]
    };

    // Group updates by productId
    const groupedUpdates = updates.reduce((acc: any, update: any) => {
      if (!acc[update.productId]) {
        acc[update.productId] = [];
      }
      acc[update.productId].push(update);
      return acc;
    }, {});

    const totalProducts = Object.keys(groupedUpdates).length;
    let processedProducts = 0;

    // Send initial progress
    sendProgress({
      type: 'start',
      totalProducts,
      totalRows: updates.length,
      message: 'Starting bulk update...'
    });

    // Process each product
    for (const [productId, productUpdates] of Object.entries(groupedUpdates)) {
      try {
        const skuUpdates = productUpdates as any[];
        
        console.log('=== Processing Product ===');
        console.log('Product ID:', productId);
        console.log('SKU Updates:', JSON.stringify(skuUpdates, null, 2));
        
        // Separate price and stock updates
        const hasPriceUpdates = skuUpdates.some(u => u.price !== undefined);
        const hasStockUpdates = skuUpdates.some(u => u.stock !== undefined);
        
        console.log('Has Price Updates:', hasPriceUpdates);
        console.log('Has Stock Updates:', hasStockUpdates);
        
        let successCount = 0;
        let lastResponse: any = null;

        // Update prices if needed
        if (hasPriceUpdates) {
          const timestamp = Math.floor(Date.now() / 1000);
          const queryParams: any = {
            app_key: appKey,
            timestamp: timestamp.toString()
          };

          if (shopCipher) {
            queryParams.shop_cipher = shopCipher;
          }

          const sortedKeys = Object.keys(queryParams).sort();
          let signString = '';
          for (const key of sortedKeys) {
            signString += `${key}${queryParams[key]}`;
          }

          const apiPath = `/product/202309/products/${productId}/prices/update`;

          // Build price SKU updates - match TikTok API format exactly
          const skus = skuUpdates
            .filter(u => u.price !== undefined)
            .map((update: any) => {
              const priceObj: any = {
                amount: update.price.toString(),
                currency: currency
              };
              
              // Add sale_price if provided (optional)
              if (update.salePrice) {
                priceObj.sale_price = update.salePrice.toString();
              }
              
              return {
                id: update.skuId,
                price: priceObj
              };
            });

          const productData = { skus };
          
          const bodyString = JSON.stringify(productData);
          const baseString = apiPath + signString + bodyString;
          const wrappedString = appSecret + baseString + appSecret;
          const sign = generateSignature(appSecret, wrappedString);
          queryParams.sign = sign;

          const queryString = new URLSearchParams(queryParams).toString();
          const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

          console.log('\n=== PRICE UPDATE REQUEST ===');
          console.log('URL:', url);
          console.log('Request Body:', JSON.stringify(productData, null, 2));
          console.log('SKUs Count:', skus.length);
          console.log('============================\n');

          const response = await axios.post(url, productData, {
            headers: {
              'x-tts-access-token': accessToken,
              'Content-Type': 'application/json'
            }
          });

          console.log('Price Update Response:', JSON.stringify(response.data, null, 2));
          lastResponse = response.data;
          successCount++;
        }

        // Update inventory if needed
        if (hasStockUpdates) {
          const timestamp = Math.floor(Date.now() / 1000);
          const queryParams: any = {
            app_key: appKey,
            timestamp: timestamp.toString()
          };

          if (shopCipher) {
            queryParams.shop_cipher = shopCipher;
          }

          const sortedKeys = Object.keys(queryParams).sort();
          let signString = '';
          for (const key of sortedKeys) {
            signString += `${key}${queryParams[key]}`;
          }

          const apiPath = `/product/202309/products/${productId}/inventory/update`;

          // Build inventory SKU updates - match TikTok API format exactly
          const skus = skuUpdates
            .filter(u => u.stock !== undefined)
            .map((update: any) => ({
              id: update.skuId,
              inventory: [{
                quantity: parseInt(update.stock)
              }]
            }));

          const productData = { skus };
          
          const bodyString = JSON.stringify(productData);
          const baseString = apiPath + signString + bodyString;
          const wrappedString = appSecret + baseString + appSecret;
          const sign = generateSignature(appSecret, wrappedString);
          queryParams.sign = sign;

          const queryString = new URLSearchParams(queryParams).toString();
          const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

          console.log('\n=== INVENTORY UPDATE REQUEST ===');
          console.log('URL:', url);
          console.log('Request Body:', JSON.stringify(productData, null, 2));
          console.log('SKUs Count:', skus.length);
          console.log('================================\n');

          const response = await axios.post(url, productData, {
            headers: {
              'x-tts-access-token': accessToken,
              'Content-Type': 'application/json'
            }
          });

          console.log('Inventory Update Response:', JSON.stringify(response.data, null, 2));
          lastResponse = response.data;
          successCount++;
        }

        results.successful.push({
          productId,
          productName: skuUpdates[0]?.productName || null,
          skuCount: skuUpdates.length,
          skus: skuUpdates.map((u: any) => u.skuId),
          updatedPrice: hasPriceUpdates,
          updatedStock: hasStockUpdates,
          response: lastResponse
        });

        processedProducts++;

        // Send progress update
        sendProgress({
          type: 'progress',
          productId,
          productName: skuUpdates[0]?.productName || null,
          status: 'success',
          skuCount: skuUpdates.length,
          processed: processedProducts,
          total: totalProducts,
          percentage: Math.round((processedProducts / totalProducts) * 100),
          successful: results.successful.length,
          failed: results.failed.length
        });

      } catch (error: any) {
        const skuUpdates = productUpdates as any[];
        console.error('Price/Inventory Update Error:', {
          productId,
          productName: skuUpdates[0]?.productName || null,
          fullError: error.response?.data || error.message,
          statusCode: error.response?.status
        });
        
        const errorDetail = {
          productId,
          productName: skuUpdates[0]?.productName || null,
          skuCount: skuUpdates.length,
          error: error.response?.data?.message || error.message,
          errorCode: error.response?.data?.code,
          statusCode: error.response?.status,
          fullResponse: error.response?.data
        };

        results.failed.push(errorDetail);
        processedProducts++;

        // Send error update
        sendProgress({
          type: 'progress',
          productId,
          productName: skuUpdates[0]?.productName || null,
          status: 'failed',
          error: errorDetail.error,
          errorCode: errorDetail.errorCode,
          processed: processedProducts,
          total: totalProducts,
          percentage: Math.round((processedProducts / totalProducts) * 100),
          successful: results.successful.length,
          failed: results.failed.length
        });
      }
    }

    // Send completion
    sendProgress({
      type: 'complete',
      totalProducts,
      successful: results.successful.length,
      failed: results.failed.length,
      percentage: 100,
      message: `Completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      results
    });

    res.end();

  } catch (error: any) {
    console.error('TikTok Shop CSV Upload Error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message
    })}\n\n`);
    res.end();
  }
});

// Bulk Update from CSV File Upload (Legacy - No Progress)
router.post('/bulk-update-csv', authenticate, requireAdmin, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { appKey, appSecret, accessToken, shopCipher } = req.body;

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No CSV file uploaded'
      });
      return;
    }

    if (!appKey || !appSecret || !accessToken) {
      res.status(400).json({
        success: false,
        error: 'Missing required credentials: appKey, appSecret, accessToken'
      });
      return;
    }

    // Parse CSV file
    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Validate and transform CSV data - Filter out empty rows
    const updates = records
      .filter((record: any) => record.productId && record.skuId) // Skip rows with empty productId or skuId
      .map((record: any) => {
        const update: any = {
          productId: record.productId.trim().replace(/^['"]/, ''), // Remove leading apostrophe or quote
          skuId: record.skuId.trim().replace(/^['"]/, '') // Remove leading apostrophe or quote
        };

        if (record.productName) {
          update.productName = record.productName.trim();
        }

        if (record.price) {
          update.price = record.price.trim();
        }

        if (record.stock) {
          update.stock = record.stock.trim();
        }

        return update;
      });

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid updates found in CSV file'
      });
      return;
    }

    // Process updates using the same logic as bulk-update
    const results = {
      successful: [] as any[],
      failed: [] as any[]
    };

    // Group updates by productId
    const groupedUpdates = updates.reduce((acc: any, update: any) => {
      if (!acc[update.productId]) {
        acc[update.productId] = [];
      }
      acc[update.productId].push(update);
      return acc;
    }, {});

    // Process each product
    for (const [productId, productUpdates] of Object.entries(groupedUpdates)) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const queryParams: any = {
          app_key: appKey,
          timestamp: timestamp.toString()
        };

        if (shopCipher) {
          queryParams.shop_cipher = shopCipher;
        }

        const sortedKeys = Object.keys(queryParams).sort();
        let signString = '';
        for (const key of sortedKeys) {
          signString += `${key}${queryParams[key]}`;
        }

        const apiPath = `/product/202509/products/${productId}`;

        // Build SKU updates
        const skus = (productUpdates as any[]).map((update: any) => {
          const skuData: any = { id: update.skuId };
          
          if (update.price !== undefined) {
            skuData.price = {
              original_price: update.price.toString()
            };
          }
          
          if (update.stock !== undefined) {
            skuData.stock_infos = [{
              available_stock: parseInt(update.stock)
            }];
          }
          
          return skuData;
        });

        const productData = { skus };

        // For PUT/POST requests, signature must include the request body
        const bodyString = JSON.stringify(productData);
        
        // Build signature string: path + params + body
        const baseString = apiPath + signString + bodyString;
        
        // Wrap with app_secret on BOTH sides
        const wrappedString = appSecret + baseString + appSecret;
        
        const sign = generateSignature(appSecret, wrappedString);
        queryParams.sign = sign;

        const queryString = new URLSearchParams(queryParams).toString();
        const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

        const response = await axios.put(url, productData, {
          headers: {
            'x-tts-access-token': accessToken,
            'Content-Type': 'application/json'
          }
        });

        results.successful.push({
          productId,
          skuCount: skus.length,
          response: response.data
        });

      } catch (error: any) {
        results.failed.push({
          productId,
          error: error.response?.data || error.message
        });
      }
    }

    res.json({
      success: true,
      message: `CSV bulk update completed: ${results.successful.length} products successful, ${results.failed.length} failed`,
      totalRows: updates.length,
      results
    });

  } catch (error: any) {
    console.error('TikTok Shop CSV Upload Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
