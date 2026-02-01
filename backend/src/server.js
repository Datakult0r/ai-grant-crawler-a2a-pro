import { env } from "./config/env.js"; // Validation runs on import
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import grantsRouter from "./routes/grants.js";
import crawlerRouter from "./routes/crawler.js";
import matcherRouter from "./routes/matcher.js";
import thinktankRouter from "./routes/thinktank.js";
import proposalRouter from "./routes/proposal.js";
import researchRouter from "./routes/research.js";
import julesRouter from "./routes/jules.js";
import alertsRouter from "./routes/alerts.js";
import trackerRouter from "./routes/tracker.js";
import predictorRouter from "./routes/predictor.js";
import documentsRouter from "./routes/documents.js";
import teamRouter from "./routes/team.js";
import searchRouter from "./routes/search.js";
import realtimeSearchRouter from "./routes/realtime-search.js";
// Phase 1: Grant Discovery Routes & Jobs
import adminSourcesRouter from "./routes/admin/sources.js";
import { ScheduledDiscoveryJob } from "./jobs/scheduledDiscovery.js";
import { startCronJobs } from "./jobs/cronScraper.js";
// Phase 3: Email Notifications
import notificationsRouter from "./routes/notifications.js";
import { initializeScheduler } from "./services/notificationScheduler.js";
// Phase 3: Analytics Dashboard
import analyticsRouter from "./routes/analytics.js";
// Phase 3: AI Model Configuration
import settingsRouter from "./routes/settings.js";

const app = express();
const PORT = env.port;

// Security Middleware
app.use(helmet());

// CORS Configuration for Production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://ai-grant-crawler-a2a-pro.vercel.app'
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all Vercel preview deployments
    if (origin.match(/^https:\/\/ai-grant-crawler-a2a-pro-.*\.vercel\.app$/)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan("dev")); // Logging

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  });
});

// Version endpoint
app.get("/version", (req, res) => {
  res.json({
    version: "1.0.0",
    name: "ai-grant-crawler-backend",
    buildTime: process.env.BUILD_TIME || new Date().toISOString(),
    nodeVersion: process.version,
    environment: env.nodeEnv,
  });
});

// Metrics endpoint (basic)
const startTime = Date.now();
let requestCount = 0;
app.use((req, res, next) => {
  requestCount++;
  next();
});

app.get("/metrics", (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();
  
  res.json({
    uptime: uptime,
    uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
    requestCount: requestCount,
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + " MB",
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + " MB",
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + " MB",
    },
    environment: env.nodeEnv,
  });
});

// API routes
app.use("/api/grants", grantsRouter);
app.use("/api/search", searchRouter);
app.use("/api/realtime-search", realtimeSearchRouter); // Real-time grant discovery
app.use("/api/crawler", crawlerRouter);
app.use("/api/matcher", matcherRouter);
app.use("/api/thinktank", thinktankRouter);
app.use("/api/proposal", proposalRouter);
app.use("/api/research", researchRouter); // Phase 2: Research Stream
app.use("/api/jules", julesRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/tracker", trackerRouter);
app.use("/api/predictor", predictorRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/team", teamRouter);
app.use("/api/admin/sources", adminSourcesRouter); // Phase 1: Sources Admin
app.use("/api/notifications", notificationsRouter); // Phase 3: Email Notifications
app.use("/api/analytics", analyticsRouter); // Phase 3: Analytics Dashboard
app.use("/api/settings", settingsRouter); // Phase 3: AI Model Configuration

// Start Cron Jobs
startCronJobs(); // Existing scraper
ScheduledDiscoveryJob.init(); // Phase 1: Daily Grant Discovery
initializeScheduler(); // Phase 3: Email Notification Scheduler

app.listen(PORT, () => {
  console.log(`🚀 AI Grant Discovery API running on port ${PORT}`);
  console.log(`🔗 Frontend should connect to: http://localhost:${PORT}`);
  console.log(
    `🤖 AI-Researcher integration: ${
      env.aiResearcherEnabled ? "ENABLED" : "DISABLED"
    }`
  );
});
