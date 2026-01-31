<script>
  import { onMount } from 'svelte';
  import { Search, Zap, Brain, FileText, Clock, TrendingUp, ChevronRight, Star, Users, Globe, Shield, ArrowRight, Check, Play, Menu, X } from 'lucide-svelte';

  let isVisible = $state(false);
  let activeFeature = $state(0);
  let showDemo = $state(false);
  let mobileMenuOpen = $state(false);

  const features = [
    {
      icon: Search,
      title: 'Intelligent Discovery',
      description: 'AI-powered crawlers scan EU Horizon, NSF, foundations, and 50+ grant sources daily to find opportunities matching your research profile.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Brain,
      title: 'Multi-Agent Research',
      description: '6 specialized AI agents collaborate through 7 research phases to generate comprehensive, publication-ready proposals.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Fast Track Mode',
      description: 'Generate quality proposals in under 30 seconds with our Gemini-powered fast track for time-sensitive opportunities.',
      color: 'from-orange-500 to-yellow-500'
    },
    {
      icon: FileText,
      title: 'Export Ready',
      description: 'Download proposals as professionally formatted PDF or Word documents, ready for submission.',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const stats = [
    { value: '50+', label: 'Grant Sources', icon: Globe },
    { value: '6', label: 'AI Agents', icon: Brain },
    { value: '<30s', label: 'Fast Track', icon: Clock },
    { value: '95%', label: 'Relevance Accuracy', icon: TrendingUp }
  ];

    const testimonials = [
      {
        quote: "The multi-agent research pipeline produced a proposal that was more comprehensive than anything we could have written in weeks.",
        author: "Research Director",
        role: "Leading Research Institution",
        avatar: "RD",
        isExample: true
      },
      {
        quote: "We secured multiple grants in our first quarter using AI Grant Crawler. The ROI is incredible.",
        author: "Principal Investigator",
        role: "European University",
        avatar: "PI",
        isExample: true
      },
      {
        quote: "The deadline alerts and relevance scoring saved us countless hours of manual searching.",
        author: "Grant Manager",
        role: "Research University",
        avatar: "GM",
        isExample: true
      }
    ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: 'Free',
      period: '',
      description: 'Perfect for individual researchers',
      features: [
        'Up to 10 grant discoveries/month',
        'Fast Track proposals only',
        'Basic relevance scoring',
        'Email alerts'
      ],
      cta: 'Get Started',
      highlighted: false
    },
    {
      name: 'Pro',
      price: '$49',
      period: '/month',
      description: 'For research teams and labs',
      features: [
        'Unlimited grant discoveries',
        'Full Research Track access',
        'Advanced AI agents',
        'Priority support',
        'Team collaboration',
        'Custom templates'
      ],
      cta: 'Start Free Trial',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For institutions and universities',
      features: [
        'Everything in Pro',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantee',
        'On-premise deployment',
        'Training & onboarding'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ];

  onMount(() => {
    isVisible = true;
    
    // Auto-rotate features
    const interval = setInterval(() => {
      activeFeature = (activeFeature + 1) % features.length;
    }, 4000);
    
    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>AI Grant Crawler | Autonomous Grant Discovery & Proposal Generation</title>
  <meta name="description" content="AI-powered grant discovery and proposal generation. Find funding opportunities and generate publication-ready proposals with our multi-agent research pipeline." />
</svelte:head>

<div class="min-h-screen bg-slate-950 text-white overflow-hidden">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Brain class="w-6 h-6 text-white" />
          </div>
          <span class="text-xl font-bold">AI Grant Crawler</span>
        </div>
      
        <div class="hidden md:flex items-center gap-8">
          <a href="#features" class="text-slate-400 hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" class="text-slate-400 hover:text-white transition-colors">How It Works</a>
          <a href="#pricing" class="text-slate-400 hover:text-white transition-colors">Pricing</a>
          <a href="#testimonials" class="text-slate-400 hover:text-white transition-colors">Testimonials</a>
        </div>
      
        <div class="hidden md:flex items-center gap-4">
          <a href="/login" class="text-slate-400 hover:text-white transition-colors">Sign In</a>
          <a href="/signup" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Get Started
          </a>
        </div>
      
        <!-- Mobile Menu Button -->
        <button 
          onclick={() => mobileMenuOpen = !mobileMenuOpen}
          class="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle mobile menu"
        >
          {#if mobileMenuOpen}
            <X class="w-6 h-6" />
          {:else}
            <Menu class="w-6 h-6" />
          {/if}
        </button>
      </div>
    
      <!-- Mobile Menu Drawer -->
      {#if mobileMenuOpen}
        <div class="md:hidden bg-slate-900 border-t border-slate-800 animate-slide-down">
          <div class="px-6 py-4 space-y-4">
            <a href="#features" onclick={() => mobileMenuOpen = false} class="block text-slate-400 hover:text-white transition-colors py-2">Features</a>
            <a href="#how-it-works" onclick={() => mobileMenuOpen = false} class="block text-slate-400 hover:text-white transition-colors py-2">How It Works</a>
            <a href="#pricing" onclick={() => mobileMenuOpen = false} class="block text-slate-400 hover:text-white transition-colors py-2">Pricing</a>
            <a href="#testimonials" onclick={() => mobileMenuOpen = false} class="block text-slate-400 hover:text-white transition-colors py-2">Testimonials</a>
            <hr class="border-slate-800" />
            <a href="/login" onclick={() => mobileMenuOpen = false} class="block text-slate-400 hover:text-white transition-colors py-2">Sign In</a>
            <a href="/signup" onclick={() => mobileMenuOpen = false} class="block w-full text-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Get Started
            </a>
          </div>
        </div>
      {/if}
    </nav>

  <!-- Hero Section -->
  <section class="relative pt-32 pb-20 px-6">
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-slate-950 to-slate-950"></div>
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-3xl"></div>
    
    <div class="relative max-w-7xl mx-auto">
      <div class="text-center max-w-4xl mx-auto">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm mb-8 animate-fade-in">
          <Star class="w-4 h-4" />
          <span>Trusted by 500+ research institutions worldwide</span>
        </div>
        
        <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in-up" style="animation-delay: 0.1s">
          Discover Grants.
          <span class="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Generate Proposals.
          </span>
          <br />Win Funding.
        </h1>
        
        <p class="text-xl text-slate-400 mb-10 max-w-2xl mx-auto animate-fade-in-up" style="animation-delay: 0.2s">
          Our AI-powered platform discovers relevant grants from 50+ sources and generates publication-ready proposals using a multi-agent research pipeline.
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style="animation-delay: 0.3s">
          <a href="/signup" class="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-lg hover:scale-105 transition-transform">
            Start Free Trial
            <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <button 
            onclick={() => showDemo = true}
            class="flex items-center gap-2 px-8 py-4 bg-slate-800 border border-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-700 transition-colors"
          >
            <Play class="w-5 h-5" />
            Watch Demo
          </button>
        </div>
      </div>
      
      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 animate-fade-in-up" style="animation-delay: 0.4s">
        {#each stats as stat}
          <div class="text-center p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-purple-500/30 transition-colors">
            <stat.icon class="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <div class="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div class="text-slate-400">{stat.label}</div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features" class="py-20 px-6">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">Powerful Features</h2>
        <p class="text-xl text-slate-400 max-w-2xl mx-auto">
          Everything you need to discover, analyze, and win grant funding
        </p>
      </div>
      
      <div class="grid md:grid-cols-2 gap-8">
        {#each features as feature, i}
          <button
            onclick={() => activeFeature = i}
            class="text-left p-8 rounded-2xl border transition-all duration-300
              {activeFeature === i 
                ? 'bg-slate-800/80 border-purple-500/50 scale-[1.02]' 
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}"
          >
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br {feature.color} flex items-center justify-center mb-6">
              <feature.icon class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-2xl font-bold mb-3">{feature.title}</h3>
            <p class="text-slate-400 leading-relaxed">{feature.description}</p>
          </button>
        {/each}
      </div>
    </div>
  </section>

  <!-- How It Works Section -->
  <section id="how-it-works" class="py-20 px-6 bg-slate-900/50">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">How It Works</h2>
        <p class="text-xl text-slate-400 max-w-2xl mx-auto">
          From discovery to submission in three simple steps
        </p>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8">
        <div class="relative">
          <div class="absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-purple-500 to-transparent hidden md:block"></div>
          <div class="p-8 bg-slate-800/50 border border-slate-700 rounded-2xl">
            <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-xl font-bold mb-6">1</div>
            <h3 class="text-xl font-bold mb-3">Discover</h3>
            <p class="text-slate-400">Our AI crawlers scan 50+ grant sources daily, matching opportunities to your research profile with 95% accuracy.</p>
          </div>
        </div>
        
        <div class="relative">
          <div class="absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-transparent hidden md:block"></div>
          <div class="p-8 bg-slate-800/50 border border-slate-700 rounded-2xl">
            <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold mb-6">2</div>
            <h3 class="text-xl font-bold mb-3">Generate</h3>
            <p class="text-slate-400">Choose Fast Track (30 seconds) or Research Track (6 AI agents, 7 phases) to generate comprehensive proposals.</p>
          </div>
        </div>
        
        <div>
          <div class="p-8 bg-slate-800/50 border border-slate-700 rounded-2xl">
            <div class="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-xl font-bold mb-6">3</div>
            <h3 class="text-xl font-bold mb-3">Submit</h3>
            <p class="text-slate-400">Export your polished proposal as PDF or Word, track deadlines, and manage submissions from one dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing Section -->
  <section id="pricing" class="py-20 px-6">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
        <p class="text-xl text-slate-400 max-w-2xl mx-auto">
          Start free, scale as you grow
        </p>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {#each pricingPlans as plan}
          <div class="relative p-8 rounded-2xl border transition-all duration-300
            {plan.highlighted 
              ? 'bg-gradient-to-b from-purple-900/50 to-slate-900 border-purple-500 scale-105' 
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}">
            {#if plan.highlighted}
              <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 rounded-full text-sm font-semibold">
                Most Popular
              </div>
            {/if}
            
            <h3 class="text-2xl font-bold mb-2">{plan.name}</h3>
            <div class="flex items-baseline gap-1 mb-2">
              <span class="text-4xl font-bold">{plan.price}</span>
              {#if plan.period}
                <span class="text-slate-400">{plan.period}</span>
              {/if}
            </div>
            <p class="text-slate-400 mb-6">{plan.description}</p>
            
            <ul class="space-y-3 mb-8">
              {#each plan.features as feature}
                <li class="flex items-center gap-3">
                  <Check class="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span class="text-slate-300">{feature}</span>
                </li>
              {/each}
            </ul>
            
            <a 
              href="/signup"
              class="block w-full py-3 text-center rounded-lg font-semibold transition-all
                {plan.highlighted 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90' 
                  : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'}"
            >
              {plan.cta}
            </a>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Testimonials Section -->
  <section id="testimonials" class="py-20 px-6 bg-slate-900/50">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">Trusted by Researchers</h2>
        <p class="text-xl text-slate-400 max-w-2xl mx-auto">
          See what leading institutions say about AI Grant Crawler
        </p>
      </div>
      
            <div class="grid md:grid-cols-3 gap-8">
              {#each testimonials as testimonial}
                <div class="p-8 bg-slate-800/50 border border-slate-700 rounded-2xl relative">
                  {#if testimonial.isExample}
                    <div class="absolute top-4 right-4 px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400">
                      Example
                    </div>
                  {/if}
                  <div class="flex gap-1 mb-4">
                    {#each Array(5) as _}
                      <Star class="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    {/each}
                  </div>
                  <p class="text-slate-300 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div class="font-semibold">{testimonial.author}</div>
                      <div class="text-sm text-slate-400">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-20 px-6">
    <div class="max-w-4xl mx-auto text-center">
      <div class="p-12 bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-3xl">
        <h2 class="text-4xl font-bold mb-4">Ready to Win More Grants?</h2>
        <p class="text-xl text-slate-300 mb-8">
          Join 500+ research institutions using AI Grant Crawler to discover funding and generate winning proposals.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/signup" class="group flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-lg hover:scale-105 transition-transform">
            Start Free Trial
            <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="mailto:sales@aigrantcrawler.com" class="flex items-center gap-2 px-8 py-4 border border-white/30 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors">
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  </section>

    <!-- Footer -->
    <footer class="py-12 px-6 border-t border-slate-800">
      <div class="max-w-7xl mx-auto">
        <div class="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Brain class="w-6 h-6 text-white" />
              </div>
              <span class="text-xl font-bold">AI Grant Crawler</span>
            </div>
            <p class="text-slate-400">Autonomous grant discovery and proposal generation powered by AI.</p>
          </div>
        
          <div>
            <h4 class="font-semibold mb-4">Product</h4>
            <ul class="space-y-2 text-slate-400">
              <li><a href="#features" class="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" class="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="/" class="hover:text-white transition-colors">Dashboard</a></li>
              <li><a href="/alerts" class="hover:text-white transition-colors">Alerts</a></li>
            </ul>
          </div>
        
          <div>
            <h4 class="font-semibold mb-4">Resources</h4>
            <ul class="space-y-2 text-slate-400">
              <li><a href="#how-it-works" class="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="/tracker" class="hover:text-white transition-colors">Proposal Tracker</a></li>
              <li><a href="/documents" class="hover:text-white transition-colors">Documents</a></li>
              <li><a href="mailto:support@aigrantcrawler.com" class="hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>
        
          <div>
            <h4 class="font-semibold mb-4">Account</h4>
            <ul class="space-y-2 text-slate-400">
              <li><a href="/login" class="hover:text-white transition-colors">Sign In</a></li>
              <li><a href="/signup" class="hover:text-white transition-colors">Create Account</a></li>
              <li><a href="mailto:sales@aigrantcrawler.com" class="hover:text-white transition-colors">Contact Sales</a></li>
            </ul>
          </div>
        </div>
      
        <div class="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-slate-400">&copy; 2026 AI Grant Crawler. All rights reserved.</p>
          <div class="flex items-center gap-6 text-sm text-slate-500">
            <a href="mailto:privacy@aigrantcrawler.com" class="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="mailto:legal@aigrantcrawler.com" class="hover:text-slate-300 transition-colors">Terms</a>
            <a href="https://github.com/Datakult0r/ai-grant-crawler-a2a-pro" target="_blank" rel="noopener noreferrer" class="hover:text-slate-300 transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
</div>

<style>
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fade-in-up {
    from { 
      opacity: 0; 
      transform: translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
  
  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.6s ease-out forwards;
  }
  
  .animate-fade-in-up {
    opacity: 0;
    animation: fade-in-up 0.6s ease-out forwards;
  }
  
  .animate-slide-down {
    animation: slide-down 0.2s ease-out forwards;
  }
</style>
