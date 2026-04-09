# 16 Psyche Power System Simulator — Deployment Guide

**Version:** 1.0 | **Date:** March 2026  
**Stack:** React 19 + TypeScript + Express 4 + tRPC 11 + Drizzle ORM + MySQL

---

## Overview

This guide covers everything required to deploy the 16 Psyche Power System Simulator on your own infrastructure. The application is a full-stack Node.js web application with a React frontend, Express backend, and MySQL database. It uses tRPC for type-safe API communication and Drizzle ORM for database access.

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 20.x LTS | 22.x LTS |
| pnpm | 9.x | 9.x |
| MySQL | 8.0 | 8.0+ or TiDB |
| RAM | 512 MB | 1 GB |
| Disk | 500 MB | 2 GB |
| CPU | 1 vCPU | 2 vCPU |

---

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see **Environment Variables** section below).

### 3. Initialize the Database

```bash
# Push schema to your MySQL database
pnpm db:push
```

### 4. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

---

## Environment Variables

Create a `.env` file in the project root with the following variables. All variables marked **Required** must be set for the application to function.

### Database

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | **Required** | MySQL connection string | `mysql://user:pass@host:3306/dbname` |

### Authentication (Manus OAuth)

The application uses Manus OAuth for user authentication. If you are deploying outside the Manus platform, you will need to either configure your own OAuth provider or disable authentication.

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | **Required** | Secret key for signing session cookies (min 32 chars) |
| `VITE_APP_ID` | Required for OAuth | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Required for OAuth | Manus OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Required for OAuth | Manus login portal URL |
| `OWNER_OPEN_ID` | Optional | Owner's Manus OpenID (grants admin role) |
| `OWNER_NAME` | Optional | Owner's display name |

### Application Branding

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `VITE_APP_TITLE` | Optional | Application title shown in UI | `16 Psyche Power System Simulator` |
| `VITE_APP_LOGO` | Optional | URL to logo image | Built-in logo |

### AI / LLM Features

The application includes an AI assistant powered by a language model. These are only required if you use the AI features.

| Variable | Required | Description |
|----------|----------|-------------|
| `BUILT_IN_FORGE_API_URL` | For AI features | LLM API base URL |
| `BUILT_IN_FORGE_API_KEY` | For AI features | LLM API bearer token (server-side) |
| `VITE_FRONTEND_FORGE_API_KEY` | For AI features | LLM API bearer token (client-side) |
| `VITE_FRONTEND_FORGE_API_URL` | For AI features | LLM API URL for frontend |

### File Storage (S3)

The application uses S3-compatible storage for file uploads. Required if you use export/download features with custom files.

| Variable | Required | Description |
|----------|----------|-------------|
| `S3_BUCKET` | For file storage | S3 bucket name |
| `S3_REGION` | For file storage | AWS region (e.g., `us-east-1`) |
| `S3_ACCESS_KEY_ID` | For file storage | AWS access key ID |
| `S3_SECRET_ACCESS_KEY` | For file storage | AWS secret access key |
| `S3_ENDPOINT` | Optional | Custom S3 endpoint for non-AWS providers |

### Analytics (Optional)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_ANALYTICS_ENDPOINT` | Optional | Analytics collection endpoint |
| `VITE_ANALYTICS_WEBSITE_ID` | Optional | Analytics website identifier |

---

## Example `.env` File

```env
# Database
DATABASE_URL=mysql://psyche_user:your_password@localhost:3306/psyche_db

# Authentication
JWT_SECRET=your-very-long-random-secret-key-at-least-32-characters

# Application (optional customization)
VITE_APP_TITLE=16 Psyche Power System Simulator

# AI Features (optional - comment out to disable)
# BUILT_IN_FORGE_API_URL=https://api.openai.com/v1
# BUILT_IN_FORGE_API_KEY=sk-...
# VITE_FRONTEND_FORGE_API_KEY=sk-...
# VITE_FRONTEND_FORGE_API_URL=https://api.openai.com/v1

# File Storage (optional - comment out to disable)
# S3_BUCKET=your-bucket-name
# S3_REGION=us-east-1
# S3_ACCESS_KEY_ID=AKIA...
# S3_SECRET_ACCESS_KEY=...
```

---

## Production Build

### Build the Application

```bash
# Build frontend (Vite) and backend (esbuild)
pnpm build
```

This produces:
- `dist/` — compiled server bundle (`index.js`)
- `client/dist/` — compiled frontend assets (served statically by Express)

### Start Production Server

```bash
pnpm start
```

The server binds to the port specified by the `PORT` environment variable (defaults to `3000`).

---

## Deployment Options

