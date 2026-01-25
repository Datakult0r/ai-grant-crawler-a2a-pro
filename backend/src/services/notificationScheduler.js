import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { 
  notifyDeadlineApproaching, 
  notifyNewHighRelevanceGrant,
  sendWeeklyDigest 
} from './emailService.js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Store for notification preferences (in production, this would be in the database)
let notificationSubscribers = new Map();

// Add a subscriber for notifications
export function addSubscriber(email, preferences = {}) {
  notificationSubscribers.set(email, {
    email,
    deadlineAlerts: preferences.deadlineAlerts !== false,
    newGrantAlerts: preferences.newGrantAlerts !== false,
    weeklyDigest: preferences.weeklyDigest !== false,
    minRelevanceScore: preferences.minRelevanceScore || 70,
    deadlineWarningDays: preferences.deadlineWarningDays || [7, 3, 1]
  });
  console.log(`[NOTIFICATIONS] Added subscriber: ${email}`);
}

// Remove a subscriber
export function removeSubscriber(email) {
  notificationSubscribers.delete(email);
  console.log(`[NOTIFICATIONS] Removed subscriber: ${email}`);
}

// Get all subscribers
export function getSubscribers() {
  return Array.from(notificationSubscribers.values());
}

// Check for grants with approaching deadlines
async function checkDeadlineAlerts() {
  console.log('[NOTIFICATIONS] Checking deadline alerts...');
  
  const subscribers = getSubscribers().filter(s => s.deadlineAlerts);
  if (subscribers.length === 0) {
    console.log('[NOTIFICATIONS] No subscribers for deadline alerts');
    return;
  }

  try {
    const today = new Date();
    const warningDays = [7, 3, 1]; // Days before deadline to send alerts
    
    for (const days of warningDays) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      const { data: grants, error } = await supabase
        .from('grants')
        .select('*')
        .eq('deadline', targetDateStr)
        .eq('status', 'active');
      
      if (error) {
        console.error('[NOTIFICATIONS] Error fetching grants:', error);
        continue;
      }

      if (grants && grants.length > 0) {
        console.log(`[NOTIFICATIONS] Found ${grants.length} grants with deadline in ${days} days`);
        
        for (const grant of grants) {
          for (const subscriber of subscribers) {
            if (subscriber.deadlineWarningDays.includes(days)) {
              await notifyDeadlineApproaching(subscriber.email, grant, days);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[NOTIFICATIONS] Error in deadline check:', error);
  }
}

// Check for new high-relevance grants
async function checkNewHighRelevanceGrants() {
  console.log('[NOTIFICATIONS] Checking for new high-relevance grants...');
  
  const subscribers = getSubscribers().filter(s => s.newGrantAlerts);
  if (subscribers.length === 0) {
    console.log('[NOTIFICATIONS] No subscribers for new grant alerts');
    return;
  }

  try {
    // Get grants discovered in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: grants, error } = await supabase
      .from('grants')
      .select('*')
      .gte('discovered_at', yesterday.toISOString())
      .order('relevance_score', { ascending: false });
    
    if (error) {
      console.error('[NOTIFICATIONS] Error fetching new grants:', error);
      return;
    }

    if (grants && grants.length > 0) {
      console.log(`[NOTIFICATIONS] Found ${grants.length} new grants`);
      
      for (const grant of grants) {
        const relevanceScore = grant.relevance_score || grant.relevance || 0;
        
        for (const subscriber of subscribers) {
          if (relevanceScore >= subscriber.minRelevanceScore) {
            await notifyNewHighRelevanceGrant(subscriber.email, grant);
          }
        }
      }
    }
  } catch (error) {
    console.error('[NOTIFICATIONS] Error in new grants check:', error);
  }
}

// Send weekly digest
async function sendWeeklyDigestToAll() {
  console.log('[NOTIFICATIONS] Sending weekly digest...');
  
  const subscribers = getSubscribers().filter(s => s.weeklyDigest);
  if (subscribers.length === 0) {
    console.log('[NOTIFICATIONS] No subscribers for weekly digest');
    return;
  }

  try {
    // Get stats for the week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Get new grants this week
    const { data: newGrants, error: grantsError } = await supabase
      .from('grants')
      .select('*')
      .gte('created_at', weekAgo.toISOString())
      .order('relevance_score', { ascending: false });
    
    if (grantsError) {
      console.error('[NOTIFICATIONS] Error fetching weekly grants:', grantsError);
      return;
    }

    // Get upcoming deadlines (next 14 days)
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    
    const { data: upcomingGrants, error: upcomingError } = await supabase
      .from('grants')
      .select('*')
      .gte('deadline', new Date().toISOString().split('T')[0])
      .lte('deadline', twoWeeksFromNow.toISOString().split('T')[0])
      .eq('status', 'active');
    
    if (upcomingError) {
      console.error('[NOTIFICATIONS] Error fetching upcoming grants:', upcomingError);
    }

    // Get proposals generated this week
    const { data: proposals, error: proposalsError } = await supabase
      .from('proposals')
      .select('*')
      .gte('created_at', weekAgo.toISOString());
    
    if (proposalsError) {
      console.error('[NOTIFICATIONS] Error fetching proposals:', proposalsError);
    }

    const stats = {
      newGrants: newGrants?.length || 0,
      upcomingDeadlines: upcomingGrants?.length || 0,
      proposalsGenerated: proposals?.length || 0
    };

    // Send digest to each subscriber
    for (const subscriber of subscribers) {
      // Filter grants by subscriber's minimum relevance score
      const relevantGrants = (newGrants || []).filter(
        g => (g.relevance_score || g.relevance || 0) >= subscriber.minRelevanceScore
      );
      
      await sendWeeklyDigest(subscriber.email, relevantGrants, proposals || [], stats);
    }

    console.log(`[NOTIFICATIONS] Weekly digest sent to ${subscribers.length} subscribers`);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error sending weekly digest:', error);
  }
}

// Initialize scheduled jobs
export function initializeScheduler() {
  console.log('[NOTIFICATIONS] Initializing notification scheduler...');

  // Check deadline alerts daily at 9 AM
  cron.schedule('0 9 * * *', () => {
    checkDeadlineAlerts();
  }, {
    timezone: 'UTC'
  });

  // Check for new high-relevance grants every 6 hours
  cron.schedule('0 */6 * * *', () => {
    checkNewHighRelevanceGrants();
  }, {
    timezone: 'UTC'
  });

  // Send weekly digest every Monday at 8 AM
  cron.schedule('0 8 * * 1', () => {
    sendWeeklyDigestToAll();
  }, {
    timezone: 'UTC'
  });

  console.log('[NOTIFICATIONS] Scheduler initialized with the following jobs:');
  console.log('  - Deadline alerts: Daily at 9:00 AM UTC');
  console.log('  - New grant alerts: Every 6 hours');
  console.log('  - Weekly digest: Mondays at 8:00 AM UTC');
}

// Manual trigger functions for testing
export async function triggerDeadlineCheck() {
  await checkDeadlineAlerts();
}

export async function triggerNewGrantsCheck() {
  await checkNewHighRelevanceGrants();
}

export async function triggerWeeklyDigest() {
  await sendWeeklyDigestToAll();
}

export default {
  initializeScheduler,
  addSubscriber,
  removeSubscriber,
  getSubscribers,
  triggerDeadlineCheck,
  triggerNewGrantsCheck,
  triggerWeeklyDigest
};
