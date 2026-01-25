/**
 * Database Seed Script
 * Creates 5-10 realistic grants for testing and demo purposes
 * 
 * Usage:
 *   npm run seed        - Add seed data to database
 *   npm run seed:reset  - Clear existing data and reseed
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Calculate deadline dates relative to today
function getDeadline(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Realistic grant seed data
const seedGrants = [
  {
    name: 'COMPETE 2030 - Digital Transformation',
    description: 'Support for SMEs implementing digital transformation projects including AI, automation, and Industry 4.0 technologies. Funding covers software development, hardware acquisition, and training costs.',
    source: 'COMPETE',
    source_url: 'https://www.compete2030.gov.pt/digital-transformation',
    amount: '€800,000',
    deadline: getDeadline(7), // 7 days from now - URGENT
    relevance: 85,
    relevance_score: 85,
    status: 'active',
    region: 'Portugal',
    country: 'Portugal',
    eligibility: 'SMEs registered in Portugal with at least 2 years of operation',
    category: 'AI',
    days_left: 7,
    keywords: ['digital transformation', 'AI', 'automation', 'Industry 4.0']
  },
  {
    name: 'Horizon Europe - AI Innovation Hub',
    description: 'European Commission funding for collaborative AI research projects. Focus areas include trustworthy AI, AI for climate, and AI in healthcare. Requires consortium of at least 3 EU member states.',
    source: 'Horizon Europe',
    source_url: 'https://ec.europa.eu/horizon-europe/ai-innovation',
    amount: '€2,500,000',
    deadline: getDeadline(14), // 14 days from now - WARNING
    relevance: 92,
    relevance_score: 92,
    status: 'active',
    region: 'EU',
    country: 'EU',
    eligibility: 'Research institutions, universities, and companies from EU member states',
    category: 'AI',
    days_left: 14,
    keywords: ['AI', 'research', 'innovation', 'trustworthy AI', 'healthcare']
  },
  {
    name: 'EIC Accelerator - Deep Tech',
    description: 'European Innovation Council funding for breakthrough deep tech startups. Combines grant funding with equity investment. Focus on disruptive technologies with high growth potential.',
    source: 'EIC',
    source_url: 'https://eic.ec.europa.eu/accelerator',
    amount: '€2,000,000',
    deadline: getDeadline(30), // 30 days from now - INFO
    relevance: 88,
    relevance_score: 88,
    status: 'active',
    region: 'EU',
    country: 'EU',
    eligibility: 'Startups and SMEs with breakthrough technology',
    category: 'AI',
    days_left: 30,
    keywords: ['deep tech', 'startup', 'innovation', 'equity', 'breakthrough']
  },
  {
    name: 'ANI Innovation Voucher',
    description: 'Portuguese National Innovation Agency funding for R&D projects. Supports collaboration between companies and research institutions. Fast-track approval process.',
    source: 'ANI',
    source_url: 'https://www.ani.pt/innovation-voucher',
    amount: '€500,000',
    deadline: getDeadline(21), // 21 days from now
    relevance: 78,
    relevance_score: 78,
    status: 'active',
    region: 'Portugal',
    country: 'Portugal',
    eligibility: 'Portuguese companies partnering with certified R&D institutions',
    category: 'AI',
    days_left: 21,
    keywords: ['R&D', 'innovation', 'research', 'collaboration']
  },
  {
    name: 'NSF AI Research Institutes',
    description: 'National Science Foundation funding for AI research institutes in the United States. Focus on fundamental AI research, AI education, and workforce development.',
    source: 'NSF',
    source_url: 'https://www.nsf.gov/ai-institutes',
    amount: '$500,000',
    deadline: getDeadline(21), // 21 days from now
    relevance: 75,
    relevance_score: 75,
    status: 'active',
    region: 'USA',
    country: 'USA',
    eligibility: 'US universities and research institutions',
    category: 'AI',
    days_left: 21,
    keywords: ['AI research', 'education', 'workforce', 'fundamental research']
  },
  {
    name: 'IAPMEI SI Innovation',
    description: 'Portuguese SME support program for innovation projects. Covers product development, process innovation, and market expansion. Non-repayable grant up to 45% of eligible costs.',
    source: 'IAPMEI',
    source_url: 'https://www.iapmei.pt/si-innovation',
    amount: '€350,000',
    deadline: getDeadline(45), // 45 days from now
    relevance: 72,
    relevance_score: 72,
    status: 'active',
    region: 'Portugal',
    country: 'Portugal',
    eligibility: 'Portuguese SMEs with innovative projects',
    category: 'AI',
    days_left: 45,
    keywords: ['SME', 'innovation', 'product development', 'market expansion']
  },
  {
    name: 'Horizon Europe - Green AI',
    description: 'EU funding for AI solutions addressing climate change and environmental challenges. Projects must demonstrate measurable environmental impact and sustainability.',
    source: 'Horizon Europe',
    source_url: 'https://ec.europa.eu/horizon-europe/green-ai',
    amount: '€1,800,000',
    deadline: getDeadline(60), // 60 days from now
    relevance: 80,
    relevance_score: 80,
    status: 'active',
    region: 'EU',
    country: 'EU',
    eligibility: 'EU organizations with environmental AI solutions',
    category: 'AI',
    days_left: 60,
    keywords: ['green AI', 'climate', 'sustainability', 'environment']
  },
  {
    name: 'COMPETE 2030 - Internationalization',
    description: 'Support for Portuguese companies expanding to international markets. Covers market research, trade missions, and international marketing activities.',
    source: 'COMPETE',
    source_url: 'https://www.compete2030.gov.pt/internationalization',
    amount: '€200,000',
    deadline: getDeadline(10), // 10 days from now - WARNING
    relevance: 65,
    relevance_score: 65,
    status: 'active',
    region: 'Portugal',
    country: 'Portugal',
    eligibility: 'Portuguese companies with export potential',
    category: 'OEPUGenAI',
    days_left: 10,
    keywords: ['internationalization', 'export', 'market expansion', 'trade']
  }
];

// Seed proposal for completed alert demo
const seedProposal = {
  grant_id: null, // Will be set after grant insertion
  mode: 'fast',
  executive_summary: 'AI-powered healthcare diagnostics platform leveraging machine learning for early disease detection.',
  full_proposal: '# Executive Summary\n\nOur proposal outlines an innovative AI-powered healthcare diagnostics platform...',
  status: 'submitted',
  gemini_model: 'gemini-2.0-flash-exp',
  generation_time: 28
};

async function clearData() {
  console.log('Clearing existing seed data...');
  
  // Delete proposals first (foreign key constraint)
  const { error: proposalsError } = await supabase
    .from('proposals')
    .delete()
    .neq('id', 0); // Delete all
  
  if (proposalsError) {
    console.warn('Warning clearing proposals:', proposalsError.message);
  }
  
  // Delete grants
  const { error: grantsError } = await supabase
    .from('grants')
    .delete()
    .neq('id', 0); // Delete all
  
  if (grantsError) {
    console.warn('Warning clearing grants:', grantsError.message);
  }
  
  console.log('Existing data cleared.');
}

async function seedDatabase() {
  console.log('Seeding database with demo grants...\n');
  
  // Insert grants
  const { data: insertedGrants, error: grantsError } = await supabase
    .from('grants')
    .insert(seedGrants)
    .select();
  
  if (grantsError) {
    console.error('Error inserting grants:', grantsError.message);
    process.exit(1);
  }
  
  console.log(`Inserted ${insertedGrants.length} grants:`);
  insertedGrants.forEach(grant => {
    const urgency = grant.days_left <= 7 ? 'URGENT' : grant.days_left <= 14 ? 'WARNING' : 'INFO';
    console.log(`  - [${urgency}] ${grant.name} (${grant.source}) - ${grant.amount} - ${grant.days_left} days left`);
  });
  
  // Insert a submitted proposal for the ANI grant (to show in completed alerts)
  const aniGrant = insertedGrants.find(g => g.source === 'ANI');
  if (aniGrant) {
    seedProposal.grant_id = aniGrant.id;
    
    const { data: insertedProposal, error: proposalError } = await supabase
      .from('proposals')
      .insert(seedProposal)
      .select()
      .single();
    
    if (proposalError) {
      console.warn('Warning inserting proposal:', proposalError.message);
    } else {
      console.log(`\nInserted submitted proposal for: ${aniGrant.name}`);
    }
  }
  
  console.log('\nSeed complete!');
  console.log('\nTo verify, visit:');
  console.log('  - Discovery page: http://localhost:5173/');
  console.log('  - Alerts page: http://localhost:5173/alerts');
}

async function main() {
  const args = process.argv.slice(2);
  const isReset = args.includes('--reset') || args.includes('-r');
  
  console.log('=================================');
  console.log('  AI Grant Crawler - Seed Script');
  console.log('=================================\n');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
  }
  
  if (isReset) {
    await clearData();
    console.log('');
  }
  
  await seedDatabase();
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
