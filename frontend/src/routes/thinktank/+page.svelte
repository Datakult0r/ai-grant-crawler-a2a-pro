<script lang="ts">
  import { Brain, Play, Download, FileText, CheckCircle, Users, Lightbulb, Zap, MessageSquare } from 'lucide-svelte';

  let selectedGrant = $state<string>('');
  let isRunning = $state(false);
  let progress = $state(0);
  let currentPhase = $state(0);
  let activities = $state<Array<{text: string, agent: string, timestamp: string, status: string}>>([]);
  let showOutput = $state(false);

  const grants = [
    { id: '1', name: 'SBIR Phase II - Advanced AI Systems', amount: '$750,000', deadline: '45 days' },
    { id: '2', name: 'NSF Innovation Corps', amount: '$50,000', deadline: '60 days' },
    { id: '3', name: 'DOE Clean Energy Grant', amount: '$2,000,000', deadline: '90 days' }
  ];

  const phases = [
    { name: 'Initial Analysis', icon: FileText, color: 'text-purple-400' },
    { name: 'Brainstorming', icon: Users, color: 'text-blue-400' },
    { name: 'Deep Research', icon: Brain, color: 'text-green-400' },
    { name: 'Synthesis', icon: Lightbulb, color: 'text-cyan-400' },
    { name: 'Writing', icon: FileText, color: 'text-orange-400' },
    { name: 'Peer Review', icon: CheckCircle, color: 'text-pink-400' },
    { name: 'Finalization', icon: Zap, color: 'text-yellow-400' }
  ];

  const researchers = [
    { id: 1, name: 'Lead Researcher', color: 'bg-purple-500', position: { x: 15, y: 60 }, role: 'lead' },
    { id: 2, name: 'Domain Expert', color: 'bg-blue-500', position: { x: 35, y: 40 }, role: 'expert' },
    { id: 3, name: 'Innovation Specialist', color: 'bg-green-500', position: { x: 55, y: 60 }, role: 'innovation' },
    { id: 4, name: 'Technical Writer', color: 'bg-cyan-500', position: { x: 35, y: 80 }, role: 'writer' },
    { id: 5, name: 'Critical Reviewer', color: 'bg-orange-500', position: { x: 75, y: 50 }, role: 'reviewer' }
  ];

  let researcherPositions = $state(researchers.map(r => ({ ...r })));
  let activeSpeaker = $state<number | null>(null);
  let speechBubble = $state<string>('');
  let whiteboardIdeas = $state<string[]>([]);

  const activityMessages = [
    { agent: 'Lead Researcher', message: 'Analyzing grant requirements and success criteria...', status: 'Researching' },
    { agent: 'Domain Expert', message: 'Identifying key innovation opportunities in the field...', status: 'Researching' },
    { agent: 'Lead Researcher', message: 'Let\'s gather at the meeting table to discuss findings', status: 'Discussing' },
    { agent: 'Innovation Specialist', message: 'I found 3 unique angles we could pursue...', status: 'Discussing' },
    { agent: 'Technical Writer', message: 'Starting abstract draft based on discussion...', status: 'Writing' },
    { agent: 'Domain Expert', message: 'Researching similar successful proposals...', status: 'Researching' },
    { agent: 'Critical Reviewer', message: 'Reviewing technical approach for feasibility...', status: 'Reviewing' },
    { agent: 'Lead Researcher', message: 'Synthesizing all findings into coherent narrative...', status: 'Writing' },
    { agent: 'Technical Writer', message: 'Drafting methodology and timeline sections...', status: 'Writing' },
    { agent: 'Critical Reviewer', message: 'Providing feedback on innovation claims...', status: 'Reviewing' },
    { agent: 'Innovation Specialist', message: 'Adding impact assessment and broader implications...', status: 'Writing' },
    { agent: 'Lead Researcher', message: 'Final review and polish of complete proposal...', status: 'Reviewing' }
  ];

  function startThinktank() {
    if (!selectedGrant) return;
    
    isRunning = true;
    progress = 0;
    currentPhase = 0;
    activities = [];
    whiteboardIdeas = [];
    showOutput = false;

    // Simulate AI thinktank process
    let activityIndex = 0;
    let progressInterval = setInterval(() => {
      progress += 1;
      
      // Update phase based on progress
      currentPhase = Math.floor((progress / 100) * 7);
      
      // Add activities
      if (progress % 8 === 0 && activityIndex < activityMessages.length) {
        const activity = activityMessages[activityIndex];
        activities = [...activities, {
          text: activity.message,
          agent: activity.agent,
          timestamp: new Date().toLocaleTimeString(),
          status: activity.status
        }];
        activityIndex++;
      }

      // Animate researchers based on phase
      animateResearchersByPhase(currentPhase);

      // Add whiteboard ideas
      if (progress % 15 === 0 && whiteboardIdeas.length < 6) {
        const ideas = ['Innovation Framework', 'Technical Architecture', 'Impact Metrics', 'Budget Model', 'Risk Mitigation', 'Success Criteria'];
        whiteboardIdeas = [...whiteboardIdeas, ideas[whiteboardIdeas.length]];
      }

      // Show speech bubbles
      if (progress % 10 === 0) {
        activeSpeaker = Math.floor(Math.random() * 5);
        speechBubble = activityMessages[Math.floor(Math.random() * activityMessages.length)].message.substring(0, 50) + '...';
        setTimeout(() => { activeSpeaker = null; }, 3000);
      }

      if (progress >= 100) {
        clearInterval(progressInterval);
        isRunning = false;
        showOutput = true;
        activities = [...activities, {
          text: 'Research paper completed successfully!',
          agent: 'System',
          timestamp: new Date().toLocaleTimeString(),
          status: 'Complete'
        }];
      }
    }, 200);
  }

  function animateResearchersByPhase(phase: number) {
    switch(phase) {
      case 0: // Initial Analysis - at desks
        researcherPositions = researchers.map(r => ({ ...r }));
        break;
      case 1: // Brainstorming - gather at table (center)
        researcherPositions = researchers.map((r, i) => ({
          ...r,
          position: {
            x: 50 + Math.cos(i * Math.PI * 2 / 5) * 15,
            y: 50 + Math.sin(i * Math.PI * 2 / 5) * 15
          }
        }));
        break;
      case 2: // Deep Research - spread out
        researcherPositions = [
          { ...researchers[0], position: { x: 10, y: 30 } },
          { ...researchers[1], position: { x: 80, y: 30 } },
          { ...researchers[2], position: { x: 10, y: 70 } },
          { ...researchers[3], position: { x: 80, y: 70 } },
          { ...researchers[4], position: { x: 45, y: 50 } }
        ];
        break;
      case 3: // Synthesis - lead at whiteboard
        researcherPositions = [
          { ...researchers[0], position: { x: 20, y: 30 } }, // Lead at whiteboard
          { ...researchers[1], position: { x: 40, y: 50 } },
          { ...researchers[2], position: { x: 50, y: 50 } },
          { ...researchers[3], position: { x: 60, y: 50 } },
          { ...researchers[4], position: { x: 70, y: 50 } }
        ];
        break;
      case 4: // Writing - writer at desk
        researcherPositions = researchers.map(r => ({ ...r }));
        break;
      case 5: // Peer Review - passing documents
        researcherPositions = researchers.map((r, i) => ({
          ...r,
          position: {
            x: 30 + i * 15,
            y: 50
          }
        }));
        break;
      case 6: // Finalization - celebration circle
        researcherPositions = researchers.map((r, i) => ({
          ...r,
          position: {
            x: 50 + Math.cos(i * Math.PI * 2 / 5) * 20,
            y: 50 + Math.sin(i * Math.PI * 2 / 5) * 20
          }
        }));
        break;
    }
  }
