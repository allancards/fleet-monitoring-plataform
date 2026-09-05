import {z } from 'zod';

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    RABBITMQ_URL: z.string().url().default('amqp://fleet_admin:fleet_password@127.0.0.1:5672'),
    HOST: z.string().default('0.0.0.0')

});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('X Error: Invalid environment variables', _env.error.format());
    throw new Error('Invalid environment variables');
}

export const env = _env.data;