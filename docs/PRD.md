# AI Grant Crawler A2A Pro - Product Requirements Document

**Version**: 1.0  
**Date**: January 2026  
**Status**: Active Development

---

## 1. Executive Summary

AI Grant Crawler A2A Pro is a production-ready autonomous grant discovery and proposal generation system. It combines MCP scrapers, multi-model AI agents, and real-time visualization to automate the entire grant application workflow from discovery to proposal submission.

**Target Users**: Startups, research institutions, and organizations seeking grant funding

**Value Proposition**: Reduce grant application time from weeks to hours while improving proposal quality through AI-powered research and writing

---

## 2. Current State Assessment

### 2.1 Completed Features (Sessions 0-9)

| Feature | Status | PR |
|---------|--------|-----|
| Repository cleanup (node_modules, merge conflicts) | Complete | #10 |
| Backend environment verification | Complete | #11 |
| Low-cost mode (Gemini-only) | Complete | #12 |
| Discovery page with real data | Complete | #13 |
| Alerts page with real data | Complete | #14 |
| SSE research stream hardening | Complete | #15 |
| Database seed & demo mode | Complete | #16 |
| Toast notifications | Complete | #17 |
| Remaining pages data integration | Complete | #18 |

### 2.2 Technical Stack

- **Backend**: Node.js/Express (port 3000), Supabase (PostgreSQL)
- **Frontend**: SvelteKit 2 + Svelte 5 (port 5173), Tailwind CSS 4
- **AI Research**: Python Agent Laboratory with multi-provider inference
- **Scraping**: Firecrawl for grant discovery

### 2.3 Known Issues

- [x] Merge conflict in README.md (fixed)
- [x] PRs #10-33 merged to main
- [ ] Production deployment pending (backend to Fly.io, frontend to Vercel)
- [ ] Team page uses demo data (needs auth integration for real users)
- [ ] Automated tests not yet implemented (no test framework configured)

---

## 3. Implementation Roadmap

### Phase 1: Consolidation & Deployment (Priority: HIGH)

#### 1.1 Merge Open PRs
**Effort**: 30 minutes  
**Description**: Review and merge PRs #10-18 to consolidate all session work into main branch.

**Tasks**:
- [ ] Review PR #10 (repository cleanup)
- [ ] Review PR #11 (backend environment)
- [ ] Review PR #12 (low-cost mode)
- [ ] Review PR #13 (discovery page)
- [ ] Review PR #14 (alerts page)
- [ ] Review PR #15 (SSE hardening)
- [ ] Review PR #16 (seed & demo mode)
- [ ] Review PR #17 (toast notifications)
- [ ] Review PR #18 (pages data integration)
- [ ] Resolve any merge conflicts
- [ ] Verify main branch builds successfully

#### 1.2 Production Deployment
**Effort**: 2-3 hours  
**Description**: Deploy the application to production environment for stakeholder testing.

**Tasks**:
- [ ] Configure Vercel for frontend deployment
- [ ] Configure Fly.io for backend deployment (or Railway)
- [ ] Set up production environment variables
- [ ] Configure CORS for production domains
- [ ] Run database migrations on production Supabase
- [ ] Seed production database with demo data
- [ ] Verify end-to-end flow in production
- [ ] Set up custom domain (optional)

#### 1.3 End-to-End Testing
**Effort**: 1-2 hours  
**Description**: Verify complete user journey works in production.

**Test Scenarios**:
- [ ] Discovery: Grants load on homepage with correct stats
- [ ] Alerts: Deadline-based alerts display correctly
- [ ] Tracker: Kanban board shows proposals by status
- [ ] Predictor: Win probability displays with factors
- [ ] Documents: Proposals list and download works
- [ ] Team: Activity feed displays correctly
- [ ] Fast Track: Gemini generates proposal in ~30s
- [ ] Research Track: SSE streams 7 phases correctly

---

### Phase 2: Core Feature Enhancements (Priority: MEDIUM)

#### 2.1 Authentication & User Management
**Effort**: 4-6 hours  
**Description**: Implement user authentication to enable multi-tenant usage.

**Tasks**:
- [x] Integrate Supabase Auth (auth store, middleware implemented)
- [x] Add login/signup pages (functional with Supabase)
- [x] Protect API routes with auth middleware (authMiddleware, optionalAuthMiddleware)
- [ ] Connect Team page to real user data (currently uses demo data)
- [ ] Add user profile settings
- [ ] Implement role-based access (admin, user)

#### 2.2 Grant Source Management
**Effort**: 3-4 hours  
**Description**: Allow users to configure and manage grant sources.

**Tasks**:
- [x] Create admin UI for grant sources (/admin/sources page with AdminGrantSources component)
- [x] Implement source enable/disable toggle (PATCH /api/admin/sources/:id)
- [x] Add custom source URL input (POST /api/admin/sources)
- [x] Configure scraping frequency per source (hourly/daily/weekly/monthly)
- [x] Add source health monitoring (GET /api/admin/sources/stats)

