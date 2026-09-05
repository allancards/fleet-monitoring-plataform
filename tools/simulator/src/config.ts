import 'dotenv/config';

export const config = {
  GATEWAY_URL: process.env.GATEWAY_URL || 'http://localhost:3000',
  VEHICLES: [
    { id: 'veh-001', name: 'Caminhão 1', lat: -23.5505, lng: -46.6333 },
    { id: 'veh-002', name: 'Caminhão 2', lat: -23.5600, lng: -46.6400 },
    { id: 'veh-003', name: 'Caminhão 3', lat: -23.5400, lng: -46.6200 },
    { id: 'veh-004', name: 'Van 1', lat: -23.5700, lng: -46.6500 },
  ],
  INTERVAL_MS: 2000,   // envia a cada 2 segundos
  MOVEMENT_RANGE: 0.002, // deslocamento máximo em graus
};