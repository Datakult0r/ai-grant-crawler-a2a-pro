/**
 * Server-Sent Events (SSE) Manager
 * Handles real-time updates for proposal generation
 */

const clients = new Map(); // proposalId -> Set of response objects

export const addClient = (proposalId, res) => {
    if (!clients.has(proposalId)) {
        clients.set(proposalId, new Set());
    }
    clients.get(proposalId).add(res);

    // Remove client on close
    res.on('close', () => {
        if (clients.has(proposalId)) {
            clients.get(proposalId).delete(res);
            if (clients.get(proposalId).size === 0) {
                clients.delete(proposalId);
            }
        }
    });
};

export const sendEvent = (proposalId, eventType, data) => {
    if (clients.has(proposalId)) {
        const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        clients.get(proposalId).forEach(client => client.write(message));
    }
};

// Helper to send log messages
export const sendLog = (proposalId, message, agent = 'System', status = 'Processing') => {
    sendEvent(proposalId, 'log', {
        timestamp: new Date().toLocaleTimeString(),
        message,
        agent,
        status
    });
};

// Helper to send phase updates
export const sendPhase = (proposalId, phaseIndex) => {
    sendEvent(proposalId, 'phase', { phase: phaseIndex });
};

// Helper to send progress updates
export const sendProgress = (proposalId, percentage) => {
    sendEvent(proposalId, 'progress', { percentage });
};
