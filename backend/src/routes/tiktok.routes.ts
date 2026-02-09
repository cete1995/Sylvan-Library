import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

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
    signString = apiPath + signString;

    // Generate signature
    const sign = generateSignature(appSecret, signString);
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
    signString = apiPath + signString;
    const sign = generateSignature(appSecret, signString);
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
    signString = apiPath + signString;

    // Generate signature
    const sign = generateSignature(appSecret, signString);
    queryParams.sign = sign;

    // Build full URL
    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${TIKTOK_API_BASE}${apiPath}?${queryString}`;

    // Product data with only category update
    const productData = {
      category_id: categoryId
    };

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

export default router;
