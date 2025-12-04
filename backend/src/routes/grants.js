import express from 'express';
import { supabase } from '../config/database.js';

const router = express.Router();

const MOCK_GRANTS = [
    {
        id: 1,
        name: "Horizon Europe AI Innovation Grant",
        source: "Horizon EU",
        region: "EU",
        amount: "€2,500,000",
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        relevance: 95,
        status: "active",
        category: "AI",
        description: "Funding for breakthrough AI research and development.",
        eligibility: "Consortium of at least 3 EU member states."
    },
    {
        id: 2,
        name: "Portugal 2030 Digital Transformation",
        source: "COMPETE 2030",
        region: "Portugal",
        amount: "€150,000",
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        relevance: 88,
        status: "active",
        category: "Web3",
        description: "Support for SMEs digitizing their operations.",
        eligibility: "Portuguese SMEs."
    },
    {
        id: 3,
        name: "Green AI Initiative",
        source: "FCT",
        region: "Portugal",
        amount: "€50,000",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        relevance: 75,
        status: "closing_soon",
        category: "AI",
        description: "Projects focusing on energy-efficient AI models.",
        eligibility: "Research institutions and startups."
    }
];

// Helper to calculate days left
const withDaysLeft = (grants) => grants.map(g => ({
    ...g,
    daysLeft: Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24))
}));

// GET /api/grants
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('grants')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('Database error, falling back to mock data:', error.message);
            return res.json(withDaysLeft(MOCK_GRANTS));
        }
        res.json(withDaysLeft(data));
    } catch (e) {
        console.error('Unexpected error in /api/grants:', e);
        res.json(withDaysLeft(MOCK_GRANTS));
    }
});

// GET /api/grants/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('grants')
            .select('*, research_data(*)')
            .eq('id', id)
            .single();

        if (error) {
            console.warn(`Database error for grant ${id}, falling back to mock data:`, error.message);
            const mockGrant = MOCK_GRANTS.find(g => g.id == id);
            if (mockGrant) {
                return res.json({ ...mockGrant, research_data: null, daysLeft: Math.ceil((new Date(mockGrant.deadline) - new Date()) / (1000 * 60 * 60 * 24)) });
            }
            return res.status(404).json({ error: 'Grant not found' });
        }

        // Calculate days left for real data
        if (data) {
             data.daysLeft = Math.ceil((new Date(data.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        }
        res.json(data);
    } catch (e) {
         console.error(`Unexpected error in /api/grants/${id}:`, e);
         const mockGrant = MOCK_GRANTS.find(g => g.id == id);
         if (mockGrant) {
             return res.json({ ...mockGrant, research_data: null, daysLeft: Math.ceil((new Date(mockGrant.deadline) - new Date()) / (1000 * 60 * 60 * 24)) });
         }
         return res.status(404).json({ error: 'Grant not found' });
    }
});

// GET /api/grants/calendar
router.get('/calendar', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('grants')
            .select('id, name, deadline')
            .not('deadline', 'is', null)
            .order('deadline', { ascending: true });

        const grantsToUse = error ? MOCK_GRANTS : data;

        // Group by month
        const calendar = grantsToUse.reduce((acc, grant) => {
            const month = new Date(grant.deadline).toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!acc[month]) acc[month] = [];
            acc[month].push(grant);
            return acc;
        }, {});

        res.json(calendar);
    } catch (e) {
        console.error('Unexpected error in /api/grants/calendar:', e);
        // Fallback for calendar
         const calendar = MOCK_GRANTS.reduce((acc, grant) => {
            const month = new Date(grant.deadline).toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!acc[month]) acc[month] = [];
            acc[month].push(grant);
            return acc;
        }, {});
        res.json(calendar);
    }
});

export default router;
