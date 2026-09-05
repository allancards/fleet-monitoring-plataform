import axios from 'axios';
import { config } from './config.js';

export async function sendTelemetry(data: any): Promise<void> {
  try {
    const url = `${config.GATEWAY_URL}/api/v1/telemetry`;
    await axios.post(url, data, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`❌ Erro ao enviar telemetria para ${data.vehicleId}:`, error.message);
  }
}