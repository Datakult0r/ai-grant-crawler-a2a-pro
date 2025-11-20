<script lang="ts">
  import { Bell, Calendar, AlertCircle, CheckCircle2 } from 'lucide-svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';

  const alerts = [
    {
      id: 1,
      type: 'urgent',
      title: 'COMPETE 2030 - Deadline in 7 days',
      description: 'Digital Transformation grant application closes on Nov 27',
      daysLeft: 7,
      grant: 'COMPETE 2030',
      amount: '€800K'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Horizon Europe - Deadline in 14 days',
      description: 'AI Innovation program final submission date approaching',
      daysLeft: 14,
      grant: 'Horizon Europe',
      amount: '€2.5M'
    },
    {
      id: 3,
      type: 'info',
      title: 'EIC Accelerator - Deadline in 30 days',
      description: 'Deep Tech funding opportunity - prepare your application',
      daysLeft: 30,
      grant: 'EIC Accelerator',
      amount: '€2M'
    },
    {
      id: 4,
      type: 'success',
      title: 'ANI Innovation - Application Submitted',
      description: 'Your application was successfully submitted on Nov 10',
      daysLeft: null,
      grant: 'ANI',
      amount: '€500K'
    }
  ];

  function getAlertColor(type: string) {
    switch (type) {
      case 'urgent': return 'border-destructive/30 bg-destructive/5';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'info': return 'border-secondary/30 bg-secondary/5';
      case 'success': return 'border-accent/30 bg-accent/5';
      default: return 'border-primary/30';
    }
  }

  function getAlertIcon(type: string) {
    switch (type) {
      case 'urgent': return AlertCircle;
      case 'warning': return Calendar;
      case 'info': return Bell;
      case 'success': return CheckCircle2;
      default: return Bell;
    }
  }

  function getAlertIconColor(type: string) {
    switch (type) {
      case 'urgent': return 'text-destructive';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-secondary';
      case 'success': return 'text-accent';
      default: return 'text-primary';
    }
  }
</script>

<div class="p-8 space-y-6">
  <!-- Header -->
  <div class="space-y-2">
    <h1 class="text-4xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
      Smart Deadline Alerts
    </h1>
    <p class="text-muted-foreground text-lg">
      Never miss a grant deadline with intelligent notifications
    </p>
  </div>

  <!-- Alert Stats -->
  <div class="grid grid-cols-4 gap-4">
    <Card class="glass-card border-destructive/30">
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Urgent (7 days)</p>
            <p class="text-3xl font-bold text-destructive">1</p>
          </div>
          <AlertCircle class={getAlertIconColor('urgent')} />
        </div>
      </CardContent>
    </Card>

    <Card class="glass-card border-yellow-500/30">
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Warning (14 days)</p>
            <p class="text-3xl font-bold text-yellow-500">1</p>
          </div>
          <Calendar class={getAlertIconColor('warning')} />
        </div>
      </CardContent>
    </Card>

    <Card class="glass-card border-secondary/30">
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Info (30 days)</p>
            <p class="text-3xl font-bold text-secondary">1</p>
          </div>
          <Bell class={getAlertIconColor('info')} />
        </div>
      </CardContent>
    </Card>

    <Card class="glass-card border-accent/30">
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Completed</p>
            <p class="text-3xl font-bold text-accent">1</p>
          </div>
          <CheckCircle2 class={getAlertIconColor('success')} />
        </div>
      </CardContent>
    </Card>
  </div>

  <!-- Alerts List -->
  <div class="space-y-4">
    {#each alerts as alert}
      <Card class="glass-card {getAlertColor(alert.type)} hover:border-primary/50 transition-all duration-300">
        <CardContent class="p-6">
          <div class="flex items-start gap-6">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <div class="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center">
                <!-- Removed quotes from class attribute to fix Svelte 5 warning -->
                {#if alert.type === 'urgent'}
                  <AlertCircle class={getAlertIconColor(alert.type)} />
                {:else if alert.type === 'warning'}
                  <Calendar class={getAlertIconColor(alert.type)} />
                {:else if alert.type === 'info'}
                  <Bell class={getAlertIconColor(alert.type)} />
                {:else if alert.type === 'success'}
                  <CheckCircle2 class={getAlertIconColor(alert.type)} />
                {:else}
                  <Bell class={getAlertIconColor(alert.type)} />
                {/if}
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 space-y-2">
              <div class="flex items-start justify-between">
                <div class="space-y-1">
                  <h3 class="font-semibold text-lg text-foreground">{alert.title}</h3>
                  <p class="text-sm text-muted-foreground">{alert.description}</p>
                </div>
                {#if alert.daysLeft !== null}
                  <Badge 
                    class={alert.daysLeft <= 7 ? 'bg-destructive/20 text-destructive border-destructive/30' : 
                           alert.daysLeft <= 14 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                           'bg-secondary/20 text-secondary border-secondary/30'}
                  >
                    {alert.daysLeft} days left
                  </Badge>
                {/if}
              </div>

              <div class="flex items-center gap-4 pt-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground">Grant:</span>
                  <Badge variant="outline" class="text-xs border-primary/30 text-primary">{alert.grant}</Badge>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground">Amount:</span>
                  <span class="text-sm font-semibold text-foreground">{alert.amount}</span>
                </div>
                <div class="flex-1"></div>
                <Button size="sm" variant="outline" class="border-primary/30 hover:bg-primary/10">
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    {/each}
  </div>
</div>
