import { emitAlert } from '../websocket/server.js';

// Regras simples (expansível)
export async function processAlertRules(data: {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  ignition: boolean;
  timestamp: string;
}) {
  // Exemplo: excesso de velocidade (acima de 100 km/h)
  if (data.speed > 100) {
    const alert = {
      vehicleId: data.vehicleId,
      type: 'SPEED_LIMIT_EXCEEDED',
      severity: 'WARNING',
      message: `Veículo ${data.vehicleId} excedeu 100 km/h (${data.speed} km/h)`,
      timestamp: new Date().toISOString(),
      payload: { speed: data.speed, lat: data.latitude, lng: data.longitude },
    };
    console.log(`⚠️ Alerta: ${alert.message}`);
    emitAlert(alert);
    // Opcional: publicar no RabbitMQ para persistência
  }

  // Futuro: geofencing, etc.
}