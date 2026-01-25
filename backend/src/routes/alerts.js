import express from 'express';
import { supabase } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/alerts
 * Returns alerts computed from grants and proposals tables based on deadlines:
 * - Urgent: < 7 days until deadline
 * - Warning: 7-14 days until deadline
 * - Info: 14-30 days until deadline
 * - Completed: proposals with status='submitted'
 */
router.get('/', async (req, res) => {
    try {
        const now = new Date();
        
        // Fetch all grants with deadlines
        const { data: grants, error: grantsError } = await supabase
            .from('grants')
            .select('id, name, source, funding_amount, deadline, description')
            .not('deadline', 'is', null)
            .order('deadline', { ascending: true });

        if (grantsError) {
            console.error('Error fetching grants:', grantsError);
            return res.status(500).json({ error: grantsError.message });
        }

        // Fetch submitted proposals
        const { data: proposals, error: proposalsError } = await supabase
            .from('proposals')
            .select('id, grant_id, status, created_at, grants(name, source, funding_amount)')
            .eq('status', 'submitted');

        if (proposalsError) {
            console.error('Error fetching proposals:', proposalsError);
            // Continue without proposals if table doesn't exist
        }

        // Categorize grants by deadline urgency
        const urgent = [];
        const warning = [];
        const info = [];
        const completed = [];

        // Process grants into alert categories
        for (const grant of grants || []) {
            const deadline = new Date(grant.deadline);
            const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            // Skip past deadlines
            if (daysLeft < 0) continue;

            const alert = {
                id: grant.id,
                type: daysLeft <= 7 ? 'urgent' : daysLeft <= 14 ? 'warning' : 'info',
                title: `${grant.name} - Deadline in ${daysLeft} days`,
                description: grant.description || `${grant.source} grant application deadline approaching`,
                daysLeft,
                grant: grant.source || grant.name,
                grantId: grant.id,
                amount: grant.funding_amount || 'TBD'
            };

            if (daysLeft <= 7) {
                urgent.push(alert);
            } else if (daysLeft <= 14) {
                warning.push(alert);
            } else if (daysLeft <= 30) {
                info.push(alert);
            }
        }

        // Process submitted proposals as completed alerts
        for (const proposal of proposals || []) {
            const grant = proposal.grants;
            if (!grant) continue;

            completed.push({
                id: `proposal-${proposal.id}`,
                type: 'success',
                title: `${grant.name} - Application Submitted`,
                description: `Your application was successfully submitted on ${new Date(proposal.created_at).toLocaleDateString()}`,
                daysLeft: null,
                grant: grant.source || grant.name,
                grantId: proposal.grant_id,
                amount: grant.funding_amount || 'TBD'
            });
        }

        res.json({
            urgent,
            warning,
            info,
            completed,
            stats: {
                urgent: urgent.length,
                warning: warning.length,
                info: info.length,
                completed: completed.length,
                total: urgent.length + warning.length + info.length + completed.length
            }
        });
    } catch (error) {
        console.error('Error in alerts route:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

export default router;
