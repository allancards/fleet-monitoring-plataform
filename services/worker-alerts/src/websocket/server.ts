import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { env } from '../config/env.js';
import { processAlertRules } from '../rules/engine.js';

let io: SocketIOServer;

export function startWebSocketServer() {
  const httpServer = createServer();
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // O cliente pode enviar um identificador (ex: vehicleId) para receber alertas específicos
    socket.on('subscribe-vehicle', (vehicleId) => {
      socket.join(`vehicle:${vehicleId}`);
      console.log(`📌 Cliente ${socket.id} inscrito no veículo ${vehicleId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
  });

  httpServer.listen(env.WS_PORT, () => {
    console.log(`🔄 WebSocket Server rodando na porta ${env.WS_PORT}`);
  });

  return io;
}

// Função para emitir atualização de veículo para todos os clientes
export function emitVehicleUpdate(data: any) {
  if (!io) return;
  // Emite para todos os clientes na sala do veículo (se houver) ou para todos
  io.to(`vehicle:${data.vehicleId}`).emit('vehicle-update', data);
  // Também emite globalmente para dashboards
  io.emit('vehicle-update', data);
}

// Função para emitir alertas
export function emitAlert(alert: any) {
  if (!io) return;
  io.emit('alert', alert);
}