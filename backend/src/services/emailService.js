import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'AI Grant Crawler <notifications@grants.ai>';

// Email templates
const templates = {
  deadlineApproaching: (grant, daysLeft) => ({
    subject: `Deadline Alert: ${grant.name} - ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Deadline Approaching</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">${grant.name}</h2>
          <p style="color: #6b7280;">
            <strong style="color: #dc2626;">${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong> remaining until the deadline.
          </p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Source:</strong> ${grant.source || 'Unknown'}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${grant.amount || grant.funding_amount || 'Not specified'}</p>
            <p style="margin: 5px 0;"><strong>Deadline:</strong> ${new Date(grant.deadline).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Relevance Score:</strong> ${grant.relevance_score || grant.relevance || 0}%</p>
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/thinktank/${grant.id}" 
             style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">
            Start Proposal
          </a>
        </div>
      </div>
    `
  }),

  proposalStatusChange: (proposal, grant, newStatus) => ({
    subject: `Proposal Update: ${grant.name} - ${newStatus}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Proposal Status Update</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">${grant.name}</h2>
          <p style="color: #6b7280;">Your proposal status has been updated to:</p>
          <div style="background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold;">
            ${newStatus.toUpperCase()}
          </div>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Proposal Mode:</strong> ${proposal.mode === 'fast' ? 'Fast Track' : 'Research Track'}</p>
            <p style="margin: 5px 0;"><strong>Created:</strong> ${new Date(proposal.created_at).toLocaleDateString()}</p>
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/documents" 
             style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">
            View Proposal
          </a>
        </div>
      </div>
    `
  }),

  newHighRelevanceGrant: (grant) => ({
    subject: `New High-Relevance Grant: ${grant.name} (${grant.relevance_score || grant.relevance}% match)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">New Grant Discovered</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
            <strong style="color: #92400e;">High Relevance Match: ${grant.relevance_score || grant.relevance}%</strong>
          </div>
          <h2 style="color: #1f2937; margin-top: 0;">${grant.name}</h2>
          <p style="color: #6b7280;">${grant.description ? grant.description.substring(0, 200) + '...' : 'No description available'}</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Source:</strong> ${grant.source || 'Unknown'}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${grant.amount || grant.funding_amount || 'Not specified'}</p>
            <p style="margin: 5px 0;"><strong>Deadline:</strong> ${grant.deadline ? new Date(grant.deadline).toLocaleDateString() : 'Not specified'}</p>
            <p style="margin: 5px 0;"><strong>Region:</strong> ${grant.region || 'Not specified'}</p>
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/thinktank/${grant.id}" 
             style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">
            Apply Now
          </a>
        </div>
      </div>
    `
  }),

  weeklyDigest: (grants, proposals, stats) => ({
    subject: `Weekly Grant Digest - ${stats.newGrants} new grants, ${stats.upcomingDeadlines} upcoming deadlines`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Weekly Grant Digest</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Week of ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          
          <!-- Stats Summary -->
          <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <div style="flex: 1; background: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${stats.newGrants}</div>
              <div style="color: #6b7280; font-size: 12px;">New Grants</div>
            </div>
            <div style="flex: 1; background: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${stats.upcomingDeadlines}</div>
              <div style="color: #6b7280; font-size: 12px;">Upcoming Deadlines</div>
            </div>
            <div style="flex: 1; background: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">${stats.proposalsGenerated}</div>
              <div style="color: #6b7280; font-size: 12px;">Proposals Generated</div>
            </div>
          </div>

          <!-- Top Grants -->
          ${grants.length > 0 ? `
            <h3 style="color: #1f2937; margin-bottom: 10px;">Top Matching Grants</h3>
            ${grants.slice(0, 5).map(grant => `
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #8b5cf6;">
                <h4 style="margin: 0 0 5px 0; color: #1f2937;">${grant.name}</h4>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  ${grant.source} | ${grant.amount || 'Amount TBD'} | 
                  <span style="color: ${grant.relevance_score >= 70 ? '#10b981' : '#f59e0b'};">${grant.relevance_score}% match</span>
                </p>
              </div>
            `).join('')}
          ` : '<p style="color: #6b7280;">No new grants this week.</p>'}

          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
             style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">
            View All Grants
          </a>
        </div>
      </div>
    `
  })
};

// Send email function
export async function sendEmail(to, template, data) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[EMAIL] Resend API key not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const emailContent = templates[template](...data);
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject: emailContent.subject,
      html: emailContent.html
    });

    console.log(`[EMAIL] Sent ${template} email to ${to}`);
    return { success: true, id: result.id };
  } catch (error) {
    console.error(`[EMAIL] Failed to send ${template} email:`, error);
    return { success: false, error: error.message };
  }
}

// Notification functions
export async function notifyDeadlineApproaching(userEmail, grant, daysLeft) {
  return sendEmail(userEmail, 'deadlineApproaching', [grant, daysLeft]);
}

export async function notifyProposalStatusChange(userEmail, proposal, grant, newStatus) {
  return sendEmail(userEmail, 'proposalStatusChange', [proposal, grant, newStatus]);
}

export async function notifyNewHighRelevanceGrant(userEmail, grant) {
  return sendEmail(userEmail, 'newHighRelevanceGrant', [grant]);
}

export async function sendWeeklyDigest(userEmail, grants, proposals, stats) {
  return sendEmail(userEmail, 'weeklyDigest', [grants, proposals, stats]);
}

export default {
  sendEmail,
  notifyDeadlineApproaching,
  notifyProposalStatusChange,
  notifyNewHighRelevanceGrant,
  sendWeeklyDigest
};
