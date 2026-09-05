import { createClient } from 'redis';
import { env } from '../config/env.js';

export const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('connect', () => console.log('✅ Conectado ao Redis'));
redisClient.on('error', (err) => console.error('❌ Redis error:', err));

// Função assíncrona imediata
(async () => {
    try {
        await redisClient.connect();
        console.log('Redis conectado com sucesso!');
    } catch (err) {
        console.error('Erro ao conectar no Redis:', err);
    }
})();

// Função para atualizar o estado do veículo
export async function updateVehicleState(data: {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  ignition: boolean;
  timestamp: string;
}) {
  const key = `vehicle:${data.vehicleId}:state`;
  const value = JSON.stringify({
    lat: data.latitude,
    lng: data.longitude,
    speed: data.speed,
    ignition: data.ignition,
    lastUpdate: data.timestamp,
  });

  // Expira após 5 minutos se o veículo parar de enviar dados
  await redisClient.setEx(key, 300, value);
}