import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import TikTokOrder from '../models/TikTokOrder.model';

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

// Refresh Access Token - Exchange refresh token for new access token
router.post('/refresh-token', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appKey, appSecret, refreshToken } = req.body;

    if (!appKey || !appSecret || !refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: appKey, appSecret, refreshToken'
      });
      return;
    }

    // Build query parameters for TikTok Shop token refresh
    // According to official docs: auth.tiktok-shops.com/api/v2/token/refresh
    const queryString = new URLSearchParams({
      app_key: appKey,
      app_secret: appSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }).toString();

    // Make GET request to TikTok Shop auth endpoint
    const url = `https://auth.tiktok-shops.com/api/v2/token/refresh?${queryString}`;

    console.log('Refreshing TikTok access token...');
    const response = await axios.get(url);

    if (response.data.code !== 0) {
      res.status(400).json({
        success: false,
        error: response.data.message || 'Failed to refresh token',
        details: response.data
      });
      return;
    }

    // Return the new tokens
    res.json({
      success: true,
      data: {
        accessToken: response.data.data.access_token,
        refreshToken: response.data.data.refresh_token,
        accessTokenExpireIn: response.data.data.access_token_expire_in,
        refreshTokenExpireIn: response.data.data.refresh_token_expire_in,
        openId: response.data.data.open_id,
        sellerName: response.data.data.seller_name,
        sellerBaseRegion: response.data.data.seller_base_region
      },
      fullResponse: response.data
    });

  } catch (error: any) {
    console.error('TikTok Shop Token Refresh Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Get product details including SKU IDs
router.post('/get-product-details', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appKey, appSecret, accessToken, shopCipher, productId } = req.body;

    if (!appKey || !appSecret || !accessToken || !productId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: appKey, appSecret, accessToken, productId'
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

    // Generate signature
    const sortedKeys = Object.keys(queryParams).sort();
    let signString = '';
    for (const key of sortedKeys) {
      signString += `${key}${queryParams[key]}`;
    }

    const apiPath = `/product/202309/products/${productId}`;
    const baseString = apiPath + signString;
    const wrappedString = appSecret + baseString + appSecret;
    const sign = generateSignature(appSecret, wrappedString);
    queryParams.sign = sign;

    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

    console.log('\n=== FETCHING PRODUCT DETAILS ===');
    console.log('Product ID:', productId);
    console.log('URL:', url);
    console.log('================================\n');

    const response = await axios.get(url, {
      headers: {
        'x-tts-access-token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    console.log('Product Details Response:', JSON.stringify(response.data, null, 2));

    if (response.data.code !== 0) {
      res.status(400).json({
        success: false,
        error: response.data.message || 'Failed to fetch product details',
        details: response.data
      });
      return;
    }

    // Extract SKU information
    const product = response.data.data;
    const skus = product.skus?.map((sku: any) => ({
      skuId: sku.id,
      sellerSku: sku.seller_sku,
      price: sku.price?.amount,
      currency: sku.price?.currency,
      stock: sku.inventory?.[0]?.quantity || 0
    })) || [];

    res.json({
      success: true,
      data: {
        productId: product.id,
        productName: product.title,
        status: product.status,
        skus: skus
      },
      fullResponse: response.data
    });

  } catch (error: any) {
    console.error('TikTok Shop Get Product Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Get Order List - Search orders endpoint
router.post('/get-orders', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      appKey,
      appSecret,
      accessToken,
      shopCipher,
      pageSize = 20,
      sortOrder = 'DESC',
      sortField = 'create_time',
      pageToken,
      // Body filters
      orderStatus,
      createTimeGe,
      createTimeLt,
      updateTimeGe,
      updateTimeLt,
      shippingType,
      buyerUserId,
      isBuyerRequestCancel,
      warehouseIds
    } = req.body;

    if (!appKey || !appSecret || !accessToken || !shopCipher) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: appKey, appSecret, accessToken, shopCipher'
      });
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    
    // Build query parameters
    const queryParams: any = {
      app_key: appKey,
      timestamp: timestamp.toString(),
      page_size: pageSize.toString(),
      shop_cipher: shopCipher
    };

    if (sortOrder) queryParams.sort_order = sortOrder;
    if (sortField) queryParams.sort_field = sortField;
    if (pageToken) queryParams.page_token = pageToken;

    // Build request body
    const bodyData: any = {};
    if (orderStatus) bodyData.order_status = orderStatus;
    if (createTimeGe) bodyData.create_time_ge = createTimeGe;
    if (createTimeLt) bodyData.create_time_lt = createTimeLt;
    if (updateTimeGe) bodyData.update_time_ge = updateTimeGe;
    if (updateTimeLt) bodyData.update_time_lt = updateTimeLt;
    if (shippingType) bodyData.shipping_type = shippingType;
    if (buyerUserId) bodyData.buyer_user_id = buyerUserId;
    if (isBuyerRequestCancel !== undefined) bodyData.is_buyer_request_cancel = isBuyerRequestCancel;
    if (warehouseIds) bodyData.warehouse_ids = warehouseIds;

    // Sort parameters alphabetically and create signature string
    const sortedKeys = Object.keys(queryParams).sort();
    let signString = '';
    for (const key of sortedKeys) {
      signString += `${key}${queryParams[key]}`;
    }

    const apiPath = '/order/202309/orders/search';
    const bodyString = JSON.stringify(bodyData);
    
    // Build signature string: path + params + body
    const baseString = apiPath + signString + bodyString;
    
    // Wrap with app_secret on BOTH sides
    const wrappedString = appSecret + baseString + appSecret;
    
    const sign = generateSignature(appSecret, wrappedString);
    queryParams.sign = sign;

    // Build full URL
    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

    // Make API request
    const response = await axios.post(url, bodyData, {
      headers: {
        'x-tts-access-token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      data: response.data,
      filters: {
        orderStatus,
        createTimeGe,
        createTimeLt,
        updateTimeGe,
        updateTimeLt,
        shippingType,
        buyerUserId,
        isBuyerRequestCancel,
        warehouseIds
      }
    });

  } catch (error: any) {
    console.error('TikTok Shop Get Orders Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Get Order Detail - Fetch detailed order information
router.post('/get-order-detail', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      appKey,
      appSecret,
      accessToken,
      shopCipher,
      orderId
    } = req.body;

    if (!appKey || !appSecret || !accessToken || !shopCipher || !orderId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: appKey, appSecret, accessToken, shopCipher, orderId'
      });
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    
    // Build query parameters - order ID passed as 'ids' parameter
    const queryParams: any = {
      app_key: appKey,
      timestamp: timestamp.toString(),
      shop_cipher: shopCipher,
      ids: orderId,  // Order ID is passed as 'ids' query parameter
      version: '202507'
    };

    // Sort parameters alphabetically and create signature string
    const sortedKeys = Object.keys(queryParams).sort();
    let signString = '';
    for (const key of sortedKeys) {
      signString += `${key}${queryParams[key]}`;
    }

    // API path for Get Order Detail
    const apiPath = '/order/202507/orders';
    
    // Build signature string: path + params (no body for GET)
    const baseString = apiPath + signString;
    
    // Wrap with app_secret on BOTH sides
    const wrappedString = appSecret + baseString + appSecret;
    
    const sign = generateSignature(appSecret, wrappedString);
    queryParams.sign = sign;

    // Build full URL
    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

    console.log('🔍 TikTok Get Order Detail API Request:');
    console.log('   Path:', apiPath);
    console.log('   Order ID:', orderId);
    console.log('   Full URL:', url);
    console.log('   Timestamp:', timestamp);

    // Make API request
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
    console.error('TikTok Shop Get Order Detail Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Sync Orders to Database - Fetch orders from TikTok and save to DB
router.post('/sync-orders', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      appKey,
      appSecret,
      accessToken,
      shopCipher,
      startDate,
      endDate
    } = req.body;

    if (!appKey || !appSecret || !accessToken || !shopCipher) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: appKey, appSecret, accessToken, shopCipher'
      });
      return;
    }

    const logs: string[] = [];
    let totalFetched = 0;
    let newOrders = 0;
    let skippedOrders = 0;
    let pageToken: string | undefined = undefined;
    const pageSize = 50;

    logs.push(`\n🚀 Starting TikTok Order Sync`);
    logs.push(`📅 Date Range: ${startDate} to ${endDate}`);
    logs.push(`⏰ Timestamp: ${new Date().toISOString()}\n`);

    // Convert dates to timestamps (seconds)
    // create_time_ge: orders created ON or AFTER this time
    // create_time_lt: orders created BEFORE this time (exclusive)
    const createTimeGe = startDate ? Math.floor(new Date(startDate).getTime() / 1000) : undefined;
    // Add 1 day to endDate to include the entire end date
    const createTimeLt = endDate ? Math.floor(new Date(endDate).getTime() / 1000) + 86400 : undefined;

    logs.push(`🕐 Start timestamp: ${createTimeGe} (${startDate} 00:00:00)`);
    logs.push(`🕐 End timestamp: ${createTimeLt} (${endDate} 23:59:59 + 1 second)\n`);

    do {
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Build query parameters
      const queryParams: any = {
        app_key: appKey,
        timestamp: timestamp.toString(),
        page_size: pageSize.toString(),
        shop_cipher: shopCipher,
        sort_order: 'DESC',
        sort_field: 'create_time'
      };

      if (pageToken) queryParams.page_token = pageToken;

      // Build request body
      const bodyData: any = {};
      if (createTimeGe) bodyData.create_time_ge = createTimeGe;
      if (createTimeLt) bodyData.create_time_lt = createTimeLt;

      // Sort parameters alphabetically and create signature string
      const sortedKeys = Object.keys(queryParams).sort();
      let signString = '';
      for (const key of sortedKeys) {
        signString += `${key}${queryParams[key]}`;
      }

      const apiPath = '/order/202309/orders/search';
      const bodyString = JSON.stringify(bodyData);
      
      // Build signature string: path + params + body
      const baseString = apiPath + signString + bodyString;
      
      // Wrap with app_secret on BOTH sides
      const wrappedString = appSecret + baseString + appSecret;
      
      const sign = generateSignature(appSecret, wrappedString);
      queryParams.sign = sign;

      // Build full URL
      const queryString = new URLSearchParams(queryParams).toString();
      const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

      logs.push(`\n📡 Calling Get Order List API (202309)...`);
      logs.push(`🔗 URL: ${url}`);
      logs.push(`📦 Body: ${JSON.stringify(bodyData, null, 2)}`);
      
      // Make API request
      let response;
      try {
        response = await axios.post(url, bodyData, {
          headers: {
            'x-tts-access-token': accessToken,
            'Content-Type': 'application/json'
          }
        });
      } catch (apiError: any) {
        logs.push(`❌ API Error: ${apiError.response?.data?.message || apiError.message}`);
        logs.push(`❌ Full Error Response: ${JSON.stringify(apiError.response?.data, null, 2)}`);
        throw apiError;
      }

      // Log full API response for debugging
      logs.push(`\n📋 Full API Response:`);
      logs.push(JSON.stringify(response.data, null, 2));

      const orders = response.data?.data?.orders || [];
      const nextPageToken = response.data?.data?.next_page_token;
      const hasMore = nextPageToken && nextPageToken !== '';

      logs.push(`\n✅ Received ${orders.length} orders from API`);
      logs.push(`📊 Total count: ${response.data?.data?.total_count || 0}`);
      logs.push(`📄 Page token: ${pageToken || 'first page'}`);
      logs.push(`➡️ Has more pages: ${hasMore}\n`);

      totalFetched += orders.length;

      // Save orders to database
      for (const order of orders) {
        try {
          const orderId = order.id; // Changed from order.order_id to order.id
          
          // Check if order already exists
          const existingOrder = await TikTokOrder.findOne({ orderId });
          
          if (existingOrder) {
            logs.push(`⏭️ Skipped (exists): ${orderId}`);
            skippedOrders++;
            continue;
          }

          // Save order from Get Order List API (202309)
          const newOrder = new TikTokOrder({
            orderId: order.id,
            orderStatus: order.status,
            createTime: order.create_time,
            updateTime: order.update_time,
            buyerUserId: order.user_id,
            shippingType: order.shipping_type,
            payment: order.payment ? {
              currency: order.payment.currency,
              subTotal: order.payment.sub_total,
              shippingFee: order.payment.shipping_fee,
              platformDiscount: order.payment.platform_discount,
              sellerDiscount: order.payment.seller_discount,
              totalAmount: order.payment.total_amount,
            } : undefined,
            recipientAddress: order.recipient_address ? {
              name: order.recipient_address.name,
              phone: order.recipient_address.phone_number,
              fullAddress: order.recipient_address.full_address,
              postalCode: order.recipient_address.postal_code,
            } : undefined,
            rawData: order,
            syncedAt: new Date(),
          });

          await newOrder.save();
          newOrders++;
          logs.push(`✅ Saved new order: ${orderId} (Status: ${order.status})`);
          
        } catch (saveError: any) {
          logs.push(`❌ Error saving order ${order.id}: ${saveError.message}`);
        }
      }

      pageToken = nextPageToken;

      // Break if no more pages
      if (!hasMore || !nextPageToken) {
        logs.push(`\n✋ No more pages available`);
        break;
      }

    } while (pageToken);

    logs.push(`\n${'='.repeat(50)}`);
    logs.push(`📊 SYNC SUMMARY`);
    logs.push(`${'='.repeat(50)}`);
    logs.push(`📥 Total Fetched from API: ${totalFetched}`);
    logs.push(`✅ New Orders Saved: ${newOrders}`);
    logs.push(`⏭️ Skipped (Already Exists): ${skippedOrders}`);
    logs.push(`${'='.repeat(50)}`);
    logs.push(`✨ Sync completed at ${new Date().toISOString()}`);

    res.json({
      success: true,
      summary: {
        totalFetched,
        newOrders,
        skippedOrders
      },
      logs
    });

  } catch (error: any) {
    console.error('❌ TikTok Shop Sync Orders Error:', error.response?.data || error.message);
    const errorLogs = [
      `\n${'='.repeat(50)}`,
      `❌ SYNC FAILED`,
      `${'='.repeat(50)}`,
      `Error: ${error.message}`,
      `Details: ${JSON.stringify(error.response?.data || {}, null, 2)}`,
      `${'='.repeat(50)}`
    ];
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data,
      logs: errorLogs
    });
  }
});

