export interface MapWaypointHub {
  id: string;
  name: string;
  shortName: string;
  country: string;
  lat: number;
  lng: number;
  type: 'dry-port' | 'seaport' | 'rail-hub' | 'customs-gateway';
  isBottleneck?: boolean;
  throughputTeuPerYear: string;
  coldStorageCapacityM3: string;
}

export interface CorridorRouteSegment {
  id: string;
  name: string;
  mode: 'RAIL' | 'SEA' | 'INTERMODAL';
  color: string;
  dashArray?: string;
  coordinates: [number, number][];
}

export interface CorridorEvent {
  id: string;
  title: string;
  shipmentId?: string;
  cargoName?: string;
  severity: 'CRITICAL' | 'WARNING' | 'BOTTLENECK' | 'INFO' | 'OPTIMAL';
  lat: number;
  lng: number;
  locationName: string;
  timestamp: string;
  description: string;
  aiAction: string;
  telemetry?: {
    temperature: number;
    humidity: number;
    ethanol: number;
    vibration: number;
  };
  bhi?: number;
  rulHours?: number;
}

export const CORRIDOR_HUBS: MapWaypointHub[] = [
  {
    id: 'khorgos',
    name: 'Khorgos Gateway Dry Port',
    shortName: 'Khorgos',
    country: 'Kazakhstan',
    lat: 44.2185,
    lng: 80.4072,
    type: 'dry-port',
    throughputTeuPerYear: '540,000 TEU',
    coldStorageCapacityM3: '45,000 m³',
  },
  {
    id: 'almaty',
    name: 'Almaty Agro-Logistics Terminal',
    shortName: 'Almaty',
    country: 'Kazakhstan',
    lat: 43.2389,
    lng: 76.8897,
    type: 'rail-hub',
    throughputTeuPerYear: '380,000 TEU',
    coldStorageCapacityM3: '80,000 m³',
  },
  {
    id: 'shymkent',
    name: 'Shymkent Agro Junction',
    shortName: 'Shymkent',
    country: 'Kazakhstan',
    lat: 42.3417,
    lng: 69.5901,
    type: 'rail-hub',
    throughputTeuPerYear: '220,000 TEU',
    coldStorageCapacityM3: '35,000 m³',
  },
  {
    id: 'aktau',
    name: 'Aktau Commercial Seaport',
    shortName: 'Aktau',
    country: 'Kazakhstan',
    lat: 43.6500,
    lng: 51.1600,
    type: 'seaport',
    throughputTeuPerYear: '180,000 TEU',
    coldStorageCapacityM3: '25,000 m³',
  },
  {
    id: 'kuryk',
    name: 'Port Kuryk Ro-Pax Ferry Terminal',
    shortName: 'Port Kuryk',
    country: 'Kazakhstan',
    lat: 43.1800,
    lng: 51.6500,
    type: 'seaport',
    isBottleneck: true,
    throughputTeuPerYear: '210,000 TEU',
    coldStorageCapacityM3: '30,000 m³',
  },
  {
    id: 'baku',
    name: 'Port of Baku (Alat Intermodal Hub)',
    shortName: 'Baku Alat',
    country: 'Azerbaijan',
    lat: 39.9950,
    lng: 49.4100,
    type: 'seaport',
    isBottleneck: true,
    throughputTeuPerYear: '500,000 TEU',
    coldStorageCapacityM3: '65,000 m³',
  },
  {
    id: 'tbilisi',
    name: 'Tbilisi Rail Marshalling Center',
    shortName: 'Tbilisi',
    country: 'Georgia',
    lat: 41.7151,
    lng: 44.8271,
    type: 'rail-hub',
    throughputTeuPerYear: '310,000 TEU',
    coldStorageCapacityM3: '40,000 m³',
  },
  {
    id: 'poti',
    name: 'Port of Poti Black Sea Terminal',
    shortName: 'Poti',
    country: 'Georgia',
    lat: 42.1462,
    lng: 41.6720,
    type: 'seaport',
    throughputTeuPerYear: '420,000 TEU',
    coldStorageCapacityM3: '50,000 m³',
  },
  {
    id: 'istanbul',
    name: 'Istanbul Marmara Logistics Gateway',
    shortName: 'Istanbul',
    country: 'Turkey',
    lat: 40.9833,
    lng: 28.8167,
    type: 'customs-gateway',
    throughputTeuPerYear: '1,200,000 TEU',
    coldStorageCapacityM3: '180,000 m³',
  },
];

