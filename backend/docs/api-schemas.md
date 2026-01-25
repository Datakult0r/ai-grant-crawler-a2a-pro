# AI Grant Crawler API Schemas

This document describes all API endpoints and their response schemas.

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### Grants

#### GET /api/grants
Returns all grants from the database.

**Response:**
```json
[
  {
    "id": 1,
    "name": "COMPETE 2030 - Digital Transformation",
    "description": "Support for SMEs implementing digital transformation",
    "source": "COMPETE",
    "source_url": "https://example.com/grant",
    "funding_amount": "€800,000",
    "deadline": "2026-01-22",
    "relevance_score": 85,
    "status": "active",
    "region": "Portugal",
    "category": "AI",
    "created_at": "2026-01-15T00:00:00.000Z"
  }
]
```

### Alerts

#### GET /api/alerts
Returns grants grouped by deadline urgency.

**Response:**
```json
{
  "urgent": [
    {
      "id": 1,
      "name": "Grant Name",
      "source": "COMPETE",
      "deadline": "2026-01-20",
      "daysLeft": 5,
      "amount": "€800,000",
      "relevanceScore": 85
    }
  ],
  "warning": [],
  "info": [],
  "completed": []
}
```

**Categories:**
- `urgent`: Deadline < 7 days
- `warning`: Deadline 7-14 days
- `info`: Deadline 14-30 days
- `completed`: Proposals with status='submitted'

### Tracker

#### GET /api/tracker
Returns proposals grouped by status for kanban board.

**Response:**
```json
{
  "applications": {
    "draft": [],
    "applied": [
      {
        "id": 1,
        "grantId": 1,
        "grant": "Horizon Europe - AI Innovation",
        "amount": "€2.5M",
        "submitted": "2024-11-15",
        "status": "applied",
        "mode": "fast",
        "source": "Horizon Europe"
      }
    ],
    "review": [],
    "awarded": [],
    "rejected": []
  },
  "stats": {
    "total": 5,
    "draft": 0,
    "applied": 2,
    "review": 2,
    "awarded": 1,
    "rejected": 0
  }
}
```

#### PATCH /api/tracker/:id
Update proposal status (for drag-and-drop).

**Request Body:**
```json
{
  "status": "review"
}
```

**Valid statuses:** `draft`, `applied`, `review`, `awarded`, `rejected`

**Response:**
```json
{
  "success": true,
  "proposal": { ... }
}
```

### Predictor

#### GET /api/predictor
Returns win probability prediction based on grants and proposals.

**Response:**
```json
{
  "prediction": {
    "overallScore": 84,
    "factors": [
      { "name": "Technical Excellence", "score": 92, "weight": 30 },
      { "name": "Team Qualifications", "score": 88, "weight": 25 },
      { "name": "Budget Alignment", "score": 76, "weight": 20 },
      { "name": "Innovation Level", "score": 90, "weight": 15 },
      { "name": "Market Potential", "score": 72, "weight": 10 }
    ],
    "recommendations": [
      "Strengthen budget justification with more detailed cost breakdown",
      "Add 2-3 letters of support from industry partners"
    ]
  },
  "historicalData": [
    { "month": "Jan", "rate": 65 },
    { "month": "Feb", "rate": 68 }
  ],
  "topGrants": [
    {
      "id": 1,
      "name": "Grant Name",
      "relevanceScore": 85,
      "source": "COMPETE",
      "amount": "€800,000"
    }
  ]
}
```

#### GET /api/predictor/:grantId
Returns prediction for a specific grant.

**Response:**
```json
{
  "grant": {
    "id": 1,
    "name": "Grant Name",
    "source": "COMPETE",
    "amount": "€800,000",
    "deadline": "2026-01-22"
  },
  "prediction": {
    "overallScore": 84,
    "factors": [...],
    "confidence": "High"
  }
}
```

### Documents

#### GET /api/documents
Returns all generated documents (proposals).

