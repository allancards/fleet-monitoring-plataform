import { connectRedisSubscriber, subscribeToVehicleUpdates } from './redis/subscriber.js';
import { startWebSocketServer, emitVehicleUpdate } from './websocket/server.js';
import { processAlertRules } from './rules/engine.js';

console.log('🚀 Iniciando Worker de Alertas e WebSocket...');

// 1. Inicia servidor WebSocket
const io = startWebSocketServer();

// 2. Conecta ao Redis e escuta atualizações
(async () => {
  await connectRedisSubscriber();
})();

// 3. Inscreve-se no canal de atualizações
(async () => {
  await subscribeToVehicleUpdates(async (data) => {
    // Ao receber uma atualização de veículo:
    // a) Emite via WebSocket para os clientes
    emitVehicleUpdate(data);

    // b) Processa regras de alerta
    await processAlertRules(data);
  });
})();

console.log('✅ Worker de Alertas pronto e aguardando eventos!');