export const CORRIDOR_ROUTES: CorridorRouteSegment[] = [
  {
    id: 'kz-rail-backbone',
    name: 'Kazakhstan Trans-Steppe Rail Backbone',
    mode: 'RAIL',
    color: '#10B981', // Emerald
    coordinates: [
      [44.2185, 80.4072], // Khorgos
      [43.2389, 76.8897], // Almaty
      [42.3417, 69.5901], // Shymkent
      [44.8500, 65.5000], // Kyzylorda
      [47.1000, 51.9000], // Atyrau branch junction
      [43.6500, 51.1600], // Aktau
      [43.1800, 51.6500], // Port Kuryk
    ],
  },
  {
    id: 'caspian-sea-ro-pax',
    name: 'Caspian Maritime Ro-Pax Fairway (Kuryk ⇄ Alat)',
    mode: 'SEA',
    color: '#0284C7', // Sky blue
    dashArray: '8 6',
    coordinates: [
      [43.1800, 51.6500], // Port Kuryk
      [42.3500, 51.0500], // East Caspian Basin
      [41.2500, 50.4000], // Mid-Caspian Deep Fairway
      [40.3500, 49.9500], // Absheron Peninsula Approach
      [39.9950, 49.4100], // Port of Baku (Alat)
    ],
  },
  {
    id: 'caucasus-rail',
    name: 'BTK Trans-Caucasus Rail Corridor (Baku ⇄ Poti)',
    mode: 'RAIL',
    color: '#6366F1', // Indigo
    coordinates: [
      [39.9950, 49.4100], // Alat
      [40.6800, 46.3600], // Ganja
      [41.7151, 44.8271], // Tbilisi
      [42.2700, 42.7000], // Kutaisi
      [42.1462, 41.6720], // Port of Poti
    ],
  },
  {
    id: 'black-sea-fairway',
    name: 'Black Sea Feeder Fairway (Poti ⇄ Istanbul)',
    mode: 'SEA',
    color: '#0D9488', // Teal
    dashArray: '8 6',
    coordinates: [
      [42.1462, 41.6720], // Poti
      [41.8000, 36.5000], // Central Black Sea
      [41.3500, 31.0000], // Western Black Sea Basin
      [41.2500, 29.1000], // Bosphorus Northern Approaches
      [40.9833, 28.8167], // Istanbul Hub
    ],
  },
];

