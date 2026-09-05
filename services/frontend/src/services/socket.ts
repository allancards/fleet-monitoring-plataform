import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export const socket: Socket = io(WS_URL, {
  transports: ['websocket'],
  autoConnect: true,
});

export function subscribeToVehicle(vehicleId: string) {
  socket.emit('subscribe-vehicle', vehicleId);
}