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

// BLOCK startup if using default secrets in production
if (config.nodeEnv === 'production') {
  if (config.jwtSecret === 'default-secret-change-in-production') {
    throw new Error('FATAL: JWT_SECRET must be set in production. Server refused to start.');
  }
  if (config.jwtRefreshSecret === 'default-refresh-secret-change-in-production') {
    throw new Error('FATAL: JWT_REFRESH_SECRET must be set in production. Server refused to start.');
  }
}

export default config;
