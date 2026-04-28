import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useAudioDevices } from '@/hooks/useAudioDevices';
import { useQueueSubmissions } from '@/hooks/useQueueSubmissions';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useBlockedDomains } from '@/hooks/useBlockedDomains';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import PlayerControls from '@/components/PlayerControls';
import DeviceSelector from '@/components/DeviceSelector';
import AdminQueueManager from '@/components/AdminQueueManager';
import AdminDashboard from '@/components/AdminDashboard';
import AdminSettings from '@/components/AdminSettings';
import AdminBlocklist from '@/components/AdminBlocklist';
import AdminAnnouncements from '@/components/AdminAnnouncements';
import {
  LogOut, Shield, Loader2, Music, Speaker, Settings,
  LayoutDashboard, Ban, Megaphone, Volume2, Disc3, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SidebarProvider, SidebarTrigger, Sidebar, SidebarContent,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from '@/components/ui/sidebar';

type Tab = 'dashboard' | 'queue' | 'devices' | 'announcements' | 'blocklist' | 'settings';

export default function AdminPanel() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const { settings, updateSetting } = useAppSettings();
  const { submissions, updateStatus, removeSubmission } = useQueueSubmissions();
  const submissionsRef = useRef(submissions);
  submissionsRef.current = submissions;
  const updateStatusRef = useRef(updateStatus);
  updateStatusRef.current = updateStatus;

  const [autoplayUnlocked, setAutoplayUnlocked] = useState(false);
  const autoplayUnlockedRef = useRef(false);

  const playbackTransitionRef = useRef(false);
  const autoPlayProcessing = useRef(false);
  const autoApproveProcessing = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const getNextEligibleTrack = useCallback((excludeId?: string) => {
    const requireApproval = settingsRef.current.require_approval === 'true';
    return submissionsRef.current.find(sub =>
      sub.id !== excludeId && (requireApproval ? sub.status === 'approved' : sub.status === 'pending' || sub.status === 'approved')
    );
  }, []);

  const player = useAudioPlayer(async () => {
    if (playbackTransitionRef.current) return;

    playbackTransitionRef.current = true;

    try {
      const currentPlaying = submissionsRef.current.find(s => s.status === 'playing');
      const finishedTrackId = currentPlaying?.id;

      if (currentPlaying) {
        await updateStatusRef.current(currentPlaying.id, 'played');
      }

      if (settingsRef.current.auto_play === 'true' && autoplayUnlockedRef.current) {
        const nextTrack = getNextEligibleTrack(finishedTrackId);
        if (nextTrack) {
          await updateStatusRef.current(nextTrack.id, 'playing');
          playerRef.current.playSingle(nextTrack.url, { title: nextTrack.title });
        }
      }
    } finally {
      window.setTimeout(() => {
        playbackTransitionRef.current = false;
      }, 250);
    }
  });
  const { devices, selectedDeviceId, selectDevice, refreshDevices, attachAudioElement } = useAudioDevices();
  const { domains, addDomain, removeDomain } = useBlockedDomains();
  const { announcements, addAnnouncement, toggleAnnouncement, removeAnnouncement } = useAnnouncements();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const playerRef = useRef(player);
  playerRef.current = player;

  // Unlock autoplay on first user interaction
  const unlockAutoplay = useCallback(() => {
    if (!autoplayUnlockedRef.current) {
      autoplayUnlockedRef.current = true;
      setAutoplayUnlocked(true);
    }
  }, []);

  useEffect(() => {
    const handler = () => unlockAutoplay();
    document.addEventListener('click', handler, { once: true });
    document.addEventListener('keydown', handler, { once: true });
    document.addEventListener('touchstart', handler, { once: true });
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [unlockAutoplay]);

  // Attach audio element for device routing
  useEffect(() => {
    if ((player as any)._audioElement) {
      attachAudioElement((player as any)._audioElement);
    }
  }, [(player as any)._audioElement, attachAudioElement]);

  const playSubmission = useCallback(async (sub: { id: string; url: string; title: string }) => {
    if (playbackTransitionRef.current) return;

    playbackTransitionRef.current = true;
    const currentPlaying = submissionsRef.current.find(s => s.status === 'playing');

    try {
      if (currentPlaying && currentPlaying.id !== sub.id) {
        await updateStatusRef.current(currentPlaying.id, 'played');
      }

      if (currentPlaying?.id === sub.id) return;

      await updateStatusRef.current(sub.id, 'playing');
      playerRef.current.playSingle(sub.url, { title: sub.title });
    } finally {
      window.setTimeout(() => {
        playbackTransitionRef.current = false;
      }, 250);
    }
  }, []);

  useEffect(() => {
    const autoApproveEnabled = settingsRef.current.require_approval === 'true' && settingsRef.current.auto_approve === 'true';

    if (!autoApproveEnabled || autoApproveProcessing.current) return;

    const pendingTracks = submissions.filter(sub => sub.status === 'pending');
    if (pendingTracks.length === 0) return;

    autoApproveProcessing.current = true;

    Promise.all(pendingTracks.map(sub => updateStatusRef.current(sub.id, 'approved'))).finally(() => {
      window.setTimeout(() => {
        autoApproveProcessing.current = false;
      }, 250);
    });
  }, [submissions, settings.auto_approve, settings.require_approval]);

  useEffect(() => {
    const autoPlayEnabled = settingsRef.current.auto_play === 'true';

    if (!autoPlayEnabled) return;
    if (autoPlayProcessing.current) return;
    if (playbackTransitionRef.current) return;
    if (!autoplayUnlockedRef.current) return;

    const currentlyPlaying = submissionsRef.current.find(s => s.status === 'playing');
    if (currentlyPlaying) return;
    if (playerRef.current.isPlaying) return;

    const nextTrack = getNextEligibleTrack();
    if (!nextTrack) return;

    autoPlayProcessing.current = true;
    updateStatusRef.current(nextTrack.id, 'playing')
      .then(() => {
        playerRef.current.playSingle(nextTrack.url, { title: nextTrack.title });
      })
      .finally(() => {
        window.setTimeout(() => {
          autoPlayProcessing.current = false;
        }, 250);
      });
  }, [submissions, settings.auto_play, settings.require_approval, autoplayUnlocked, getNextEligibleTrack]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="surface-elevated rounded-2xl p-8 text-center max-w-md">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have admin privileges.</p>
          <Button onClick={() => navigate('/')} variant="outline">Go to Public Page</Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'queue' as Tab, label: 'Queue', icon: Music },
    { id: 'devices' as Tab, label: 'Devices', icon: Speaker },
    { id: 'announcements' as Tab, label: 'Announce', icon: Megaphone },
    { id: 'blocklist' as Tab, label: 'Blocklist', icon: Ban },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  const autoPlayOn = settings.auto_play === 'true';
  const autoApproveOn = settings.auto_approve === 'true' && settings.require_approval === 'true';
  const queueCount = submissions.filter(s => s.status === 'pending' || s.status === 'approved').length;
  const playingCount = submissions.filter(s => s.status === 'playing').length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <Disc3 className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm">SoundCast</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {tabs.map(tab => (
                    <SidebarMenuItem key={tab.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveTab(tab.id)}
                        className={activeTab === tab.id ? 'bg-primary/10 text-primary font-medium' : ''}
                      >
                        <tab.icon className="h-4 w-4 mr-2" />
                        <span>{tab.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium">Admin</span>
            </div>
            <div className="flex items-center gap-3">
              {autoApproveOn && (
                <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium bg-secondary text-foreground">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>Auto-Approve On</span>
                </div>
              )}
              {autoPlayOn && (
                <div className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium ${
                  autoplayUnlocked
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary text-foreground'
                }`}>
                  <Volume2 className="h-3 w-3" />
                  <span>{autoplayUnlocked ? 'Auto-Play Active' : 'Click to enable'}</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground h-8">
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6 pb-32 overflow-y-auto">
            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <div className="surface-elevated rounded-3xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Queue</p>
                <p className="mt-2 text-2xl font-semibold">{queueCount}</p>
                <p className="text-sm text-muted-foreground">Tracks waiting to play</p>
              </div>
              <div className="surface-elevated rounded-3xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Playback</p>
                <p className="mt-2 text-2xl font-semibold">{autoPlayOn ? 'Auto' : 'Manual'}</p>
                <p className="text-sm text-muted-foreground">{autoplayUnlocked ? 'Ready to continue queue' : 'Needs one click to unlock browser audio'}</p>
              </div>
              <div className="surface-elevated rounded-3xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Live</p>
                <p className="mt-2 text-2xl font-semibold">{playingCount}</p>
                <p className="text-sm text-muted-foreground">Track currently playing</p>
              </div>
            </div>

            {activeTab === 'dashboard' && <AdminDashboard submissions={submissions} />}
            {activeTab === 'queue' && (
              <AdminQueueManager
                submissions={submissions}
                onPlay={playSubmission}
                onUpdateStatus={updateStatus}
                onRemove={removeSubmission}
              />
            )}
            {activeTab === 'devices' && (
              <div className="max-w-md">
                <h2 className="text-lg font-semibold mb-4">Audio Output Device</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Music will only play through the device selected here.
                </p>
                <DeviceSelector
                  devices={devices}
                  selectedDeviceId={selectedDeviceId}
                  onSelectDevice={selectDevice}
                  onRefresh={refreshDevices}
                />
              </div>
            )}
            {activeTab === 'announcements' && (
              <AdminAnnouncements
                announcements={announcements}
                onAdd={addAnnouncement}
                onToggle={toggleAnnouncement}
                onRemove={removeAnnouncement}
              />
            )}
            {activeTab === 'blocklist' && (
              <AdminBlocklist
                domains={domains}
                onAdd={addDomain}
                onRemove={removeDomain}
              />
            )}
            {activeTab === 'settings' && (
              <AdminSettings
                settings={settings}
                onUpdateSetting={updateSetting}
                userEmail={user?.email || ''}
                deviceLabel={devices.find(d => d.deviceId === selectedDeviceId)?.label || 'Default'}
              />
            )}
          </main>

          <PlayerControls
            isPlaying={player.isPlaying}
            currentTime={player.currentTime}
            duration={player.duration}
            volume={player.volume}
            currentTrack={player.currentTrack}
            isLoading={player.isLoading}
            error={player.error}
            onTogglePlay={player.togglePlay}
            onSeek={player.seek}
            onVolumeChange={player.changeVolume}
            onSkipNext={player.skipNext}
            onSkipPrev={player.skipPrev}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
