import { useState } from 'react';
import { Link2, Play, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface LinkInputProps {
  onPlayNow: (url: string) => void;
  onAddToQueue: (url: string) => void;
}

function validateUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch { return false; }
}

export default function LinkInput({ onPlayNow, onAddToQueue }: LinkInputProps) {
  const [url, setUrl] = useState('');

  const handlePlay = () => {
    if (!validateUrl(url)) {
      toast({ title: 'Invalid URL', description: 'Please enter a valid music or video link.', variant: 'destructive' });
      return;
    }
    onPlayNow(url);
    setUrl('');
  };

  const handleQueue = () => {
    if (!validateUrl(url)) {
      toast({ title: 'Invalid URL', description: 'Please enter a valid music or video link.', variant: 'destructive' });
      return;
    }
    onAddToQueue(url);
    setUrl('');
    toast({ title: 'Added to queue' });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-slide-up">
      <div className="relative">
        <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
          placeholder="Paste a music or video link (YouTube, Spotify, MP3 URL...)"
          className="pl-12 pr-4 h-14 text-base bg-secondary border-glass-border focus:ring-2 focus:ring-primary/50 rounded-xl"
        />
      </div>
      <div className="flex gap-3 justify-center">
        <Button onClick={handlePlay} size="lg" className="gap-2 rounded-xl glow-primary font-semibold px-8">
          <Play className="h-5 w-5" /> Play Now
        </Button>
        <Button onClick={handleQueue} size="lg" variant="outline" className="gap-2 rounded-xl border-glass-border hover:bg-surface-hover">
          <Plus className="h-5 w-5" /> Add to Queue
        </Button>
      </div>
    </div>
  );
}
