import express from 'express';
import { supabase } from '../config/database.js';
import { sendEmail, createDeadlineAlertEmail, createNewGrantAlertEmail, createWeeklyDigestEmail } from '../services/emailService.js';
import crypto from 'crypto';

const router = express.Router();

// Subscribe to notifications - stores in Supabase
router.post('/subscribe', async (req, res) => {
  try {
    const { email, preferences } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Generate unique unsubscribe token
    const unsubscribeToken = crypto.randomUUID();
    
    const defaultPreferences = {
      deadlines: true,
      newGrants: true,
      weeklyDigest: true,
      proposalUpdates: true
    };

    // Upsert subscriber in Supabase
    const { data, error } = await supabase
      .from('notification_subscribers')
      .upsert({
        email: email.toLowerCase().trim(),
        unsubscribe_token: unsubscribeToken,
        preferences: { ...defaultPreferences, ...preferences },
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('[NOTIFICATIONS] Subscribe error:', error);
      return res.status(500).json({ error: 'Failed to subscribe' });
    }

    res.json({ 
      success: true, 
      message: 'Successfully subscribed to notifications',
      preferences: data.preferences
    });
  } catch (err) {
    console.error('[NOTIFICATIONS] Subscribe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unsubscribe using token (one-click unsubscribe for CAN-SPAM compliance)
router.get('/unsubscribe/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const { data, error } = await supabase
      .from('notification_subscribers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('unsubscribe_token', token)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Invalid unsubscribe token' });
    }

    res.json({ 
      success: true, 
      message: 'Successfully unsubscribed from all notifications' 
    });
  } catch (err) {
    console.error('[NOTIFICATIONS] Unsubscribe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update notification preferences
router.put('/preferences/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { preferences } = req.body;
    
    const { data, error } = await supabase
      .from('notification_subscribers')
      .update({ 
        preferences,
        updated_at: new Date().toISOString()
      })
      .eq('unsubscribe_token', token)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    res.json({ 
      success: true, 
      preferences: data.preferences 
    });
  } catch (err) {
    console.error('[NOTIFICATIONS] Update preferences error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get preferences by token (for preference management page)
router.get('/preferences/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const { data, error } = await supabase
      .from('notification_subscribers')
      .select('email, preferences, is_active')
      .eq('unsubscribe_token', token)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    res.json({ 
      email: data.email,
      preferences: data.preferences,
      isActive: data.is_active
    });
  } catch (err) {
    console.error('[NOTIFICATIONS] Get preferences error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all subscribers (protected - requires auth middleware)
router.get('/admin/subscribers', async (req, res) => {
  try {
    // Check for admin authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify the token with Supabase
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { data, error } = await supabase
      .from('notification_subscribers')
      .select('id, email, preferences, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[NOTIFICATIONS] Admin list error:', error);
      return res.status(500).json({ error: 'Failed to fetch subscribers' });
    }

    res.json({ 
      subscribers: data,
      total: data.length,
      active: data.filter(s => s.is_active).length
    });
  } catch (err) {
    console.error('[NOTIFICATIONS] Admin list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Send test notification (protected)
router.post('/admin/test', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { email, type } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Create test content based on type
    const testGrant = {
      id: 'test-grant-123',
      name: 'Test Grant - Horizon Europe AI Innovation',
      source: 'Horizon Europe',
      amount: '2,500,000',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      relevance_score: 85
    };

    let emailContent;
    const testToken = 'test-unsubscribe-token';

    switch (type) {
      case 'deadline':
        emailContent = createDeadlineAlertEmail(testGrant, 7, testToken);
        break;
      case 'newGrant':
        emailContent = createNewGrantAlertEmail([testGrant], testToken);
        break;
      case 'digest':
        emailContent = createWeeklyDigestEmail(
          { newGrants: 5, proposalsGenerated: 3, upcomingDeadlines: 2 },
          [testGrant],
          testToken
        );
        break;
      default:
        emailContent = createDeadlineAlertEmail(testGrant, 7, testToken);
    }

    const result = await sendEmail(email, emailContent.subject, emailContent.html);
    
    res.json({ 
      success: result.success,
      message: result.success ? 'Test email sent' : 'Failed to send test email',
      error: result.error
    });
  } catch (err) {
    console.error('[NOTIFICATIONS] Test email error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trigger deadline notifications (called by scheduler)
router.post('/trigger/deadlines', async (req, res) => {
  try {
    // This endpoint should be called by a cron job or scheduler
    // Verify internal call or admin auth
    const authHeader = req.headers.authorization;
    const internalKey = req.headers['x-internal-key'];
    
    if (internalKey !== process.env.INTERNAL_API_KEY && !authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get active subscribers who want deadline notifications
    const { data: subscribers, error: subError } = await supabase
      .from('notification_subscribers')
      .select('email, unsubscribe_token, preferences')
      .eq('is_active', true);

    if (subError) {
      return res.status(500).json({ error: 'Failed to fetch subscribers' });
    }

    const deadlineSubscribers = subscribers.filter(s => s.preferences?.deadlines !== false);

    // Get grants with upcoming deadlines (1, 3, 7 days)
    const now = new Date();
    const deadlines = [1, 3, 7];
    let emailsSent = 0;

    for (const days of deadlines) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();

      const { data: grants, error: grantError } = await supabase
        .from('grants')
        .select('*')
        .gte('deadline', startOfDay)
        .lte('deadline', endOfDay);

      if (grantError || !grants?.length) continue;

      for (const grant of grants) {
        for (const subscriber of deadlineSubscribers) {
          const emailContent = createDeadlineAlertEmail(grant, days, subscriber.unsubscribe_token);
          await sendEmail(subscriber.email, emailContent.subject, emailContent.html);
          emailsSent++;
        }
      }
    }

    res.json({ 
      success: true, 
      emailsSent,
      subscribersNotified: deadlineSubscribers.length
    });
  } catch (err) {
    console.error('[NOTIFICATIONS] Trigger deadlines error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
