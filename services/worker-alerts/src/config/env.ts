import 'dotenv/config';

export const env = {
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  WS_PORT: parseInt(process.env.WS_PORT || '3001', 10),
};