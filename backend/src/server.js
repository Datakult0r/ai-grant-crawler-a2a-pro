import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import grantsRouter from './routes/grants.js';
import crawlerRouter from './routes/crawler.js';
import matcherRouter from './routes/matcher.js';
import thinktankRouter from './routes/thinktank.js';
import proposalRouter from './routes/proposal.js';
import researchRouter from './routes/research.js';
import { startCronJobs } from './jobs/cronScraper.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/grants', grantsRouter);
app.use('/api/crawler', crawlerRouter);
app.use('/api/matcher', matcherRouter);
app.use('/api/thinktank', thinktankRouter);
app.use('/api/proposal', proposalRouter);
app.use('/api/research', researchRouter);

// Start 24/7 scraping cron jobs
startCronJobs();

app.listen(PORT, () => {
  console.log(`🚀 AI Grant Discovery API running on port ${PORT}`);
  console.log(`🔗 Frontend should connect to: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
  console.log(`🤖 AI-Researcher integration: ${process.env.AI_RESEARCHER_ENABLED ? 'ENABLED' : 'DISABLED'}`);
});
