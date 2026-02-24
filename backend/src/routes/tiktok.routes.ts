import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import TikTokOrder from '../models/TikTokOrder.model';
import TikTokCredentials from '../models/TikTokCredentials.model';
import Card from '../models/Card.model';
import User from '../models/User.model';
import config from '../config/env';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ── Credential encryption (AES-256-CBC) ───────────────────────────────────
// Key is always 32 bytes — derived from JWT_SECRET via SHA-256
const CRED_KEY = crypto.createHash('sha256').update(config.jwtSecret).digest();

const encrypt = (text: string): string => {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', CRED_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (stored: string): string => {
  if (!stored || !stored.includes(':')) return stored; // plain-text fallback
  const [ivHex, encHex] = stored.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', CRED_KEY, Buffer.from(ivHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
};

// GET /api/admin/tiktok/credentials — load saved credentials
router.get('/credentials', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await TikTokCredentials.findOne();
    if (!doc) { res.json({ found: false }); return; }
    res.json({
      found: true,
      appKey:       decrypt(doc.appKey),
      appSecret:    decrypt(doc.appSecret),
      accessToken:  decrypt(doc.accessToken),
      refreshToken: decrypt(doc.refreshToken),
      shopCipher:   decrypt(doc.shopCipher),
      updatedAt:    doc.updatedAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/tiktok/credentials — save/update credentials
router.post('/credentials', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { appKey, appSecret, accessToken, refreshToken, shopCipher } = req.body;
    await TikTokCredentials.findOneAndUpdate(
      {},
      {
        appKey:       encrypt(appKey       || ''),
        appSecret:    encrypt(appSecret    || ''),
        accessToken:  encrypt(accessToken  || ''),
        refreshToken: encrypt(refreshToken || ''),
        shopCipher:   encrypt(shopCipher   || ''),
      },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Credentials saved securely.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// TikTok Shop API base URL for SEA region
const TIKTOK_API_BASE = 'https://open-api.tiktokglobalshop.com';

// Generate HMAC-SHA256 signature for TikTok Shop API
const generateSignature = (appSecret: string, params: string): string => {
  return crypto
    .createHmac('sha256', appSecret)
    .update(params)
    .digest('hex');
};

// Helper function to fetch order details from TikTok API
const fetchOrderDetailFromAPI = async (
  orderId: string,
  appKey: string,
  appSecret: string,
  accessToken: string,
  shopCipher: string
): Promise<any> => {
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Build query parameters - order ID passed as 'ids' parameter
  const queryParams: any = {
    app_key: appKey,
    timestamp: timestamp.toString(),
    shop_cipher: shopCipher,
    ids: orderId,
    version: '202507'
  };

  // Sort parameters alphabetically and create signature string
  const sortedKeys = Object.keys(queryParams).sort();
  let signString = '';
  for (const key of sortedKeys) {
    signString += `${key}${queryParams[key]}`;
  }

  const apiPath = '/order/202507/orders';
  const baseString = apiPath + signString;
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

  const orders = response.data?.data?.orders;
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    throw new Error('No order data in API response');
  }

  return orders[0];
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

    // ── Helper: process a single product ────────────────────────────────────────
    const processOneProduct = async (productId: string, productUpdates: any[]): Promise<void> => {
      const skuUpdates = productUpdates as any[];
      const hasPriceUpdates = skuUpdates.some(u => u.price !== undefined);
      const hasStockUpdates = skuUpdates.some(u => u.stock !== undefined);

      let lastResponse: any = null;

      try {
        // Update prices if needed
        if (hasPriceUpdates) {
          const timestamp = Math.floor(Date.now() / 1000);
          const queryParams: any = { app_key: appKey, timestamp: timestamp.toString() };
          if (shopCipher) queryParams.shop_cipher = shopCipher;

          const sortedKeys = Object.keys(queryParams).sort();
          let signString = '';
          for (const key of sortedKeys) signString += `${key}${queryParams[key]}`;

          const apiPath = `/product/202309/products/${productId}/prices/update`;
          const skus = skuUpdates
            .filter(u => u.price !== undefined)
            .map((update: any) => {
              const priceObj: any = { amount: update.price.toString(), currency };
              if (update.salePrice) priceObj.sale_price = update.salePrice.toString();
              return { id: update.skuId, price: priceObj };
            });

          const productData = { skus };
          const bodyString = JSON.stringify(productData);
          const baseString = apiPath + signString + bodyString;
          const wrappedString = appSecret + baseString + appSecret;
          queryParams.sign = generateSignature(appSecret, wrappedString);

          const url = `${TIKTOK_API_BASE}${apiPath}?${new URLSearchParams(queryParams).toString()}`;
          const response = await axios.post(url, productData, {
            headers: { 'x-tts-access-token': accessToken, 'Content-Type': 'application/json' }
          });
          lastResponse = response.data;
        }

        // Update inventory if needed
        if (hasStockUpdates) {
          const timestamp = Math.floor(Date.now() / 1000);
          const queryParams: any = { app_key: appKey, timestamp: timestamp.toString() };
          if (shopCipher) queryParams.shop_cipher = shopCipher;

          const sortedKeys = Object.keys(queryParams).sort();
          let signString = '';
          for (const key of sortedKeys) signString += `${key}${queryParams[key]}`;

          const apiPath = `/product/202309/products/${productId}/inventory/update`;
          const skus = skuUpdates
            .filter(u => u.stock !== undefined)
            .map((update: any) => ({
              id: update.skuId,
              inventory: [{ quantity: parseInt(update.stock) }]
            }));

          const productData = { skus };
          const bodyString = JSON.stringify(productData);
          const baseString = apiPath + signString + bodyString;
          const wrappedString = appSecret + baseString + appSecret;
          queryParams.sign = generateSignature(appSecret, wrappedString);

          const url = `${TIKTOK_API_BASE}${apiPath}?${new URLSearchParams(queryParams).toString()}`;
          const response = await axios.post(url, productData, {
            headers: { 'x-tts-access-token': accessToken, 'Content-Type': 'application/json' }
          });
          lastResponse = response.data;
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
    };

    // ── Process in concurrent batches of 25 (TikTok allows 30 req/s) ───────────
    const CONCURRENCY = 25;
    const entries = Object.entries(groupedUpdates);
    for (let i = 0; i < entries.length; i += CONCURRENCY) {
      const batch = entries.slice(i, i + CONCURRENCY);
      await Promise.allSettled(
        batch.map(([productId, productUpdates]) => processOneProduct(productId, productUpdates as any[]))
      );
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
          
          // Fetch and save detailed order information
          try {
            logs.push(`   🔍 Fetching details for order: ${orderId}`);
            const orderDetail = await fetchOrderDetailFromAPI(orderId, appKey, appSecret, accessToken, shopCipher);
            
            // DEBUG: Log the first line item to see its structure
            if (orderDetail.line_items && orderDetail.line_items.length > 0) {
              console.log('\n🔍 TikTok API Line Item Structure:');
              console.log(JSON.stringify(orderDetail.line_items[0], null, 2));
              console.log('Available fields:', Object.keys(orderDetail.line_items[0]));
            }
            
            // Update order with detailed information
            newOrder.itemList = orderDetail.line_items?.map((item: any) => ({
              productId: item.product_id,
              productName: item.product_name,
              skuId: item.sku_id,
              skuName: item.sku_name,
              skuImage: item.sku_image,
              sellerSku: item.seller_sku,
              quantity: item.quantity || item.item_quantity || item.sku_quantity || 1, // Try multiple field names
              originalPrice: item.original_price,
              salePrice: item.sale_price,
            }));
            
            console.log('📦 Mapped itemList[0]:', newOrder.itemList?.[0]);

            if (orderDetail.payment) {
              newOrder.payment = {
                currency: orderDetail.payment.currency,
                subTotal: orderDetail.payment.sub_total,
                shippingFee: orderDetail.payment.shipping_fee,
                platformDiscount: orderDetail.payment.platform_discount,
                sellerDiscount: orderDetail.payment.seller_discount,
                totalAmount: orderDetail.payment.total_amount,
              };
            }

            if (orderDetail.recipient_address) {
              newOrder.recipientAddress = {
                name: orderDetail.recipient_address.name,
                phone: orderDetail.recipient_address.phone,
                fullAddress: orderDetail.recipient_address.full_address,
                district: orderDetail.recipient_address.district,
                city: orderDetail.recipient_address.city,
                province: orderDetail.recipient_address.province,
                postalCode: orderDetail.recipient_address.postal_code,
              };
            }

            newOrder.rawData = orderDetail;
            newOrder.lastFetchedDetailAt = new Date();
            
            await newOrder.save();
            logs.push(`   ✅ Saved order details with ${orderDetail.line_items?.length || 0} items`);
            
          } catch (detailError: any) {
            logs.push(`   ⚠️ Warning: Could not fetch details for ${orderId}: ${detailError.message}`);
            // Continue even if detail fetch fails - we still have basic order info
          }
          
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

// Delete All Orders from Database
router.delete('/delete-all-orders', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await TikTokOrder.deleteMany({});
    
    console.log(`🗑️ Deleted ${result.deletedCount} orders from database`);
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} orders`,
      deletedCount: result.deletedCount
    });
    
  } catch (error: any) {
    console.error('Delete All Orders Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
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

// Find Sellers with Card - Search for cards matching product name
router.post('/find-sellers-with-card', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerSku } = req.body;

    if (!sellerSku) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: sellerSku'
      });
      return;
    }

    console.log('Search - Seller SKU:', sellerSku);

    // Search for cards with matching sellerSku in inventory
    const cards = await Card.find({
      'inventory.sellerSku': sellerSku,
      'inventory.quantityForSale': { $gt: 0 }
    }).select('name setCode setName collectorNumber imageUrl inventory');

    // Get all unique seller IDs
    const sellerIds = [...new Set(
      cards.flatMap(card => 
        card.inventory
          .filter(inv => inv.sellerId)
          .map(inv => inv.sellerId?.toString())
      )
    )].filter(Boolean);

    console.log('Search - Unique Seller IDs:', sellerIds);

    // Fetch seller info (name and email) from User table
    const sellers = await User.find({ _id: { $in: sellerIds } }).select('_id email name');
    const sellerEmailMap = new Map(
      sellers.map(s => [s._id.toString(), s.email.split('@')[0]]) // Get username part before @
    );
    const sellerNameMap = new Map(
      sellers.map(s => [s._id.toString(), s.name || s.email.split('@')[0]]) // Use name or fallback to email username
    );

    console.log('Search - Seller Email Map:', Array.from(sellerEmailMap.entries()));
    console.log('Search - Seller Name Map:', Array.from(sellerNameMap.entries()));

    // Filter to only show inventory items with matching SKU and quantity for sale
    const results = cards.map(card => ({
      cardId: card._id,
      name: card.name,
      setCode: card.setCode,
      setName: card.setName,
      collectorNumber: card.collectorNumber,
      imageUrl: card.imageUrl,
      inventory: card.inventory
        .map((inv, index) => {
          const sellerIdStr = inv.sellerId?.toString();
          const sellerEmail = sellerIdStr ? sellerEmailMap.get(sellerIdStr) : null;
          const sellerName = sellerIdStr ? sellerNameMap.get(sellerIdStr) : inv.sellerName; // Use current name from User table
          console.log(`Inventory ${index}: sellerId=${sellerIdStr}, name=${sellerName}, email=${sellerEmail}`);
          return {
            condition: inv.condition,
            finish: inv.finish,
            quantityOwned: inv.quantityOwned,
            quantityForSale: inv.quantityForSale,
            buyPrice: inv.buyPrice,
            sellPrice: inv.sellPrice,
            marketplacePrice: inv.marketplacePrice,
            sellerId: inv.sellerId,
            sellerName: sellerName, // Use current name from User table
            sellerEmail: sellerEmail,
            tiktokProductId: inv.tiktokProductId,
            tiktokSkuId: inv.tiktokSkuId,
            sellerSku: inv.sellerSku,
            inventoryIndex: index
          };
        })
        .filter(inv => inv.sellerSku === sellerSku && inv.quantityForSale > 0)
    })).filter(card => card.inventory.length > 0);

    console.log('Search - Results found:', results.length);
    console.log('Search - First result:', JSON.stringify(results[0], null, 2));

    res.json({
      success: true,
      data: results
    });

  } catch (error: any) {
    console.error('Find Sellers Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Assign Card to Order Item - Decrease stock and track assignment
router.post('/assign-card-to-order', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, itemIndex, cardId, inventoryIndex } = req.body;

    if (!orderId || itemIndex === undefined || !cardId || inventoryIndex === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, itemIndex, cardId, inventoryIndex'
      });
      return;
    }

    // Find the order
    const order = await TikTokOrder.findOne({ orderId });
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    // Find the card
    const card = await Card.findById(cardId);
    if (!card) {
      res.status(404).json({
        success: false,
        error: 'Card not found'
      });
      return;
    }

    // Validate inventory index
    if (inventoryIndex >= card.inventory.length) {
      res.status(400).json({
        success: false,
        error: 'Invalid inventory index'
      });
      return;
    }

    const inventoryItem = card.inventory[inventoryIndex];
    const orderItem = order.itemList![itemIndex];

    // Comprehensive debugging
    console.log('\n=== ASSIGNMENT DEBUG ===');
    console.log('Order ID:', orderId);
    console.log('Item Index:', itemIndex);
    console.log('Order has itemList:', !!order.itemList);
    console.log('ItemList length:', order.itemList?.length);
    console.log('Full Order Item:', JSON.stringify(orderItem, null, 2));
    console.log('Order Item Quantity:', orderItem.quantity, 'Type:', typeof orderItem.quantity);
    console.log('Inventory quantityForSale:', inventoryItem.quantityForSale, 'Type:', typeof inventoryItem.quantityForSale);
    console.log('Inventory quantityOwned:', inventoryItem.quantityOwned, 'Type:', typeof inventoryItem.quantityOwned);

    // Convert to numbers explicitly to prevent NaN
    const orderQuantity = Number(orderItem.quantity);
    if (isNaN(orderQuantity)) {
      console.error('ERROR: Order quantity is not a valid number!', orderItem.quantity);
      res.status(400).json({
        success: false,
        error: `Invalid order quantity: ${orderItem.quantity}`
      });
      return;
    }

    // Sanitize quantityForSale to prevent NaN errors
    if (isNaN(inventoryItem.quantityForSale as any) || typeof inventoryItem.quantityForSale !== 'number') {
      console.log('Warning: Invalid quantityForSale detected, fixing...', inventoryItem.quantityForSale);
      inventoryItem.quantityForSale = Number(inventoryItem.quantityOwned) || 0;
    }

    // Ensure it's a proper number
    inventoryItem.quantityForSale = Number(inventoryItem.quantityForSale);

    // Check if enough stock available
    if (inventoryItem.quantityForSale < orderQuantity) {
      res.status(400).json({
        success: false,
        error: `Not enough stock. Available: ${inventoryItem.quantityForSale}, Required: ${orderQuantity}`
      });
      return;
    }

    // If already assigned, automatically undo first (restore stock)
    if (orderItem.assignedSeller) {
      const previousCardId = orderItem.assignedSeller.cardId;
      const previousInventoryIndex = orderItem.assignedSeller.inventoryIndex;
      
      console.log('Auto-undo - Previous:', { cardId: previousCardId, inventoryIndex: previousInventoryIndex });
      console.log('Auto-undo - New:', { cardId: cardId, inventoryIndex: inventoryIndex });
      
      // Only restore stock if it's a different card or different inventory item
      if (previousCardId !== cardId || previousInventoryIndex !== inventoryIndex) {
        const previousCard = await Card.findById(previousCardId);
        if (previousCard && previousCard.inventory[previousInventoryIndex]) {
          let currentQty = Number(previousCard.inventory[previousInventoryIndex].quantityForSale);
          
          // Sanitize previous card's quantityForSale
          if (isNaN(currentQty)) {
            console.log('Warning: Previous card has invalid quantityForSale, fixing...', currentQty);
            currentQty = Number(previousCard.inventory[previousInventoryIndex].quantityOwned) || 0;
            previousCard.inventory[previousInventoryIndex].quantityForSale = currentQty;
          }
          
          console.log('Auto-undo - Current qty:', currentQty, 'Restoring:', orderQuantity);
          previousCard.inventory[previousInventoryIndex].quantityForSale = currentQty + orderQuantity;
          console.log('Auto-undo - New quantity:', previousCard.inventory[previousInventoryIndex].quantityForSale);
          await previousCard.save();
          console.log('Auto-undo: Restored stock for previous assignment');
        }
      } else {
        console.log('Auto-undo: Same item selected, no stock change needed');
      }
    }

    // Decrease stock with explicit number arithmetic
    const newQuantity = inventoryItem.quantityForSale - orderQuantity;
    console.log('Deducting stock:', inventoryItem.quantityForSale, '-', orderQuantity, '=', newQuantity);
    
    if (isNaN(newQuantity)) {
      console.error('ERROR: Arithmetic produced NaN!');
      console.error('  inventoryItem.quantityForSale:', inventoryItem.quantityForSale, typeof inventoryItem.quantityForSale);
      console.error('  orderQuantity:', orderQuantity, typeof orderQuantity);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate new stock quantity'
      });
      return;
    }

    inventoryItem.quantityForSale = newQuantity;
    console.log('New quantityForSale before save:', inventoryItem.quantityForSale, 'Type:', typeof inventoryItem.quantityForSale);
    
    await card.save();
    console.log('=== ASSIGNMENT DEBUG END ===\n');

    // Get seller info (name and email) from User table
    let sellerEmail: string | undefined = undefined;
    let sellerName: string = 'Unknown';
    if (inventoryItem.sellerId) {
      const seller = await User.findById(inventoryItem.sellerId).select('email name');
      if (seller) {
        sellerEmail = seller.email.split('@')[0]; // Get username part
        sellerName = seller.name || seller.email.split('@')[0]; // Use name or fallback to email username
      }
      console.log('Assignment - SellerId:', inventoryItem.sellerId, 'Name:', sellerName, 'Email:', sellerEmail);
    }

    // Track assignment
    orderItem.assignedSeller = {
      cardId: cardId,
      sellerId: inventoryItem.sellerId || '',
      sellerName: sellerName,
      sellerEmail: sellerEmail,
      inventoryIndex: inventoryIndex,
      assignedAt: new Date()
    };
    await order.save();

    console.log('Assignment - Saved assignedSeller:', orderItem.assignedSeller);

    res.json({
      success: true,
      message: `Assigned ${orderItem.quantity} units to ${sellerName}`,
      data: {
        order,
        remainingStock: inventoryItem.quantityForSale
      }
    });

  } catch (error: any) {
    console.error('Assign Card Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Undo Card Assignment - Restore stock
router.post('/undo-card-assignment', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, itemIndex } = req.body;

    if (!orderId || itemIndex === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, itemIndex'
      });
      return;
    }

    // Find the order
    const order = await TikTokOrder.findOne({ orderId });
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    const orderItem = order.itemList![itemIndex];

    // Check if assigned
    if (!orderItem.assignedSeller) {
      res.status(400).json({
        success: false,
        error: 'This order item is not assigned to any seller'
      });
      return;
    }

    // Find the card and restore stock
    const card = await Card.findById(orderItem.assignedSeller.cardId);
    if (card) {
      const inventoryItem = card.inventory[orderItem.assignedSeller.inventoryIndex];
      if (inventoryItem) {
        inventoryItem.quantityForSale += orderItem.quantity;
        await card.save();
      }
    }

    // Remove assignment
    const sellerName = orderItem.assignedSeller.sellerName;
    orderItem.assignedSeller = undefined;
    await order.save();

    res.json({
      success: true,
      message: `Undone assignment from ${sellerName}. Stock restored.`,
      data: order
    });

  } catch (error: any) {
    console.error('Undo Assignment Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Edit Inventory Stock - Manual stock adjustment
router.post('/edit-inventory-stock', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { cardId, inventoryIndex, newQuantity } = req.body;

    if (!cardId || inventoryIndex === undefined || newQuantity === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: cardId, inventoryIndex, newQuantity'
      });
      return;
    }

    // Find the card
    const card = await Card.findById(cardId);
    if (!card) {
      res.status(404).json({
        success: false,
        error: 'Card not found'
      });
      return;
    }

    // Validate inventory index
    if (inventoryIndex >= card.inventory.length) {
      res.status(400).json({
        success: false,
        error: 'Invalid inventory index'
      });
      return;
    }

    // Validate quantity
    if (newQuantity < 0) {
      res.status(400).json({
        success: false,
        error: 'Quantity cannot be negative'
      });
      return;
    }

    // Update stock
    const oldQuantity = card.inventory[inventoryIndex].quantityForSale;
    card.inventory[inventoryIndex].quantityForSale = newQuantity;
    await card.save();

    res.json({
      success: true,
      message: `Updated stock from ${oldQuantity} to ${newQuantity}`,
      data: {
        oldQuantity,
        newQuantity,
        inventoryItem: card.inventory[inventoryIndex]
      }
    });

  } catch (error: any) {
    console.error('Edit Stock Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to check seller inventory
router.get('/debug/seller-inventory/:sellerId', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    
    const seller = await User.findById(sellerId).select('name email');
    const cards = await Card.find({ 'inventory.sellerId': sellerId }).select('name setCode collectorNumber inventory');
    
    const inventoryItems = cards.flatMap(card => 
      card.inventory
        .filter(inv => inv.sellerId?.toString() === sellerId)
        .map(inv => ({
          cardName: card.name,
          setCode: card.setCode,
          collectorNumber: card.collectorNumber,
          sellerSku: inv.sellerSku,
          condition: inv.condition,
          finish: inv.finish,
          quantityOwned: inv.quantityOwned,
          quantityForSale: inv.quantityForSale,
          sellerName: inv.sellerName,
          inventoryIndex: card.inventory.indexOf(inv)
        }))
    );
    
    res.json({
      success: true,
      seller: seller,
      totalItems: inventoryItems.length,
      inventory: inventoryItems
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
