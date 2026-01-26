# AI Grant Crawler A2A Pro - PRD V2
## Product Requirements Document - Phase 2 Roadmap

**Version:** 2.0  
**Date:** January 24, 2026  
**Status:** Draft  
**Author:** Devin AI  

---

## Executive Summary

This PRD documents the comprehensive review of all work completed across 18 pull requests (#10-27) and outlines the next phase of development. The project has made significant progress with core features implemented, but several critical issues must be addressed before production deployment.

---

## 1. Current State Assessment

### 1.1 Completed Work Summary

| Phase | PRs | Features |
|-------|-----|----------|
| Sessions 1-9 | #10-18 | Repository cleanup, backend setup, low-cost mode, frontend pages, SSE hardening, seed script, toast notifications, data integration |
| Phase 2 | #19-23 | PRD + deployment config, kanban drag-and-drop, PDF/Word export, authentication, grant source management |
| Phase 3 | #24-26 | Email notifications, analytics dashboard, AI model configuration |
| Phase 4 | #27 | Marketing landing page |

**Total Lines of Code Added:** ~5,000+ lines across frontend and backend

### 1.2 What's Working Well

1. **CI/CD Pipeline:** All 18 PRs pass CI checks (6 passed, 0 failed each)
2. **Vercel Previews:** Frontend automatically deploys preview URLs for each PR
3. **Modern Frontend:** Svelte 5 with runes, responsive design, smooth animations
4. **Code Quality:** Good separation of concerns, consistent patterns
5. **Feature Coverage:** Core grant discovery, proposal generation, and tracking flows implemented

### 1.3 Critical Issues Identified

#### 1.3.1 In-Memory Storage (HIGH PRIORITY)

**Affected PRs:** #24 (Email Notifications), #26 (AI Model Settings)

Both features store data in JavaScript Maps that reset on server restart:

```javascript
// PR #24 - notificationScheduler.js
const subscribers = new Map();

// PR #26 - settings.js
let currentSettings = { preset: 'low-cost', ... };
```

**Impact:** All email subscribers and AI model configurations are lost on every deployment or server restart.

**Required Fix:** Migrate to Supabase tables for persistent storage.

#### 1.3.2 Unprotected API Endpoints (HIGH PRIORITY)

**Affected PRs:** #24, #25, #26

| Endpoint | Risk |
|----------|------|
| `/api/notifications/admin/*` | Exposes subscriber list, allows manual trigger of mass emails |
| `/api/analytics/*` | Exposes business metrics to public |
| `/api/settings/*` | Allows unauthorized changes to AI model configuration (cost implications) |

**Required Fix:** Add authentication middleware to sensitive routes.

#### 1.3.3 Email Compliance (MEDIUM PRIORITY)

**Affected PR:** #24

Email templates lack unsubscribe links, which may violate:
- CAN-SPAM Act (US)
- GDPR (EU)
- CASL (Canada)

**Required Fix:** Add one-click unsubscribe links to all email templates.

#### 1.3.4 Landing Page Issues (MEDIUM PRIORITY)

**Affected PR:** #27

| Issue | Risk |
|-------|------|
| Fictional testimonials (Dr. Sarah Chen, Prof. Marcus Weber, Dr. Elena Rodriguez) | Legal/reputation risk |
| Unverified claims ("500+ research institutions", "95% accuracy") | False advertising |
| Dead footer links (/docs, /api, /about, /blog, /careers, /contact, /privacy, /terms, /security) | Poor UX |
| Watch Demo button not implemented | Broken functionality |
| No mobile hamburger menu | Poor mobile UX |

#### 1.3.5 Integration Gap (MEDIUM PRIORITY)

**Affected PR:** #26

AI model settings are stored but NOT consumed by the research pipeline. Changing presets in the UI has no effect on which models are actually used during proposal generation.

**Required Fix:** Connect settings API to `researchService.js` and `agent_models.py`.

### 1.4 Missing Features from Original PRD

| Feature | Status | Notes |
|---------|--------|-------|
| Phase 3.3: Collaboration Features | Not Started | Real-time editing, comments, version history |
| Phase 4.2: Documentation | Not Started | API docs, user guide |
| Demo Video | Not Started | For landing page |

---

## 2. Phase 2 Roadmap

### Phase 2.1: Production Readiness (Critical - Week 1-2)

#### 2.1.1 Migrate In-Memory Storage to Supabase

**Priority:** P0 (Blocker)  
**Estimated Time:** 4-6 hours

**Tasks:**
1. Create `notification_subscribers` table in Supabase
   ```sql
   CREATE TABLE notification_subscribers (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT UNIQUE NOT NULL,
     preferences JSONB DEFAULT '{"deadlines": true, "newGrants": true, "weeklyDigest": true}',
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. Create `user_settings` table in Supabase
   ```sql
   CREATE TABLE user_settings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id),
     preset TEXT DEFAULT 'low-cost',
     custom_models JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. Update `notificationScheduler.js` to use Supabase
4. Update `settings.js` to use Supabase
5. Add migration script for existing data

**Success Criteria:** Data persists across server restarts

