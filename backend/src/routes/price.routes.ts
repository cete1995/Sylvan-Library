import { Router, Request, Response } from 'express';
import axios from 'axios';
import CardPrice from '../models/CardPrice';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { verifyToken } from '../utils/auth.utils';

const router = Router();

// Store import progress
let importProgress = {
  isImporting: false,
  currentCard: 0,
  totalCards: 0,
  imported: 0,
  skipped: 0,
  percentage: 0,
  status: 'idle',
  downloadProgress: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  downloadSpeed: 0
};

// SSE endpoint for import progress
router.get('/import-progress', (req: Request, res: Response) => {
  // For SSE, we need to handle auth via query parameter since EventSource doesn't support custom headers
  const token = req.query.token as string;
  
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  // Verify the JWT is valid and belongs to an admin
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Send initial progress
  res.write(`data: ${JSON.stringify(importProgress)}\n\n`);

  // Send progress updates every 500ms
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify(importProgress)}\n\n`);
    
    // Close connection when import is complete
    if (!importProgress.isImporting && importProgress.status === 'completed') {
      clearInterval(interval);
      res.end();
    }
  }, 500);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Download and import AllPricesToday.json from MTGJson
router.post('/import-prices', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  if (importProgress.isImporting) {
    res.status(400).json({
      error: 'Import already in progress'
    });
    return;
  }

  // Reset progress
  importProgress = {
    isImporting: true,
    currentCard: 0,
    totalCards: 0,
    imported: 0,
    skipped: 0,
    percentage: 0,
    status: 'downloading',
    downloadProgress: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    downloadSpeed: 0
  };

  // Start import in background, return immediately
  res.json({
    success: true,
    message: 'Import started. Use /import-progress to monitor progress.'
  });

  // Run import in background (don't await)
  Promise.resolve().then(async () => {
    try {
      console.log('Downloading AllPricesToday.json from MTGJson...');
    
    // Track download progress
    let startTime = Date.now();
    let lastUpdateTime = startTime;
    let lastDownloadedBytes = 0;
    
    // Download the price data with progress tracking
    const response = await axios.get('https://mtgjson.com/api/v5/AllPricesToday.json', {
      timeout: 300000, // 5 minutes timeout
      maxContentLength: 500 * 1024 * 1024, // 500MB max
      onDownloadProgress: (progressEvent) => {
        const now = Date.now();
        const timeDiff = (now - lastUpdateTime) / 1000; // seconds
        
        if (progressEvent.total) {
          importProgress.totalBytes = progressEvent.total;
          importProgress.downloadedBytes = progressEvent.loaded;
          importProgress.downloadProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          
          // Calculate download speed (bytes per second)
          if (timeDiff > 0.5) { // Update speed every 500ms
            const bytesDiff = progressEvent.loaded - lastDownloadedBytes;
            importProgress.downloadSpeed = Math.round(bytesDiff / timeDiff); // bytes/second
            lastUpdateTime = now;
            lastDownloadedBytes = progressEvent.loaded;
          }
          
          console.log(`Download progress: ${importProgress.downloadProgress}% (${(progressEvent.loaded / 1024 / 1024).toFixed(2)} MB / ${(progressEvent.total / 1024 / 1024).toFixed(2)} MB) - ${(importProgress.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s`);
        }
      }
    });

    const priceData = response.data.data;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Process each UUID in the price data
    const uuids = Object.keys(priceData);
    importProgress.totalCards = uuids.length;
    importProgress.status = 'processing';
    console.log(`Processing ${uuids.length} card prices...`);

    // Pre-fetch ALL UUIDs that already have a price record for today in a single query
    // This replaces the N individual findOne calls that were in the loop
    const alreadyImportedUuids = await CardPrice.distinct('uuid', { date: today }) as string[];
    const alreadyImportedSet = new Set<string>(alreadyImportedUuids);
    console.log(`Loaded ${alreadyImportedSet.size} already-imported UUIDs for today`);

    for (const uuid of uuids) {
      const cardPriceData = priceData[uuid];
      
      // Skip if no paper data (we only want paper prices, not MTGO)
      if (!cardPriceData.paper) {
        skippedCount++;
        importProgress.currentCard++;
        importProgress.skipped = skippedCount;
        importProgress.percentage = Math.round((importProgress.currentCard / importProgress.totalCards) * 100);
        continue;
      }
      
      // Check if we already have data for this UUID today (O(1) Set lookup, no DB query)
      if (alreadyImportedSet.has(uuid)) {
        skippedCount++;
        importProgress.currentCard++;
        importProgress.skipped = skippedCount;
        importProgress.percentage = Math.round((importProgress.currentCard / importProgress.totalCards) * 100);
        continue;
      }

      // Extract prices from paper section only
      const prices: any = {};
      const paperData = cardPriceData.paper;

      if (paperData.cardkingdom?.retail) {
        prices.cardkingdom = { retail: {} };
        // Extract the latest date's price
        if (paperData.cardkingdom.retail.normal) {
          const normalPrices = paperData.cardkingdom.retail.normal;
          const latestDate = Object.keys(normalPrices).sort().pop();
          if (latestDate) {
            prices.cardkingdom.retail.normal = normalPrices[latestDate];
          }
        }
        if (paperData.cardkingdom.retail.foil) {
          const foilPrices = paperData.cardkingdom.retail.foil;
          const latestDate = Object.keys(foilPrices).sort().pop();
          if (latestDate) {
            prices.cardkingdom.retail.foil = foilPrices[latestDate];
          }
        }
        if (paperData.cardkingdom.retail.etched) {
          const etchedPrices = paperData.cardkingdom.retail.etched;
          const latestDate = Object.keys(etchedPrices).sort().pop();
          if (latestDate) {
            prices.cardkingdom.retail.etched = etchedPrices[latestDate];
          }
        }
      }

      if (paperData.tcgplayer?.retail) {
        prices.tcgplayer = { retail: {} };
        if (paperData.tcgplayer.retail.normal) {
          const normalPrices = paperData.tcgplayer.retail.normal;
          const latestDate = Object.keys(normalPrices).sort().pop();
          if (latestDate) {
            prices.tcgplayer.retail.normal = normalPrices[latestDate];
          }
        }
        if (paperData.tcgplayer.retail.foil) {
          const foilPrices = paperData.tcgplayer.retail.foil;
          const latestDate = Object.keys(foilPrices).sort().pop();
          if (latestDate) {
            prices.tcgplayer.retail.foil = foilPrices[latestDate];
          }
        }
        if (paperData.tcgplayer.retail.etched) {
          const etchedPrices = paperData.tcgplayer.retail.etched;
          const latestDate = Object.keys(etchedPrices).sort().pop();
          if (latestDate) {
            prices.tcgplayer.retail.etched = etchedPrices[latestDate];
          }
        }
      }

      // Only create record if we have at least some price data
      if (Object.keys(prices).length > 0) {
        await CardPrice.create({
          uuid,
          date: today,
          prices
        });
        importedCount++;
      } else {
        skippedCount++;
      }

      // Update progress
      importProgress.currentCard++;
      importProgress.imported = importedCount;
      importProgress.skipped = skippedCount;
      importProgress.percentage = Math.round((importProgress.currentCard / importProgress.totalCards) * 100);

      // Log progress every 1000 cards
      if (importedCount % 1000 === 0) {
        console.log(`Imported ${importedCount} cards...`);
      }
    }

    // Mark as completed
    importProgress.isImporting = false;
    importProgress.status = 'completed';
    console.log(`Import completed: ${importedCount} imported, ${skippedCount} skipped`);

  } catch (error: any) {
    console.error('Price import error:', error);
    importProgress.isImporting = false;
    importProgress.status = 'error';
  }
  }).catch(err => console.error('Background import error:', err));
});

// Get price history for a specific card UUID
router.get('/card-prices/:uuid', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const { startDate, endDate, days } = req.query;

    let query: any = { uuid };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
      query.date = { $gte: daysAgo };
    }

    const prices = await CardPrice.find(query)
      .sort({ date: 1 })
      .lean();

    res.json({
      success: true,
      uuid,
      prices
    });

  } catch (error: any) {
    console.error('Get price history error:', error);
    res.status(500).json({
      error: 'Failed to get price history',
      message: error.message
    });
  }
});

// Get latest price for a specific card UUID
router.get('/card-price/:uuid/latest', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    const latestPrice = await CardPrice.findOne({ uuid })
      .sort({ date: -1 })
      .lean();

    if (!latestPrice) {
      return res.status(404).json({
        error: 'No price data found for this card'
      });
    }

    return res.json({
      success: true,
      price: latestPrice
    });

  } catch (error: any) {
    console.error('Get latest price error:', error);
    return res.status(500).json({
      error: 'Failed to get latest price',
      message: error.message
    });
  }
});

// Get import status (check if prices exist for today)
router.get('/import-status', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await CardPrice.countDocuments({ date: today });
    
    const latestImport = await CardPrice.findOne()
      .sort({ date: -1 })
      .select('date')
      .lean();

    res.json({
      success: true,
      todayCount: count,
      hasDataForToday: count > 0,
      latestImportDate: latestImport?.date || null
    });

  } catch (error: any) {
    console.error('Get import status error:', error);
    res.status(500).json({
      error: 'Failed to get import status',
      message: error.message
    });
  }
});

export default router;
