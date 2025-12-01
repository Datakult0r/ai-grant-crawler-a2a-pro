import { env } from '$env/dynamic/public';

export const API_BASE_URL = env.PUBLIC_API_URL || 'http://localhost:3000/api';

export async function fetchGrants() {
    const res = await fetch(`${API_BASE_URL}/grants`);
    if (!res.ok) throw new Error('Failed to fetch grants');
    return res.json();
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
