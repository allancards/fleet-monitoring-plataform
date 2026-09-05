import Fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { rabbitMQService } from './services/rabbitmq.js';
import { telemetryRoutes } from './routes/telemetry.route.js';

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  }
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

async function bootstrap() {  
  try {
    await app.register(cors, { origin: '*' });
    await rabbitMQService.connect();
    await app.register(telemetryRoutes, { prefix: '/api/v1' });

    app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    app.get('/', async () => ({ message: 'API Gateway esta rodando com sucesso!!!!!' }));

    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 API Gateway rodando em http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();