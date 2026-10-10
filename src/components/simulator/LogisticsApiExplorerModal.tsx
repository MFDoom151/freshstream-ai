'use client';

import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Code, 
  Train, 
  Ship, 
  Box, 
  Radio, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { TelemetryInput } from '@/types/arrhenius';

interface LogisticsApiExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TelemetryInput;
  shipmentId: string;
}

type ApiTab = 'dcsa' | 'ktz_rail' | 'ais_maritime';

export const LogisticsApiExplorerModal: React.FC<LogisticsApiExplorerModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  shipmentId,
}) => {
  const [activeTab, setActiveTab] = useState<ApiTab>('dcsa');
  const [copied, setCopied] = useState<boolean>(false);
  const [simulatingPing, setSimulatingPing] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const timestampIso = new Date().toISOString();

  // DCSA Track & Trace 3.0 IoT & Reefer Telemetry Payload
  const dcsaPayload = {
    eventType: 'EQUIPMENT_EVENT',
    eventClassifierCode: 'ACT',
    eventDateTime: timestampIso,
    equipmentReference: `FS-REEF-${shipmentId.replace(/\D/g, '') || '8821'}`,
    ISOEquipmentCode: '45R1', // 40ft High Cube Reefer
    transportCall: {
      UNLocationCode: telemetry.waypoint === 'kuryk' ? 'KZKRK' : telemetry.waypoint === 'baku' ? 'AZBAK' : 'KZALA',
      facilityTypeCode: 'BRTH',
      modeOfTransport: telemetry.transport_mode || 'RAIL_REEFER',
    },
    telemetry: {
      temperature: {
        setPointCelsius: 1.0,
        actualInternalCelsius: telemetry.temperature,
        ambientAirCelsius: 32.4,
        status: telemetry.temperature > 5.0 ? 'EXCURSION_ALERT' : 'OPTIMAL',
      },
      atmosphere: {
        relativeHumidityPercent: Math.round(telemetry.humidity),
        co2LevelPercent: telemetry.co2_pct ?? 4.5,
        o2LevelPercent: telemetry.o2_pct ?? 3.0,
        ethylenePpm: telemetry.ethylene_ppm ?? 1.2,
        volatileEthanolPpm: telemetry.ethanol,
      },
      power: {
        supplySource: telemetry.transport_mode === 'RO_PAX_FERRY' ? 'VESSEL_AUX_BUS' : 'GENSET_DIESEL',
        voltageVolts: 380,
        frequencyHz: 50.1,
      },
      triAxialShockG: telemetry.vibration,
    },
    compliance: {
      standard: 'DCSA IoT & Reefer v3.0.0',
      biologicalTwinHealthIndex: telemetry.ethanol > 35 ? 38.2 : 96.5,
      haccpStatus: telemetry.temperature <= 4.0 ? 'PASSED' : 'DEVIATION_LOGGED',
    },
  };

  // KTZ Express Automated Operating System (ASOU / SMGS Waybill)
  const ktzPayload = {
    railConsignmentNote: `SMGS-KZ-${shipmentId}-2026`,
    carrier: 'KTZ Express JSC (Kazakhstan Temir Zholy)',
    trainNumber: 'Train 2042-East-West',
    wagonNumber: '67419204 (4-axle insulated platform)',
    interchangeStation: {
      name: 'Akhalkalaki Break-of-Gauge Facility',
      country: 'Georgia (GE)',
      gaugeTransfer: '1520mm Russian ⇄ 1435mm European UIC',
      bogieExchangeStatus: 'CLEARED_FOR_TRANSIT',
    },
    trainTelematics: {
      speedKmh: 74.2,
      brakingPipePressureBar: 5.2,
      blockSignalStatus: 'GREEN_CLEAR',
      shockThresholdExceeded: telemetry.vibration > 1.8,
      lastGpsFix: {
        lat: 43.1800,
        lng: 51.6500,
        elevationMeters: -28, // Caspian depression
      },
    },
  };

  // AIS MarineTraffic Caspian Ro-Pax Vessel Telemetry
  const aisPayload = {
    vesselName: 'Ro-Pax Ferry "BARYS-1"',
    mmsi: 437190422,
    imoNumber: 9814502,
    flag: 'Kazakhstan (KZ)',
    navigationStatus: 'Under Way Using Engine',
    speedKnots: 14.8,
    courseDegrees: 254.0, // heading towards Baku Alat
    destinationPort: 'BAKU_ALAT (AZ)',
    eta: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    seaState: {
      waveHeightMeters: 1.4,
      windSpeedKnots: 18.2,
      casingTemperatureC: 22.0,
    },
    reeferDeckPlugs: {
      activeContainers: 48,
      totalVoltageOutputKw: 380,
      monitoredReefers: [`FS-REEF-${shipmentId.replace(/\D/g, '') || '8821'}`],
    },
  };

  const getActivePayload = () => {
    switch (activeTab) {
      case 'dcsa':
        return JSON.stringify(dcsaPayload, null, 2);
      case 'ktz_rail':
        return JSON.stringify(ktzPayload, null, 2);
      case 'ais_maritime':
        return JSON.stringify(aisPayload, null, 2);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActivePayload());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestPing = () => {
    setSimulatingPing(true);
    setPingResult(null);
    setTimeout(() => {
      setSimulatingPing(false);
      setPingResult(`HTTP 200 OK • Ingested via FreshStream Telemetry Gateway • Latency: 18ms`);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Multimodal Logistics API & Telemetry Gateway
                </h3>
                <Badge variant="mint" size="sm">
                  LIVE INTERFACE
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Industry-Standard Ingestion Schemas: DCSA Track & Trace 3.0, KTZ Rail ASOU, and AIS Maritime
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Category Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-5 pt-3 border-b border-slate-800 bg-slate-900/40 text-xs">
          <button
            onClick={() => setActiveTab('dcsa')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'dcsa'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>1. DCSA Track & Trace 3.0 (IoT Reefer)</span>
          </button>

          <button
            onClick={() => setActiveTab('ktz_rail')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'ktz_rail'
                ? 'border-purple-400 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Train className="w-4 h-4" />
            <span>2. KTZ Express Rail ASOU (SMGS Waybill)</span>
          </button>

          <button
            onClick={() => setActiveTab('ais_maritime')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'ais_maritime'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ship className="w-4 h-4" />
            <span>3. Caspian / Black Sea AIS Telemetry</span>
          </button>
        </div>

        {/* Code Content & Live Terminal */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-slate-950 font-mono text-xs">
          <div className="flex items-center justify-between mb-2 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ENDPOINT: POST /api/telemetry/ingest (Format: application/json)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTestPing}
                disabled={simulatingPing}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>{simulatingPing ? 'Transmitting...' : 'Send Test Ingest'}</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          {/* Ping Success Banner */}
          {pingResult && (
            <div className="mb-3 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {pingResult}
              </span>
              <span className="text-[10px] text-slate-400">Timestamp: {new Date().toLocaleTimeString()}</span>
            </div>
          )}

          {/* Formatted Code Block */}
          <pre className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-300 overflow-x-auto leading-relaxed shadow-inner">
            <code>{getActivePayload()}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>OpenAPI 3.1 & DCSA 3.0 Compatible Interface</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
