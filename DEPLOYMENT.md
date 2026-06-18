# CoupleSync Deployment Guide

## Architecture
- **Single server**: Express.js on port **3000** serves both the API and the compiled frontend
- **Frontend**: Built with Vite, output to `dist/`, served as static files by Express
- **Backend**: Express API routes under `/api/*`
- **Database**: SQLite file stored in `server/data/couplesync.db`

## Prerequisites
1. **GitHub repo connected** (owner action in team settings)
2. **Node.js 20+** on the host
3. **Environment variables** configured

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `3000`) |
| `HOST` | No | Bind address (default: `0.0.0.0`) |
| `JWT_SECRET` | No | Legacy JWT secret (default: dev fallback) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes* | Clerk publishable key for frontend auth |
| `CLERK_SECRET_KEY` | No | Clerk secret key for backend JWT verification |
| `STRIPE_SECRET_KEY` | No* | Stripe API secret key for payments |
| `STRIPE_PRICE_ID` | No* | Stripe price ID for $4.99/mo subscription |
| `STRIPE_WEBHOOK_SECRET` | No* | Stripe webhook signing secret |

*Required when the corresponding feature is enabled.

## Deployment Steps

### 1. Build the frontend
```bash
cd /workspace/couplesync
npm install
npx vite build
```

### 2. Install backend dependencies
```bash
cd /workspace/couplesync/server
npm install
```

### 3. Start the server
```bash
cd /workspace/couplesync/server
npx tsx src/index.ts
```

The app is now live at `http://0.0.0.0:3000`.

## Recommended Hosting Platforms

### Railway (Recommended)
1. Push code to GitHub repo
2. Create a new Railway project from the repo
3. **Root Directory**: leave **blank** (not `server/`)
4. **Build Command**: `npm install && npx vite build && cd server && npm install`
5. **Start Command**: `cd server && npx tsx src/index.ts`
6. Add environment variables in Railway dashboard
7. Railway auto-provisions a public URL

### Render
1. Push code to GitHub repo
2. Create a "Web Service" from the repo
3. Root directory: leave as root
4. Build command: `npm install && npx vite build && cd server && npm install`
5. Start command: `cd server && npx tsx src/index.ts`
6. Add environment variables in Render dashboard

## First-Time Setup
1. Visit the deployed URL
2. Sign up via Clerk (creates account)
3. Go to Dashboard → "Create Couple" to generate a couple code
4. Partner signs up and enters the couple code to connect

## Database
- SQLite database is auto-created at `server/data/couplesync.db` on first run
- All tables are auto-initialized
- For production, consider adding periodic backups of the `.db` file

## Health Check
The `/api/health` endpoint returns:
```json
{ "status": "ok", "timestamp": "2026-06-18T..." }
```