export const CORRIDOR_EVENTS: CorridorEvent[] = [
  {
    id: 'EVT-101',
    title: 'Thermal Excursion & Volatile Ethanol Surge',
    shipmentId: 'FS-9042',
    cargoName: 'Altyn Dan Fresh Berries',
    severity: 'CRITICAL',
    lat: 43.2100,
    lng: 51.6800,
    locationName: 'Port Kuryk Staging Buffer, Rail Interchange Yard',
    timestamp: '12 min ago',
    description: 'Reefer unit shore-power disconnected during shunting. Ambient temperature reached +38°C; internal core temperature spiked to +7.8°C with volatile ethanol at 38.4 ppm (>35 ppm threshold). Biological degradation rate accelerated by 2.4x.',
    aiAction: 'Engaged emergency CO₂ blast injection. Dispatched yard technician for immediate auxiliary gen-set connection and fast-track Ro-Pax ferry loading.',
    telemetry: {
      temperature: 7.8,
      humidity: 91,
      ethanol: 38.4,
      vibration: 0.8,
    },
    bhi: 48.2,
    rulHours: 28,
  },
  {
    id: 'EVT-102',
    title: 'Auxiliary Generator Frequency Drift in Caspian Transit',
    shipmentId: 'FS-4103',
    cargoName: 'Saumal Bio-Kefir & Dairy',
    severity: 'WARNING',
    lat: 41.2500,
    lng: 50.4000,
    locationName: 'Caspian Sea Mid-Transit, Ro-Pax Ferry "Merkuriy-1"',
    timestamp: '42 min ago',
    description: 'Vessel auxiliary power bus showed 4% voltage sag, leading to intermittent compressor shutdown. Reefer temperature drifted upwards to +5.6°C (Target: +2°C to +4°C).',
    aiAction: 'Switched to internal lithium-iron-phosphate buffer battery. Alerted Alat Port engineering team to prepare dockside high-amperage reefer plug.',
    telemetry: {
      temperature: 5.6,
      humidity: 79,
      ethanol: 16.2,
      vibration: 0.6,
    },
    bhi: 68.4,
    rulHours: 72,
  },
  {
    id: 'EVT-103',
    title: 'Reefer Expansion Valve Mechanical Blockage',
    shipmentId: 'FS-7750',
    cargoName: 'Amiran Infant Formula & Yogurt',
    severity: 'WARNING',
    lat: 39.9950,
    lng: 49.4100,
    locationName: 'Port of Baku (Alat Inland Dry Port Reefer Yard)',
    timestamp: '1 hour ago',
    description: 'Thermostatic expansion valve stuck partially closed after rough rail shunting. Compartment temperature climbed to +8.4°C under high ambient heat.',
    aiAction: 'Triggered automated ultrasonic valve cycling protocol. Mobilized on-site Carrier Transicold certified technician to verify refrigerant charge.',
    telemetry: {
      temperature: 8.4,
      humidity: 81,
      ethanol: 22.4,
      vibration: 0.9,
    },
    bhi: 58.0,
    rulHours: 42,
  },
  {
    id: 'EVT-104',
    title: 'Severe Gale Advisory & Ro-Pax Anchorage Delay',
    severity: 'BOTTLENECK',
    lat: 40.3500,
    lng: 49.9500,
    locationName: 'Absheron Peninsula Maritime Fairway & Alat Roadstead',
    timestamp: '25 min ago',
    description: 'North-westerly gale winds reaching 24 m/s (Sea State 5). Maritime safety administration halted berthing maneuvers. 4 container Ro-Pax vessels holding at anchorage with an estimated 14-hour delay.',
    aiAction: 'Automated predictive shelf-life re-calculation across 18 perishable containers. Adjusted reefer setpoints to pre-cooling regime (+1.5°C) to extend biological buffer.',
    telemetry: {
      temperature: 21.0,
      humidity: 84,
      ethanol: 0.0,
      vibration: 1.2,
    },
  },
  {
    id: 'EVT-105',
    title: 'Dynamic Impact Excursion During Rail Bogie Shunting',
    severity: 'WARNING',
    lat: 41.7151,
    lng: 44.8271,
    locationName: 'Tbilisi Central Marshalling Yard',
    timestamp: '1.5 hours ago',
    description: 'Tri-axial accelerometer logged a mechanical shock spike of 1.42g during train assembly (exceeding standard 1.0g threshold).',
    aiAction: 'Run automated acoustic resonance diagnostic on container frame. Confirmed reefer hermetic seal and vacuum insulation integrity maintained.',
    telemetry: {
      temperature: 3.2,
      humidity: 75,
      ethanol: 5.1,
      vibration: 1.42,
    },
  },
  {
    id: 'EVT-106',
    title: 'Autonomous Arrhenius Pulse-Cooling Cycle Complete',
    shipmentId: 'FS-6218',
    cargoName: 'Tian Shan Organic Apples & Cherries',
    severity: 'OPTIMAL',
    lat: 42.1462,
    lng: 41.6720,
    locationName: 'Port of Poti Intermodal Rail Yard',
    timestamp: '3 hours ago',
    description: 'AI Conductor autonomously executed a precision pulse-cooling cycle in response to rising humidity (88%). Temperature stabilized at +3.8°C; respiration rate reduced by 34%.',
    aiAction: 'Optimal biological preservation verified. Zero manual intervention required.',
    telemetry: {
      temperature: 3.8,
      humidity: 88,
      ethanol: 8.5,
      vibration: 0.4,
    },
    bhi: 89.1,
    rulHours: 216,
  },
];

export const SHIPMENT_GEO_POSITIONS: Record<string, { lat: number; lng: number; mode: 'TRAIN' | 'SHIP' | 'TRUCK' }> = {
  'FS-8821': { lat: 43.1800, lng: 51.6500, mode: 'TRAIN' },   // Kuryk Terminal
  'FS-9042': { lat: 43.2100, lng: 51.6800, mode: 'TRAIN' },   // Kuryk Yard (Critical)
  'FS-4103': { lat: 41.2500, lng: 50.4000, mode: 'SHIP' },    // Caspian Sea mid-transit
  'FS-7750': { lat: 39.9950, lng: 49.4100, mode: 'TRUCK' },   // Baku Alat dry port
  'FS-6218': { lat: 42.1462, lng: 41.6720, mode: 'TRAIN' },   // Port of Poti
  'FS-3319': { lat: 40.9833, lng: 28.8167, mode: 'TRUCK' },   // Istanbul Hub
};
