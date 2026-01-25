import { env } from '$env/dynamic/public';

export const API_BASE_URL = env.PUBLIC_API_URL || 'http://localhost:3000/api';
export const IS_DEMO = env.PUBLIC_IS_DEMO === 'true';

// Demo data for fallback when backend is unavailable
const DEMO_GRANTS = [
    {
        id: 1,
        name: 'COMPETE 2030 - Digital Transformation',
        description: 'Support for SMEs implementing digital transformation projects including AI, automation, and Industry 4.0 technologies.',
        source: 'COMPETE',
        source_url: 'https://www.compete2030.gov.pt/digital-transformation',
        amount: '€800,000',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        relevance_score: 85,
        status: 'active',
        region: 'Portugal',
        category: 'AI',
        days_left: 7
    },
    {
        id: 2,
        name: 'Horizon Europe - AI Innovation Hub',
        description: 'European Commission funding for collaborative AI research projects. Focus areas include trustworthy AI, AI for climate, and AI in healthcare.',
        source: 'Horizon Europe',
        source_url: 'https://ec.europa.eu/horizon-europe/ai-innovation',
        amount: '€2,500,000',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        relevance_score: 92,
        status: 'active',
        region: 'EU',
        category: 'AI',
        days_left: 14
    },
    {
        id: 3,
        name: 'EIC Accelerator - Deep Tech',
        description: 'European Innovation Council funding for breakthrough deep tech startups. Combines grant funding with equity investment.',
        source: 'EIC',
        source_url: 'https://eic.ec.europa.eu/accelerator',
        amount: '€2,000,000',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        relevance_score: 88,
        status: 'active',
        region: 'EU',
        category: 'AI',
        days_left: 30
    },
    {
        id: 4,
        name: 'ANI Innovation Voucher',
        description: 'Portuguese National Innovation Agency funding for R&D projects. Supports collaboration between companies and research institutions.',
        source: 'ANI',
        source_url: 'https://www.ani.pt/innovation-voucher',
        amount: '€500,000',
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        relevance_score: 78,
        status: 'active',
        region: 'Portugal',
        category: 'AI',
        days_left: 21
    },
    {
        id: 5,
        name: 'NSF AI Research Institutes',
        description: 'National Science Foundation funding for AI research institutes. Focus on fundamental AI research, AI education, and workforce development.',
        source: 'NSF',
        source_url: 'https://www.nsf.gov/ai-institutes',
        amount: '$500,000',
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        relevance_score: 75,
        status: 'active',
        region: 'USA',
        category: 'AI',
        days_left: 21
    }
];

export async function fetchGrants() {
    // Use demo data if IS_DEMO is enabled
    if (IS_DEMO) {
        console.log('[DEMO MODE] Using demo grants data');
        return DEMO_GRANTS;
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/grants`);
        if (!res.ok) throw new Error('Failed to fetch grants');
        return res.json();
    } catch (error) {
        // Fallback to demo data on error if IS_DEMO is not explicitly false
        console.warn('Failed to fetch grants from API, using demo data:', error);
        return DEMO_GRANTS;
    }
}

export async function generateProposal(grantId: number, companyProfile: any, mode: 'fast' | 'research') {
    const res = await fetch(`${API_BASE_URL}/proposal/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId, companyProfile, mode })
    });
    if (!res.ok) throw new Error('Failed to generate proposal');
    return res.json();
}

export async function askJules(message: string, context: any = {}) {
    const res = await fetch(`${API_BASE_URL}/jules/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context })
    });
    if (!res.ok) throw new Error('Failed to chat with Jules');
    return res.json();
}

export async function checkJulesHealth() {
    const res = await fetch(`${API_BASE_URL}/jules/health`);
    if (!res.ok) throw new Error('Failed to check Jules health');
    return res.json();
}

// Tracker API - Get proposals grouped by status for kanban board
export async function fetchTracker() {
    const res = await fetch(`${API_BASE_URL}/tracker`);
    if (!res.ok) throw new Error('Failed to fetch tracker data');
    return res.json();
}

export async function updateProposalStatus(id: number, status: string) {
    const res = await fetch(`${API_BASE_URL}/tracker/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update proposal status');
    return res.json();
}

// Predictor API - Get win probability predictions
export async function fetchPredictor() {
    const res = await fetch(`${API_BASE_URL}/predictor`);
    if (!res.ok) throw new Error('Failed to fetch predictor data');
    return res.json();
}

export async function fetchGrantPrediction(grantId: number) {
    const res = await fetch(`${API_BASE_URL}/predictor/${grantId}`);
    if (!res.ok) throw new Error('Failed to fetch grant prediction');
    return res.json();
}

// Documents API - Get generated documents
export async function fetchDocuments() {
    const res = await fetch(`${API_BASE_URL}/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
}

export async function fetchDocument(id: number) {
    const res = await fetch(`${API_BASE_URL}/documents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch document');
    return res.json();
}

export async function downloadDocument(id: number) {
    const res = await fetch(`${API_BASE_URL}/documents/${id}/download`);
    if (!res.ok) throw new Error('Failed to download document');
    return res.blob();
}

// Team API - Get team members and activity
export async function fetchTeam() {
    const res = await fetch(`${API_BASE_URL}/team`);
    if (!res.ok) throw new Error('Failed to fetch team data');
    return res.json();
}

// Alert types
export interface Alert {
    id: number | string;
    type: 'urgent' | 'warning' | 'info' | 'success';
    title: string;
    description: string;
    daysLeft: number | null;
    grant: string;
    grantId: number;
    amount: string;
}

export interface AlertsResponse {
    urgent: Alert[];
    warning: Alert[];
    info: Alert[];
    completed: Alert[];
    stats: {
        urgent: number;
        warning: number;
        info: number;
        completed: number;
        total: number;
    };
}

// Alerts API - Get alerts based on deadlines
export async function fetchAlerts(): Promise<AlertsResponse> {
    const res = await fetch(`${API_BASE_URL}/alerts`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
}
