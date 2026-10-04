import { CargoType, RouteWaypoint } from './arrhenius';

export type ShipmentStatus = 'OPTIMAL' | 'WARNING' | 'CRITICAL';

export interface ShipmentTelemetry {
  temperature: number;
  humidity: number;
  ethanol: number;
  vibration: number;
}

export interface ShipmentAlert {
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: string;
  action: string;
  location: string;
}

export interface ShipmentItem {
  id: string;
  cargo: CargoType;
  cargoNameEn: string;
  exporter: string;
  carrier: string;
  origin: string;
  destination: string;
  currentWaypoint: RouteWaypoint;
  waypointName: string;
  assetValueUsd: number;
  departureDate: string;
  eta: string;
  bhi: number;
  predictedRulHours: number;
  status: ShipmentStatus;
  telemetry: ShipmentTelemetry;
  alert?: ShipmentAlert;
}
