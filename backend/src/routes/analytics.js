import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get overall dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get total grants
    const { count: totalGrants } = await supabase
      .from('grants')
      .select('*', { count: 'exact', head: true });

    // Get active grants
    const { count: activeGrants } = await supabase
      .from('grants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get grants discovered this week
    const { count: newGrantsThisWeek } = await supabase
      .from('grants')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    // Get total proposals
    const { count: totalProposals } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true });

    // Get proposals this month
    const { count: proposalsThisMonth } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get average relevance score
    const { data: grantsWithRelevance } = await supabase
      .from('grants')
      .select('relevance_score, relevance')
      .not('relevance_score', 'is', null);

    const avgRelevance = grantsWithRelevance && grantsWithRelevance.length > 0
      ? Math.round(grantsWithRelevance.reduce((sum, g) => sum + (g.relevance_score || g.relevance || 0), 0) / grantsWithRelevance.length)
      : 0;

    // Get proposals by status
    const { data: proposalsByStatus } = await supabase
      .from('proposals')
      .select('status');

    const statusCounts = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0
    };
    
    if (proposalsByStatus) {
      proposalsByStatus.forEach(p => {
        const status = p.status || 'draft';
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status]++;
        }
      });
    }

    res.json({
      overview: {
        totalGrants: totalGrants || 0,
        activeGrants: activeGrants || 0,
        newGrantsThisWeek: newGrantsThisWeek || 0,
        totalProposals: totalProposals || 0,
        proposalsThisMonth: proposalsThisMonth || 0,
        avgRelevanceScore: avgRelevance
      },
      proposalsByStatus: statusCounts
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get success rate by grant source
router.get('/success-rate', async (req, res) => {
  try {
    // Get all proposals with their grants
    const { data: proposals } = await supabase
      .from('proposals')
      .select(`
        id,
        status,
        grant_id,
        grants (
          source,
          name
        )
      `);

    // Calculate success rate by source
    const sourceStats = {};
    
    if (proposals) {
      proposals.forEach(p => {
        const source = p.grants?.source || 'Unknown';
        if (!sourceStats[source]) {
          sourceStats[source] = { total: 0, submitted: 0, approved: 0 };
        }
        sourceStats[source].total++;
        if (p.status === 'submitted' || p.status === 'approved') {
          sourceStats[source].submitted++;
        }
        if (p.status === 'approved') {
          sourceStats[source].approved++;
        }
      });
    }

    const successRates = Object.entries(sourceStats).map(([source, stats]) => ({
      source,
      total: stats.total,
      submitted: stats.submitted,
      approved: stats.approved,
      successRate: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0,
      submissionRate: stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0
    }));

    res.json({ successRates });
  } catch (error) {
    console.error('Error fetching success rates:', error);
    res.status(500).json({ error: 'Failed to fetch success rates' });
  }
});

// Get proposal generation time stats
router.get('/generation-time', async (req, res) => {
  try {
    const { data: proposals } = await supabase
      .from('proposals')
      .select('mode, generation_time, created_at')
      .not('generation_time', 'is', null);

    const fastTrack = proposals?.filter(p => p.mode === 'fast') || [];
    const researchTrack = proposals?.filter(p => p.mode === 'research') || [];

    const avgFastTime = fastTrack.length > 0
      ? Math.round(fastTrack.reduce((sum, p) => sum + (p.generation_time || 0), 0) / fastTrack.length)
      : 0;

    const avgResearchTime = researchTrack.length > 0
      ? Math.round(researchTrack.reduce((sum, p) => sum + (p.generation_time || 0), 0) / researchTrack.length)
      : 0;

    res.json({
      fastTrack: {
        count: fastTrack.length,
        avgTimeSeconds: avgFastTime,
        avgTimeFormatted: formatTime(avgFastTime)
      },
      researchTrack: {
        count: researchTrack.length,
        avgTimeSeconds: avgResearchTime,
        avgTimeFormatted: formatTime(avgResearchTime)
      }
    });
  } catch (error) {
    console.error('Error fetching generation time stats:', error);
    res.status(500).json({ error: 'Failed to fetch generation time stats' });
  }
});

// Get relevance score distribution
router.get('/relevance-distribution', async (req, res) => {
  try {
    const { data: grants } = await supabase
      .from('grants')
      .select('relevance_score, relevance');

    const distribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    if (grants) {
      grants.forEach(g => {
        const score = g.relevance_score || g.relevance || 0;
        if (score <= 20) distribution['0-20']++;
        else if (score <= 40) distribution['21-40']++;
        else if (score <= 60) distribution['41-60']++;
        else if (score <= 80) distribution['61-80']++;
        else distribution['81-100']++;
      });
    }

    res.json({ distribution });
  } catch (error) {
    console.error('Error fetching relevance distribution:', error);
    res.status(500).json({ error: 'Failed to fetch relevance distribution' });
  }
});

// Get historical trends (grants and proposals over time)
router.get('/trends', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get grants by date
    const { data: grants } = await supabase
      .from('grants')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Get proposals by date
    const { data: proposals } = await supabase
      .from('proposals')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Group by date
    const grantsByDate = groupByDate(grants || [], 'created_at');
    const proposalsByDate = groupByDate(proposals || [], 'created_at');

    // Generate date range
    const dateRange = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateRange.push({
        date: dateStr,
        grants: grantsByDate[dateStr] || 0,
        proposals: proposalsByDate[dateStr] || 0
      });
    }

    res.json({ trends: dateRange, period: days });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Get grants by source
router.get('/grants-by-source', async (req, res) => {
  try {
    const { data: grants } = await supabase
      .from('grants')
      .select('source');

    const sourceCounts = {};
    if (grants) {
      grants.forEach(g => {
        const source = g.source || 'Unknown';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
    }

    const sources = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ sources });
  } catch (error) {
    console.error('Error fetching grants by source:', error);
    res.status(500).json({ error: 'Failed to fetch grants by source' });
  }
});

// Helper functions
function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function groupByDate(items, dateField) {
  const grouped = {};
  items.forEach(item => {
    const date = new Date(item[dateField]).toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + 1;
  });
  return grouped;
}

export default router;
