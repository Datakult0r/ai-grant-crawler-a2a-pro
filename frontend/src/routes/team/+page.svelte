<script lang="ts">
  import { Users, UserPlus, MessageSquare, Activity, Loader2 } from 'lucide-svelte';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
  import { onMount } from 'svelte';
  import { fetchTeam } from '$lib/api';

  let teamMembers = $state([
    { name: 'Ana Silva', role: 'Principal Investigator', initials: 'AS', assigned: 5, color: 'bg-primary' },
    { name: 'João Santos', role: 'Medical Expert', initials: 'JS', assigned: 3, color: 'bg-secondary' },
    { name: 'Maria Costa', role: 'AI Researcher', initials: 'MC', assigned: 4, color: 'bg-accent' },
    { name: 'Pedro Alves', role: 'Project Manager', initials: 'PA', assigned: 6, color: 'bg-yellow-500' }
  ]);

  let activities = $state([
    { user: 'Ana Silva', action: 'commented on', target: 'Horizon Europe - AI Innovation', time: '2 hours ago' },
    { user: 'João Santos', action: 'assigned', target: 'COMPETE 2030 to Maria Costa', time: '4 hours ago' },
    { user: 'Maria Costa', action: 'updated', target: 'Technical Approach section', time: '6 hours ago' },
    { user: 'Pedro Alves', action: 'completed', target: 'Budget Breakdown', time: '1 day ago' },
    { user: 'Ana Silva', action: 'created', target: 'EIC Accelerator application', time: '2 days ago' }
  ]);

  let comments = $state([
    { 
      user: 'João Santos', 
      initials: 'JS', 
      color: 'bg-secondary',
      grant: 'Horizon Europe - AI', 
      text: 'We should emphasize the clinical trial results more prominently in the executive summary.',
      time: '3 hours ago'
    },
    { 
      user: 'Maria Costa', 
      initials: 'MC', 
      color: 'bg-accent',
      grant: 'COMPETE 2030', 
      text: 'The technical architecture diagram needs to be updated with the latest specifications.',
      time: '5 hours ago'
    },
    { 
      user: 'Ana Silva', 
      initials: 'AS', 
      color: 'bg-primary',
      grant: 'EIC Accelerator', 
      text: 'Great work on the market analysis section! The competitive landscape is very comprehensive.',
      time: '1 day ago'
    }
  ]);

  let loading = $state(true);

  onMount(async () => {
    try {
      const data = await fetchTeam();
      if (data.teamMembers) {
        teamMembers = data.teamMembers;
      }
      if (data.activities && data.activities.length > 0) {
        activities = data.activities;
      }
      if (data.comments && data.comments.length > 0) {
        comments = data.comments;
      }
    } catch (e) {
      console.error('Failed to fetch team data:', e);
      // Keep demo data on error
    } finally {
      loading = false;
    }
  });
</script>

<div class="p-8 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="space-y-2">
      <h1 class="text-4xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
        Team Collaboration
      </h1>
      <p class="text-muted-foreground text-lg">
        Assign grants, discuss applications, and track team activity
      </p>
    </div>
    <Button class="bg-primary hover:bg-primary/90 neon-glow-purple">
      <UserPlus class="w-4 h-4 mr-2" />
      Invite Member
    </Button>
  </div>

  <!-- Team Members -->
  <div class="grid grid-cols-4 gap-4">
    {#each teamMembers as member}
      <Card class="glass-card hover:border-primary/50 transition-all duration-300">
        <CardContent class="p-6 space-y-4">
          <div class="flex flex-col items-center text-center gap-3">
            <Avatar class="w-16 h-16">
              <AvatarFallback class="{member.color} text-white text-lg font-semibold">
                {member.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 class="font-semibold text-foreground">{member.name}</h3>
              <p class="text-sm text-muted-foreground">{member.role}</p>
            </div>
          </div>
          <div class="pt-4 border-t border-border">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Assigned grants</span>
              <Badge class="bg-primary/20 text-primary border-primary/30">{member.assigned}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    {/each}
  </div>

  <div class="grid grid-cols-2 gap-6">
    <!-- Activity Feed -->
    <Card class="glass-card">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Activity class="w-5 h-5 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>Team actions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          {#each activities as activity}
            <div class="flex gap-3">
              <div class="w-2 h-2 rounded-full bg-primary mt-2"></div>
              <div class="flex-1">
                <p class="text-sm text-foreground">
                  <span class="font-semibold">{activity.user}</span>
                  <span class="text-muted-foreground"> {activity.action} </span>
                  <span class="font-medium">{activity.target}</span>
                </p>
                <p class="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          {/each}
        </div>
      </CardContent>
    </Card>

    <!-- Comment Threads -->
    <Card class="glass-card">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <MessageSquare class="w-5 h-5 text-secondary" />
          Comment Threads
        </CardTitle>
        <CardDescription>Team discussions and feedback</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          {#each comments as comment}
            <div class="p-4 bg-muted/20 rounded-lg border border-border">
              <div class="flex items-start gap-3">
                <Avatar class="w-10 h-10">
                  <AvatarFallback class="{comment.color} text-white font-semibold">
                    {comment.initials}
                  </AvatarFallback>
                </Avatar>
                <div class="flex-1 space-y-2">
                  <div class="flex items-center justify-between">
                    <p class="font-semibold text-sm text-foreground">{comment.user}</p>
                    <span class="text-xs text-muted-foreground">{comment.time}</span>
                  </div>
                  <Badge variant="outline" class="text-xs border-primary/30 text-primary">{comment.grant}</Badge>
                  <p class="text-sm text-foreground leading-relaxed">{comment.text}</p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </CardContent>
    </Card>
  </div>
</div>
