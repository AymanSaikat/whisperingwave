import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, Loader2, Zap, ShieldCheck, Info, WandSparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AdminSettingsProps {
  settings: Record<string, string>;
  onUpdateSetting: (key: string, value: string) => Promise<{ error: any }>;
  userEmail: string;
  deviceLabel: string;
}

export default function AdminSettings({ settings, onUpdateSetting, userEmail, deviceLabel }: AdminSettingsProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggle = async (key: string, current: boolean) => {
    setSaving(key);
    const val = current ? 'false' : 'true';
    const { error } = await onUpdateSetting(key, val);
    if (error) toast({ title: 'Error', description: 'Failed to save setting.', variant: 'destructive' });
    else { setLocalSettings(prev => ({ ...prev, [key]: val })); toast({ title: 'Saved' }); }
    setSaving(null);
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    const { error } = await onUpdateSetting(key, localSettings[key] || '');
    if (error) toast({ title: 'Error', description: 'Failed to save.', variant: 'destructive' });
    else toast({ title: 'Saved' });
    setSaving(null);
  };

  const isOn = (key: string) => (localSettings[key] || settings[key]) === 'true';

  const autoPlay = isOn('auto_play');
  const requireApproval = isOn('require_approval');
  const autoApprove = isOn('auto_approve');

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Playback Settings</h2>
        <p className="text-sm text-muted-foreground">Control approvals, queue automation, and the public page from one place.</p>
      </div>

      {/* Account */}
      <div className="surface-elevated rounded-3xl p-5 space-y-3 border border-border/60">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Account</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{userEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Output Device</span>
            <span className="font-medium">{deviceLabel}</span>
          </div>
        </div>
      </div>

      {/* Auto-Play & Approval */}
      <div className="surface-elevated rounded-3xl p-5 space-y-5 border border-border/60">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Playback Automation</h3>
        </div>

        <div className="rounded-2xl bg-secondary p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {autoPlay && !requireApproval && (
              <><span className="font-semibold text-foreground">Fully automatic:</span> new submissions can start playing in queue order without manual approval.</>
            )}
            {autoPlay && requireApproval && autoApprove && (
              <><span className="font-semibold text-foreground">Hands-free approval:</span> new submissions are approved automatically and then played in order.</>
            )}
            {autoPlay && requireApproval && !autoApprove && (
              <><span className="font-semibold text-foreground">Approval gate:</span> tracks wait for approval, then they auto-play in order.</>
            )}
            {!autoPlay && (
              <><span className="font-semibold text-foreground">Manual:</span> you decide when each track starts.</>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Auto-Play</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Play tracks automatically from the queue
            </p>
          </div>
          <Switch
            checked={autoPlay}
            onCheckedChange={() => handleToggle('auto_play', autoPlay)}
            disabled={saving === 'auto_play'}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <WandSparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-sm font-medium">Auto-Approve</Label>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically approve new tracks when approval mode is enabled
            </p>
          </div>
          <Switch
            checked={autoApprove}
            onCheckedChange={() => handleToggle('auto_approve', autoApprove)}
            disabled={saving === 'auto_approve'}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-sm font-medium">Require Approval</Label>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {autoPlay
                ? 'Only approved tracks are allowed to enter auto-play'
                : 'Tracks need approval before you can play them'}
            </p>
          </div>
          <Switch
            checked={requireApproval}
            onCheckedChange={() => handleToggle('require_approval', requireApproval)}
            disabled={saving === 'require_approval'}
          />
        </div>
      </div>

      {/* Queue settings */}
      <div className="surface-elevated rounded-3xl p-5 space-y-4 border border-border/60">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Queue Limits</h3>
        <div className="space-y-2">
          <Label className="text-sm">Max Queue Size</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={localSettings.max_queue_size || settings.max_queue_size || '50'}
              onChange={e => setLocalSettings(prev => ({ ...prev, max_queue_size: e.target.value }))}
              className="bg-secondary border-0"
            />
            <Button size="sm" onClick={() => handleSave('max_queue_size')} disabled={saving === 'max_queue_size'}>
              {saving === 'max_queue_size' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Cooldown (seconds)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={localSettings.submission_cooldown_seconds || settings.submission_cooldown_seconds || '30'}
              onChange={e => setLocalSettings(prev => ({ ...prev, submission_cooldown_seconds: e.target.value }))}
              className="bg-secondary border-0"
            />
            <Button size="sm" onClick={() => handleSave('submission_cooldown_seconds')} disabled={saving === 'submission_cooldown_seconds'}>
              {saving === 'submission_cooldown_seconds' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Public Page */}
      <div className="surface-elevated rounded-3xl p-5 space-y-4 border border-border/60">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Public Page</h3>
        <div className="space-y-2">
          <Label className="text-sm">Site Title</Label>
          <div className="flex gap-2">
            <Input
              value={localSettings.site_title || settings.site_title || 'SoundCast'}
              onChange={e => setLocalSettings(prev => ({ ...prev, site_title: e.target.value }))}
              className="bg-secondary border-0"
            />
            <Button size="sm" onClick={() => handleSave('site_title')} disabled={saving === 'site_title'}>
              {saving === 'site_title' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Site Description</Label>
          <div className="flex gap-2">
            <Input
              value={localSettings.site_description || settings.site_description || ''}
              onChange={e => setLocalSettings(prev => ({ ...prev, site_description: e.target.value }))}
              className="bg-secondary border-0"
            />
            <Button size="sm" onClick={() => handleSave('site_description')} disabled={saving === 'site_description'}>
              {saving === 'site_description' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
