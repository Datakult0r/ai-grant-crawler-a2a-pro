import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Available AI models with their capabilities and costs
const AVAILABLE_MODELS = {
  'gemini-3-pro': {
    name: 'Gemini 3 Pro',
    provider: 'Google',
    costPer1kTokens: 0,
    capabilities: ['reasoning', 'writing', 'coding', 'math'],
    quality: 'high',
    speed: 'fast',
    description: 'Top reasoning (72.85%), 95.67% math accuracy. FREE via Gemini API.'
  },
  'gemini-2.0-pro': {
    name: 'Gemini 2.0 Pro',
    provider: 'Google',
    costPer1kTokens: 0,
    capabilities: ['reasoning', 'writing', 'coding'],
    quality: 'medium',
    speed: 'fast',
    description: 'Reliable performance, good for general tasks. FREE via Gemini API.'
  },
  'claude-opus-4.5': {
    name: 'Claude Opus 4.5',
    provider: 'Anthropic',
    costPer1kTokens: 0.015,
    capabilities: ['reasoning', 'writing', 'coding', 'agentic'],
    quality: 'premium',
    speed: 'medium',
    description: 'Best reasoning (69.77%), excellent writing, 87.1% LiveCodeBench.'
  },
  'claude-sonnet-4.5': {
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    costPer1kTokens: 0.009,
    capabilities: ['reasoning', 'writing'],
    quality: 'high',
    speed: 'fast',
    description: 'Great writing + reasoning balance. Good for prose-heavy tasks.'
  },
  'gpt-5-codex': {
    name: 'GPT-5 Codex',
    provider: 'OpenAI',
    costPer1kTokens: 0.005,
    capabilities: ['coding', 'math', 'reasoning'],
    quality: 'premium',
    speed: 'medium',
    description: '98.67% math accuracy, 84% LiveCodeBench. Best for code generation.'
  }
};

// Agent roles with their requirements
const AGENT_ROLES = {
  phd_student: {
    name: 'PhD Student',
    description: 'Conducts deep research and literature review',
    requiredCapabilities: ['reasoning', 'writing'],
    defaultModel: 'claude-opus-4.5',
    lowCostModel: 'gemini-3-pro',
    estimatedTokens: 100000
  },
  postdoc: {
    name: 'Postdoc',
    description: 'Analyzes methodology and validates research approach',
    requiredCapabilities: ['reasoning', 'math'],
    defaultModel: 'gemini-3-pro',
    lowCostModel: 'gemini-3-pro',
    estimatedTokens: 80000
  },
  professor: {
    name: 'Professor',
    description: 'Provides strategic guidance and writes executive summary',
    requiredCapabilities: ['reasoning', 'writing'],
    defaultModel: 'claude-sonnet-4.5',
    lowCostModel: 'gemini-3-pro',
    estimatedTokens: 60000
  },
  ml_engineer: {
    name: 'ML Engineer',
    description: 'Designs technical architecture and implementation plan',
    requiredCapabilities: ['coding', 'math'],
    defaultModel: 'gpt-5-codex',
    lowCostModel: 'gemini-3-pro',
    estimatedTokens: 70000
  },
  sw_engineer: {
    name: 'Software Engineer',
    description: 'Implements code and handles technical integration',
    requiredCapabilities: ['coding', 'agentic'],
    defaultModel: 'claude-opus-4.5',
    lowCostModel: 'gemini-3-pro',
    estimatedTokens: 90000
  },
  reviewers: {
    name: 'Reviewers',
    description: 'Reviews and critiques the proposal for quality',
    requiredCapabilities: ['reasoning'],
    defaultModel: 'gemini-3-pro',
    lowCostModel: 'gemini-3-pro',
    estimatedTokens: 50000
  }
};

// Quality presets
const QUALITY_PRESETS = {
  'low-cost': {
    name: 'Low Cost (FREE)',
    description: 'Uses only free Gemini models. Best for testing and budget-conscious usage.',
    estimatedCost: 0,
    estimatedTime: '5-10 minutes',
    models: {
      phd_student: 'gemini-3-pro',
      postdoc: 'gemini-3-pro',
      professor: 'gemini-3-pro',
      ml_engineer: 'gemini-3-pro',
      sw_engineer: 'gemini-3-pro',
      reviewers: 'gemini-3-pro'
    }
  },
  'balanced': {
    name: 'Balanced',
    description: 'Mix of free and premium models. Good quality at moderate cost.',
    estimatedCost: 3.50,
    estimatedTime: '8-12 minutes',
    models: {
      phd_student: 'claude-sonnet-4.5',
      postdoc: 'gemini-3-pro',
      professor: 'gemini-3-pro',
      ml_engineer: 'gemini-3-pro',
      sw_engineer: 'claude-sonnet-4.5',
      reviewers: 'gemini-3-pro'
    }
  },
  'premium': {
    name: 'Premium Quality',
    description: 'Uses optimal models for each role. Best quality, highest cost.',
    estimatedCost: 7.00,
    estimatedTime: '10-15 minutes',
    models: {
      phd_student: 'claude-opus-4.5',
      postdoc: 'gemini-3-pro',
      professor: 'claude-sonnet-4.5',
      ml_engineer: 'gpt-5-codex',
      sw_engineer: 'claude-opus-4.5',
      reviewers: 'gemini-3-pro'
    }
  }
};

