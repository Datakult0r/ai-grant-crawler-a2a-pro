import express from 'express';
import { supabase } from '../config/database.js';

const router = express.Router();

// Model presets with cost estimates
const MODEL_PRESETS = {
  'low-cost': {
    name: 'Low Cost',
    description: 'Uses only free Gemini models',
    estimatedCost: 0,
    models: {
      phd_student: 'gemini-2.0-flash',
      postdoc: 'gemini-2.0-flash',
      professor: 'gemini-2.0-flash',
      ml_engineer: 'gemini-2.0-flash',
      sw_engineer: 'gemini-2.0-flash',
      reviewer1: 'gemini-2.0-flash',
      reviewer2: 'gemini-2.0-flash'
    }
  },
  'balanced': {
    name: 'Balanced',
    description: 'Mix of quality and cost efficiency',
    estimatedCost: 3.50,
    models: {
      phd_student: 'claude-sonnet-4-20250514',
      postdoc: 'gemini-2.0-flash',
      professor: 'claude-sonnet-4-20250514',
      ml_engineer: 'gpt-4o',
      sw_engineer: 'gemini-2.0-flash',
      reviewer1: 'gemini-2.0-flash',
      reviewer2: 'gemini-2.0-flash'
    }
  },
  'premium': {
    name: 'Premium',
    description: 'Best models for highest quality output',
    estimatedCost: 7.00,
    models: {
      phd_student: 'claude-opus-4-20250514',
      postdoc: 'gemini-2.5-pro-preview-05-06',
      professor: 'claude-sonnet-4-20250514',
      ml_engineer: 'gpt-4o',
      sw_engineer: 'claude-opus-4-20250514',
      reviewer1: 'gemini-2.5-pro-preview-05-06',
      reviewer2: 'gemini-2.5-pro-preview-05-06'
    }
  }
};

// Available models for custom configuration
const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', costPer1k: 0 },
  { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro', provider: 'Google', costPer1k: 0.00125 },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'Anthropic', costPer1k: 0.003 },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'Anthropic', costPer1k: 0.015 },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', costPer1k: 0.005 },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', costPer1k: 0.00015 },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', costPer1k: 0.00014 }
];

// Get available presets and models
router.get('/presets', (req, res) => {
  res.json({
    presets: Object.entries(MODEL_PRESETS).map(([key, value]) => ({
      id: key,
      ...value
    })),
    availableModels: AVAILABLE_MODELS
  });
});

// Get current user settings (requires auth)
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Get user settings from Supabase
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[SETTINGS] Get error:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }

    // Return default settings if none exist
    if (!data) {
      return res.json({
        preset: 'low-cost',
        customModels: null,
        models: MODEL_PRESETS['low-cost'].models,
        estimatedCost: MODEL_PRESETS['low-cost'].estimatedCost
      });
    }

    // Calculate effective models based on preset or custom
    const effectiveModels = data.custom_models || MODEL_PRESETS[data.preset]?.models || MODEL_PRESETS['low-cost'].models;
    const estimatedCost = data.custom_models 
      ? calculateCustomCost(data.custom_models)
      : MODEL_PRESETS[data.preset]?.estimatedCost || 0;

    res.json({
      preset: data.preset,
      customModels: data.custom_models,
      models: effectiveModels,
      estimatedCost
    });
  } catch (err) {
    console.error('[SETTINGS] Get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings (requires auth)
router.put('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { preset, customModels } = req.body;

    // Validate preset
    if (preset && !MODEL_PRESETS[preset] && preset !== 'custom') {
      return res.status(400).json({ error: 'Invalid preset' });
    }

    // Validate custom models if provided
    if (customModels) {
      const validModelIds = AVAILABLE_MODELS.map(m => m.id);
      for (const [agent, modelId] of Object.entries(customModels)) {
        if (!validModelIds.includes(modelId)) {
          return res.status(400).json({ error: `Invalid model: ${modelId}` });
        }
      }
    }

    // Upsert settings
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        preset: preset || 'low-cost',
        custom_models: customModels || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('[SETTINGS] Update error:', error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }

    const effectiveModels = data.custom_models || MODEL_PRESETS[data.preset]?.models || MODEL_PRESETS['low-cost'].models;
    const estimatedCost = data.custom_models 
      ? calculateCustomCost(data.custom_models)
      : MODEL_PRESETS[data.preset]?.estimatedCost || 0;

    res.json({
      success: true,
      preset: data.preset,
      customModels: data.custom_models,
      models: effectiveModels,
      estimatedCost
    });
  } catch (err) {
    console.error('[SETTINGS] Update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get effective models for research (internal use)
router.get('/effective-models', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    // If no auth, return low-cost defaults
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({
        models: MODEL_PRESETS['low-cost'].models,
        preset: 'low-cost'
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.json({
        models: MODEL_PRESETS['low-cost'].models,
        preset: 'low-cost'
      });
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('preset, custom_models')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return res.json({
        models: MODEL_PRESETS['low-cost'].models,
        preset: 'low-cost'
      });
    }

    const effectiveModels = data.custom_models || MODEL_PRESETS[data.preset]?.models || MODEL_PRESETS['low-cost'].models;

    res.json({
      models: effectiveModels,
      preset: data.preset
    });
  } catch (err) {
    console.error('[SETTINGS] Get effective models error:', err);
    res.json({
      models: MODEL_PRESETS['low-cost'].models,
      preset: 'low-cost'
    });
  }
});

function calculateCustomCost(customModels) {
  let totalCost = 0;
  const avgTokensPerAgent = 5000; // Rough estimate
  
  for (const modelId of Object.values(customModels)) {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (model) {
      totalCost += model.costPer1k * (avgTokensPerAgent / 1000);
    }
  }
  
  return Math.round(totalCost * 100) / 100;
}

export default router;
