# FreshStream AI — Project Master Specification & Milestone Decomposition

## 1. Project Overview & Architecture
FreshStream AI is an independent enterprise B2B cold-chain "biological digital twin" SaaS platform specifically engineered for perishable cargo transiting the Trans-Caspian International Transport Route (TITR / Middle Corridor).

### Architecture
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS.
- **3D Graphics**: Vanilla Three.js (`^0.186.1`) mounted via React `useEffect`/`useRef` lifecycle with a full-viewport fixed canvas (`fixed inset-0 -z-10 w-screen h-screen pointer-events-none`).
- **Telemetry Streaming**: Server-Sent Events (`/api/telemetry/stream`) powered by Node.js `ReadableStream` with explicit `cancel()` hooks, 5s heartbeat pings, 180s recycling, and client-side visibility-aware lifecycle management.
- **ML Inference Engine**: Native `onnxruntime-node` (`^1.30.0`) running real-world biological RUL and health index predictions (`/api/predict`).
- **Geospatial & Logistics Twin**: Real Leaflet / OpenStreetMap mapping with accurate Trans-Caspian GPS track polylines, 5 transport modes, cargo condition controls, and adherence to DCSA 3.0, SMGS, and AIS data models.
- **Enterprise Design System**: Restrained, modern enterprise styling inspired by Linear, Stripe, and Flexport (slate/zinc palette, subtle borders, high contrast WCAG AA, dark/light themes, trilingual EN/RU/KZ).

---

## 2. Feature Inventory
Every requirement from the authoritative request (`ORIGINAL_REQUEST.md` Follow-up 2026-10-10T15:22:00Z) is inventoried and mapped to an implementation milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | SSE Telemetry Stream Teardown | Declare `cancel()` on `ReadableStream`, heartbeat error abort, 180s recycle | M1 | R2 |
| F2 | Client Telemetry Lifecycle | Clean unmount, visibility change pause, max 3 reconnection cap with backoff | M1 | R2 |
| F3 | Missing Route `/dashboard/shipments` | Dedicated page redirecting cleanly to `/dashboard#shipments` | M1 | R2 |
| F4 | Navigation Freeze Elimination | Unblock HTTP/1.1 socket pool; guarantee all routes render <5s without hangs | M1 | R2 |
| F5 | Full-Viewport Fixed 3D Canvas | `fixed inset-0 -z-10 w-screen h-screen pointer-events-none` behind all homepage content | M2 | R1 |
| F6 | Apple-Grade Parametric Pear | 64x64 custom geometry with 5-lobed base, natural slant, calyx/stem indents, 3D leaf, woody stem | M2 | R1 |
| F7 | Realistic Biological Rot Shader | Lesion growth, brown halos, epidermal wrinkling displacement, mycelium mold bloom | M2 | R1 |
| F8 | Biological Twin Recovery Shader | Smooth reverse-rot recovery sweep, tissue rehydration, leaf restoration | M2 | R1 |
| F9 | Smart Carton Packaging 3D Model | Insulated carton with opening flaps, pear descending, sealing, mint IoT indicator | M2 | R1 |
| F10 | Refrigerated Semi-Trailer Truck 3D | Model with Thermo King cooling unit, container loading, and highway departure animation | M2 | R1 |
| F11 | Bidirectional Damped Scroller | 5-phase scroll state machine (0..1) with exponential moving average, fully reversible on scroll up | M2 | R1 |
| F12 | WCAG AA Contrast Over 3D | Right-half 3D framing, left-column narrative, glass cards with >15:1 contrast | M2 | R1 |
| F13 | Neon & Vomit Glow Removal | Remove 11 artifacts: ambient blur orbs, 25px button shadows, badge glows, card glows, halo blurs | M3 | R3 |
| F14 | Enterprise Theme & Typography | Restrained slate/zinc design system (Linear/Stripe/Flexport quality), crisp cards & tables | M3 | R3 |
| F15 | Light-Mode Contrast Fix | Replace hardcoded `text-white` with theme-aware `text-slate-900 dark:text-white` | M3 | R3 |
| F16 | Independence & Academic Purge | Replace residual student/academic phrases in Support & Header with enterprise B2B copy | M3 | R5 |
| F17 | Trilingual i18n Polish | 100% key parity across EN, RU, and KZ; zero lorem ipsum or unfinished placeholder copy | M3 | R3 |
| F18 | Dedicated Interactive `/demo` Page | Rich standalone logistics control tower showcase with interactive digital twin map | M4 | R4 |
| F19 | Middle Corridor Real Geographic Map | Accurate rail tracks, Caspian ferry, highways, border gauge-breaks (Khorgos, Aktau, Baku, Batumi) | M4 | R4 |
| F20 | 5 Animated Transport Modes | Rail Reefer, Ro-Pax Ferry, TIR Truck, Reefer Container, Multimodal Combo | M4 | R4 |
| F21 | Full Cargo Condition Controls | Temperature Setpoint ($T_{set}$ vs $T_{act}$), RH%, CO₂/O₂, Ethylene ($C_2H_4$), Vibration | M4 | R4 |
| F22 | Logistics Standards Integration | DCSA Track & Trace 3.0 event feeds, SMGS railway consignment notes, AIS vessel data | M4 | R4 |
| F23 | TypeScript & Build Hygiene | `npm run type-check` (0 errors) and `npm run build` (exit code 0) | M5 | Acceptance |
| F24 | Independence Verification | `git grep -niE "satbayev|сатпаев|gwu|george washington|\bGW\b"` returns 0 | M5 | R5 |
| F25 | Real Browser Automation & Screenshots | Chrome DevTools MCP verification: 5 homepage scroll stages, navigation loop <5s, demo map | M5 | Acceptance |
| F26 | Independent Design Rubric Review | Reviewer evaluation against enterprise design standards (contrast, typography, no neon) | M5 | Acceptance |
| F27 | Git Commit & Push to `main` | Final clean commit pushed to `origin/main` | M5 | Acceptance |

