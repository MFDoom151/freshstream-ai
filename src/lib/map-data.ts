export interface MapWaypointHub {
  id: string;
  name: string;
  shortName: string;
  country: string;
  lat: number;
  lng: number;
  type: 'dry-port' | 'seaport' | 'rail-hub' | 'customs-gateway' | 'gauge-break';
  isBottleneck?: boolean;
  throughputTeuPerYear: string;
  coldStorageCapacityM3: string;
  gaugeMm?: string;
  dcsaCode?: string;
}

export interface CorridorRouteSegment {
  id: string;
  name: string;
  mode: 'RAIL' | 'SEA' | 'HIGHWAY' | 'INTERMODAL';
  color: string;
  dashArray?: string;
  coordinates: [number, number][];
  transitDays?: number;
  gaugeMm?: string;
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
    co2?: number;
    o2?: number;
  };
  bhi?: number;
  rulHours?: number;
  dcsaEventCode?: string;
}

export const CORRIDOR_HUBS: MapWaypointHub[] = [
  {
    id: 'khorgos',
    name: 'Khorgos Gateway Dry Port & Gauge Transfer',
    shortName: 'Khorgos',
    country: 'Kazakhstan',
    lat: 44.2185,
    lng: 80.4072,
    type: 'dry-port',
    throughputTeuPerYear: '540,000 TEU',
    coldStorageCapacityM3: '45,000 m³',
    gaugeMm: '1435mm ⇄ 1520mm',
    dcsaCode: 'KZKHO',
  },
  {
    id: 'almaty',
    name: 'Almaty Agro-Logistics Terminal (Zhetysu)',
    shortName: 'Almaty',
    country: 'Kazakhstan',
    lat: 43.2389,
    lng: 76.8897,
    type: 'rail-hub',
    throughputTeuPerYear: '420,000 TEU',
    coldStorageCapacityM3: '95,000 m³',
    gaugeMm: '1520mm',
    dcsaCode: 'KZALA',
  },
  {
    id: 'shu',
    name: 'Shu (Chu) Turksib Rail Junction',
    shortName: 'Shu Junction',
    country: 'Kazakhstan',
    lat: 43.5980,
    lng: 73.7610,
    type: 'rail-hub',
    throughputTeuPerYear: '280,000 TEU',
    coldStorageCapacityM3: '20,000 m³',
    gaugeMm: '1520mm',
    dcsaCode: 'KZSHU',
  },
  {
    id: 'shymkent',
    name: 'Shymkent Agro-Industrial Junction',
    shortName: 'Shymkent',
    country: 'Kazakhstan',
    lat: 42.3417,
    lng: 69.5901,
    type: 'rail-hub',
    throughputTeuPerYear: '290,000 TEU',
    coldStorageCapacityM3: '40,000 m³',
    gaugeMm: '1520mm',
    dcsaCode: 'KZCIT',
  },
  {
    id: 'kyzylorda',
    name: 'Kyzylorda Syr Darya Cold-Chain Hub',
    shortName: 'Kyzylorda',
    country: 'Kazakhstan',
    lat: 44.8500,
    lng: 65.5000,
    type: 'rail-hub',
    throughputTeuPerYear: '190,000 TEU',
    coldStorageCapacityM3: '35,000 m³',
    gaugeMm: '1520mm',
    dcsaCode: 'KZKZO',
  },
  {
    id: 'beyneu',
    name: 'Beyneu Mangystau Rail Intermodal Gateway',
    shortName: 'Beyneu',
    country: 'Kazakhstan',
    lat: 45.3200,
    lng: 55.1900,
    type: 'rail-hub',
    throughputTeuPerYear: '310,000 TEU',
    coldStorageCapacityM3: '30,000 m³',
    gaugeMm: '1520mm',
    dcsaCode: 'KZBEY',
  },
  {
    id: 'aktau',
    name: 'Aktau Commercial International Seaport',
    shortName: 'Aktau',
    country: 'Kazakhstan',
    lat: 43.6500,
    lng: 51.1600,
    type: 'seaport',
    throughputTeuPerYear: '220,000 TEU',
    coldStorageCapacityM3: '35,000 m³',
    gaugeMm: '1520mm & Maritime',
    dcsaCode: 'KZSCO',
  },
  {
    id: 'kuryk',
    name: 'Port Kuryk Ro-Pax Rail Ferry Terminal',
    shortName: 'Port Kuryk',
    country: 'Kazakhstan',
    lat: 43.1800,
    lng: 51.6500,
    type: 'seaport',
    isBottleneck: true,
    throughputTeuPerYear: '260,000 TEU',
    coldStorageCapacityM3: '40,000 m³',
    gaugeMm: 'Ro-Pax Rail Ramp',
    dcsaCode: 'KZKRK',
  },
  {
    id: 'baku',
    name: 'Port of Baku (Alat Intermodal Logistics Hub)',
    shortName: 'Baku Alat',
    country: 'Azerbaijan',
    lat: 39.9950,
    lng: 49.4100,
    type: 'seaport',
    isBottleneck: true,
    throughputTeuPerYear: '550,000 TEU',
    coldStorageCapacityM3: '75,000 m³',
    gaugeMm: '1520mm & Rail Ferry',
    dcsaCode: 'AZBAK',
  },
  {
    id: 'ganja',
    name: 'Ganja Agro-Logistics Center',
    shortName: 'Ganja',
    country: 'Azerbaijan',
    lat: 40.6800,
    lng: 46.3600,
    type: 'rail-hub',
    throughputTeuPerYear: '180,000 TEU',
    coldStorageCapacityM3: '25,000 m³',
    gaugeMm: '1520mm',
    dcsaCode: 'AZKVD',
  },
  {
    id: 'tbilisi',
    name: 'Tbilisi Central Rail Marshalling Center',
    shortName: 'Tbilisi',
    country: 'Georgia',
    lat: 41.7151,
    lng: 44.8271,
    type: 'rail-hub',
    throughputTeuPerYear: '340,000 TEU',
    coldStorageCapacityM3: '45,000 m³',
    gaugeMm: '1520mm',
    dcsaCode: 'GETBS',
  },
  {
    id: 'akhalkalaki',
    name: 'Akhalkalaki Break-of-Gauge Facility (BTK)',
    shortName: 'Akhalkalaki',
    country: 'Georgia',
    lat: 41.4050,
    lng: 43.4860,
    type: 'gauge-break',
    isBottleneck: true,
    throughputTeuPerYear: '210,000 TEU',
    coldStorageCapacityM3: '20,000 m³',
    gaugeMm: '1520mm ⇄ 1435mm European',
    dcsaCode: 'GEAKH',
  },
  {
    id: 'poti',
    name: 'Port of Poti Black Sea Container Terminal',
    shortName: 'Poti',
    country: 'Georgia',
    lat: 42.1462,
    lng: 41.6720,
    type: 'seaport',
    throughputTeuPerYear: '480,000 TEU',
    coldStorageCapacityM3: '60,000 m³',
    gaugeMm: '1520mm & Deepwater Berths',
    dcsaCode: 'GEPTI',
  },
  {
    id: 'kars',
    name: 'Kars Logistics Center & Rail Terminal',
    shortName: 'Kars',
    country: 'Turkey',
    lat: 40.6050,
    lng: 43.0950,
    type: 'rail-hub',
    throughputTeuPerYear: '250,000 TEU',
    coldStorageCapacityM3: '35,000 m³',
    gaugeMm: '1435mm (Standard)',
    dcsaCode: 'TRKSY',
  },
  {
    id: 'ankara',
    name: 'Ankara Central Freight Gateway',
    shortName: 'Ankara',
    country: 'Turkey',
    lat: 39.9334,
    lng: 32.8597,
    type: 'rail-hub',
    throughputTeuPerYear: '750,000 TEU',
    coldStorageCapacityM3: '110,000 m³',
    gaugeMm: '1435mm',
    dcsaCode: 'TRANK',
  },
  {
    id: 'istanbul',
    name: 'Istanbul Halkali & Marmara Logistics Gateway',
    shortName: 'Istanbul',
    country: 'Turkey',
    lat: 40.9833,
    lng: 28.8167,
    type: 'customs-gateway',
    throughputTeuPerYear: '1,400,000 TEU',
    coldStorageCapacityM3: '220,000 m³',
    gaugeMm: '1435mm & Marmaray Subsea',
    dcsaCode: 'TRIST',
  },
];

