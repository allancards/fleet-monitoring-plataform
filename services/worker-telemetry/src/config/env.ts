import 'dotenv/config';

export const env = {
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://fleet_admin:fleet_password@localhost:5672',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://fleet_user:fleet_password@localhost:5432/fleet_db',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
};