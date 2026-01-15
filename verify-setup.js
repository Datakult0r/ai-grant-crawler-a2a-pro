#!/usr/bin/env node
/**
 * Setup Verification Script
 *
 * This script verifies that all components are properly configured:
 * - Backend API endpoints
 * - Frontend configuration
 * - Python AI-Researcher integration
 * - Environment variables
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying AI Grant Crawler Setup...\n');

let errors = [];
let warnings = [];
let success = [];

// Check 1: Verify backend .env file
console.log('📋 Checking backend configuration...');
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(backendEnvPath)) {
  const envContent = fs.readFileSync(backendEnvPath, 'utf8');

  // Check for required API keys
  const requiredKeys = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];

  const optionalKeys = [
    'OPENROUTER_API_KEY',
    'OPENAI_API_KEY',
    'GEMINI_API_KEY',
    'DEEPSEEK_API_KEY',
  ];

  requiredKeys.forEach(key => {
    if (envContent.includes(`${key}=`) && !envContent.includes(`${key}=""`)) {
      success.push(`✅ ${key} is set`);
    } else {
      errors.push(`❌ ${key} is missing or empty`);
    }
  });

  const hasAnyAIKey = optionalKeys.some(key =>
    envContent.includes(`${key}=`) && !envContent.includes(`${key}=""`)
  );

  if (hasAnyAIKey) {
    success.push(`✅ At least one AI API key is configured`);
  } else {
    warnings.push(`⚠️  No AI API keys configured (OPENROUTER, OPENAI, GEMINI, or DEEPSEEK)`);
  }

  // Check AI_RESEARCHER_ENABLED
  if (envContent.includes('AI_RESEARCHER_ENABLED="true"')) {
    success.push(`✅ AI-Researcher integration is enabled`);
  } else {
    warnings.push(`⚠️  AI-Researcher integration is disabled`);
  }

} else {
  errors.push(`❌ Backend .env file not found. Copy .env.example to .env`);
}

// Check 2: Verify Python AI-Researcher files
console.log('\n🐍 Checking Python AI-Researcher integration...');
const pythonFiles = [
  'backend/ai-researcher/grant_research_bridge.py',
  'backend/ai-researcher/ai_lab_repo.py',
  'backend/ai-researcher/agents.py',
  'backend/ai-researcher/agent_models.py',
];

pythonFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    success.push(`✅ ${path.basename(file)} exists`);
  } else {
    errors.push(`❌ ${file} is missing`);
  }
});

// Check 3: Verify frontend configuration
console.log('\n🎨 Checking frontend configuration...');
const frontendApiFile = path.join(__dirname, 'frontend', 'src', 'lib', 'api.ts');
if (fs.existsSync(frontendApiFile)) {
  const apiContent = fs.readFileSync(frontendApiFile, 'utf8');
  if (apiContent.includes('API_BASE_URL')) {
    success.push(`✅ Frontend API configuration exists`);
  }
} else {
  errors.push(`❌ Frontend api.ts configuration missing`);
}

// Check 4: Verify package.json dependencies
console.log('\n📦 Checking dependencies...');
const rootPackage = path.join(__dirname, 'package.json');
if (fs.existsSync(rootPackage)) {
  const pkg = JSON.parse(fs.readFileSync(rootPackage, 'utf8'));

  if (pkg.dependencies && pkg.dependencies.puppeteer) {
    success.push(`✅ Puppeteer dependency configured for auto-accept`);
  } else {
    warnings.push(`⚠️  Puppeteer not installed - auto-accept feature won't work`);
  }

  if (pkg.devDependencies && pkg.devDependencies.concurrently) {
    success.push(`✅ Concurrently installed for parallel dev servers`);
  }
} else {
  errors.push(`❌ Root package.json missing`);
}

// Check 5: Verify critical backend files
console.log('\n🔌 Checking API endpoints...');
const researchRouter = path.join(__dirname, 'backend', 'src', 'routes', 'research.js');
if (fs.existsSync(researchRouter)) {
  const routerContent = fs.readFileSync(researchRouter, 'utf8');
  if (routerContent.includes('/:id/research')) {
    success.push(`✅ Research SSE endpoint configured`);
  }
} else {
  errors.push(`❌ Research router missing`);
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION RESULTS');
console.log('='.repeat(60));

if (success.length > 0) {
  console.log('\n✅ SUCCESS:');
  success.forEach(msg => console.log(`  ${msg}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(msg => console.log(`  ${msg}`));
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(msg => console.log(`  ${msg}`));
}

console.log('\n' + '='.repeat(60));

if (errors.length === 0) {
  console.log('\n✨ Setup verification complete! You\'re ready to run the system.');
  console.log('\n📝 Next steps:');
  console.log('  1. Run: npm install');
  console.log('  2. Install Python deps: cd backend/ai-researcher && pip install -r requirements.txt');
  console.log('  3. Start dev servers: npm run dev');
  console.log('  4. (Optional) Auto-accept: npm run dev:with-auto');
  process.exit(0);
} else {
  console.log('\n⚠️  Please fix the errors above before running the system.');
  process.exit(1);
}