export const CORRIDOR_ROUTES: CorridorRouteSegment[] = [
  // 1. Authentic Kazakhstan Trans-Steppe Rail Backbone (KTZ Mainline)
  {
    id: 'kz-rail-mainline',
    name: 'KTZ Trans-Kazakhstan Heavy Rail Backbone (1520mm)',
    mode: 'RAIL',
    color: '#10B981', // Emerald
    gaugeMm: '1520mm',
    transitDays: 6,
    coordinates: [
      [44.2185, 80.4072], // Khorgos Dry Port
      [44.1500, 80.0500], // Altynkol Station
      [44.3600, 77.9800], // Saryozek Pass
      [43.8700, 77.0600], // Qonaev (Kapchagay)
      [43.2389, 76.8897], // Almaty Logistics Terminal
      [43.5400, 75.2100], // Otar Junction
      [43.5980, 73.7610], // Shu (Chu) Rail Junction
      [42.8960, 71.3780], // Taraz (Zhambyl)
      [42.3417, 69.5901], // Shymkent Agro Junction
      [42.4280, 68.8050], // Arys Marshalling Yard
      [43.2970, 68.2510], // Turkestan Station
      [44.1700, 66.7400], // Shieli Station
      [44.8500, 65.5000], // Kyzylorda Cold-Chain Hub
      [45.4900, 64.0800], // Zhosaly
      [45.7600, 62.1100], // Kazaly
      [46.7900, 61.6700], // Aralsk Station
      [47.1500, 61.3500], // Saksaulskaya
      [47.8300, 59.6100], // Shalkar Junction
      [45.3200, 55.1900], // Beyneu Intermodal Junction
      [44.7500, 53.9000], // Sais-Otes
      [44.1600, 52.1200], // Shetpe
      [43.6900, 51.3200], // Mangystau Depot
      [43.6500, 51.1600], // Aktau Commercial Seaport
      [43.1800, 51.6500], // Port Kuryk Ro-Pax Ferry Terminal
    ],
  },

  // 2. Caspian Maritime Ro-Pax Rail-Ferry Fairway
  {
    id: 'caspian-sea-ro-pax',
    name: 'Caspian Sea Ro-Pax Rail Ferry Fairway (Kuryk ⇄ Alat)',
    mode: 'SEA',
    color: '#0284C7', // Sky blue
    dashArray: '8 6',
    transitDays: 2,
    coordinates: [
      [43.1800, 51.6500], // Port Kuryk Ro-Pax Terminal
      [42.4000, 51.1000], // Eastern Caspian Fairway
      [41.2000, 50.3500], // Mid-Caspian Deep Water Trench
      [40.2500, 49.9500], // Absheron Peninsula Southern Approaches
      [39.9950, 49.4100], // Port of Baku (Alat Intermodal Hub)
    ],
  },

  // 3. Baku-Tbilisi-Kars (BTK) Trans-Caucasus Railway
  {
    id: 'btk-trans-caucasus-rail',
    name: 'Baku-Tbilisi-Kars (BTK) Trans-Caucasus Rail Corridor',
    mode: 'RAIL',
    color: '#6366F1', // Indigo
    gaugeMm: '1520mm to 1435mm',
    transitDays: 4,
    coordinates: [
      [39.9950, 49.4100], // Port of Baku (Alat)
      [40.0300, 48.9300], // Hajigabul
      [40.3400, 48.1600], // Kurdamir
      [40.6100, 47.1500], // Yevlakh
      [40.6800, 46.3600], // Ganja Agro-Logistics Center
      [40.9900, 45.6200], // Tovuz
      [41.1100, 45.4500], // Aghstafa
      [41.2500, 45.1000], // Boyuk Kasik Border
      [41.5400, 45.0000], // Rustavi
      [41.7151, 44.8271], // Tbilisi Rail Marshalling
      [41.5200, 44.7500], // Marabda
      [41.6000, 44.0800], // Tsalka
      [41.4050, 43.4860], // Akhalkalaki (Break-of-Gauge 1520mm / 1435mm)
      [40.6050, 43.0950], // Kars Logistics Hub
    ],
  },

  // 4. Black Sea Rail Branch (Tbilisi ⇄ Port of Poti)
  {
    id: 'black-sea-rail-branch',
    name: 'Georgian Railway Black Sea Branch (Tbilisi ⇄ Poti)',
    mode: 'RAIL',
    color: '#8B5CF6', // Purple
    gaugeMm: '1520mm',
    transitDays: 1,
    coordinates: [
      [41.7151, 44.8271], // Tbilisi
      [41.9800, 44.1100], // Gori
      [41.9900, 43.6000], // Khashuri
      [42.0200, 43.5000], // Surami Pass Tunnel
      [42.1100, 43.0400], // Zestafoni
      [42.2700, 42.7000], // Kutaisi
      [42.1600, 42.3300], // Samtredia Junction
      [42.1462, 41.6720], // Port of Poti Container Terminal
    ],
  },

  // 5. Trans-Anatolian Rail Line (Kars ⇄ Ankara ⇄ Istanbul Marmaray)
  {
    id: 'trans-anatolian-rail',
    name: 'TCDD Trans-Anatolian Rail & Marmaray (Kars ⇄ Istanbul)',
    mode: 'RAIL',
    color: '#EC4899', // Pink
    gaugeMm: '1435mm',
    transitDays: 3,
    coordinates: [
      [40.6050, 43.0950], // Kars
      [39.9000, 41.2700], // Erzurum
      [39.7500, 39.4900], // Erzincan
      [39.7500, 37.0100], // Sivas
      [38.7300, 35.4800], // Kayseri
      [39.9334, 32.8597], // Ankara Freight Hub
      [39.7767, 30.5206], // Eskisehir
      [40.1400, 29.9800], // Bilecik
      [40.7600, 29.9200], // Izmit
      [40.8000, 29.4300], // Gebze Intermodal Hub
      [41.0000, 28.9800], // Marmaray Subsea Rail Tunnel
      [40.9833, 28.8167], // Istanbul Halkali European Gateway
    ],
  },

  // 6. Western Europe - Western China Highway (WE-WC Trucking Corridor)
  {
    id: 'we-wc-highway',
    name: 'WE-WC Multimodal Reefer Highway (TIR Trucking)',
    mode: 'HIGHWAY',
    color: '#F59E0B', // Amber
    transitDays: 5,
    coordinates: [
      [44.2185, 80.4072], // Khorgos
      [43.2389, 76.8897], // Almaty
      [43.0500, 75.0500], // Korday Pass
      [42.8960, 71.3780], // Taraz
      [42.3417, 69.5901], // Shymkent
      [43.2970, 68.2510], // Turkestan
      [44.8500, 65.5000], // Kyzylorda
      [46.7900, 61.6700], // Aralsk
      [50.2800, 57.1700], // Aktobe
      [47.1000, 51.9000], // Atyrau
      [45.3200, 55.1900], // Beyneu
      [43.6500, 51.1600], // Aktau
    ],
  },

  // 7. Black Sea Container Feeder Fairway (Poti ⇄ Istanbul)
  {
    id: 'black-sea-feeder',
    name: 'Black Sea Maritime Reefer Fairway (Poti ⇄ Istanbul)',
    mode: 'SEA',
    color: '#0D9488', // Teal
    dashArray: '8 6',
    transitDays: 3,
    coordinates: [
      [42.1462, 41.6720], // Port of Poti
      [42.2000, 37.5000], // Central Black Sea Fairway
      [42.1500, 35.2000], // Sinop Offshore Channel
      [41.5000, 31.5000], // Western Black Sea Basin
      [41.2500, 29.1000], // Bosphorus North Approach
      [40.9833, 28.8167], // Port of Istanbul
    ],
  },
];

