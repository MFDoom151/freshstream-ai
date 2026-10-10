export type CargoType = 'pears' | 'beef' | 'berries' | 'dairy' | 'fruits';

export type TransportMode = 
  | 'RAIL_REEFER' 
  | 'RO_PAX_FERRY' 
  | 'TIR_TRUCK' 
  | 'SMART_REEFER_CONTAINER';

export type RouteWaypoint = 
  | 'khorgos' 
  | 'almaty' 
  | 'shymkent' 
  | 'beyneu' 
  | 'kuryk' 
  | 'baku' 
  | 'tbilisi' 
  | 'poti' 
  | 'istanbul';

export type AlertSeverity = 'OPTIMAL' | 'NOMINAL' | 'WARNING' | 'CRITICAL' | 'CONDEMNED';

export interface TelemetryInput {
  cargo: CargoType;
  temperature: number; // -5 to +35 °C
  ethanol: number;     // 0 to 100 ppm
  humidity: number;    // 20 to 100 %
  vibration: number;   // 0.1 to 3.0 G
  transport_mode?: TransportMode;
  co2_pct?: number;    // 0 to 15 %
  o2_pct?: number;     // 1 to 21 %
  ethylene_ppm?: number; // 0 to 50 ppm
  cargo_value_usd?: number; // default $68,000
  waypoint?: RouteWaypoint; // default 'kuryk'
  container_id?: string;
  api_standard?: 'DCSA' | 'KTZ_EDI' | 'AIS_MARITIME';
}

export interface KineticsOutput {
  shelf_life_hours: number;
  shelf_life_days: number;
  health_index: number; // 0 to 100 %
  acceleration_factor: number;
  k_rate: number;
  is_ethanol_critical: boolean; // true if ethanol > 35 ppm
  rescue_window_hours?: number; // ~14h when critical
  alert_severity: AlertSeverity;
  alert_title: string;
  alert_description: string;
  recommended_actions: string[];
  saved_value_usd: number;
  decay_curve: Array<{ time_hours: number; quality_remaining: number; baseline_quality: number }>;
}