// In-memory storage for user settings (in production, this would be in the database)
let currentSettings = {
  preset: 'low-cost',
  customModels: null,
  lowCostMode: process.env.LOW_COST_MODE !== 'false'
};

// Get available models
router.get('/models', (req, res) => {
  res.json({
    models: AVAILABLE_MODELS,
    agentRoles: AGENT_ROLES
  });
});

// Get quality presets
router.get('/presets', (req, res) => {
  res.json({
    presets: QUALITY_PRESETS,
    currentPreset: currentSettings.preset
  });
});

// Get current configuration
router.get('/current', (req, res) => {
  const preset = QUALITY_PRESETS[currentSettings.preset];
  const models = currentSettings.customModels || preset.models;
  
  // Calculate estimated cost
  let estimatedCost = 0;
  for (const [role, modelId] of Object.entries(models)) {
    const model = AVAILABLE_MODELS[modelId];
    const agent = AGENT_ROLES[role];
    if (model && agent) {
      estimatedCost += (model.costPer1kTokens * agent.estimatedTokens) / 1000;
    }
  }

  res.json({
    preset: currentSettings.preset,
    presetName: preset.name,
    models,
    estimatedCost: Math.round(estimatedCost * 100) / 100,
    estimatedTime: preset.estimatedTime,
    lowCostMode: currentSettings.lowCostMode,
    agentDetails: Object.entries(models).map(([role, modelId]) => ({
      role,
      roleName: AGENT_ROLES[role]?.name,
      roleDescription: AGENT_ROLES[role]?.description,
      model: modelId,
      modelName: AVAILABLE_MODELS[modelId]?.name,
      modelProvider: AVAILABLE_MODELS[modelId]?.provider,
      estimatedCost: Math.round((AVAILABLE_MODELS[modelId]?.costPer1kTokens * AGENT_ROLES[role]?.estimatedTokens / 1000) * 100) / 100
    }))
  });
});

// Update configuration
router.post('/update', (req, res) => {
  const { preset, customModels } = req.body;

  if (preset && !QUALITY_PRESETS[preset]) {
    return res.status(400).json({ error: 'Invalid preset' });
  }

  if (customModels) {
    // Validate custom models
    for (const [role, modelId] of Object.entries(customModels)) {
      if (!AGENT_ROLES[role]) {
        return res.status(400).json({ error: `Invalid agent role: ${role}` });
      }
      if (!AVAILABLE_MODELS[modelId]) {
        return res.status(400).json({ error: `Invalid model: ${modelId}` });
      }
    }
    currentSettings.customModels = customModels;
    currentSettings.preset = 'custom';
  } else if (preset) {
    currentSettings.preset = preset;
    currentSettings.customModels = null;
  }

  res.json({ 
    success: true, 
    message: 'Configuration updated',
    currentSettings 
  });
});

// Estimate cost for a specific configuration
router.post('/estimate', (req, res) => {
  const { models } = req.body;
  
  if (!models) {
    return res.status(400).json({ error: 'Models configuration required' });
  }

  let totalCost = 0;
  let totalTokens = 0;
  const breakdown = [];

  for (const [role, modelId] of Object.entries(models)) {
    const model = AVAILABLE_MODELS[modelId];
    const agent = AGENT_ROLES[role];
    
    if (model && agent) {
      const cost = (model.costPer1kTokens * agent.estimatedTokens) / 1000;
      totalCost += cost;
      totalTokens += agent.estimatedTokens;
      breakdown.push({
        role,
        roleName: agent.name,
        model: modelId,
        modelName: model.name,
        tokens: agent.estimatedTokens,
        cost: Math.round(cost * 100) / 100
      });
    }
  }

  res.json({
    totalCost: Math.round(totalCost * 100) / 100,
    totalTokens,
    breakdown
  });
});

// Reset to default (low-cost mode)
router.post('/reset', (req, res) => {
  currentSettings = {
    preset: 'low-cost',
    customModels: null,
    lowCostMode: true
  };

  res.json({ 
    success: true, 
    message: 'Configuration reset to low-cost mode',
    currentSettings 
  });
});

export default router;
