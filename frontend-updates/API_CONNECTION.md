# API Connection Guide

## Overview
The backend is now ready to accept connections from your existing frontend.

## Base URL
The backend is running on: `http://localhost:3000` (or your Railway URL in production).

## Endpoints

### 1. List Grants
- **URL**: `/api/grants`
- **Method**: `GET`
- **Response**: Array of grant objects.

### 2. Get Grant Details
- **URL**: `/api/grants/:id`
- **Method**: `GET`
- **Response**: Grant object with `research_data`.

### 3. Generate Proposal (Dual Mode)
- **URL**: `/api/proposal/generate`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "grantId": 1,
    "companyProfile": { ... },
    "mode": "fast" // or "research"
  }
  ```
- **Response**: `{ "proposalId": 123, "status": "processing" }`

## Connecting in Frontend Code

In your frontend API client (e.g., `api.ts` or `utils/api.js`), update the base URL:

```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const fetchGrants = async () => {
  const res = await fetch(`${API_BASE_URL}/grants`);
  return res.json();
};

export const generateProposal = async (grantId, companyProfile, mode) => {
  const res = await fetch(`${API_BASE_URL}/proposal/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grantId, companyProfile, mode })
  });
  return res.json();
};
```

## Real-time Updates
For long-running "Research Mode" tasks, consider polling `/api/proposal/:id` or implementing the SSE endpoint if you added it to the frontend.
