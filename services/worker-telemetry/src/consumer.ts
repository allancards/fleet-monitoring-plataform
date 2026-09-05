import * as amqp from 'amqplib';
import { env } from './config/env.js';
import { saveTelemetryHistory } from './db/postgres.js';
import { updateVehicleState } from './db/redis.js';

const EXCHANGE = 'fleet.events';
const QUEUE = 'telemetry.raw.queue';
const ROUTING_KEY = 'telemetry.raw';


export async function startConsumer() {
try {
    // 1. Conecta ao RabbitMQ
    const connection = await amqp.connect(env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    // 2. Garante que a fila e exchange existem
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    // 3. Configura o consumo (1 mensagem por vez, para equilibrar carga)
    await channel.prefetch(1);

    console.log(`📡 Worker escutando a fila: ${QUEUE}`);

    // 4. Consome as mensagens
    await channel.consume(
      QUEUE,
      async (msg) => {
        if (!msg) return;

        try {
          const content = msg.content.toString();
          const data = JSON.parse(content);

          // Validação básica (pode usar Zod se quiser)
          if (!data.vehicleId || data.latitude === undefined || data.longitude === undefined) {
            console.error('❌ Mensagem inválida (faltam campos):', data);
            channel!.nack(msg, false, false); // Rejeita sem reenfileirar
            return;
          }

          // Processamento: salva no Postgres e atualiza Redis
          await saveTelemetryHistory(data);
          await updateVehicleState(data);

          console.log(`✅ Processado veículo ${data.vehicleId} em ${new Date(data.timestamp).toLocaleTimeString()}`);

          // Confirma o processamento
          channel!.ack(msg);
        } catch (error) {
          console.error('❌ Erro ao processar mensagem:', error);
          // Rejeita e reenfileira (para tentar novamente)
          channel!.nack(msg, false, true);
        }
      },
      { noAck: false } // Confirmação manual
    );

    // 5. Tratamento de sinal para desligamento gracioso
    process.on('SIGINT', async () => {
      console.log('🛑 Recebido SIGINT. Fechando worker...');
      await channel?.close();
      await connection?.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar consumer:', error);
    process.exit(1);
  }
}