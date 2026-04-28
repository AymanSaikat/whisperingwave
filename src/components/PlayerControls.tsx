import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2, Music } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { QueueItem } from '@/hooks/useAudioPlayer';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  currentTrack: QueueItem | null;
  isLoading: boolean;
  error: string | null;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (v: number) => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function PlayerControls({
  isPlaying, currentTime, duration, volume, currentTrack, isLoading, error,
  onTogglePlay, onSeek, onVolumeChange, onSkipNext, onSkipPrev,
}: PlayerControlsProps) {
  if (!currentTrack && !error) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto">
        {/* Progress bar - thin line at top */}
        <div className="px-4">
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={0.1}
            onValueChange={([v]) => onSeek(v)}
            className="h-1"
          />
        </div>

        {error && (
          <p className="text-destructive text-xs text-center px-4 pt-1">{error}</p>
        )}

        <div className="flex items-center gap-4 px-4 py-3">
          {/* Track info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <Music className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{currentTrack?.title || 'No track'}</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-3">
            <button onClick={onSkipPrev} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying
                ? <Pause className="h-4 w-4 text-background" />
                : <Play className="h-4 w-4 text-background ml-0.5" />
              }
            </button>
            <button onClick={onSkipNext} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 w-28 flex-shrink-0">
            <button onClick={() => onVolumeChange(volume === 0 ? 0.75 : 0)} className="text-muted-foreground hover:text-foreground p-1">
              {volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={([v]) => onVolumeChange(v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
