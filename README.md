# FreshStream AI — Enterprise Biological Digital Twin & Cold-Chain Logistics SaaS

> **Autonomous Perishable Asset Preservation Powered by Physics-Informed Machine Learning & Real-Time IoT Telematics**  
> Engineered specifically for high-value agricultural exports navigating Central Eurasia's **Trans-Caspian International Transport Route (TITR / Middle Corridor)**.

[![Next.js 15](https://img.shields.io/badge/Framework-Next.js%2015%20App%20Router-020617.svg?style=flat-square&logo=next.js)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/UI-React%2019%20%2B%20Tailwind%20CSS-06b6d4.svg?style=flat-square&logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/3D%20Graphics-Three.js%20WebGL-emerald.svg?style=flat-square&logo=three.js)](https://threejs.org)
[![Leaflet GIS](https://img.shields.io/badge/GIS%20Mapping-Leaflet%20OpenStreetMap-10b981.svg?style=flat-square&logo=leaflet)](https://leafletjs.com)
[![ONNX Runtime](https://img.shields.io/badge/ML%20Engine-ONNX%20Runtime%20Node-8b5cf6.svg?style=flat-square&logo=onnx)](https://onnxruntime.ai)
[![TypeScript](https://img.shields.io/badge/Type%20Safety-Strict%20TypeScript%205.7-3b82f6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-slate.svg?style=flat-square)](LICENSE)

---

## 1. Executive Summary

Perishable agri-bulk cargo (organic beef, fresh berries, bio-dairy, and orchard fruits) transiting the 4,500 km Trans-Caspian Middle Corridor faces up to 30% direct cargo loss rates. Over 80% of these catastrophic failures occur at multi-day intermodal bottlenecks and Caspian ferry staging ports such as **Port Kuryk**, **Aktau**, and **Baku Alat**.

Standard USB loggers and basic GPS trackers serve merely as post-mortem evidence for insurance claims filed 6 months after spoilage has occurred. **FreshStream AI** replaces passive logging with active biological preservation:

1. **Chemoresistive Multi-Gas Telematics**: Real-time monitoring of Temperature, Relative Humidity, Shock/Vibration, and critically **Volatile Ethanol ($C_2H_5OH$) & Climacteric Ethylene ($C_2H_4$)** — detecting anaerobic cellular fermentation and pectin degradation up to 14 hours before physical core temperatures breach thermal alarm thresholds.
2. **Physics-Informed Arrhenius Digital Twin**: Implements modified Arrhenius chemical kinetics $k(T) = A \cdot e^{-E_a / (RT)}$ coupled with dual-head hybrid 1D-CNN + LSTM neural networks to predict Remaining Useful Life (RUL in hours) and Biological Health Index (BHI 0–100%).
3. **Apple-Grade 3D Parametric Scrollytelling**: Full-viewport WebGL interactive digital twin demonstrating biological rot mechanics, AI-driven time-reversal intervention, smart carton encapsulation, and refrigerated semi-trailer highway dispatch.
4. **Real-Map Geospatial Digital Twin**: Live Leaflet GIS control tower mapping 16 Middle Corridor logistics hubs, 2 Break-of-Gauge facilities (Khorgos 1435mm/1520mm, Akhalkalaki 1520mm/1435mm), 5 animated transport modes, and real-time cargo excursion controls adhering to **DCSA 3.0**, **KTZ Rail ASOU / SMGS**, and **AIS Maritime** telemetry schemas.
5. **Zero-Hang Enterprise Telemetry**: Non-blocking Server-Sent Events (`/api/telemetry/stream`) with visibility-aware client lifecycles, explicit stream `cancel()` cleanup, and sub-second route navigation.

---

## 2. Visual Platform Tour

| Phase / Screen | Description | Preview |
| :--- | :--- | :--- |
| **01. Fresh Asset Baseline** (`scroll-0.png`) | Pristine Bartlett/Asian pear ($Pyrus\ pyrifolia$) at Day 0 harvest with waxy cuticle sheen, optimal turgor pressure, and 99.8% BHI. | `docs/screenshots/scroll-0.png` |
| **02. Thermal Spoilage** (`scroll-35.png`) | Thermal abuse excursion at ferry bottleneck: necrotic lesion expansion, cellular wrinkling, and mycelium mold bloom ($BHI < 35\%$). | `docs/screenshots/scroll-35.png` |
| **03. Arrhenius Recovery** (`scroll-65.png`) | Physics-informed autonomous cooling intervention halts decay, rehydrates tissue, and restores biological shelf life. | `docs/screenshots/scroll-65.png` |
| **04. Smart Encapsulation** (`scroll-85.png`) | Asset descends into insulated cold-chain carton with hermetic silicone gaskets and mint IoT sensor puck node. | `docs/screenshots/scroll-85.png` |
| **05. Highway Dispatch** (`scroll-100.png`) | Refrigerated semi-trailer truck loaded and departing along the Trans-Caspian Silk Road corridor with spinning wheels and LED headlights. | `docs/screenshots/scroll-100.png` |
| **06. Interactive Control Tower** (`demo-map.png`) | Dedicated interactive `/demo` GIS map showcasing 16 hubs, 5 transport modes, Break-of-Gauge facilities, and live cargo condition sliders. | `docs/screenshots/demo-map.png` |
| **07. Fleet Dashboard** (`dashboard.png`) | Enterprise monitoring console with live fleet telematics, critical anomaly alerts, and active reefer container manifests. | `docs/screenshots/dashboard.png` |
| **08. Shipment IoT Telemetry** (`shipment-detail.png`) | In-depth IoT control tower for reefer container `FS-8821` with real-time SSE stream, Arrhenius decay charts, and TinyML predictions. | `docs/screenshots/shipment-detail.png` |

---

## 3. Core Capabilities & Architecture

### 3.1 3D Apple-Grade Parametric Digital Twin (`/`)
- **64×64 Organic Pear Geometry**: Procedural BufferGeometry featuring 5-lobed carpellary modulation, natural belly slant, concave calyx indent, and slender conical neck ($4,225$ vertices, $24,576$ indices).
- **Curved 3D Leaf with V-Crease**: Longitudinal downward arch and central midrib crease.
- **Custom GLSL Rot & Recovery Shaders**: Procedural 3D Simplex cellular noise for necrotic lesions, epidermal dehydration wrinkling displacement, velvety mycelium mold bloom, and reverse-rot restoration wavefronts.
- **Detailed Packaging & Vehicle Models**: Insulated carton with opening/closing flaps and mint LED indicator; cab-over refrigerated semi-trailer truck with Thermo King cooling unit, 6 rubber wheels on alloy rims, and dual LED headlights.
- **Bidirectional Damped Scroller**: Deterministic 5-phase state machine with exponential smoothing ($lerp$), fully reversible when scrolling up.

### 3.2 Real-Map Geospatial Logistics Digital Twin (`/demo`)
- **16 Middle Corridor Hubs**: Khorgos, Almaty, Shu, Shymkent, Turkestan, Kyzylorda, Beyneu, Aktau, Port Kuryk, Baku Alat, Ganja, Tbilisi, Akhalkalaki, Poti, Kars, and Istanbul.
- **Break-of-Gauge Interchanges**: Highlighted railway bogie exchange facilities at Khorgos (`1435mm ⇄ 1520mm`) and Akhalkalaki (`1520mm ⇄ 1435mm UIC`), plus Caspian Ro-Pax ferry ramps at Port Kuryk and Baku.
- **5 Transport Modalities**:
  1. `RAIL_REEFER` — KTZ / BTK Heavy Rail Consist (1520mm & 1435mm rail networks)
  2. `RO_PAX_FERRY` — Caspian Sea "BARYS-1" Ro-Pax Rail Ferry crossing
  3. `TIR_TRUCK` — Western Europe - Western China Motorway reefer highway
  4. `SMART_REEFER_CONTAINER` — 40ft ISO Smart Reefer Container with IoT mesh
  5. `MULTIMODAL_COMBO` — Full 4,500 km intermodal chain connecting Central Asia to Europe
- **Interactive Telemetry Controls**: Dynamic dual temperature setpoint vs. actual ($T_{set}$ vs. $T_{act}$), climacteric ethylene ($C_2H_4$), volatile ethanol ($>35$ ppm anaerobic fermentation threshold), and vibration/shock G-forces.
- **Logistics Standards Ingestion**: Generates and inspects valid payloads for **DCSA Track & Trace 3.0**, **KTZ Rail ASOU / SMGS Consignment Notes**, and **AIS Maritime Vessel Feeds**.

### 3.3 Zero-Hang Resilient Telemetry Stream
- **Server Lifecycle**: SSE endpoint `/api/telemetry/stream` backed by Node.js `ReadableStream` with explicit `cancel()` hooks, heartbeat keep-alive pings every 5s, connection recycling at 180s, and automated socket pool drainage.
- **Client Lifecycle**: Clean unmount handlers, tab visibility change detection (pauses background streams to preserve browser socket pools), exponential reconnection backoff, and rapid navigation without socket starvation.
- **Sub-Second Route Latency**: All protected and public routes compile and render in <600ms during automated stress tests (acceptance threshold <5000ms).

### 3.4 Production Machine Learning Inference
- **Real Empirical Training Data**: Trained on real laboratory electronic nose time-series measurements (Wijaya et al., Mendeley Data DOI: 10.17632/mwmhh766fc, CC BY 4.0).
- **Hybrid 1D-CNN + LSTM**: Predicts Remaining Useful Life (RUL hours) and Biological Health Index (BHI 0–100%) from real MOS chemoresistive sensor sequences.
- **ONNX Runtime Engine**: Native on-device execution via `onnxruntime-node` (`public/models/freshstream_real_rul.onnx`).

### 3.5 Enterprise Design & Trilingual Localization
- **Design Tokens**: Restrained, professional enterprise aesthetic inspired by Linear, Stripe, and Flexport. Pure slate/zinc palette, subtle borders, high contrast WCAG AA readability, and zero garish neon glows.
- **Theme Support**: Seamless Dark Mode (default) and Light Mode toggle with persistent local storage.
- **Trilingual Parity**: 100% complete translation parity across English, Russian, and Kazakh (`translations.ts`).

---

## 4. Quickstart & Local Setup

### Prerequisites
- Node.js 20.x, 22.x, or 24.x
- npm 10+
- Google Chrome, Chromium, or Microsoft Edge (for automated browser QA)

### 4.1 Installation & Database Setup

```bash
# 1. Clone repository
git clone https://github.com/MFDoom151/freshstream-ai.git
cd freshstream-ai

# 2. Install dependencies
npm install

# 3. Environment configuration
cp .env.example .env

# 4. Generate Prisma client & seed database
npx prisma generate
npm run db:seed
```

### 4.2 Start Development Server

```bash
npm run dev
# -> Application live at http://localhost:3000
```

### 4.3 Production Build & Run

```bash
npm run build
npm run start
# -> Production Next.js server live at http://localhost:3000
```

---

## 5. Authentication & Demo Access

The platform provides role-based authentication via NextAuth:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Fleet Operator** | `operator@freshstream.ai` | `Password123!` | Real-time monitoring, shipment inspection, control tower simulator |
| **System Admin** | `admin@freshstream.ai` | `Password123!` | Full telemetry ingestion, corridor configuration, fleet management |

Unauthenticated requests to `/dashboard/*` routes are intercepted by Next.js Edge middleware and redirected to `/login`.

---

## 6. Verification & Automated Test Suites

The codebase includes an exhaustive automated verification harness:

```bash
# 1. Static Type Hygiene (TypeScript 5.7)
npm run type-check
# -> 0 type errors

# 2. Production Build Compilation (Next.js 15)
npm run build
# -> 16/16 routes compiled successfully

# 3. Independence Terminology Audit (0 forbidden academic/competition terms)
npm run lint

# 4. 3D Scrollytelling & Shader Mathematical Verification
npx tsx scripts/verify-scrollytelling.ts
# -> 30+ tests verifying geometry, normals, shaders, and 5-stage reversibility

# 5. Middle Corridor Geospatial & Logistics Standards Verification
npx tsx scripts/verify-demo-map.ts
# -> 67/67 acceptance checks passed (16 hubs, 5 modes, DCSA 3.0, SMGS, AIS)

# 6. Telemetry Stream Stability & Zero-Hang Socket Drainage
npx tsx scripts/verify-stability.ts
# -> 20 rapid SSE cycles, socket pool unblocking, all routes <5s

# 7. Real Browser QA Automation (Playwright / Chromium / Puppeteer)
npx tsx scripts/verify-browser-qa.ts
# -> 37/37 checks passed: full-screen 3D canvas, 5 scroll screenshots,
#    reversibility, 16 route rapid navigation loop, demo map modes & sliders,
#    0 unhandled console errors, 0 WebGL errors
```

---

## 7. Project Structure

```
freshstream-ai/
├── docs/
│   └── screenshots/              # High-resolution QA verification screenshots
│       ├── scroll-0.png          # 3D Scrollytelling: Fresh Harvest (0%)
│       ├── scroll-35.png         # 3D Scrollytelling: Rot & Thermal Abuse (35%)
│       ├── scroll-65.png         # 3D Scrollytelling: Arrhenius Recovery (65%)
│       ├── scroll-85.png         # 3D Scrollytelling: Smart Carton Encapsulation (85%)
│       ├── scroll-100.png        # 3D Scrollytelling: Reefer Truck Dispatch (100%)
│       ├── demo-map.png          # Real-map Middle Corridor Logistics Twin (/demo)
│       ├── dashboard.png         # Fleet operations dashboard
│       ├── shipment-detail.png   # Shipment IoT telematics & Control Tower
│       ├── analytics.png         # Corridor loss & saved value analytics
│       └── support.png           # Enterprise contact & pilot onboarding
├── prisma/
│   ├── schema.prisma             # SQLite / PostgreSQL schema
│   └── seed.ts                   # Seed data with authentic corridor shipments
├── public/
│   └── models/
│       └── freshstream_real_rul.onnx # Trained 1D-CNN + LSTM ONNX neural network
├── scripts/
│   ├── verify-browser-qa.ts      # Real browser QA automation & screenshot capture
│   ├── verify-demo-map.ts        # Logistics twin & standards verification suite
│   ├── verify-scrollytelling.ts  # 3D geometry & shader mathematical verification
│   └── verify-stability.ts       # SSE telemetry lifecycle & rapid route stress harness
├── src/
│   ├── app/                      # Next.js 15 App Router pages & API endpoints
│   │   ├── api/
│   │   │   ├── predict/          # ONNX neural network inference API
│   │   │   ├── telemetry/stream/ # Non-blocking SSE telemetry streaming hub
│   │   │   └── ...
│   │   ├── dashboard/            # Fleet operations, shipments, analytics, support
│   │   ├── demo/                 # Dedicated interactive logistics digital twin showcase
│   │   ├── login/                # Role-based NextAuth login with quick-fill
│   │   └── page.tsx              # Homepage with full-screen 3D Apple-grade scrollytelling
│   ├── components/
│   │   ├── 3d/
│   │   │   └── PearScrollytelling.tsx # Full-viewport Three.js WebGL canvas & shaders
│   │   ├── map/
│   │   │   └── DigitalTwinMap.tsx     # Leaflet GIS Middle Corridor map with 5 modes
│   │   ├── simulator/
│   │   │   └── ControlTower.tsx       # Live IoT Arrhenius simulator component
│   │   └── ui/                   # Restrained enterprise UI components (GlassCard, Button, Badge)
│   ├── lib/
│   │   ├── i18n/                 # Trilingual localization (EN, RU, KZ)
│   │   ├── map-data.ts           # 16 corridor hubs, 7 GPS tracks, 5 transport modes
│   │   └── telemetry/            # Event broadcaster & connection registry
│   └── types/
│       └── telemetry.ts          # Biochemical kinetics & logistics standards schemas
└── tailwind.config.ts            # Enterprise color tokens & styling rules
```

---

## 8. License

Developed and maintained by **FreshStream AI** — Intelligent Agri-Asset Preservation Platform.

Released under the **MIT License**.
