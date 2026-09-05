import amqp, { Channel, Connection } from 'amqplib';
import { env } from '../config/env.js';

class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  public static readonly EXCHANGE = 'fleet.events';
  public static readonly ROUTING_KEY_TELEMETRY = 'telemetry.raw';
  public static readonly QUEUE_TELEMETRY = 'telemetry.raw.queue';

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      // Exchange Topic para roteamento extensível
      await this.channel.assertExchange(RabbitMQService.EXCHANGE, 'topic', {
        durable: true
      });

      // Garantir fila persistente de entrada
      await this.channel.assertQueue(RabbitMQService.QUEUE_TELEMETRY, {
        durable: true
      });

      // Bind da fila na exchange
      await this.channel.bindQueue(
        RabbitMQService.QUEUE_TELEMETRY,
        RabbitMQService.EXCHANGE,
        RabbitMQService.ROUTING_KEY_TELEMETRY
      );

      console.log('✅ Conectado ao RabbitMQ e canais configurados!');
    } catch (error) {
      console.error('❌ Erro ao conectar no RabbitMQ:', error);
      throw error;
    }
  }

  async publishTelemetry(payload: object): Promise<boolean> {
    if (!this.channel) {
      throw new Error('Canal RabbitMQ não inicializado.');
    }

    return this.channel.publish(
      RabbitMQService.EXCHANGE,
      RabbitMQService.ROUTING_KEY_TELEMETRY,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now()
      }
    );
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}

export const rabbitMQService = new RabbitMQService();