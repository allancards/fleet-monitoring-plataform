import { useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { VehicleState, Alert } from '../types';

export function useSocket() {
  const [vehicles, setVehicles] = useState<Record<string, VehicleState>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
  socket.on('connect', () => console.log('✅ Socket conectado'));
  socket.on('disconnect', (reason) => console.log('❌ Socket desconectado:', reason));
  socket.on('connect_error', (err) => console.error('🚨 Erro de conexão:', err));
  

  socket.on('vehicle-update', (data) => {
  setVehicles(prev => ({
    ...prev,
    [data.vehicleId]: {
      vehicleId: data.vehicleId,
      lat: data.latitude,
      lng: data.longitude,
      speed: data.speed,
      ignition: data.ignition,
      lastUpdate: data.timestamp
    }
  }));
});

  return () => {
    socket.off('connect');
    socket.off('disconnect');
    socket.off('connect_error');
    socket.off('vehicle-update');
    socket.off('alert');
  };
}, []);

  return { vehicles, alerts };
}