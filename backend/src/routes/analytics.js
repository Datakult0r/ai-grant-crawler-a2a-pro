import express from 'express';
import { supabase } from '../config/database.js';

const router = express.Router();

// Middleware to verify authentication for all analytics routes
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  req.user = user;
  next();
}

// Apply auth middleware to all routes
router.use(requireAuth);

// Dashboard overview stats
router.get('/dashboard', async (req, res) => {
  try {
    // Get total grants
    const { count: totalGrants } = await supabase
      .from('grants')
      .select('*', { count: 'exact', head: true });

    // Get total proposals
    const { count: totalProposals } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true });

    // Get average relevance score
    const { data: grantsData } = await supabase
      .from('grants')
      .select('relevance_score')
      .not('relevance_score', 'is', null);

    const avgRelevance = grantsData?.length 
      ? Math.round(grantsData.reduce((sum, g) => sum + (g.relevance_score || 0), 0) / grantsData.length)
      : 0;

    // Get grants added this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: newThisWeek } = await supabase
      .from('grants')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Get proposals by status
    const { data: proposalsByStatus } = await supabase
      .from('proposals')
      .select('status');

    const statusCounts = proposalsByStatus?.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      totalGrants: totalGrants || 0,
      totalProposals: totalProposals || 0,
      avgRelevance,
      newThisWeek: newThisWeek || 0,
      proposalsByStatus: statusCounts
    });
  } catch (err) {
    console.error('[ANALYTICS] Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Success rate by source
router.get('/success-rate', async (req, res) => {
  try {
    const { data: proposals } = await supabase
      .from('proposals')
      .select(`
        status,
        grants!inner(source)
      `);

    // Group by source and calculate success rate
    const sourceStats = {};
    proposals?.forEach(p => {
      const source = p.grants?.source || 'Unknown';
      if (!sourceStats[source]) {
        sourceStats[source] = { total: 0, submitted: 0, approved: 0 };
      }
      sourceStats[source].total++;
      if (p.status === 'submitted') sourceStats[source].submitted++;
      if (p.status === 'approved') sourceStats[source].approved++;
    });

    const result = Object.entries(sourceStats).map(([source, stats]) => ({
      source,
      total: stats.total,
      submitted: stats.submitted,
      approved: stats.approved,
      successRate: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0
    }));

    res.json({ sources: result });
  } catch (err) {
    console.error('[ANALYTICS] Success rate error:', err);
    res.status(500).json({ error: 'Failed to fetch success rates' });
  }
});

// Generation time comparison (fast vs research mode)
router.get('/generation-times', async (req, res) => {
  try {
    const { data: proposals } = await supabase
      .from('proposals')
      .select('mode, generation_time')
      .not('generation_time', 'is', null);

    const fastTimes = proposals?.filter(p => p.mode === 'fast').map(p => p.generation_time) || [];
    const researchTimes = proposals?.filter(p => p.mode === 'research').map(p => p.generation_time) || [];

    const avgFast = fastTimes.length 
      ? Math.round(fastTimes.reduce((a, b) => a + b, 0) / fastTimes.length)
      : 0;
    const avgResearch = researchTimes.length 
      ? Math.round(researchTimes.reduce((a, b) => a + b, 0) / researchTimes.length)
      : 0;

    res.json({
      fast: {
        count: fastTimes.length,
        avgTime: avgFast,
        minTime: fastTimes.length ? Math.min(...fastTimes) : 0,
        maxTime: fastTimes.length ? Math.max(...fastTimes) : 0
      },
      research: {
        count: researchTimes.length,
        avgTime: avgResearch,
        minTime: researchTimes.length ? Math.min(...researchTimes) : 0,
        maxTime: researchTimes.length ? Math.max(...researchTimes) : 0
      }
    });
  } catch (err) {
    console.error('[ANALYTICS] Generation times error:', err);
    res.status(500).json({ error: 'Failed to fetch generation times' });
  }
});

// Relevance score distribution
router.get('/relevance-distribution', async (req, res) => {
  try {
    const { data: grants } = await supabase
      .from('grants')
      .select('relevance_score')
      .not('relevance_score', 'is', null);

    // Create distribution buckets (0-20, 21-40, 41-60, 61-80, 81-100)
    const distribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    grants?.forEach(g => {
      const score = g.relevance_score || 0;
      if (score <= 20) distribution['0-20']++;
      else if (score <= 40) distribution['21-40']++;
      else if (score <= 60) distribution['41-60']++;
      else if (score <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    res.json({ distribution });
  } catch (err) {
    console.error('[ANALYTICS] Relevance distribution error:', err);
    res.status(500).json({ error: 'Failed to fetch relevance distribution' });
  }
});

// Grants by source
router.get('/grants-by-source', async (req, res) => {
  try {
    const { data: grants } = await supabase
      .from('grants')
      .select('source');

    const sourceCounts = grants?.reduce((acc, g) => {
      const source = g.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {}) || {};

    const result = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ sources: result });
  } catch (err) {
    console.error('[ANALYTICS] Grants by source error:', err);
    res.status(500).json({ error: 'Failed to fetch grants by source' });
  }
});

// 30-day activity trends
router.get('/trends', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get grants created in last 30 days
    const { data: grants } = await supabase
      .from('grants')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get proposals created in last 30 days
    const { data: proposals } = await supabase
      .from('proposals')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Group by day
    const grantsByDay = {};
    const proposalsByDay = {};

    grants?.forEach(g => {
      const day = g.created_at.split('T')[0];
      grantsByDay[day] = (grantsByDay[day] || 0) + 1;
    });

    proposals?.forEach(p => {
      const day = p.created_at.split('T')[0];
      proposalsByDay[day] = (proposalsByDay[day] || 0) + 1;
    });

    // Create array of last 30 days
    const trends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.toISOString().split('T')[0];
      trends.push({
        date: day,
        grants: grantsByDay[day] || 0,
        proposals: proposalsByDay[day] || 0
      });
    }

    res.json({ trends });
  } catch (err) {
    console.error('[ANALYTICS] Trends error:', err);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

export default router;
