export type CargoType = 'berries' | 'beef' | 'dairy' | 'fruits';
export type RouteWaypoint = 'kuryk' | 'baku' | 'poti' | 'istanbul';
export type AlertSeverity = 'OPTIMAL' | 'NOMINAL' | 'WARNING' | 'CRITICAL' | 'CONDEMNED';

export interface TelemetryInput {
  cargo: CargoType;
  temperature: number; // -5 to +35 °C
  ethanol: number;     // 0 to 100 ppm
  humidity: number;    // 20 to 100 %
  vibration: number;   // 0.1 to 3.0 G
  cargo_value_usd?: number; // default $68,000
  waypoint?: RouteWaypoint; // default 'kuryk'
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