### Option A: Railway

Railway is the simplest deployment option with built-in MySQL support.

1. Create a new Railway project and connect your GitHub repository.
2. Add a MySQL plugin from the Railway dashboard.
3. Set environment variables in Railway's Variables panel (copy from `.env.example`).
4. Railway will automatically detect the `pnpm build` and `pnpm start` scripts.
5. Run `pnpm db:push` once via Railway's shell to initialize the database schema.

### Option B: Render

1. Create a new Web Service on Render pointing to your repository.
2. Set **Build Command** to `pnpm install && pnpm build`.
3. Set **Start Command** to `pnpm start`.
4. Add a PostgreSQL or MySQL database from Render's dashboard and copy the connection string to `DATABASE_URL`.
5. Set all required environment variables in Render's Environment panel.

### Option C: VPS / Bare Metal (Ubuntu)

```bash
# Install Node.js 22 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22 && nvm use 22

# Install pnpm
npm install -g pnpm

# Clone or copy project files
cd /opt/psyche-simulator

# Install dependencies
pnpm install

# Set environment variables (edit as needed)
cp .env.example .env && nano .env

# Initialize database
pnpm db:push

# Build for production
pnpm build

# Start with PM2 for process management
npm install -g pm2
pm2 start "pnpm start" --name psyche-simulator
pm2 save && pm2 startup
```

### Option D: Docker

A `Dockerfile` is included in the project root. Build and run:

```bash
# Build image
docker build -t psyche-simulator .

# Run container
docker run -d \
  --name psyche-simulator \
  -p 3000:3000 \
  --env-file .env \
  psyche-simulator
```

For Docker Compose with MySQL:

```bash
docker-compose up -d
```

---

## Database Setup

The application uses Drizzle ORM with MySQL. The schema is defined in `drizzle/schema.ts`.

### Initialize Schema

```bash
# Generate migration files and apply to database
pnpm db:push
```

### Key Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts (Manus OAuth integration) |
| `sizingScenarios` | Saved simulation configurations |
| `simulationResults` | Cached simulation output data |

---

## Authentication Notes

The default authentication uses **Manus OAuth**. If you are deploying independently without Manus platform access, you have two options:

**Option 1 — Disable authentication:** Remove `protectedProcedure` guards from `server/routers.ts` and make all procedures public. This allows unauthenticated access to all features.

**Option 2 — Replace OAuth provider:** Modify `server/_core/oauth.ts` to integrate your own OAuth provider (Google, GitHub, etc.) following the same callback pattern.

The simulation engine itself (`server/simulationEngine.ts`) has no authentication dependency and can be used standalone.

---

## Disabling Optional Features

If you do not have access to certain external services, you can disable features by commenting out the relevant environment variables:

| Feature | Variables to Remove | Impact |
|---------|-------------------|--------|
| AI Assistant | `BUILT_IN_FORGE_*`, `VITE_FRONTEND_FORGE_*` | AI chat disabled |
| File Storage | `S3_*` | Custom file uploads disabled |
| Analytics | `VITE_ANALYTICS_*` | Usage tracking disabled |
| OAuth Login | `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` | Login disabled |

The core simulation engine, all 6 presets, comparison tools, and export features (PDF/Excel) work entirely client-side and require no external services.

---

## Reverse Proxy (Nginx)

For production deployments, place Nginx in front of the Node.js server:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable HTTPS with Certbot:

```bash
sudo certbot --nginx -d your-domain.com
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `DATABASE_URL` connection error | Wrong credentials or host | Verify MySQL is running and credentials are correct |
| Blank page after build | Missing `VITE_*` variables | Ensure all `VITE_` prefixed variables are set before build |
| 401 on all API calls | `JWT_SECRET` mismatch | Use the same `JWT_SECRET` across all instances |
| Simulation returns 0W | PV area or concentrator area is 0 | Both `pvArea` and `concentratorArea` must be > 0 |
| `pnpm db:push` fails | Database not reachable | Check `DATABASE_URL` format: `mysql://user:pass@host:port/db` |

---

## Support & Resources

- **Technical Report:** `TECHNICAL_REPORT.md` — full system architecture and methodology
- **Reference Card:** `16_Psyche_Reference_Card.pdf` — quick-reference for parameters and equations
- **Test Suite:** `pnpm test` — 114 unit tests covering simulation engine and data validation
- **NASA Psyche Mission:** https://science.nasa.gov/mission/psyche/
- **ASU Psyche Team:** https://psyche.asu.edu/

---

*Arizona State University | Ira A. Fulton Schools of Engineering*  
*NASA | 16 Psyche Mission*
