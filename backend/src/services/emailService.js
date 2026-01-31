import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'AI Grant Crawler <notifications@aigrantcrawler.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function getEmailFooter(unsubscribeToken) {
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p>AI Grant Crawler - Autonomous Grant Discovery & Proposal Generation</p>
      <p style="margin-top: 10px;">
        <a href="${FRONTEND_URL}/unsubscribe?token=${unsubscribeToken}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
        &nbsp;|&nbsp;
        <a href="${FRONTEND_URL}/notification-preferences?token=${unsubscribeToken}" style="color: #6b7280; text-decoration: underline;">Manage Preferences</a>
      </p>
      <p style="margin-top: 10px; font-size: 11px;">
        You're receiving this email because you subscribed to AI Grant Crawler notifications.
      </p>
    </div>
  `;
}

export function createDeadlineAlertEmail(grant, daysRemaining, unsubscribeToken) {
  const urgencyColor = daysRemaining <= 1 ? '#dc2626' : daysRemaining <= 3 ? '#f59e0b' : '#3b82f6';
  const urgencyText = daysRemaining <= 1 ? 'URGENT' : daysRemaining <= 3 ? 'Warning' : 'Reminder';
  
  return {
    subject: `${urgencyText}: ${grant.name} deadline in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Grant Deadline Alert</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="background-color: ${urgencyColor}15; border-left: 4px solid ${urgencyColor}; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: ${urgencyColor}; font-weight: 600;">
              ${urgencyText}: ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining
            </p>
          </div>
          
          <h2 style="color: #1f2937; margin-top: 0;">${grant.name}</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Source</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 500;">${grant.source || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 500;">${grant.amount || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Deadline</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: ${urgencyColor}; font-weight: 600;">${new Date(grant.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Relevance Score</td>
              <td style="padding: 10px 0; color: #1f2937; font-weight: 500;">${grant.relevance_score || 'N/A'}%</td>
            </tr>
          </table>
          
          <a href="${FRONTEND_URL}/thinktank/${grant.id}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px;">
            Start Proposal Now
          </a>
        </div>
        
        ${getEmailFooter(unsubscribeToken)}
      </div>
    `
  };
}

export function createNewGrantAlertEmail(grants, unsubscribeToken) {
  const grantRows = grants.map(grant => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-weight: 600; color: #1f2937;">${grant.name}</div>
        <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">${grant.source || 'Unknown source'}</div>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        <div style="font-weight: 600; color: #059669;">${grant.amount || 'TBD'}</div>
        <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Score: ${grant.relevance_score || 'N/A'}%</div>
      </td>
    </tr>
  `).join('');

  return {
    subject: `${grants.length} New High-Relevance Grant${grants.length === 1 ? '' : 's'} Found`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Grants Discovered</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${grants.length} high-relevance opportunit${grants.length === 1 ? 'y' : 'ies'} matching your profile</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            ${grantRows}
          </table>
          
          <a href="${FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px;">
            View All Grants
          </a>
        </div>
        
        ${getEmailFooter(unsubscribeToken)}
      </div>
    `
  };
}

export function createWeeklyDigestEmail(stats, topGrants, unsubscribeToken) {
  const grantList = topGrants.map(grant => `
    <li style="margin-bottom: 10px;">
      <strong>${grant.name}</strong> - ${grant.amount || 'Amount TBD'}
      <br><span style="color: #6b7280; font-size: 14px;">Deadline: ${new Date(grant.deadline).toLocaleDateString()}</span>
    </li>
  `).join('');

  return {
    subject: `Your Weekly Grant Digest - ${stats.newGrants} New Opportunities`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Weekly Grant Digest</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
            <div style="text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px;">
              <div style="font-size: 28px; font-weight: 700; color: #7c3aed;">${stats.newGrants}</div>
              <div style="font-size: 14px; color: #6b7280;">New Grants</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px;">
              <div style="font-size: 28px; font-weight: 700; color: #059669;">${stats.proposalsGenerated}</div>
              <div style="font-size: 14px; color: #6b7280;">Proposals</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px;">
              <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">${stats.upcomingDeadlines}</div>
              <div style="font-size: 14px; color: #6b7280;">Deadlines</div>
            </div>
          </div>
          
          <h3 style="color: #1f2937; margin-bottom: 15px;">Top Opportunities This Week</h3>
          <ul style="padding-left: 20px; color: #1f2937;">
            ${grantList}
          </ul>
          
          <a href="${FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px;">
            Explore All Grants
          </a>
        </div>
        
        ${getEmailFooter(unsubscribeToken)}
      </div>
    `
  };
}

export function createProposalStatusEmail(proposal, grant, newStatus, unsubscribeToken) {
  const statusColors = {
    draft: '#6b7280',
    generating: '#3b82f6',
    completed: '#059669',
    submitted: '#7c3aed',
    approved: '#10b981',
    rejected: '#dc2626'
  };
  
  const statusColor = statusColors[newStatus] || '#6b7280';

  return {
    subject: `Proposal Status Update: ${grant.name} - ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Proposal Status Update</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="display: inline-block; background-color: ${statusColor}20; color: ${statusColor}; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 20px;">
            ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
          </div>
          
          <h2 style="color: #1f2937; margin-top: 0;">${grant.name}</h2>
          
          <p style="color: #6b7280; line-height: 1.6;">
            Your proposal for this grant has been updated to <strong>${newStatus}</strong>.
          </p>
          
          <a href="${FRONTEND_URL}/documents" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px;">
            View Proposal
          </a>
        </div>
        
        ${getEmailFooter(unsubscribeToken)}
      </div>
    `
  };
}

export async function sendEmail(to, subject, html) {
  if (!resend) {
    console.log(`[EMAIL] Resend not configured. Would send to ${to}: ${subject}`);
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html
    });

    if (error) {
      console.error('[EMAIL] Failed to send:', error);
      return { success: false, error };
    }

    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
    return { success: true, data };
  } catch (err) {
    console.error('[EMAIL] Error:', err);
    return { success: false, error: err.message };
  }
}

// Wrapper functions for notification scheduler
export async function notifyDeadlineApproaching(email, grant, daysRemaining, unsubscribeToken = 'default') {
  const { subject, html } = createDeadlineAlertEmail(grant, daysRemaining, unsubscribeToken);
  return sendEmail(email, subject, html);
}

export async function notifyNewHighRelevanceGrant(email, grant, unsubscribeToken = 'default') {
  const { subject, html } = createNewGrantAlertEmail([grant], unsubscribeToken);
  return sendEmail(email, subject, html);
}

export async function sendWeeklyDigest(email, grants, proposals, stats, unsubscribeToken = 'default') {
  const { subject, html } = createWeeklyDigestEmail(stats, grants.slice(0, 5), unsubscribeToken);
  return sendEmail(email, subject, html);
}