</script>

<div class="min-h-screen p-8">
  <div class="max-w-[1800px] mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        AI Thinktank Workspace
      </h1>
      <p class="text-muted-foreground">Collaborative AI research team for grant proposal development</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left Sidebar - Grant Selection -->
      <div class="lg:col-span-3">
        <div class="glass-card p-6 space-y-6 sticky top-8">
          <div>
            <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText class="w-5 h-5 text-purple-400" />
              Grant Selection
            </h2>
            
            <select 
              bind:value={selectedGrant}
              class="w-full bg-background/50 border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a grant...</option>
              {#each grants as grant}
                <option value={grant.id}>{grant.name}</option>
              {/each}
            </select>
          </div>

          {#if selectedGrant}
            {@const grant = grants.find(g => g.id === selectedGrant)}
            <div class="space-y-3 text-sm">
              <div class="p-3 rounded-lg bg-muted/30">
                <div class="text-muted-foreground">Amount</div>
                <div class="text-lg font-semibold text-green-400">{grant?.amount}</div>
              </div>
              <div class="p-3 rounded-lg bg-muted/30">
                <div class="text-muted-foreground">Deadline</div>
                <div class="text-lg font-semibold text-orange-400">{grant?.deadline}</div>
              </div>
              <div class="p-3 rounded-lg bg-muted/30">
                <div class="text-muted-foreground">Success Factors</div>
                <ul class="mt-2 space-y-1 text-xs">
                  <li class="flex items-start gap-2">
                    <CheckCircle class="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Strong technical innovation</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <CheckCircle class="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Clear commercialization path</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <CheckCircle class="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Experienced team</span>
                  </li>
                </ul>
              </div>
            </div>

            <button 
              onclick={startThinktank}
              disabled={isRunning}
              class="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold
                     neon-glow-purple hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
            >
              {#if isRunning}
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Running...
              {:else}
                <Play class="w-5 h-5" />
                Start AI Thinktank
              {/if}
            </button>
          {/if}

          <!-- Phase Progress -->
          {#if isRunning || showOutput}
            <div class="space-y-2">
              <h3 class="text-sm font-semibold">Research Phases</h3>
              {#each phases as phase, i}
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center 
                              {i <= currentPhase ? 'bg-primary/20 ' + phase.color : 'bg-muted/30 text-muted-foreground'}">
                    <phase.icon class="w-4 h-4" />
                  </div>
                  <span class="text-xs {i <= currentPhase ? phase.color : 'text-muted-foreground'}">{phase.name}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Center - Visualization Canvas -->
      <div class="lg:col-span-6">
        <div class="glass-card p-8 min-h-[600px]">
          <div class="relative w-full h-[600px] bg-gradient-to-br from-background/50 to-muted/30 rounded-2xl overflow-hidden">
            {#if !selectedGrant}
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center text-muted-foreground">
                  <Brain class="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Select a grant to start the AI thinktank</p>
                </div>
              </div>
            {:else if !isRunning && !showOutput}
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 neon-glow-purple flex items-center justify-center">
                    <Play class="w-10 h-10 text-white" />
                  </div>
                  <p class="text-muted-foreground">Ready to start research thinktank</p>
                </div>
              </div>
            {:else}
              <!-- Office Environment -->
              <div class="absolute inset-0">
                <!-- Whiteboard (top left) -->
                <div class="absolute top-8 left-8 w-48 h-32 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-3">
                  <div class="text-xs text-purple-400 font-semibold mb-2">Ideas Board</div>
                  <div class="space-y-1">
                    {#each whiteboardIdeas as idea}
                      <div class="text-[10px] text-foreground/80 animate-pulse">• {idea}</div>
                    {/each}
                  </div>
                </div>

                <!-- Meeting Table (center) -->
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                            w-40 h-24 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full border border-primary/30">
                </div>

                <!-- Researchers -->
                {#each researcherPositions as researcher, i}
                  <div 
                    class="absolute w-16 h-16 transition-all duration-[2000ms] ease-in-out"
                    style="left: {researcher.position.x}%; top: {researcher.position.y}%; transform: translate(-50%, -50%);"
                  >
                    <!-- Avatar -->
                    <div class="w-16 h-16 rounded-full {researcher.color} neon-glow-subtle flex items-center justify-center shadow-lg">
                      <span class="text-white font-bold text-xl">{researcher.name.charAt(0)}</span>
                    </div>
                    
                    <!-- Name tag -->
                    <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] text-center whitespace-nowrap text-foreground/80 font-medium">
                      {researcher.name.split(' ')[0]}
                    </div>

                    <!-- Speech Bubble -->
                    {#if activeSpeaker === i}
                      <div class="absolute -top-16 left-1/2 transform -translate-x-1/2 w-48 
                                  bg-white/95 dark:bg-background/95 backdrop-blur-sm rounded-2xl p-3 
                                  border border-primary/30 shadow-lg animate-fade-in z-10">
                        <div class="text-[10px] text-foreground leading-tight">{speechBubble}</div>
                        <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white/95 dark:bg-background/95 rotate-45 border-r border-b border-primary/30"></div>
                      </div>
                    {/if}
                  </div>
                {/each}

                <!-- Progress Bar -->
                <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-2/3">
                  <div class="mb-2 flex justify-between text-xs">
                    <span class="text-muted-foreground">Overall Progress</span>
                    <span class="text-primary font-semibold">{progress}%</span>
                  </div>
                  <div class="h-3 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-gradient-to-r from-purple-500 to-blue-500 neon-glow-purple transition-all duration-300"
                      style="width: {progress}%"
                    ></div>
                  </div>
                  {#if currentPhase < phases.length}
                    <div class="mt-1 text-xs text-center {phases[currentPhase].color}">
                      {phases[currentPhase].name}
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Right Sidebar - Activity Feed -->
      <div class="lg:col-span-3">
        <div class="glass-card p-6 sticky top-8">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare class="w-5 h-5 text-blue-400" />
            Live Activity
          </h2>

          <div class="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
            {#if activities.length === 0}
              <p class="text-sm text-muted-foreground text-center py-8">
                Activity log will appear here when thinktank starts
              </p>
            {/if}

            {#each activities as activity}
              <div class="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1 animate-fade-in">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-foreground">{activity.agent}</span>
                  <span class="text-[10px] text-muted-foreground">{activity.timestamp}</span>
                </div>
                <p class="text-xs text-muted-foreground">{activity.text}</p>
                <div>
                  <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium
                               {activity.status === 'Researching' ? 'bg-blue-500/20 text-blue-400' : ''}
                               {activity.status === 'Discussing' ? 'bg-purple-500/20 text-purple-400' : ''}
                               {activity.status === 'Writing' ? 'bg-green-500/20 text-green-400' : ''}
                               {activity.status === 'Reviewing' ? 'bg-orange-500/20 text-orange-400' : ''}
                               {activity.status === 'Complete' ? 'bg-cyan-500/20 text-cyan-400' : ''}">
                    {activity.status}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Output Panel (Expandable) -->
    {#if showOutput}
      <div class="mt-6 glass-card p-8 space-y-6 animate-fade-in">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold flex items-center gap-2">
            <FileText class="w-6 h-6 text-green-400" />
            Generated Research Proposal
          </h2>
          <div class="flex gap-2">
            <button class="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium flex items-center gap-2">
              <Download class="w-4 h-4" />
              PDF
            </button>
            <button class="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium flex items-center gap-2">
              <Download class="w-4 h-4" />
              Word
            </button>
            <button class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium flex items-center gap-2">
              <FileText class="w-4 h-4" />
              Apply to Grant Writer
            </button>
          </div>
        </div>

        <div class="space-y-4 text-sm">
          <div class="p-4 rounded-lg bg-muted/30">
            <h3 class="font-semibold text-purple-400 mb-2">Abstract</h3>
            <p class="text-muted-foreground leading-relaxed">
              This proposal presents an innovative approach to [grant focus area] that addresses critical challenges in the field. 
              Our interdisciplinary team has identified a novel methodology that combines cutting-edge AI techniques with domain expertise 
              to achieve measurable impact. The proposed research will advance the state-of-the-art while providing practical solutions 
              that align with the funding agency's strategic priorities.
            </p>
          </div>

          <div class="p-4 rounded-lg bg-muted/30">
            <h3 class="font-semibold text-blue-400 mb-2">Introduction & Innovation Proposal</h3>
            <p class="text-muted-foreground leading-relaxed">
              Recent advances in artificial intelligence have created unprecedented opportunities for innovation in [specific domain]. 
              However, significant gaps remain in translating these technological breakthroughs into practical applications. 
              Our research addresses this gap through three key innovations: (1) a novel algorithmic framework that improves efficiency by 40%, 
              (2) an integrated validation methodology, and (3) a scalable deployment strategy with clear commercialization potential.
            </p>
          </div>

          <div class="p-4 rounded-lg bg-muted/30">
            <h3 class="font-semibold text-green-400 mb-2">Technical Approach & Methodology</h3>
            <p class="text-muted-foreground leading-relaxed">
              Our technical approach leverages state-of-the-art machine learning architectures optimized for [specific application]. 
              The methodology includes rigorous testing protocols, validation against industry benchmarks, and iterative refinement based on feedback. 
              We will develop prototypes in quarters 1-2, conduct pilot testing in quarter 3, and scale deployment in quarter 4, 
              ensuring measurable milestones throughout the project timeline.
            </p>
          </div>

          <div class="p-4 rounded-lg bg-muted/30">
            <h3 class="font-semibold text-orange-400 mb-2">Expected Impact & Broader Implications</h3>
            <p class="text-muted-foreground leading-relaxed">
              The proposed research will generate significant scientific, economic, and societal impact. Scientifically, it will produce 
              3-5 peer-reviewed publications and advance fundamental understanding of [domain]. Economically, the technology has clear 
              commercialization pathways with market potential exceeding $50M within 5 years. Societally, the work addresses critical needs 
              in [application area], benefiting diverse stakeholders and underserved communities.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 rounded-lg bg-muted/30">
              <h3 class="font-semibold text-cyan-400 mb-2">Budget Justification</h3>
              <ul class="text-muted-foreground text-xs space-y-1">
                <li>• Personnel (60%): PI, 2 researchers, 1 engineer</li>
                <li>• Equipment (20%): Computing infrastructure</li>
                <li>• Materials (10%): Development and testing</li>
                <li>• Travel (10%): Conferences and collaboration</li>
              </ul>
            </div>

            <div class="p-4 rounded-lg bg-muted/30">
              <h3 class="font-semibold text-pink-400 mb-2">Team Qualifications</h3>
              <p class="text-muted-foreground text-xs leading-relaxed">
                Our team brings 50+ years combined experience in AI, domain expertise, and technology commercialization. 
                Previous projects have resulted in 10+ patents, $5M in follow-on funding, and 2 successful startups.
              </p>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: hsl(var(--primary) / 0.3);
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--primary) / 0.5);
  }
</style>