**Response:**
```json
{
  "documentTypes": [
    {
      "id": "proposals",
      "title": "Generated Proposals",
      "description": "AI-generated grant proposals",
      "status": "ready",
      "count": 5
    }
  ],
  "recentDocuments": [
    {
      "id": 1,
      "name": "Proposal_Grant_Name_fast.md",
      "grantName": "Grant Name",
      "grantId": 1,
      "mode": "fast",
      "status": "draft",
      "size": "250 KB",
      "date": "2024-11-20",
      "hasContent": true
    }
  ],
  "stats": {
    "total": 5,
    "ready": 4,
    "generating": 1
  }
}
```

#### GET /api/documents/:id
Returns specific document content.

**Response:**
```json
{
  "id": 1,
  "grantId": 1,
  "grantName": "Grant Name",
  "mode": "fast",
  "status": "draft",
  "generationTime": 30,
  "createdAt": "2024-11-20T00:00:00.000Z",
  "content": {
    "executiveSummary": "...",
    "fullProposal": "...",
    "budget": {...},
    "timeline": {...}
  },
  "grant": {
    "name": "Grant Name",
    "source": "COMPETE",
    "amount": "€800,000",
    "deadline": "2026-01-22",
    "description": "..."
  }
}
```

#### GET /api/documents/:id/download
Downloads document as markdown file.

**Response:** `text/markdown` file

### Team

#### GET /api/team
Returns team members and activity.

**Response:**
```json
{
  "teamMembers": [
    {
      "id": "1",
      "name": "Ana Silva",
      "role": "Principal Investigator",
      "initials": "AS",
      "color": "bg-primary",
      "assigned": 5,
      "email": "ana.silva@example.com"
    }
  ],
  "activities": [
    {
      "user": "Ana Silva",
      "action": "created",
      "target": "EIC Accelerator application",
      "time": "2 hours ago"
    }
  ],
  "comments": [
    {
      "user": "João Santos",
      "initials": "JS",
      "color": "bg-secondary",
      "grant": "Horizon Europe - AI",
      "text": "Great progress on the technical approach section.",
      "time": "3 hours ago"
    }
  ],
  "stats": {
    "totalMembers": 4,
    "activeProposals": 5,
    "totalAssigned": 18
  }
}
```

#### GET /api/team/members
Returns just team members list.

**Response:**
```json
{
  "members": [
    {
      "id": "1",
      "name": "Ana Silva",
      "role": "Principal Investigator",
      "initials": "AS",
      "color": "bg-primary"
    }
  ]
}
```

### Proposal

#### POST /api/proposal/generate
Generates a new proposal for a grant.

**Request Body:**
```json
{
  "grantId": 1,
  "companyProfile": {
    "name": "Company Name",
    "description": "Company description"
  },
  "mode": "fast"
}
```

**Modes:**
- `fast`: Uses Gemini for quick generation (~30s)
- `research`: Uses Agent Laboratory for deep research (5-15min)

**Response:**
```json
{
  "success": true,
  "proposal": {
    "id": 1,
    "executiveSummary": "...",
    "fullProposal": "...",
    "generationTime": 30
  }
}
```

### Research (SSE)

#### GET /api/research/:grantId
Server-Sent Events stream for research progress.

**Event Types:**
- `phases_info`: Initial phases information
- `heartbeat`: Keep-alive signal (every 10s)
- `phase_update`: Phase progress update
- `status`: Status message
- `complete`: Research complete
- `error`: Error occurred
- `timeout`: Research timed out
- `fallback`: Fallback to Fast Track mode

**Example Events:**
```
data: {"type":"phases_info","phases":[...],"totalPhases":7}

data: {"type":"heartbeat","timestamp":"2026-01-15T00:00:00.000Z","currentPhase":0}

data: {"type":"complete","proposal":{...}}
```

### Jules (AI Assistant)

#### POST /api/jules/chat
Chat with Jules AI assistant.

**Request Body:**
```json
{
  "message": "Help me improve my proposal",
  "context": {
    "grantId": 1,
    "proposalId": 1
  }
}
```

**Response:**
```json
{
  "response": "Here are some suggestions...",
  "suggestions": [...]
}
```

#### GET /api/jules/health
Check Jules health status.

**Response:**
```json
{
  "status": "ok",
  "model": "gemini-2.0-flash-exp"
}
```

### Health

#### GET /health
API health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-15T00:00:00.000Z",
  "environment": "development"
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found
- `500`: Internal Server Error
