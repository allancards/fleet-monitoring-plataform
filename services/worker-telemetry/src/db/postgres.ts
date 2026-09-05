import { Pool } from 'pg';
import { env } from '../config/env.js';

export const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
});

// Testa conexão ao iniciar
pgPool.on('connect', () => console.log('✅ Conectado ao PostgreSQL/PostGIS'));

// Função para inserir a telemetria no histórico
export async function saveTelemetryHistory(data: {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  ignition: boolean;
  timestamp: string;
}) {
  const query = `
    INSERT INTO telemetry_history 
      (vehicle_id, latitude, longitude, location, speed, ignition, timestamp)
    VALUES 
      ($1, $2, $3, ST_SetSRID(ST_MakePoint($3, $2), 4326), $4, $5, $6)
    RETURNING id;
  `;

  const values = [
    data.vehicleId,
    data.latitude,
    data.longitude,
    data.speed,
    data.ignition,
    data.timestamp,
  ];

  const result = await pgPool.query(query, values);
  return result.rows[0].id;
}