// Get Orders from Database
router.get('/orders', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const orderId = req.query.orderId as string;

    const query: any = {};
    if (status) {
      query.orderStatus = status;
    }
    if (orderId) {
      query.orderId = orderId;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      TikTokOrder.find(query)
        .sort({ createTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TikTokOrder.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('Get Orders from DB Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Fetch and Update Order Details
router.post('/fetch-order-detail', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      appKey,
      appSecret,
      accessToken,
      shopCipher,
      orderId
    } = req.body;

    if (!appKey || !appSecret || !accessToken || !shopCipher || !orderId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: appKey, appSecret, accessToken, shopCipher, orderId'
      });
      return;
    }

    const logs: string[] = [];
    logs.push(`[${new Date().toISOString()}] Fetching details for order: ${orderId}`);

    const timestamp = Math.floor(Date.now() / 1000);
    
    // Build query parameters - order ID passed as 'ids' parameter
    const queryParams: any = {
      app_key: appKey,
      timestamp: timestamp.toString(),
      shop_cipher: shopCipher,
      ids: orderId,  // Order ID is passed as 'ids' query parameter
      version: '202507'
    };

    // Sort parameters alphabetically and create signature string
    const sortedKeys = Object.keys(queryParams).sort();
    let signString = '';
    for (const key of sortedKeys) {
      signString += `${key}${queryParams[key]}`;
    }

    // API path for Get Order Detail
    const apiPath = '/order/202507/orders';
    
    // Build signature string: path + params (no body for GET)
    const baseString = apiPath + signString;
    
    // Wrap with app_secret on BOTH sides
    const wrappedString = appSecret + baseString + appSecret;
    
    const sign = generateSignature(appSecret, wrappedString);
    queryParams.sign = sign;

    // Build full URL
    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

    logs.push(`[${new Date().toISOString()}] Making API request to TikTok`);
    logs.push(`[${new Date().toISOString()}] API Path: ${apiPath}`);
    logs.push(`[${new Date().toISOString()}] Full URL: ${url}`);

    // Make API request
    const response = await axios.get(url, {
      headers: {
        'x-tts-access-token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    logs.push(`[${new Date().toISOString()}] Received response from TikTok`);

    // Response structure: data.orders[0] contains the order detail
    const orders = response.data?.data?.orders;
    
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      logs.push(`[${new Date().toISOString()}] ERROR: No order data in response`);
      res.json({
        success: false,
        error: 'No order data in response',
        logs
      });
      return;
    }
    
    const orderDetail = orders[0];  // Get first order from array

    // Update order in database with detailed information
    const order = await TikTokOrder.findOne({ orderId });

    if (!order) {
      logs.push(`[${new Date().toISOString()}] WARNING: Order not found in database: ${orderId}`);
      res.json({
        success: false,
        error: 'Order not found in database. Please sync orders first.',
        logs
      });
      return;
    }

    // Update with detailed info
    order.itemList = orderDetail.item_list?.map((item: any) => ({
      productId: item.product_id,
      productName: item.product_name,
      skuId: item.sku_id,
      skuName: item.sku_name,
      skuImage: item.sku_image,
      sellerSku: item.seller_sku,
      quantity: item.quantity,
      originalPrice: item.original_price,
      salePrice: item.sale_price,
    }));

    order.payment = orderDetail.payment ? {
      currency: orderDetail.payment.currency,
      subTotal: orderDetail.payment.sub_total,
      shippingFee: orderDetail.payment.shipping_fee,
      platformDiscount: orderDetail.payment.platform_discount,
      sellerDiscount: orderDetail.payment.seller_discount,
      totalAmount: orderDetail.payment.total_amount,
    } : order.payment;

    order.recipientAddress = orderDetail.recipient_address ? {
      name: orderDetail.recipient_address.name,
      phone: orderDetail.recipient_address.phone,
      fullAddress: orderDetail.recipient_address.full_address,
      district: orderDetail.recipient_address.district,
      city: orderDetail.recipient_address.city,
      province: orderDetail.recipient_address.province,
      postalCode: orderDetail.recipient_address.postal_code,
    } : order.recipientAddress;

    order.rawData = orderDetail;
    order.lastFetchedDetailAt = new Date();

    await order.save();

    logs.push(`[${new Date().toISOString()}] Updated order in database`);
    logs.push(`[${new Date().toISOString()}] SUCCESS: Order details fetched and saved`);

    res.json({
      success: true,
      data: order,
      logs
    });

  } catch (error: any) {
    console.error('Fetch Order Detail Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data,
      logs: [`[${new Date().toISOString()}] ERROR: ${error.message}`]
    });
  }
});

export default router;