export const CORRIDOR_EVENTS: CorridorEvent[] = [
  {
    id: 'EVT-101',
    title: 'Thermal Excursion & Volatile Ethanol Surge',
    shipmentId: 'FS-9042',
    cargoName: 'Altyn Dan Fresh Berries & Pears',
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
      co2: 4.8,
      o2: 14.2,
    },
    bhi: 48.2,
    rulHours: 28,
    dcsaEventCode: 'DCSA-EQUIP-EXCURSION-04',
  },
  {
    id: 'EVT-102',
    title: 'Auxiliary Generator Frequency Drift in Caspian Transit',
    shipmentId: 'FS-4103',
    cargoName: 'Saumal Bio-Kefir & Organic Dairy',
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
      co2: 1.2,
      o2: 19.5,
    },
    bhi: 68.4,
    rulHours: 72,
    dcsaEventCode: 'DCSA-TRANS-REEFER-DRIFT',
  },
  {
    id: 'EVT-103',
    title: 'Reefer Expansion Valve Mechanical Blockage',
    shipmentId: 'FS-7750',
    cargoName: 'Mountain Pears & Stone Fruits',
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
      co2: 5.1,
      o2: 12.0,
    },
    bhi: 58.0,
    rulHours: 42,
    dcsaEventCode: 'DCSA-EQUIP-MAINT-REQ',
  },
  {
    id: 'EVT-104',
    title: 'Severe Gale Advisory & Ro-Pax Anchorage Delay',
    severity: 'BOTTLENECK',
    lat: 40.2500,
    lng: 49.9500,
    locationName: 'Absheron Peninsula Maritime Fairway & Alat Roadstead',
    timestamp: '25 min ago',
    description: 'North-westerly gale winds reaching 24 m/s (Sea State 5). Maritime safety administration halted berthing maneuvers. 4 container Ro-Pax vessels holding at anchorage with an estimated 14-hour delay.',
    aiAction: 'Automated predictive shelf-life re-calculation across 18 perishable containers. Adjusted reefer setpoints to pre-cooling regime (+1.0°C) to extend biological buffer.',
    telemetry: {
      temperature: 21.0,
      humidity: 84,
      ethanol: 0.0,
      vibration: 1.2,
    },
    dcsaEventCode: 'DCSA-AIS-WEATHER-DELAY',
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
    dcsaEventCode: 'DCSA-SHOCK-SURGE-02',
  },
  {
    id: 'EVT-106',
    title: 'Autonomous Arrhenius Pulse-Cooling Cycle Complete',
    shipmentId: 'FS-6218',
    cargoName: 'Tian Shan Organic Apples & Pears',
    severity: 'OPTIMAL',
    lat: 42.1462,
    lng: 41.6720,
    locationName: 'Port of Poti Intermodal Rail Yard',
    timestamp: '3 hours ago',
    description: 'AI Conductor autonomously executed a precision pulse-cooling cycle in response to rising humidity (88%). Temperature stabilized at +1.8°C; respiration rate reduced by 34%.',
    aiAction: 'Optimal biological preservation verified. Zero manual intervention required.',
    telemetry: {
      temperature: 1.8,
      humidity: 88,
      ethanol: 6.2,
      vibration: 0.4,
      co2: 6.0,
      o2: 3.5,
    },
    bhi: 92.4,
    rulHours: 240,
    dcsaEventCode: 'DCSA-PULSE-COOL-COMPLETE',
  },
];

export const SHIPMENT_GEO_POSITIONS: Record<string, { lat: number; lng: number; mode: 'TRAIN' | 'SHIP' | 'TRUCK' }> = {
  'FS-8821': { lat: 43.1800, lng: 51.6500, mode: 'TRAIN' },   // Kuryk Terminal
  'FS-9042': { lat: 43.2100, lng: 51.6800, mode: 'TRAIN' },   // Kuryk Yard (Critical)
  'FS-4103': { lat: 41.2000, lng: 50.3500, mode: 'SHIP' },    // Caspian Sea mid-transit
  'FS-7750': { lat: 39.9950, lng: 49.4100, mode: 'TRUCK' },   // Baku Alat dry port
  'FS-6218': { lat: 42.1462, lng: 41.6720, mode: 'TRAIN' },   // Port of Poti
  'FS-3319': { lat: 40.9833, lng: 28.8167, mode: 'TRUCK' },   // Istanbul Hub
};
