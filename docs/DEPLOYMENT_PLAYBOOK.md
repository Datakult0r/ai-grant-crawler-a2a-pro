# AI Grant Crawler - Deployment Playbook

This playbook provides step-by-step instructions for deploying the AI Grant Crawler application to production.

## Overview

The AI Grant Crawler is a full-stack application with the following architecture:

- **Backend**: Node.js/Express API deployed to **Railway** (primary) or Fly.io (alternative)
- **Frontend**: SvelteKit application deployed to **Vercel**
- **Database**: **Supabase** (PostgreSQL with real-time capabilities)
- **AI**: **Google Gemini** API for proposal generation

## Prerequisites

Before starting, ensure you have accounts on:

1. **GitHub** - Repository access (https://github.com/Datakult0r/ai-grant-crawler-a2a-pro)
2. **Railway** - Backend hosting (https://railway.app)
3. **Supabase** - Database (https://supabase.com)
4. **Google AI Studio** - Gemini API key (https://aistudio.google.com)
5. **Vercel** - Frontend hosting (https://vercel.com)
6. **Fly.io** (optional) - Alternative backend hosting (https://fly.io)

---

## Step-by-Step Deployment

### Step 1: Configure Supabase

1. **Create a Supabase Project** (if not already done):
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Choose organization, name, password, and region
   - Wait for project to initialize

2. **Get Your Credentials**:
   - Go to Project Settings > API
   - Copy the following values:

   | Supabase UI Label | Environment Variable | Description |
   |-------------------|---------------------|-------------|
   | Project URL | `SUPABASE_URL` | Your project's API URL (e.g., `https://xxxxx.supabase.co`) |
   | anon public | `SUPABASE_ANON_KEY` | Public API key for client-side access |
   | service_role secret | `SUPABASE_SERVICE_ROLE_KEY` | Private key for server-side operations (keep secret!) |

3. **Apply Database Schema**:
   - Go to SQL Editor in Supabase Dashboard
   - Copy the contents of `backend/schema.sql`
   - Run the SQL to create all tables and RLS policies

4. **Seed Demo Data** (optional):
   - After backend is deployed, run: `npm run seed` from the backend directory

---

### Step 2: Create Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Select or create a Google Cloud project
4. Copy the generated API key
5. Save as `GEMINI_API_KEY`

**Note**: The Gemini API key is required for AI proposal generation (Fast Track and Research Track features).

---

### Step 3: Deploy Backend to Railway (Primary)

Railway uses the `backend/railway.json` configuration with Nixpacks builder.

1. **Create Railway Project**:
   - Go to https://railway.app/dashboard
   - Click "New Project" > "Deploy from GitHub repo"
   - Connect your GitHub account if not already connected
   - Select `Datakult0r/ai-grant-crawler-a2a-pro`

2. **Configure Root Directory**:
   - In project settings, set Root Directory to: `backend`

3. **Set Environment Variables**:
   - Go to Variables tab
   - Add the following:

   ```
   SUPABASE_URL=your-supabase-url-here
   SUPABASE_ANON_KEY=your-supabase-anon-key-here
   GEMINI_API_KEY=your-gemini-api-key-here
   PORT=3000
   NODE_ENV=production
   LOW_COST_MODE=true
   IS_DEMO=false
   ```

   Optional variables:
   ```
   OPENROUTER_API_KEY=your-openrouter-key-here
   FIRECRAWL_API_KEY=your-firecrawl-key-here
   RESEND_API_KEY=your-resend-key-here
   ```

4. **Deploy**:
   - Railway will automatically build and deploy using Nixpacks
   - Build command: `npm install` (automatic)
   - Start command: `npm start` (from railway.json)

5. **Get Backend URL**:
   - Go to Settings > Domains
   - Generate a Railway domain or add custom domain
   - Your backend URL will be: `https://your-app.up.railway.app`

6. **Verify Deployment**:
   ```bash
   curl https://your-app.up.railway.app/health
   curl https://your-app.up.railway.app/version
   curl https://your-app.up.railway.app/metrics
   ```

---

### Step 4: Deploy Backend to Fly.io (Alternative)

If using Fly.io instead of Railway:

1. **Install Fly CLI**:
   ```bash
   # macOS
   brew install flyctl
   
   # Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login and Create App**:
   ```bash
   fly auth login
   cd backend
   fly launch
   ```

3. **Generate FLY_API_TOKEN** (for CI/CD):
   - Go to https://fly.io/user/personal_access_tokens
   - Click "Create Token"
   - Name it (e.g., "ai-grant-crawler-deploy")
   - Copy the token

4. **Set Secrets**:
   ```bash
   fly secrets set SUPABASE_URL="your-supabase-url-here"
   fly secrets set SUPABASE_ANON_KEY="your-supabase-anon-key-here"
   fly secrets set GEMINI_API_KEY="your-gemini-api-key-here"
   fly secrets set LOW_COST_MODE="true"
   fly secrets set IS_DEMO="false"
   ```

5. **Deploy**:
   ```bash
   fly deploy
   ```

6. **Get Backend URL**:
   - Your URL will be: `https://your-app.fly.dev`

---

### Step 5: Deploy Frontend to Vercel

1. **Import Project**:
   - Go to https://vercel.com/new
   - Import `Datakult0r/ai-grant-crawler-a2a-pro`

2. **Configure Build Settings**:
   - Framework Preset: SvelteKit
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.svelte-kit`

3. **Set Environment Variables**:
   - Go to Project Settings > Environment Variables
   - Add:

   ```
   PUBLIC_API_URL=https://your-backend.up.railway.app/api
   PUBLIC_SUPABASE_URL=your-supabase-url-here
   PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   PUBLIC_IS_DEMO=false
   ```

   **Important**: `PUBLIC_API_URL` must point to your deployed backend URL with `/api` suffix.

4. **Deploy**:
   - Click Deploy
   - Vercel will build and deploy automatically

5. **Get Frontend URL**:
   - Your URL will be: `https://your-app.vercel.app`

---

## Environment Variables Reference

| Variable | Description | Where to Set | Required |
|----------|-------------|--------------|----------|
| `SUPABASE_URL` | Supabase project URL | Backend (Railway/Fly), Frontend (Vercel) | Yes |
| `SUPABASE_ANON_KEY` | Supabase public API key | Backend (Railway/Fly), Frontend (Vercel) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase private key | Backend only (for admin operations) | No |
| `GEMINI_API_KEY` | Google Gemini API key | Backend (Railway/Fly) | Yes |
| `PORT` | Server port | Backend (Railway/Fly) | Yes (3000) |
| `NODE_ENV` | Environment mode | Backend (Railway/Fly) | Yes (production) |
| `LOW_COST_MODE` | Use cheaper AI models | Backend (Railway/Fly) | No (default: true) |
| `IS_DEMO` | Enable demo mode | Backend (Railway/Fly), Frontend (Vercel) | No (default: false) |
| `PUBLIC_API_URL` | Backend API URL | Frontend (Vercel) | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key | Backend (Railway/Fly) | No |
| `FIRECRAWL_API_KEY` | Firecrawl scraping API | Backend (Railway/Fly) | No |
| `RESEND_API_KEY` | Resend email API | Backend (Railway/Fly) | No |
| `FLY_API_TOKEN` | Fly.io deploy token | GitHub Actions (if using Fly) | No |

---

## Post-Deployment Checklist

After deployment, verify the following:

1. **Backend Health**:
   - [ ] `/health` returns `{"status":"ok"}`
   - [ ] `/version` returns version info
   - [ ] `/metrics` returns uptime and memory stats

2. **Database Connection**:
   - [ ] `/api/grants` returns grant data
   - [ ] Seed script ran successfully (8 demo grants)

3. **Frontend**:
   - [ ] Discovery page loads grants
   - [ ] "Apply Now" opens proposal strategy modal
   - [ ] Login/signup pages work

4. **AI Features** (requires GEMINI_API_KEY):
   - [ ] Fast Track proposal generation works
   - [ ] Research Track SSE streaming works

---

## Troubleshooting

### Backend not starting
- Check Railway/Fly logs for errors
- Verify all required env vars are set
- Ensure `PORT` is set to 3000

### Frontend can't connect to backend
- Verify `PUBLIC_API_URL` is correct (include `/api` suffix)
- Check CORS settings in backend
- Ensure backend is running

### Database errors
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Ensure schema.sql has been applied
- Check RLS policies in Supabase

### AI features not working
- Verify `GEMINI_API_KEY` is set and valid
- Check backend logs for API errors
- Ensure `LOW_COST_MODE` is set appropriately

---

## Support

For issues or questions:
- Repository: https://github.com/Datakult0r/ai-grant-crawler-a2a-pro
- Documentation: See `docs/PRD.md` and `docs/DEPLOYMENT.md`
