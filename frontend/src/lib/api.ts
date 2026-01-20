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

export async function exportDocumentPdf(id: number) {
    const res = await fetch(`${API_BASE_URL}/documents/${id}/export/pdf`);
    if (!res.ok) throw new Error('Failed to export PDF');
    return res.blob();
}

export async function exportDocumentDocx(id: number) {
    const res = await fetch(`${API_BASE_URL}/documents/${id}/export/docx`);
    if (!res.ok) throw new Error('Failed to export Word document');
    return res.blob();
}

// Team API - Get team members and activity
export async function fetchTeam() {
    const res = await fetch(`${API_BASE_URL}/team`);
    if (!res.ok) throw new Error('Failed to fetch team data');
    return res.json();
}

// Alerts API - Get alerts based on deadlines
export async function fetchAlerts() {
    const res = await fetch(`${API_BASE_URL}/alerts`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
}
