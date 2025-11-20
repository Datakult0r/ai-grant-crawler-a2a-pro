import express from 'express';
import { supabase } from '../config/database.js';
import { generateProposalFast } from '../services/geminiService.js';
import { generateResearchProposal } from '../services/aiResearcher.js';

const router = express.Router();

/**
 * POST /api/proposal/generate
 * Body: { grantId, companyProfile, mode }
 * mode: 'fast' | 'research'
 */
router.post('/generate', async (req, res) => {
    const { grantId, companyProfile, mode } = req.body;

    if (!grantId || !mode) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Fetch grant details
        const { data: grant, error: grantError } = await supabase
            .from('grants')
            .select('*')
            .eq('id', grantId)
            .single();

        if (grantError || !grant) {
            return res.status(404).json({ error: 'Grant not found' });
        }

        // 2. Create proposal record
        const { data: proposal, error: proposalError } = await supabase
            .from('proposals')
            .insert({
                grant_id: grantId,
                mode: mode,
                status: 'processing'
            })
            .select()
            .single();

        if (proposalError) throw proposalError;

        // 3. Start generation (Async)
        // We return the proposal ID immediately so the frontend can poll or listen for SSE
        res.json({ proposalId: proposal.id, status: 'processing' });

        // Background processing
        (async () => {
            try {
                let result;
                const startTime = Date.now();

                if (mode === 'fast') {
                    result = await generateProposalFast(grant, companyProfile);
                } else if (mode === 'research') {
                    result = await generateResearchProposal(grant, companyProfile, proposal.id);
                } else {
                    throw new Error("Invalid mode");
                }

                // Update proposal with result (if not already updated by service)
                if (mode === 'fast') {
                    await supabase
                        .from('proposals')
                        .update({
                            full_proposal: result,
                            status: 'completed',
                            generation_time: Math.floor((Date.now() - startTime) / 1000)
                        })
                        .eq('id', proposal.id);
                }

            } catch (err) {
                console.error('Proposal generation failed:', err);
                await supabase
                    .from('proposals')
                    .update({ status: 'failed', full_proposal: `Error: ${err.message}` })
                    .eq('id', proposal.id);
            }
        })();

    } catch (error) {
        console.error('Error in proposal route:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
