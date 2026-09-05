import { createClient, RedisClientType } from 'redis';
import { env } from '../config/env.js';

export let redisSubscriber: RedisClientType;

export async function connectRedisSubscriber() {
  redisSubscriber = createClient({ url: env.REDIS_URL });
  await redisSubscriber.connect();
  console.log('✅ Redis Subscriber conectado');
}

export async function subscribeToVehicleUpdates(callback: (data: any) => void) {
  await redisSubscriber.subscribe('vehicle.update', (message) => {
    try {
      const data = JSON.parse(message);
      callback(data);
    } catch (err) {
      console.error('❌ Erro ao parsear mensagem do Redis:', err);
    }
  });
  console.log('📡 Inscrito no canal Redis: vehicle.update');
}