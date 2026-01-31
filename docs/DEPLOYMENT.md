# AI Grant Crawler - Deployment Guide

This guide covers deploying the AI Grant Crawler application to production.

## Architecture Overview

The application consists of two main components:

1. **Frontend** (SvelteKit) - Deployed to Vercel (automatic via GitHub integration)
2. **Backend** (Node.js/Express) - Deployed to Fly.io (manual setup required)

## Prerequisites

- [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/) installed
- Fly.io account created
- Supabase project with database schema applied
- API keys for Gemini (required) and OpenRouter (optional)

## Frontend Deployment (Vercel)

The frontend is automatically deployed to Vercel when you push to GitHub. Each PR gets a preview deployment.

### Environment Variables (Vercel Dashboard)

Set these in your Vercel project settings:

```
PUBLIC_API_URL=https://your-backend.fly.dev/api
```

## Backend Deployment (Fly.io)

### 1. Install Fly CLI

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### 2. Login to Fly.io

```bash
fly auth login
```

### 3. Launch the Application

From the `backend/` directory:

```bash
cd backend
fly launch
```

When prompted:
- Choose a unique app name (e.g., `ai-grant-crawler-backend`)
- Select a region close to your users (e.g., `iad` for US East)
- Don't create a Postgres database (we use Supabase)
- Don't create a Redis instance

### 4. Set Environment Variables

```bash
# Required
fly secrets set SUPABASE_URL="https://your-project.supabase.co"
fly secrets set SUPABASE_ANON_KEY="your-anon-key"
fly secrets set GEMINI_API_KEY="your-gemini-key"

# Optional
fly secrets set OPENROUTER_API_KEY="your-openrouter-key"
fly secrets set LOW_COST_MODE="true"
fly secrets set AI_RESEARCHER_ENABLED="false"
```

### 5. Deploy

```bash
fly deploy
```

### 6. Verify Deployment

```bash
# Check status
fly status

# View logs
fly logs

# Test health endpoint
curl https://your-app.fly.dev/health
```

## Post-Deployment Configuration

### Update Frontend API URL

After deploying the backend, update the frontend's `PUBLIC_API_URL` in Vercel:

1. Go to Vercel Dashboard > Project Settings > Environment Variables
2. Set `PUBLIC_API_URL` to `https://your-backend.fly.dev/api`
3. Redeploy the frontend

### Database Setup

Run the schema migration on your Supabase project:

1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `backend/schema.sql`
3. Run the SQL

### Seed Demo Data (Optional)

```bash
# From the backend directory with .env configured
npm run seed
```

## Monitoring

### Fly.io Dashboard

Access your app's metrics and logs at: https://fly.io/apps/your-app-name

### Health Check

The backend exposes several monitoring endpoints:

**`/health`** - Basic health check
- Returns: `{ status: "ok", timestamp, environment }`

**`/version`** - Application version info
- Returns: `{ version, name, buildTime, nodeVersion, environment }`

**`/metrics`** - Runtime metrics
- Returns: `{ uptime, uptimeFormatted, requestCount, memory: { heapUsed, heapTotal, rss }, environment }`

Example:
```bash
curl https://your-app.fly.dev/health
curl https://your-app.fly.dev/version
curl https://your-app.fly.dev/metrics
```

## Troubleshooting

### Backend not starting

1. Check logs: `fly logs`
2. Verify environment variables: `fly secrets list`
3. Check health endpoint: `curl https://your-app.fly.dev/health`

### Frontend can't connect to backend

1. Verify `PUBLIC_API_URL` is set correctly in Vercel
2. Check CORS configuration in backend
3. Ensure backend is running: `fly status`

### Database connection issues

1. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
2. Check Supabase dashboard for connection limits
3. Ensure RLS policies are configured correctly

## Cost Estimates

### Fly.io (Backend)
- Free tier: 3 shared-cpu-1x VMs with 256MB RAM
- Estimated cost: $0-5/month for low traffic

### Vercel (Frontend)
- Free tier: Unlimited deployments for personal projects
- Estimated cost: $0/month for most use cases

### Supabase (Database)
- Free tier: 500MB database, 2GB bandwidth
- Estimated cost: $0-25/month depending on usage
