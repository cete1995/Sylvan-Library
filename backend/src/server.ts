import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase } from './config/database';
import config from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', config.frontendUrl],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Increase limit for large set JSON uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
import authRoutes from './routes/auth.routes';
import cardRoutes from './routes/card.routes';
import adminRoutes from './routes/admin.routes';
import cartRoutes from './routes/cart.routes';
import carouselRoutes from './routes/public-carousel.routes';
import adminCarouselRoutes from './routes/carousel.routes';
import featuredRoutes from './routes/public-featured.routes';
import adminFeaturedRoutes from './routes/featured.routes';
import uploadRoutes from './routes/upload.routes';
import profileRoutes from './routes/profile.routes';
import orderRoutes from './routes/order.routes';
import priceRoutes from './routes/price.routes';
import ubPricingRoutes from './routes/ubPricing.routes';

app.get('/api', (_req, res) => {
  res.json({
    message: 'MTG Inventory & Store API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      cards: '/api/cards',
      auth: '/api/auth',
      admin: '/api/admin',
      cart: '/api/cart',
      carousel: '/api/carousel',
      featured: '/api/featured',
      profile: '/api/profile',
      orders: '/api/orders',
      prices: '/api/prices',
    },
  });
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/carousel', carouselRoutes);
app.use('/api/admin/carousel', adminCarouselRoutes);
app.use('/api/featured', featuredRoutes);
app.use('/api/admin/featured', adminFeaturedRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/admin/ub-pricing', ubPricingRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API: http://localhost:${config.port}/api`);
      console.log(`🏥 Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