#### 2.1.2 Secure Sensitive API Endpoints

**Priority:** P0 (Blocker)  
**Estimated Time:** 3-4 hours

**Tasks:**
1. Create `requireAuth` middleware that validates Supabase JWT
2. Create `requireAdmin` middleware for admin-only routes
3. Apply middleware to:
   - `/api/notifications/admin/*` (requireAdmin)
   - `/api/analytics/*` (requireAuth)
   - `/api/settings/*` (requireAuth)
4. Add proper error responses for unauthorized access

**Success Criteria:** Unauthenticated requests return 401, non-admin requests to admin routes return 403

#### 2.1.3 Email Compliance

**Priority:** P1 (High)  
**Estimated Time:** 2-3 hours

**Tasks:**
1. Add unsubscribe link to all email templates
2. Create `/api/notifications/unsubscribe/:token` endpoint with one-click unsubscribe
3. Generate unique unsubscribe tokens per subscriber
4. Add "Manage Preferences" link to email footer
5. Include physical mailing address in footer (CAN-SPAM requirement)

**Success Criteria:** All emails contain working unsubscribe link

#### 2.1.4 Fix Landing Page Issues

**Priority:** P1 (High)  
**Estimated Time:** 4-5 hours

**Tasks:**
1. Replace fictional testimonials with:
   - Option A: Real testimonials (requires outreach)
   - Option B: Remove testimonials section temporarily
   - Option C: Use generic "What Users Say" with anonymized quotes
2. Update marketing claims to be verifiable or add disclaimers
3. Create placeholder pages for footer links OR remove dead links
4. Implement Watch Demo modal with embedded video or redirect
5. Add mobile hamburger menu with slide-out navigation

**Success Criteria:** No legal/compliance risks, all links functional

### Phase 2.2: Integration & Testing (Week 2-3)

#### 2.2.1 Connect AI Model Settings to Research Pipeline

**Priority:** P1 (High)  
**Estimated Time:** 4-6 hours

**Tasks:**
1. Create API endpoint to fetch current settings from backend
2. Modify `researchService.js` to read settings before spawning Python process
3. Pass selected models as environment variables to `agent_models.py`
4. Update `agent_models.py` to read model config from environment
5. Add logging to verify correct models are being used

**Success Criteria:** Changing preset in UI affects which models are used in research

#### 2.2.2 End-to-End Testing

**Priority:** P1 (High)  
**Estimated Time:** 6-8 hours

**Tasks:**
1. Test complete user journey:
   - Sign up → Login → View grants → Start research → View proposal → Export
2. Test email notification flows:
   - Subscribe → Receive deadline alert → Unsubscribe
3. Test analytics accuracy:
   - Verify counts match database
4. Test settings persistence:
   - Change preset → Restart server → Verify preset persists
5. Document any bugs found

**Success Criteria:** All critical paths work without errors

#### 2.2.3 Performance Testing

**Priority:** P2 (Medium)  
**Estimated Time:** 3-4 hours

**Tasks:**
1. Seed database with 1000+ grants
2. Test analytics endpoint response times
3. Test grant list pagination
4. Identify and optimize slow queries
5. Add database indexes if needed

**Success Criteria:** All endpoints respond in <500ms with production-scale data

### Phase 2.3: Remaining Features (Week 3-4)

#### 2.3.1 Documentation

**Priority:** P2 (Medium)  
**Estimated Time:** 6-8 hours

**Tasks:**
1. Create `/docs` page with:
   - Getting Started guide
   - Feature overview
   - FAQ
2. Create `/api` page with:
   - API reference (auto-generated from OpenAPI spec)
   - Authentication guide
   - Rate limits
3. Create developer setup guide in README

**Success Criteria:** New users can onboard without external help

#### 2.3.2 Demo Video

**Priority:** P2 (Medium)  
**Estimated Time:** 2-3 hours

**Tasks:**
1. Record screen capture of key flows:
   - Grant discovery
   - Proposal generation (fast track)
   - Export to PDF
2. Add voiceover or captions
3. Upload to hosting (YouTube/Vimeo)
4. Embed in landing page

**Success Criteria:** Demo video plays on landing page

#### 2.3.3 Collaboration Features (Optional)

**Priority:** P3 (Low)  
**Estimated Time:** 20-30 hours

**Note:** This is a complex feature that may be deferred to a future release.

**Tasks:**
1. Real-time collaborative editing (requires WebSocket infrastructure)
2. Comments on proposals
3. Version history
4. Approval workflows
5. Activity feed

**Success Criteria:** Multiple users can collaborate on same proposal

### Phase 2.4: Deployment & Launch (Week 4)

#### 2.4.1 Merge PRs

**Priority:** P0 (Blocker)  
**Estimated Time:** 2-3 hours

**Merge Order:**
1. PR #10 (Repository cleanup) → main
2. PRs #11-18 (Sessions 2-9) → main (sequential)
3. PR #19 (PRD + deployment) → main
4. PRs #20-27 (Phase 2-4 features) → main (after rebasing on updated main)

