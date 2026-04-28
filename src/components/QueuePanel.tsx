import { Music, X, Play } from 'lucide-react';
import type { QueueItem } from '@/hooks/useAudioPlayer';

interface QueuePanelProps {
  queue: QueueItem[];
  currentIndex: number;
  onPlay: (index: number) => void;
  onRemove: (id: string) => void;
}

export default function QueuePanel({ queue, currentIndex, onPlay, onRemove }: QueuePanelProps) {
  if (queue.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-6 w-full max-w-md animate-slide-up">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <Music className="h-4 w-4 text-accent" /> Queue ({queue.length})
      </h3>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {queue.map((item, i) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              i === currentIndex ? 'bg-primary/10 border border-primary/20' : 'hover:bg-surface-hover'
            }`}
          >
            <button onClick={() => onPlay(i)} className="text-muted-foreground hover:text-primary transition-colors">
              {i === currentIndex ? (
                <div className="flex items-end gap-0.5 h-4 w-4">
                  <div className="w-1 bg-primary rounded-full animate-equalizer" style={{ animationDelay: '0s' }} />
                  <div className="w-1 bg-primary rounded-full animate-equalizer" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 bg-primary rounded-full animate-equalizer" style={{ animationDelay: '0.4s' }} />
                </div>
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <span className={`text-sm flex-1 truncate ${i === currentIndex ? 'text-primary font-medium' : ''}`}>
              {item.title}
            </span>
            <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
