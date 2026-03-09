import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  frontendUrl: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mtg-inventory',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

// Warn if using default secrets in production
if (config.nodeEnv === 'production') {
  if (config.jwtSecret === 'default-secret-change-in-production') {
    console.warn('⚠️  WARNING: Using default JWT_SECRET in production!');
  }
  if (config.jwtRefreshSecret === 'default-refresh-secret-change-in-production') {
    console.warn('⚠️  WARNING: Using default JWT_REFRESH_SECRET in production!');
  }
}

export default config;