#### 2.3 Proposal Export & Formatting
**Effort**: 2-3 hours  
**Description**: Enable exporting proposals in multiple formats.

**Tasks**:
- [x] PDF export with professional formatting (pdfkit integration)
- [x] Word document export (.docx) (docx library integration)
- [ ] LaTeX export for academic submissions
- [ ] Custom template support
- [ ] Include charts and visualizations

#### 2.4 Tracker Kanban Improvements
**Effort**: 2-3 hours  
**Description**: Make the tracker kanban board fully interactive.

**Tasks**:
- [x] Implement drag-and-drop between columns (with optimistic UI updates)
- [ ] Add inline editing for proposal details
- [ ] Add deadline reminders
- [ ] Implement filtering and search
- [ ] Add bulk actions (archive, delete)

---

### Phase 3: Advanced Features (Priority: LOW)

#### 3.1 Email Notifications
**Effort**: 3-4 hours  
**Description**: Send email alerts for important events.

**Tasks**:
- [ ] Integrate email service (Resend, SendGrid)
- [ ] Deadline approaching notifications (7, 3, 1 day)
- [ ] Proposal status change notifications
- [ ] New high-relevance grant alerts
- [ ] Weekly digest summary

#### 3.2 Analytics Dashboard
**Effort**: 4-5 hours  
**Description**: Provide insights into grant application performance.

**Tasks**:
- [ ] Success rate by grant source
- [ ] Average proposal generation time
- [ ] Cost tracking per proposal
- [ ] Relevance score distribution
- [ ] Historical trends visualization

#### 3.3 Collaboration Features
**Effort**: 5-6 hours  
**Description**: Enable team collaboration on proposals.

**Tasks**:
- [ ] Real-time collaborative editing
- [ ] Comments and annotations
- [ ] Version history
- [ ] Approval workflows
- [ ] Team activity feed

#### 3.4 AI Model Configuration
**Effort**: 2-3 hours  
**Description**: Allow users to customize AI model selection.

**Tasks**:
- [ ] Model selection UI per agent role
- [ ] Cost estimation before generation
- [ ] Quality vs speed presets
- [ ] Custom prompt templates
- [ ] A/B testing for model performance

---

### Phase 4: Marketing & Growth (Priority: MEDIUM)

#### 4.1 Landing Page
**Effort**: 4-6 hours  
**Description**: Create a compelling marketing landing page.

**Tasks**:
- [ ] Hero section with value proposition
- [ ] Feature showcase with animations
- [ ] Pricing tiers display
- [ ] Customer testimonials
- [ ] Demo video/GIF
- [ ] CTA for signup/waitlist

#### 4.2 Documentation
**Effort**: 2-3 hours  
**Description**: Create comprehensive user and developer documentation.

**Tasks**:
- [ ] User guide with screenshots
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Developer setup guide
- [ ] Troubleshooting FAQ
- [ ] Video tutorials

---

## 4. Technical Requirements

### 4.1 Performance Targets

| Metric | Target |
|--------|--------|
| Page load time | < 2 seconds |
| Fast Track proposal | < 45 seconds |
| Research Track proposal | < 20 minutes |
| API response time | < 500ms |
| Uptime | 99.5% |

### 4.2 Security Requirements

- [ ] HTTPS everywhere
- [ ] API rate limiting
- [ ] Input validation and sanitization
- [ ] Secure credential storage
- [ ] CORS configuration
- [ ] SQL injection prevention (Supabase handles)

### 4.3 Monitoring & Logging

- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] API usage analytics
- [ ] Cost tracking per AI call
- [ ] Uptime monitoring

---

## 5. Success Metrics

### 5.1 Product Metrics

| Metric | Target |
|--------|--------|
| Proposals generated per week | 50+ |
| Average relevance score | > 70 |
| User retention (30-day) | > 60% |
| Proposal completion rate | > 80% |

### 5.2 Business Metrics

| Metric | Target |
|--------|--------|
| Monthly active users | 100+ |
| Conversion rate (free to paid) | > 5% |
| Customer satisfaction (NPS) | > 40 |
| Cost per proposal | < $10 |

---

## 6. Implementation Schedule

### Week 1: Consolidation
- Day 1-2: Merge PRs, fix conflicts
- Day 3-4: Production deployment
- Day 5: End-to-end testing

### Week 2: Core Enhancements
- Day 1-2: Authentication
- Day 3-4: Proposal export
- Day 5: Tracker improvements

### Week 3: Advanced Features
- Day 1-2: Email notifications
- Day 3-4: Analytics dashboard
- Day 5: Documentation

### Week 4: Marketing
- Day 1-3: Landing page
- Day 4-5: Launch preparation

---

## 7. Appendix

### 7.1 API Endpoints

See `backend/docs/api-schemas.md` for complete API documentation.

### 7.2 Database Schema

See `backend/schema.sql` for complete database schema.

### 7.3 Environment Variables

See `backend/.env.example` and `frontend/.env.example` for required configuration.
