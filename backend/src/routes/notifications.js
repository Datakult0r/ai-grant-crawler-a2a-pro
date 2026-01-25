import express from 'express';
import { 
  addSubscriber, 
  removeSubscriber, 
  getSubscribers,
  triggerDeadlineCheck,
  triggerNewGrantsCheck,
  triggerWeeklyDigest
} from '../services/notificationScheduler.js';
import { 
  notifyDeadlineApproaching,
  notifyProposalStatusChange,
  notifyNewHighRelevanceGrant,
  sendWeeklyDigest
} from '../services/emailService.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Subscribe to notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { email, preferences } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    addSubscriber(email, preferences || {});
    
    res.json({ 
      success: true, 
      message: 'Successfully subscribed to notifications',
      preferences: {
        deadlineAlerts: preferences?.deadlineAlerts !== false,
        newGrantAlerts: preferences?.newGrantAlerts !== false,
        weeklyDigest: preferences?.weeklyDigest !== false,
        minRelevanceScore: preferences?.minRelevanceScore || 70,
        deadlineWarningDays: preferences?.deadlineWarningDays || [7, 3, 1]
      }
    });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    res.status(500).json({ error: 'Failed to subscribe to notifications' });
  }
});

// Unsubscribe from notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    removeSubscriber(email);
    
    res.json({ 
      success: true, 
      message: 'Successfully unsubscribed from notifications' 
    });
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from notifications' });
  }
});

// Get subscription status
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const subscribers = getSubscribers();
    const subscriber = subscribers.find(s => s.email === email);
    
    if (subscriber) {
      res.json({ 
        subscribed: true, 
        preferences: subscriber 
      });
    } else {
      res.json({ 
        subscribed: false 
      });
    }
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Update notification preferences
router.patch('/preferences', async (req, res) => {
  try {
    const { email, preferences } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const subscribers = getSubscribers();
    const existingSubscriber = subscribers.find(s => s.email === email);
    
    if (!existingSubscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    // Update preferences by re-adding with merged preferences
    addSubscriber(email, { ...existingSubscriber, ...preferences });
    
    res.json({ 
      success: true, 
      message: 'Preferences updated successfully' 
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Admin: Get all subscribers (should be protected in production)
router.get('/admin/subscribers', async (req, res) => {
  try {
    const subscribers = getSubscribers();
    res.json({ 
      count: subscribers.length,
      subscribers 
    });
  } catch (error) {
    console.error('Error getting subscribers:', error);
    res.status(500).json({ error: 'Failed to get subscribers' });
  }
});

// Admin: Trigger deadline check manually
router.post('/admin/trigger/deadlines', async (req, res) => {
  try {
    await triggerDeadlineCheck();
    res.json({ success: true, message: 'Deadline check triggered' });
  } catch (error) {
    console.error('Error triggering deadline check:', error);
    res.status(500).json({ error: 'Failed to trigger deadline check' });
  }
});

// Admin: Trigger new grants check manually
router.post('/admin/trigger/new-grants', async (req, res) => {
  try {
    await triggerNewGrantsCheck();
    res.json({ success: true, message: 'New grants check triggered' });
  } catch (error) {
    console.error('Error triggering new grants check:', error);
    res.status(500).json({ error: 'Failed to trigger new grants check' });
  }
});

// Admin: Trigger weekly digest manually
router.post('/admin/trigger/weekly-digest', async (req, res) => {
  try {
    await triggerWeeklyDigest();
    res.json({ success: true, message: 'Weekly digest triggered' });
  } catch (error) {
    console.error('Error triggering weekly digest:', error);
    res.status(500).json({ error: 'Failed to trigger weekly digest' });
  }
});

// Send test notification
router.post('/test', async (req, res) => {
  try {
    const { email, type } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get a sample grant for testing
    const { data: grants } = await supabase
      .from('grants')
      .select('*')
      .limit(1);
    
    const sampleGrant = grants?.[0] || {
      id: 1,
      name: 'Test Grant',
      source: 'Test Source',
      amount: '100,000',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      relevance_score: 85,
      description: 'This is a test grant notification.'
    };

    let result;
    switch (type) {
      case 'deadline':
        result = await notifyDeadlineApproaching(email, sampleGrant, 7);
        break;
      case 'new-grant':
        result = await notifyNewHighRelevanceGrant(email, sampleGrant);
        break;
      case 'status-change':
        result = await notifyProposalStatusChange(email, { mode: 'fast', created_at: new Date() }, sampleGrant, 'submitted');
        break;
      case 'weekly-digest':
        result = await sendWeeklyDigest(email, [sampleGrant], [], { newGrants: 5, upcomingDeadlines: 3, proposalsGenerated: 2 });
        break;
      default:
        result = await notifyDeadlineApproaching(email, sampleGrant, 7);
    }

    if (result.success) {
      res.json({ success: true, message: `Test ${type || 'deadline'} notification sent to ${email}` });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

export default router;
