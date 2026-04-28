import heroBg from '@/assets/hero-bg.jpg';
import LinkInput from '@/components/LinkInput';
import DeviceSelector from '@/components/DeviceSelector';
import PlayerControls from '@/components/PlayerControls';
import QueuePanel from '@/components/QueuePanel';
import Equalizer from '@/components/Equalizer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useAudioDevices } from '@/hooks/useAudioDevices';
import { useAuth } from '@/contexts/AuthContext';
import { Headphones, LogIn, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Index() {
  const player = useAudioPlayer();
  const { devices, selectedDeviceId, selectDevice, refreshDevices, attachAudioElement } = useAudioDevices();
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // Attach audio element for device routing
  if ((player as any)._audioElement) {
    attachAudioElement((player as any)._audioElement);
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Hero background */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-end px-6 pt-4">
        {!loading && (
          user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground gap-1">
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground gap-1">
              <LogIn className="h-3.5 w-3.5" /> Sign In
            </Button>
          )
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-10 pb-32">
        {/* Logo & Title */}
        <div className="flex items-center gap-3 mb-2 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center glow-primary">
            <Headphones className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-3 animate-fade-in">
          <span className="text-gradient">SoundCast</span>
        </h1>
        <p className="text-muted-foreground text-center text-lg mb-10 max-w-lg animate-fade-in">
          Paste any music link. Play it anywhere. Stream to your devices instantly.
        </p>

        {/* Equalizer visualization */}
        <div className="mb-10">
          <Equalizer isPlaying={player.isPlaying} />
        </div>

        {/* Link input */}
        <LinkInput onPlayNow={player.playNow} onAddToQueue={player.addToQueue} />

        {/* Panels */}
        <div className="mt-12 flex flex-col md:flex-row gap-6 w-full max-w-3xl justify-center">
          <DeviceSelector
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={selectDevice}
            onRefresh={refreshDevices}
          />
          <QueuePanel
            queue={player.queue}
            currentIndex={player.currentIndex}
            onPlay={player.playIndex}
            onRemove={player.removeFromQueue}
          />
        </div>

        {/* Info */}
        <div className="mt-16 glass-panel rounded-2xl p-6 max-w-2xl w-full animate-fade-in">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-secondary-foreground">
            <div className="space-y-1">
              <p className="font-medium text-foreground">1. Paste a Link</p>
              <p className="text-muted-foreground">YouTube, Spotify, SoundCloud, or any direct audio URL.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">2. Choose Device</p>
              <p className="text-muted-foreground">Select your speakers, headphones, or any connected audio output.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">3. Enjoy</p>
              <p className="text-muted-foreground">Control playback, volume, and queue from one place.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Player bar */}
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
  );
}
