# FreshStream AI — Render Cloud Deployment Guide

This guide walks you through deploying **FreshStream AI** to [Render](https://render.com) for production.

---

## 🚀 Deployment Options Overview

| Method | Environment | Free Plan Compatible? | Recommended For |
| :--- | :--- | :---: | :--- |
| **Option 1: 1-Click Render Blueprint** | Docker (`render.yaml`) | **Yes** | **Fastest & automated** |
| **Option 2: Docker Web Service** | Docker (`Dockerfile`) | **Yes** | Standard container deploy |
| **Option 3: Node Web Service** | Node.js (`npm start`) | **Yes** | Native Node.js runtime |

---

## Step 1: Push Your Code to GitHub

Render deploys directly from GitHub or GitLab. Your project repository is already initialized and committed locally on branch `main`.

1. Go to [GitHub](https://github.com/new) and create a new repository named `freshstream-ai` (public or private).
2. Push your local codebase to GitHub:

```bash
cd "c:\Users\user\Documents\Working Let it Happen\new tren\freshstream-ai"

# Link your GitHub repository (replace with your actual GitHub username/repo)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/freshstream-ai.git

# Push the main branch
git push -u origin main
```

---

## Step 2: Deploy to Render

### Option 1: Using Render Blueprint (Recommended — 1 Click)

The project includes an official [`render.yaml`](render.yaml) file configured for Render Blueprints.

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your GitHub account (if not already connected) and select your `freshstream-ai` repository.
4. Render will automatically read `render.yaml` and configure:
   - **Service Name**: `freshstream-web`
   - **Runtime**: `Docker` (using `./Dockerfile`)
   - **Plan**: `Free`
   - **Port**: `3000`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `DATABASE_URL`: `file:/app/prisma/dev.db`
     - `NEXTAUTH_SECRET`: *automatically generated secure 32-character key*
     - `NEXT_TELEMETRY_DISABLED`: `1`
5. Click **Apply**.
6. Render will build the Docker container and deploy the web service.

---

### Option 2: Deploy as a Manual Web Service (Docker)

If you prefer manual configuration without Blueprints:

1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select your `freshstream-ai` GitHub repository.
3. Configure the settings:
   - **Name**: `freshstream-ai` (or your choice)
   - **Language / Environment**: `Docker`
   - **Region**: Oregon (US West) or Frankfurt (EU)
   - **Branch**: `main`
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.`
   - **Instance Type**: `Free`
4. Expand **Advanced** -> **Add Environment Variable**:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `file:/app/prisma/dev.db`
   - `NEXT_TELEMETRY_DISABLED` = `1`
   - `NEXTAUTH_SECRET` = *(click "Generate" or paste a random 32+ character string)*
   - `NEXTAUTH_URL` = `https://<YOUR-RENDER-SUBDOMAIN>.onrender.com`
5. Click **Create Web Service**.

---

### Option 3: Deploy as a Native Node.js Web Service

If you prefer native Node.js over Docker:

1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select your repository.
3. Configure:
   - **Language**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `file:./prisma/dev.db`
   - `NEXTAUTH_SECRET` = *(Generate random key)*
   - `NEXTAUTH_URL` = `https://<YOUR-RENDER-SUBDOMAIN>.onrender.com`
5. Click **Create Web Service**.

---

## Step 3: Verify Your Live Deployment

Once Render finishes the build (usually ~2-3 minutes):

1. Click your service's `.onrender.com` URL (e.g. `https://freshstream-web.onrender.com`).
2. Verify:
   - Landing page loads with 200 OK.
   - Navigate to `/login` and sign in using the demo credentials:
     - **Admin**: `admin@freshstream.ai` / `AdminPass2026!`
     - **Operator**: `operator@freshstream.ai` / `OperatorPass2026!`
   - Access the `/dashboard` and monitor active shipments.
   - Click on shipment **FS-8821** to view the live Control Tower with ONNX RUL predictions.

---

## ⚡ Optional: Running Emulator & Telegram Bot in Background

- **Free Tier**: The Next.js web application includes built-in streaming endpoints (`/api/telemetry/stream`), historical data buffers, and live ML inference.
- **Paid Tier ($7/mo per worker)**: To run the continuous IoT Stream Emulator (`scripts/stream_emulator.js`) and Telegram alert bot (`tg-bot/`) as persistent 24/7 background workers on Render, simply uncomment the worker blocks in `render.yaml`.
