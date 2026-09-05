import { z } from 'zod';

export const TelemetryInputSchema = z.object({
  vehicleId: z.string({
    required_error: 'vehicleId é obrigatório'
  }).min(1, 'vehicleId não pode ser vazio'),
  
  latitude: z.number({
    required_error: 'latitude é obrigatória'
  }).min(-90).max(90),
  
  longitude: z.number({
    required_error: 'longitude é obrigatória'
  }).min(-180).max(180),
  
  speed: z.number().min(0, 'A velocidade não pode ser negativa'),
  
  ignition: z.boolean().default(true),
  
  timestamp: z.string().datetime({
    message: 'timestamp deve estar no formato ISO8601'
  }).default(() => new Date().toISOString())
});

export type TelemetryInput = z.infer<typeof TelemetryInputSchema>;

export const TelemetryResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  receivedAt: z.string()
});