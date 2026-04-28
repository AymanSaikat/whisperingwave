import { Play, Check, X, Trash2, Clock, Music, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QueueSubmission } from '@/hooks/useQueueSubmissions';

interface AdminQueueManagerProps {
  submissions: QueueSubmission[];
  onPlay: (sub: { id: string; url: string; title: string }) => void;
  onUpdateStatus: (id: string, status: string) => Promise<{ error: any }>;
  onRemove: (id: string) => Promise<{ error: any }>;
}

export default function AdminQueueManager({ submissions, onPlay, onUpdateStatus, onRemove }: AdminQueueManagerProps) {
  const pending = submissions.filter(s => s.status === 'pending');
  const approved = submissions.filter(s => s.status === 'approved');
  const playing = submissions.find(s => s.status === 'playing');
  const played = submissions.filter(s => s.status === 'played');

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const TrackRow = ({ sub, actions }: { sub: QueueSubmission; actions: React.ReactNode }) => (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
      {sub.thumbnail ? (
        <img src={sub.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <Music className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight break-words">{sub.title || 'Untitled track'}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{sub.submitted_by}</span>
          {formatDuration(sub.duration_seconds) && <span>• {formatDuration(sub.duration_seconds)}</span>}
          <span className="rounded-full bg-secondary px-2 py-0.5 uppercase tracking-wider">{sub.status}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">{actions}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Queue Manager</h2>
        <p className="text-sm text-muted-foreground">Review incoming tracks, keep the queue moving, and see full track details.</p>
      </div>

      {playing && (
        <div className="surface-elevated rounded-3xl overflow-hidden border border-border/60">
          <div className="px-4 py-2 bg-primary/5 flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Now Playing</span>
          </div>
          <TrackRow
            sub={playing}
            actions={
              <Button size="sm" variant="ghost" onClick={() => onUpdateStatus(playing.id, 'played')} className="h-8 text-xs">
                <X className="h-3.5 w-3.5 mr-1" /> Stop
              </Button>
            }
          />
        </div>
      )}

      <div className="surface-elevated rounded-3xl overflow-hidden border border-border/60">
        <div className="px-4 py-2 border-b border-border flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Pending ({pending.length})</span>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No pending submissions</p>
        ) : (
          <div className="divide-y divide-border">
            {pending.map(sub => (
              <TrackRow
                key={sub.id}
                sub={sub}
                actions={
                  <>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onPlay(sub)}>
                      <Play className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onUpdateStatus(sub.id, 'approved')}>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onUpdateStatus(sub.id, 'rejected')}>
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onRemove(sub.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>

      {approved.length > 0 && (
        <div className="surface-elevated rounded-3xl overflow-hidden border border-border/60">
          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Approved ({approved.length})</span>
          </div>
          <div className="divide-y divide-border">
            {approved.map(sub => (
              <TrackRow
                key={sub.id}
                sub={sub}
                actions={
                  <Button size="sm" variant="ghost" className="h-8 text-xs text-primary" onClick={() => onPlay(sub)}>
                    <Play className="h-3.5 w-3.5 mr-1" /> Play
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {played.length > 0 && (
        <div className="surface-elevated rounded-3xl overflow-hidden border border-border/60">
          <div className="px-4 py-2 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">History ({played.length})</span>
          </div>
          <div className="divide-y divide-border max-h-48 overflow-y-auto">
            {played.map(sub => (
              <div key={sub.id} className="flex items-center gap-3 px-4 py-2 text-muted-foreground">
                <p className="text-xs truncate flex-1">{sub.title} — {sub.submitted_by}</p>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onRemove(sub.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