**Tasks:**
1. Review each PR for merge conflicts
2. Resolve any conflicts
3. Merge in order
4. Verify Vercel production deployment after each merge

#### 2.4.2 Deploy Backend to Fly.io

**Priority:** P0 (Blocker)  
**Estimated Time:** 2-3 hours

**Tasks:**
1. Verify fly.toml health check syntax
2. Run `fly launch` to create app
3. Set secrets:
   ```bash
   fly secrets set SUPABASE_URL=... SUPABASE_ANON_KEY=... GEMINI_API_KEY=... RESEND_API_KEY=...
   ```
4. Run `fly deploy`
5. Verify health check passes
6. Update frontend `PUBLIC_API_URL` to Fly.io URL

**Success Criteria:** Backend accessible at `https://ai-grant-crawler-api.fly.dev`

#### 2.4.3 Production Environment Configuration

**Priority:** P0 (Blocker)  
**Estimated Time:** 1-2 hours

**Tasks:**
1. Set production environment variables in Vercel
2. Configure custom domain (if available)
3. Set up monitoring/alerting (Fly.io metrics, Vercel analytics)
4. Configure rate limiting for production

**Success Criteria:** Production environment fully configured

---

## 3. Success Metrics

### 3.1 Technical Metrics

| Metric | Target |
|--------|--------|
| API Response Time (p95) | <500ms |
| Frontend Load Time | <3s |
| Uptime | 99.9% |
| CI Pass Rate | 100% |

### 3.2 Product Metrics

| Metric | Target (Month 1) |
|--------|------------------|
| User Signups | 100 |
| Grants Discovered | 500 |
| Proposals Generated | 50 |
| Email Subscribers | 200 |

---

## 4. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss from in-memory storage | High | Critical | Migrate to Supabase (Phase 2.1.1) |
| Security breach via unprotected endpoints | Medium | Critical | Add authentication (Phase 2.1.2) |
| Legal issues from fake testimonials | Medium | High | Remove/replace testimonials (Phase 2.1.4) |
| AI model costs exceed budget | Low | Medium | Default to low-cost mode, add cost alerts |
| Fly.io deployment fails | Low | High | Have backup deployment plan (Railway, Render) |

---

## 5. Timeline Summary

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| Week 1 | Production Readiness | Supabase migration, endpoint security |
| Week 2 | Production Readiness + Testing | Email compliance, landing page fixes, E2E testing |
| Week 3 | Remaining Features | Documentation, demo video |
| Week 4 | Deployment | Merge PRs, deploy to Fly.io, launch |

---

## 6. Appendix

### 6.1 PR Reference

| PR | Title | Status | Preview URL |
|----|-------|--------|-------------|
| #10 | Repository cleanup | Open | [Preview](https://ai-grant-crawler-a2a-pro-git-devin-176844-e22774-co-ai-118c92ff.vercel.app) |
| #11-18 | Sessions 2-9 | Open | Various |
| #19 | PRD + Deployment | Open | [Preview](https://ai-grant-crawler-a2a-pro-git-devin-176893-70cc7a-co-ai-118c92ff.vercel.app) |
| #20-23 | Phase 2 Features | Open | Various |
| #24 | Email Notifications | Open | [Preview](https://ai-grant-crawler-a2a-pro-git-devin-176894-4c5b06-co-ai-118c92ff.vercel.app) |
| #25 | Analytics Dashboard | Open | [Preview](https://ai-grant-crawler-a2a-pro-git-devin-176894-ceb9d5-co-ai-118c92ff.vercel.app) |
| #26 | AI Model Settings | Open | [Preview](https://ai-grant-crawler-a2a-pro-git-devin-176929-00e6f1-co-ai-118c92ff.vercel.app) |
| #27 | Landing Page | Open | [Preview](https://ai-grant-crawler-a2a-pro-git-devin-176929-56d01a-co-ai-118c92ff.vercel.app) |

### 6.2 New Database Tables Required

```sql
-- Notification subscribers (replaces in-memory Map)
CREATE TABLE notification_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  unsubscribe_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  preferences JSONB DEFAULT '{"deadlines": true, "newGrants": true, "weeklyDigest": true}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings (replaces in-memory object)
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preset TEXT DEFAULT 'low-cost' CHECK (preset IN ('low-cost', 'balanced', 'premium', 'custom')),
  custom_models JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notification_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 6.3 Environment Variables Checklist

**Backend (Fly.io):**
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
- [ ] `GEMINI_API_KEY`
- [ ] `OPENROUTER_API_KEY` (optional, for premium models)
- [ ] `RESEND_API_KEY`
- [ ] `FROM_EMAIL`
- [ ] `FRONTEND_URL`
- [ ] `NODE_ENV=production`

**Frontend (Vercel):**
- [ ] `PUBLIC_API_URL` (Fly.io backend URL)
- [ ] `PUBLIC_SUPABASE_URL`
- [ ] `PUBLIC_SUPABASE_ANON_KEY`

---

## 7. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |

---

*Document generated by Devin AI - https://app.devin.ai/sessions/9573820f0f6d41dab1cff8a61c26c981*
