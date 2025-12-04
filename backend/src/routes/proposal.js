import express from 'express';
import { supabase } from '../config/database.js';
import { generateProposalFast } from '../services/geminiService.js';
import { generateResearchProposal } from '../services/aiResearcher.js';
import { addClient, sendEvent, sendLog } from '../utils/sse.js';

const router = express.Router();

// Mock grants data (duplicated from grants.js for fallback consistency)
const MOCK_GRANTS = [
    {
        id: 1,
        name: "Horizon Europe AI Innovation Grant",
        category: "AI",
        amount: "€2,500,000",
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        eligibility: "Consortium of at least 3 EU member states."
    },
    {
        id: 2,
        name: "Portugal 2030 Digital Transformation",
        category: "Web3",
        amount: "€150,000",
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        eligibility: "Portuguese SMEs."
    },
    {
        id: 3,
        name: "Green AI Initiative",
        category: "AI",
        amount: "€50,000",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        eligibility: "Research institutions and startups."
    }
];

/**
 * GET /api/proposal/:id/stream
 * Connect to SSE stream for a specific proposal
 */
router.get('/:id/stream', (req, res) => {
    const { id } = req.params;

    // SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    addClient(id, res);

    // Send initial connection message
    sendEvent(id, 'connected', { message: 'Connected to proposal stream' });
});

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
        // 1. Fetch grant details (Try DB first, then Mock)
        let grant;
        const { data: dbGrant, error: grantError } = await supabase
            .from('grants')
            .select('*')
            .eq('id', grantId)
            .single();

        if (grantError || !dbGrant) {
            console.warn(`Grant lookup failed: ${grantError?.message || 'Not found'}. Using mock data.`);
            grant = MOCK_GRANTS.find(g => g.id == grantId);
            if (!grant) {
                return res.status(404).json({ error: 'Grant not found' });
            }
        } else {
            grant = dbGrant;
        }

        // 2. Create proposal record (Try DB, fail gracefully to Mock ID)
        let proposalId;
        const { data: proposal, error: proposalError } = await supabase
            .from('proposals')
            .insert({
                grant_id: grantId,
                mode: mode,
                status: 'processing'
            })
            .select()
            .single();

        if (proposalError) {
            console.warn('Proposal creation failed (DB likely missing). Using mock proposal ID.');
            proposalId = Math.floor(Math.random() * 100000); // Mock ID
        } else {
            proposalId = proposal.id;
        }

        // 3. Start generation (Async)
        // We return the proposal ID immediately so the frontend can poll or listen for SSE
        res.json({ proposalId: proposalId, status: 'processing' });

        // Background processing
        (async () => {
            try {
                let result;
                const startTime = Date.now();

                if (mode === 'fast') {
                    // Check if we can run fast mode (needs Gemini Key)
                    if (process.env.GEMINI_API_KEY === 'PLACEHOLDER_GEMINI_KEY') {
                         result = `# Proposal for ${grant.name}\n\n## Executive Summary\n(Mock generated due to missing API Key)\n\nThis is a simulated proposal for ${companyProfile.name}.`;
                    } else {
                        result = await generateProposalFast(grant, companyProfile);
                    }
                } else if (mode === 'research') {
                    // Pass proposalId for SSE updates
                    result = await generateResearchProposal(grant, companyProfile, proposalId);
                } else {
                    throw new Error("Invalid mode");
                }

                // Update proposal with result (if DB works)
                if ((mode === 'fast' || result) && !proposalError) {
                     await supabase
                        .from('proposals')
                        .update({
                            full_proposal: result,
                            status: 'completed',
                            generation_time: Math.floor((Date.now() - startTime) / 1000)
                        })
                        .eq('id', proposalId);
                }
                
                if (mode === 'research') {
                     sendEvent(proposalId, 'complete', { result });
                }

            } catch (err) {
                console.error('Proposal generation failed:', err);
                if (!proposalError) {
                    await supabase
                        .from('proposals')
                        .update({ status: 'failed', full_proposal: `Error: ${err.message}` })
                        .eq('id', proposalId);
                }
                
                sendLog(proposalId, `Error: ${err.message}`, 'System', 'Failed');
                sendEvent(proposalId, 'error', { error: err.message });
            }
        })();

    } catch (error) {
        console.error('Error in proposal route:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
