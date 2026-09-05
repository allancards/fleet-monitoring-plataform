import { config } from './config.js';
import { generateTelemetry } from './vehicle.js';
import { sendTelemetry } from './sender.js';

console.log('🚗 Iniciando simulador de frota...');

// Estado atual dos veículos (para manter posição)
const vehicleStates = config.VEHICLES.map(v => ({
  ...v,
  lat: v.lat,
  lng: v.lng,
}));

// Função que é executada a cada intervalo
async function tick() {
  const promises = vehicleStates.map(async (vehicle) => {
    const telemetry = generateTelemetry(vehicle);
    // Atualiza a posição no estado para a próxima iteração
    vehicle.lat = telemetry.lat;
    vehicle.lng = telemetry.lng;

    // Envia para o gateway (não esperamos resposta para não bloquear)
    await sendTelemetry({
      vehicleId: telemetry.id,
      latitude: telemetry.lat,
      longitude: telemetry.lng,
      speed: telemetry.speed,
      ignition: telemetry.ignition,
      timestamp: telemetry.timestamp,
    });
    console.log(`📤 Enviado: ${telemetry.id} -> (${telemetry.lat.toFixed(4)}, ${telemetry.lng.toFixed(4)}) ${telemetry.speed} km/h`);
  });

  await Promise.all(promises);
}

// Inicia o loop
setInterval(tick, config.INTERVAL_MS);

// Tratamento de encerramento
process.on('SIGINT', () => {
  console.log('🛑 Simulador interrompido.');
  process.exit(0);
});