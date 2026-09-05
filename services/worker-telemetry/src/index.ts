import { startConsumer } from './consumer.js';

console.log('🚀 Iniciando Worker de Telemetria...');

startConsumer().catch((err) => {
  console.error('❌ Falha crítica no worker:', err);
  process.exit(1);
});