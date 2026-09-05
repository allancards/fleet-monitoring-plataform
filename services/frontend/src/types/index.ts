export interface VehicleState {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  ignition: boolean;
  lastUpdate: string;
}

export interface Alert {
  vehicleId: string;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
  payload?: any;
}