import { config } from './config.js';

interface VehicleState {
  id: string;
  lat: number;
  lng: number;
  speed: number;
  ignition: boolean;
  timestamp: string;
}

// Gera uma velocidade aleatória entre 0 e 120 km/h
function randomSpeed(): number {
  return Math.round(Math.random() * 120);
}

// Move o veículo aleatoriamente dentro de um quadrado
function moveVehicle(lat: number, lng: number): { lat: number; lng: number } {
  const delta = config.MOVEMENT_RANGE;
  const newLat = lat + (Math.random() - 0.5) * delta * 2;
  const newLng = lng + (Math.random() - 0.5) * delta * 2;
  return { lat: newLat, lng: newLng };
}

export function generateTelemetry(vehicle: { id: string; lat: number; lng: number }): VehicleState {
  const newPos = moveVehicle(vehicle.lat, vehicle.lng);
  return {
    id: vehicle.id,
    lat: newPos.lat,
    lng: newPos.lng,
    speed: randomSpeed(),
    ignition: true,
    timestamp: new Date().toISOString(),
  };
}