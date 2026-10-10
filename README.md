# FreshStream AI — Production IoT Cold-Chain SaaS Platform

> **Intelligent Perishable Asset Preservation Powered by Biological Digital Twins & Hybrid 1D-CNN + LSTM Neural Networks**  
> Developed for high-value agricultural exports along Central Eurasia's **Trans-Caspian Middle Corridor (TITR / TMTM)**.

[![CI/CD Pipeline](https://github.com/freshstream-ai/freshstream-ai/actions/workflows/deploy.yml/badge.svg)](https://github.com/freshstream-ai/freshstream-ai/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Framework-Next.js%2015%20App%20Router-blue.svg)](https://nextjs.org)
[![PyTorch ONNX](https://img.shields.io/badge/ML%20Engine-ONNX%20Runtime%20Node-purple.svg)](https://onnxruntime.ai)
[![Dataset](https://img.shields.io/badge/Data-Mendeley%20DOI%2010.17632%2Fmwmhh766fc-orange.svg)](https://doi.org/10.17632/mwmhh766fc)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/MFDoom151/freshstream-ai)

---

## 1. Executive Overview

Perishable agri-bulk cargo (organic beef, fresh berries, bio-dairy) moving across the 4,500 km Trans-Caspian Middle Corridor faces up to 30% loss rates, predominantly at maritime buffer choke points such as **Port Kuryk**, **Aktau**, and **Baku**.

Traditional temperature loggers act only as post-mortem proof for insurance claims 6 months later. **FreshStream AI** replaces passive logging with proactive biological preservation:
1. **Multi-Spectral Chemoresistive IoT**: Continuously monitoring Temperature, Humidity, and critically **Volatile Ethanol ($C_2H_5OH$) & Putrefactive Gases ($MQ3 / MQ135$)** — the earliest chemical biomarkers of anaerobic fermentation hours before physical pulp temperature spikes.
2. **Dual-Head Hybrid 1D-CNN + LSTM Neural Network**: Trained on real laboratory E-nose time-series measurements (Wijaya et al., CC BY 4.0) to predict exact Remaining Useful Life (RUL in hours) and a Biological Health Index (BHI 0–100%).
3. **Autonomous AI Conductor**: Instant automated alerts and rerouting protocols dispatched in real-time via Server-Sent Events (SSE) and Telegram Bot notifications.
4. **Enterprise SaaS Dashboard**: Protected role-based operations dashboard with live multi-container tracking, trilingual localization (English, Русский, Қазақша), and persistent SQLite/PostgreSQL storage via Prisma ORM.

---

## 2. Microservice Architecture

The ecosystem consists of three coordinated services:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRESHSTREAM AI ECOSYSTEM                        │
├────────────────────────┬───────────────────────┬───────────────────────┤
│    Next.js 15 App      │  IoT Stream Emulator  │  Telegram Alert Bot   │
│   (freshstream-web)    │ (freshstream-emulator)│ (freshstream-tg-bot)  │
├────────────────────────┼───────────────────────┼───────────────────────┤
│ • NextAuth (JWT)       │ • Replays 2,160 real  │ • SSE & Polling       │
│ • Prisma ORM & SQLite  │   E-nose readings     │ • Anomaly Detector    │
│ • ONNX Inference API   │ • Emits every ~2 sec  │ • 5-min Cooldown      │
│ • SSE Stream Hub       │ • POST /api/telemetry │ • Telegram Markdown   │
│ • Trilingual i18n      │                       │ • Zero-crash Dry-Run  │
└───────────┬────────────┴───────────┬───────────┴───────────┬───────────┘
            │                        │                       │
            └────────────────────────┼───────────────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     │ Docker Bridge Network & Volume│
                     │  - freshstream-network        │
                     │  - sqlite_data (/app/prisma)  │
                     └───────────────────────────────┘
```

---

## 3. Quickstart & Local Setup

### Prerequisites
- Node.js 20.x or 22.x
- npm 10+
- (Optional) Docker & Docker Compose

### 3.1 Standard Local Development

```bash
# 1. Clone & install dependencies
cd freshstream-ai
npm install

# 2. Configure environment
cp .env.example .env

# 3. Database Migration & Seeding
npx prisma migrate dev --name init
npx prisma db seed

# 4. Start Next.js development server
npm run dev
# -> Accessible at http://localhost:3000
```

### 3.2 Demo Authentication Credentials

The database seed provides two pre-configured accounts:
- **Admin**: `admin@freshstream.ai` / `AdminPass2026!`
- **Operator**: `operator@freshstream.ai` / `OperatorPass2026!`

Unauthenticated visits to `/dashboard` are intercepted by Edge middleware and redirected to `/login`.

---

## 4. Real-Time Telemetry & Telegram Alerts

### Running the IoT Stream Emulator
Simulate an active refrigerated container shipping organic beef across the Caspian Sea:
```bash
# Emits real sensor telemetry every 2 seconds to the backend
node scripts/stream_emulator.js --shipment=FS-8821 --interval=2000
```

### Running the Telegram Alert Bot
```bash
cd tg-bot
npm install
npm start
# -> Listens to SSE /api/telemetry/stream and dispatches alerts
```
*Note: If `TELEGRAM_BOT_TOKEN` is unset, the bot safely operates in **DRY-RUN mode**, formatting messages and logging to stdout without crashing.*

---

## 5. Production Docker Compose Deployment

Launch the entire multi-service ecosystem (Web application, Telemetry Emulator, and Telegram Bot) with a single command:

```bash
# Build and start all services with persistent SQLite storage
docker-compose up --build -d

# Check service health and logs
docker-compose ps
docker-compose logs -f web
docker-compose logs -f emulator
docker-compose logs -f tg-bot

# Stop all containers
docker-compose down
```

---

## 6. Machine Learning Pipeline & Real Data Integrity

- **Empirical Dataset**: D. R. Wijaya, R. Sarno, and E. Zulaika, *"Electronic nose dataset for beef quality monitoring under an uncontrolled environment"*, *BMC Research Notes* / Mendeley Data ([DOI: 10.17632/mwmhh766fc](https://doi.org/10.17632/mwmhh766fc)), Creative Commons Attribution 4.0 International (CC BY 4.0).
- **Zero Synthetic Data Guarantee**: All training arrays are windowed from physical MOS chemical sensor measurements.
- **Model File**: `public/models/freshstream_real_rul.onnx` executed via `onnxruntime-node`.
- **Inference Evaluation**: RUL MAE: 4.4 hours, Health Index MAE: 17.9%.

---

## 7. Verification & Automated Test Suite

Run the master E2E acceptance test suite covering Prisma DB, NextAuth, Real ONNX ML, SSE streaming, Telegram dry-run, and Docker configurations:

```bash
# 1. Execute full E2E acceptance test suite (Tiers 1-4)
node scripts/run-e2e-tests.mjs

# 2. Static TypeScript type check
npx tsc --noEmit

# 3. Production Next.js build
npm run build
```

---

## 8. License & Enterprise Platform

Developed and maintained by **FreshStream AI** — Intelligent Agri-Asset Preservation Platform.

License: **MIT License**.