---

## 3. Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Stability & Zero-Hang Telemetry Stream | Fix SSE connection leak, client lifecycle, `/dashboard/shipments` route, verify socket drainage | None | DONE |
| M2 | Full-Screen 3D Pear Scroll Story | Full-viewport canvas, Apple-like parametric pear, 5-stage rot/recovery/box/truck story, WCAG AA contrast | None | DONE |
| M3 | Serious Enterprise UI Redesign & i18n | Eliminate 11 neon glow artifacts, theme-aware text contrast, B2B copy, 100% EN/RU/KZ parity | None | PLANNED |
| M4 | Near-Production Logistics Demo & Real Map | Dedicated `/demo`, accurate Middle Corridor Leaflet map, 5 transport modes, cargo controls, DCSA/SMGS/AIS | M1, M3 | PLANNED |
| M5 | Full Verification, Browser QA & Push | Type-check, build, 0 forbidden terms, Chrome DevTools MCP screenshots, design review, git push | M1, M2, M3, M4 | PLANNED |

---

## 4. Code Layout & File Boundaries

| Milestone | Exclusively Owned Files | Read-Only Dependencies |
|-----------|-------------------------|------------------------|
| **M1** | `src/app/api/telemetry/stream/route.ts`, `src/lib/telemetry/broadcaster.ts`, `src/components/simulator/ControlTower.tsx`, `src/app/dashboard/shipments/page.tsx`, `scripts/verify-stability.ts` | `src/types/**`, `package.json` |
| **M2** | `src/components/3d/PearScrollytelling.tsx`, `src/app/page.tsx` | `src/components/layout/**`, `src/lib/i18n/**` |
| **M3** | `src/app/layout.tsx`, `src/app/globals.css`, `tailwind.config.ts`, `src/components/ui/**`, `src/components/layout/Header.tsx`, `src/app/login/page.tsx`, `src/app/dashboard/support/page.tsx`, `src/lib/i18n/translations.ts`, `src/types/i18n.ts` | `src/types/**` |
| **M4** | `src/app/demo/page.tsx`, `src/components/map/DigitalTwinMap.tsx`, `src/lib/map-data.ts`, `src/types/telemetry.ts` | `src/lib/i18n/**`, `src/components/ui/**` |
| **M5** | `scripts/verify-browser-qa.ts`, `docs/screenshots/**`, `README.md` | All project files |

---

## 5. Interface Contracts

### M1 ↔ M4 (Telemetry & Control Tower)
- SSE Endpoint: `/api/telemetry/stream?shipmentId={id}`
- Event types: `connected`, `telemetry`, `ping`
- Payload structure:
  ```typescript
  interface StreamEventPayload {
    shipmentId: string;
    timestamp: string;
    temperature: number;
    humidity: number;
    gasConcentration: number;
    batteryLevel: number;
    latitude: number;
    longitude: number;
    status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
    bhi: number;
    predictedRulHours: number;
  }
  ```

### M3 ↔ M2 / M4 (Enterprise Theme Design Tokens)
- Primary card backing: `bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800`
- Button variants:
  - `primary`: `bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm border border-emerald-500/50` (zero 25px outer blur)
  - `secondary`: `bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700`
- Text hierarchy:
  - Heading: `text-slate-900 dark:text-white`
  - Body: `text-slate-600 dark:text-slate-300`
  - Muted: `text-slate-500 dark:text-slate-400`
