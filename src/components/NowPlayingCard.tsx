import { Disc3, Clock } from 'lucide-react';
import type { QueueSubmission } from '@/hooks/useQueueSubmissions';

interface NowPlayingCardProps {
  track: QueueSubmission;
  compact?: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function NowPlayingCard({ track, compact = false }: NowPlayingCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg glow-primary">
      {/* Background artwork blur */}
      {track.thumbnail && (
        <div className="absolute inset-0">
          <img src={track.thumbnail} alt="" className="w-full h-full object-cover opacity-20 blur-2xl scale-110" />
        </div>
      )}

      <div className="relative flex items-center gap-4 p-5">
        {/* Album art / spinning disc */}
        <div className="relative flex-shrink-0">
          {track.thumbnail ? (
            <div className="w-20 h-20 rounded-xl overflow-hidden shadow-lg">
              <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
              <Disc3 className="h-10 w-10 animate-spin-slow opacity-60" />
            </div>
          )}
          {/* Live dot */}
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary-foreground flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70 mb-1">Now Playing</p>
          <p className="text-base font-bold truncate">{track.title}</p>
          <div className="flex items-center gap-3 mt-1.5 opacity-80">
            <p className="text-xs">{track.submitted_by}</p>
            {track.duration_seconds && (
              <div className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(track.duration_seconds)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Equalizer bars */}
        <div className="flex items-end gap-[2px] h-8 flex-shrink-0 opacity-70">
          {[0, 0.15, 0.3, 0.1, 0.25].map((delay, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-primary-foreground animate-equalizer"
              style={{ animationDelay: `${delay}s`, animationDuration: `${0.5 + i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
