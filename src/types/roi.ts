export interface RoiInput {
  fleetSize: number;       // e.g. 50
  cargoValue: number;      // e.g. $45,000
  tripsPerYear: number;    // e.g. 12
  spoilageRate?: number;   // default 20%
  savingsEfficacy?: number;// default 75%
}

export interface RoiOutput {
  annualLossWithout: number;
  savedCapital: number;
  netProfitIncrease: number;
  paybackPeriodMonths: number;
  exporterRoiPercent: number;
}
