import { PredictResult } from '@/lib/ml/inference';

export interface TelemetryReading {
  shipmentId: string;
  timestamp: string;
  minute?: number;
  temperature: number;
  humidity: number;
  ethanol: number;
  gas: number;
  vibration?: number;
  cargo?: string;
  location?: string;
  [key: string]: any;
}

export interface StreamEventPayload {
  success: boolean;
  shipmentId: string;
  timestamp: string;
  telemetry: {
    temperature: number;
    humidity: number;
    ethanol: number;
    gas: number;
    vibration?: number;
    cargo?: string;
    location?: string;
  };
  prediction: PredictResult;
}

export interface AlertEvent {
  id: string;
  shipmentId: string;
  severity: 'CRITICAL' | 'WARNING' | 'OPTIMAL';
  type: string;
  message: string;
  action: string;
  timestamp: string;
  location?: string;
}
