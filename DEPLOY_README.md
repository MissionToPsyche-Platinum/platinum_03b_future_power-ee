# 16 Psyche Power System Simulator — External Deployment Guide

This archive contains everything needed to run the application on any Node.js-capable hosting platform (Railway, Render, Fly.io, DigitalOcean App Platform, a VPS, etc.).

---

## Contents

```
dist/
  index.js          ← Compiled Express server (ESM)
  public/           ← Compiled React frontend (static assets)
    index.html
    assets/
    logos/
package.json        ← Dependency manifest (production deps only needed)
pnpm-lock.yaml      ← Exact dependency lock file
drizzle/            ← Database schema & migrations
.env.example        ← Required environment variables
DEPLOY_README.md    ← This file
```

---

## Prerequisites

- **Node.js** 20 or later
- **pnpm** 10 or later (`npm install -g pnpm`)
- A **MySQL 8** (or TiDB) database accessible from your host

---

## Quick Start

### 1. Install production dependencies

```bash
pnpm install --prod
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

See the **Environment Variables** section below for details on each variable.

### 3. Run database migrations

```bash
pnpm db:push
```

> This applies the Drizzle schema to your database. Run it once on first deploy and again after any schema changes.

### 4. Start the server

```bash
pnpm start
# or directly:
NODE_ENV=production node dist/index.js
```

The server listens on the port defined by the `PORT` environment variable (default: `3000`).

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# ── Database ────────────────────────────────────────────────────────────────
DATABASE_URL=mysql://user:password@host:3306/psyche_db

# ── Auth (JWT session cookies) ──────────────────────────────────────────────
JWT_SECRET=a-long-random-secret-string-at-least-32-chars

# ── Manus OAuth (required for user login) ───────────────────────────────────
# Register your app at https://manus.im to obtain these values.
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
OWNER_OPEN_ID=your-manus-open-id
OWNER_NAME=Your Name

# ── App metadata ─────────────────────────────────────────────────────────────
VITE_APP_TITLE=16 Psyche Power System Simulator
VITE_APP_LOGO=

# ── LLM / AI features (optional — used for AI-assisted analysis) ─────────────
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=

# ── File storage (optional — used for PDF/file uploads) ──────────────────────
# AWS S3-compatible bucket credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=

# ── Analytics (optional) ─────────────────────────────────────────────────────
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=

# ── Server port ───────────────────────────────────────────────────────────────
PORT=3000
```

> **Note on Manus OAuth:** The login/save-to-server features require a Manus OAuth application. If you do not register one, the app still works fully in **standalone mode** — all simulations run, and scenarios/configurations are saved to the browser's `localStorage` instead of the database.

---

## Hosting Platform Examples

### Railway / Render / Fly.io

1. Push this directory to a Git repository.
2. Create a new service pointing to that repo.
3. Set the **start command** to `node dist/index.js`.
4. Add all environment variables via the platform's secrets/env UI.
5. Provision a MySQL database add-on and set `DATABASE_URL`.

### VPS (Ubuntu/Debian)

```bash
# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# In the project directory
pnpm install --prod
cp .env.example .env   # edit .env with your values
pnpm db:push
NODE_ENV=production node dist/index.js
```

Use **PM2** or **systemd** to keep the process alive:

```bash
npm install -g pm2
pm2 start dist/index.js --name psyche-sim
pm2 save && pm2 startup
```

---

## Standalone Mode (No Database / No Auth)

The application is fully functional without a database or Manus OAuth credentials. In this mode:

- All simulations, sizing calculations, cost-benefit analyses, and optimization runs work normally.
- Saved configurations and scenarios are stored in the browser's `localStorage`.
- The Compare Configurations and Compare Scenarios pages read from `localStorage`.
- PDF and Excel exports work without any backend.

To run in standalone mode, simply omit `DATABASE_URL` and the OAuth variables from your `.env`.

---

## Architecture Overview

```
Browser (React 19 + Vite)
    │  tRPC over HTTP
    ▼
Express 4 server  (dist/index.js)
    ├── /api/trpc        ← tRPC router (simulation, sizing, cost-benefit, etc.)
    ├── /api/oauth/*     ← Manus OAuth callback
    └── /*               ← Serves dist/public (React SPA)
    │
    ▼
MySQL / TiDB  (optional)
```

---

## Support

For issues with the simulator itself, refer to the in-app **Help & Documentation** page.
For Manus OAuth setup, visit [https://manus.im](https://manus.im).
