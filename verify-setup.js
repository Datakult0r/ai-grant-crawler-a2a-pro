#!/usr/bin/env node
/**
 * Setup Verification Script
 *
 * This script verifies that all components are properly configured:
 * - Environment variables (required and optional)
 * - Database connectivity (Supabase)
 * - Backend API endpoints
 * - Frontend configuration
 * - Python AI-Researcher integration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying AI Grant Crawler Setup...\n');

let errors = [];
let warnings = [];
let success = [];

// Environment variable definitions with descriptions
const ENV_VARS = {
  required: [
    {
      key: 'SUPABASE_URL',
      description: 'Supabase project URL (e.g., https://your-project.supabase.co)',
      errorMsg: 'Get your Supabase URL from: https://supabase.com/dashboard -> Project Settings -> API'
    },
    {
      key: 'SUPABASE_ANON_KEY',
      description: 'Supabase anonymous/public key for client-side access',
      errorMsg: 'Get your anon key from: https://supabase.com/dashboard -> Project Settings -> API -> anon/public'
    },
    {
      key: 'GEMINI_API_KEY',
      description: 'Google Gemini API key (FREE) - required for Fast Track proposals',
      errorMsg: 'Get a FREE Gemini API key from: https://makersuite.google.com/app/apikey'
    }
  ],
  optional: [
    {
      key: 'FIRECRAWL_API_KEY',
      description: 'Firecrawl API key for web scraping grant sources',
      warningMsg: 'Grant discovery/crawling will be limited without Firecrawl. Get key from: https://firecrawl.dev'
    },
    {
      key: 'OPENROUTER_API_KEY',
      description: 'OpenRouter API key for premium AI models (Claude, GPT-5)',
      warningMsg: 'Research Track will use Gemini fallback. For premium models: https://openrouter.ai/keys'
    },
    {
      key: 'OPENAI_API_KEY',
      description: 'OpenAI API key (alternative to OpenRouter)',
      warningMsg: null
    },
    {
      key: 'DEEPSEEK_API_KEY',
      description: 'DeepSeek API key (cost-effective alternative)',
      warningMsg: null
    }
  ],
  settings: [
    {
      key: 'AI_RESEARCHER_ENABLED',
      description: 'Enable/disable AI-Researcher integration',
      default: 'true'
    },
    {
      key: 'LOW_COST_MODE',
      description: 'Use only free Gemini models for all agents',
      default: 'true'
    },
    {
      key: 'PORT',
      description: 'Backend server port',
      default: '3000'
    },
    {
      key: 'NODE_ENV',
      description: 'Node environment (development/production)',
      default: 'development'
    }
  ]
};

// Parse .env file into object
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[match[1].trim()] = value;
      }
    }
  });
  
  return env;
}

// Check database connectivity
async function checkDatabaseConnectivity(env) {
  console.log('\n🔌 Checking database connectivity...');
  
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    errors.push('❌ Cannot test database - Supabase credentials missing');
    return false;
  }
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    
    const { data, error } = await supabase
      .from('grants')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        warnings.push('⚠️  Database connected but "grants" table not found. Run schema.sql in Supabase SQL editor.');
        return true;
      }
      throw error;
    }
    
    success.push('✅ Database connectivity verified');
    success.push(`✅ Grants table accessible (${data ? data.length : 0} sample rows)`);
    return true;
    
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      warnings.push('⚠️  @supabase/supabase-js not installed. Run: cd backend && npm install');
      return false;
    }
    errors.push(`❌ Database connection failed: ${err.message}`);
    errors.push('   -> Check SUPABASE_URL and SUPABASE_ANON_KEY are correct');
    return false;
  }
}

// Main verification function
async function runVerification() {
  // Check 1: Verify backend .env file exists
  console.log('📋 Checking backend configuration...');
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  
  if (!fs.existsSync(backendEnvPath)) {
    errors.push('❌ Backend .env file not found');
    errors.push('   -> Copy backend/.env.example to backend/.env and fill in your values');
    printResults();
    return;
  }
  
  const env = parseEnvFile(backendEnvPath);
  
  // Check required environment variables
  console.log('\n🔑 Checking required environment variables...');
  ENV_VARS.required.forEach(({ key, description, errorMsg }) => {
    const value = env[key];
    if (value && value.length > 0 && !value.includes('your-')) {
      success.push(`✅ ${key} is set`);
    } else {
      errors.push(`❌ ${key} is missing or invalid`);
      errors.push(`   -> ${description}`);
      errors.push(`   -> ${errorMsg}`);
    }
  });
  
  // Check optional environment variables
  console.log('\n🔧 Checking optional environment variables...');
  ENV_VARS.optional.forEach(({ key, description, warningMsg }) => {
    const value = env[key];
    if (value && value.length > 0 && !value.includes('your-') && !value.includes('sk-or-...')) {
      success.push(`✅ ${key} is set`);
    } else if (warningMsg) {
      warnings.push(`⚠️  ${key} not configured`);
      warnings.push(`   -> ${warningMsg}`);
    }
  });
  
  // Check settings
  console.log('\n⚙️  Checking application settings...');
  ENV_VARS.settings.forEach(({ key, description, default: defaultVal }) => {
    const value = env[key];
    if (value) {
      success.push(`✅ ${key}=${value}`);
    } else {
      success.push(`✅ ${key} will use default: ${defaultVal}`);
    }
  });
  
  // Check 2: Database connectivity
  await checkDatabaseConnectivity(env);
  
  // Check 3: Verify Python AI-Researcher files
  console.log('\n🐍 Checking Python AI-Researcher integration...');
  const pythonFiles = [
    'backend/ai-researcher/grant_research_bridge.py',
    'backend/ai-researcher/ai_lab_repo.py',
    'backend/ai-researcher/agents.py',
    'backend/ai-researcher/agent_models.py',
    'backend/ai-researcher/requirements.txt',
  ];
  
  pythonFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      success.push(`✅ ${path.basename(file)} exists`);
    } else {
      errors.push(`❌ ${file} is missing`);
    }
  });
  
  // Check 4: Verify frontend configuration
  console.log('\n🎨 Checking frontend configuration...');
  const frontendApiFile = path.join(__dirname, 'frontend', 'src', 'lib', 'api.ts');
  if (fs.existsSync(frontendApiFile)) {
    const apiContent = fs.readFileSync(frontendApiFile, 'utf8');
    if (apiContent.includes('API_BASE_URL') || apiContent.includes('VITE_API_URL')) {
      success.push('✅ Frontend API configuration exists');
    }
  } else {
    errors.push('❌ Frontend api.ts configuration missing');
  }
  
  // Check 5: Verify package.json dependencies
  console.log('\n📦 Checking dependencies...');
  const rootPackage = path.join(__dirname, 'package.json');
  if (fs.existsSync(rootPackage)) {
    const pkg = JSON.parse(fs.readFileSync(rootPackage, 'utf8'));
    
    if (pkg.dependencies && pkg.dependencies.puppeteer) {
      success.push('✅ Puppeteer dependency configured for auto-accept');
    } else {
      warnings.push('⚠️  Puppeteer not installed - auto-accept feature won\'t work');
    }
    
    if (pkg.devDependencies && pkg.devDependencies.concurrently) {
      success.push('✅ Concurrently installed for parallel dev servers');
    }
  } else {
    errors.push('❌ Root package.json missing');
  }
  
  // Check 6: Verify critical backend files
  console.log('\n🔌 Checking API endpoints...');
  const researchRouter = path.join(__dirname, 'backend', 'src', 'routes', 'research.js');
  if (fs.existsSync(researchRouter)) {
    const routerContent = fs.readFileSync(researchRouter, 'utf8');
    if (routerContent.includes('/:id/research')) {
      success.push('✅ Research SSE endpoint configured');
    }
  } else {
    errors.push('❌ Research router missing');
  }
  
  printResults();
}

function printResults() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 VERIFICATION RESULTS');
  console.log('='.repeat(70));
  
  if (success.length > 0) {
    console.log('\n✅ SUCCESS (' + success.length + ' checks passed):');
    success.forEach(msg => console.log(`  ${msg}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (' + warnings.length + '):');
    warnings.forEach(msg => console.log(`  ${msg}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS (' + errors.length + '):');
    errors.forEach(msg => console.log(`  ${msg}`));
  }
  
  console.log('\n' + '='.repeat(70));
  
  console.log('\n📈 Summary:');
  console.log(`   Passed: ${success.length} | Warnings: ${warnings.length} | Errors: ${errors.length}`);
  
  if (errors.length === 0) {
    console.log('\n✨ Setup verification complete! You\'re ready to run the system.');
    console.log('\n📝 Next steps:');
    console.log('  1. Run: npm run install:all');
    console.log('  2. Install Python deps: cd backend/ai-researcher && pip install -r requirements.txt');
    console.log('  3. Start dev servers: npm run dev');
    console.log('  4. (Optional) Auto-accept: npm run dev:with-auto');
    process.exit(0);
  } else {
    console.log('\n⚠️  Please fix the errors above before running the system.');
    console.log('\n💡 Quick fix commands:');
    console.log('  cp backend/.env.example backend/.env  # Create .env file');
    console.log('  # Then edit backend/.env with your API keys');
    process.exit(1);
  }
}

// Run verification
runVerification().catch(err => {
  console.error('Verification script error:', err);
  process.exit(1);
});
