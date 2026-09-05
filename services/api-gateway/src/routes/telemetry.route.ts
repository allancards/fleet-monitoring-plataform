import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { TelemetryInputSchema, TelemetryResponseSchema } from '../schemas/telemetry.schema.js';
import { rabbitMQService } from '../services/rabbitmq.js';

export async function telemetryRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/telemetry',
    {
      schema: {
        body: TelemetryInputSchema,
        response: {
          202: TelemetryResponseSchema,
          400: z.object({ message: z.string() })
        }
      }
    },
    async (request, reply) => {
      const payload = request.body;

      // Publicação assíncrona na fila
      await rabbitMQService.publishTelemetry(payload);

      // Resposta 202 sem bloquear o remetente
      return reply.status(202).send({
        status: 'accepted',
        message: 'Evento de telemetria recebido e enfileirado para processamento.',
        receivedAt: new Date().toISOString()
      });
    }
  );
}