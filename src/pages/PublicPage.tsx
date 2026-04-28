import { useState } from 'react';
import { Music, Send, Megaphone, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useQueueSubmissions } from '@/hooks/useQueueSubmissions';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useBlockedDomains } from '@/hooks/useBlockedDomains';
import NowPlayingCard from '@/components/NowPlayingCard';

function validateUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch { return false; }
}

function extractTitle(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube') || u.hostname.includes('youtu.be')) return 'YouTube Video';
    if (u.hostname.includes('spotify')) return 'Spotify Track';
    if (u.hostname.includes('soundcloud')) return 'SoundCloud Track';
    const path = u.pathname.split('/').pop() || '';
    return decodeURIComponent(path) || u.hostname;
  } catch { return url.slice(0, 40); }
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0];
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2];
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
    }
    return null;
  } catch { return null; }
}

function getThumbnail(url: string): string | null {
  const ytId = extractYouTubeId(url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
  return null;
}

async function fetchTrackMetadata(url: string): Promise<{ title: string; thumbnail: string | null }> {
  const fallback = { title: extractTitle(url), thumbnail: getThumbnail(url) };

  try {
    if (extractYouTubeId(url)) {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (res.ok) {
        const data = await res.json();
        return {
          title: data.title || fallback.title,
          thumbnail: data.thumbnail_url || fallback.thumbnail,
        };
      }
    }

    if (url.includes('soundcloud.com')) {
      const res = await fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        return {
          title: data.title || fallback.title,
          thumbnail: data.thumbnail_url || fallback.thumbnail,
        };
      }
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return ''; }
}

export default function PublicPage() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const { submissions, submitLink } = useQueueSubmissions();
  const { announcements } = useAnnouncements();
  const { settings } = useAppSettings();
  const { domains: blockedDomains } = useBlockedDomains();

  const nowPlaying = submissions.find(s => s.status === 'playing');
  const pending = submissions.filter(s => s.status === 'pending' || s.status === 'approved');
  const activeAnnouncements = announcements.filter(a => a.is_active);

  const siteTitle = settings.site_title || 'SoundCast';
  const siteDescription = settings.site_description || 'Submit a music link and it plays on the main speaker.';
  const cooldown = parseInt(settings.submission_cooldown_seconds || '30', 10);
  const maxQueue = parseInt(settings.max_queue_size || '50', 10);
  const autoApprove = settings.auto_approve === 'true' && settings.require_approval === 'true';

  const handleSubmit = async () => {
    if (!validateUrl(url)) {
      toast({ title: 'Invalid URL', description: 'Please enter a valid music or video link.', variant: 'destructive' });
      return;
    }
    const domain = getDomain(url);
    if (blockedDomains.some(d => domain.includes(d.domain))) {
      toast({ title: 'Blocked', description: 'Links from this domain are not allowed.', variant: 'destructive' });
      return;
    }
    const elapsed = (Date.now() - lastSubmitTime) / 1000;
    if (elapsed < cooldown && lastSubmitTime > 0) {
      toast({ title: 'Too fast', description: `Please wait ${Math.ceil(cooldown - elapsed)}s before submitting again.`, variant: 'destructive' });
      return;
    }
    if (pending.length >= maxQueue) {
      toast({ title: 'Queue full', description: 'The queue is full. Try again later.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const metadata = await fetchTrackMetadata(url);
    const { error } = await submitLink(url, metadata.title, {
      submittedBy: name || 'Anonymous',
      thumbnail: metadata.thumbnail || undefined,
      status: autoApprove ? 'approved' : 'pending',
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to submit. Try again.', variant: 'destructive' });
    } else {
      toast({ title: '🎵 Submitted!', description: 'Your track has been added to the queue.' });
      setUrl('');
      setLastSubmitTime(Date.now());
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Announcements banner */}
      {activeAnnouncements.length > 0 && (
        <div className="border-b border-border bg-primary/5">
          <div className="max-w-2xl mx-auto px-4 py-2">
            {activeAnnouncements.map(a => (
              <div key={a.id} className="flex items-center gap-2 text-sm">
                <Megaphone className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <p className="text-foreground/80">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 pt-16 pb-32">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-5 shadow-lg glow-primary">
            <Disc3 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">{siteTitle}</h1>
          <p className="text-muted-foreground text-lg">{siteDescription}</p>
        </div>

        {/* Now Playing */}
        {nowPlaying && (
          <div className="mb-10">
            <NowPlayingCard track={nowPlaying} />
          </div>
        )}

        {/* Submit form */}
        <div className="space-y-3 mb-12">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="h-12 rounded-xl bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
          />
          <div className="relative">
            <Music className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Paste a YouTube, Spotify, or audio link..."
              className="pl-12 h-14 text-base rounded-xl bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            size="lg"
            className="w-full gap-2 rounded-xl h-12 font-semibold text-base"
          >
            <Send className="h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit to Queue'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {pending.length}/{maxQueue} in queue · {cooldown}s cooldown
          </p>
        </div>

        {/* Queue */}
        {pending.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Up Next · {pending.length} tracks
            </h3>
            <div className="surface-elevated rounded-2xl divide-y divide-border overflow-hidden">
              {pending.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
                  <span className="text-xs text-muted-foreground w-5 text-right tabular-nums">{i + 1}</span>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Music className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.submitted_by}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="surface-elevated rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">How It Works</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { step: '1', title: 'Paste', desc: 'Any music link' },
              { step: '2', title: 'Submit', desc: 'Added to queue' },
              { step: '3', title: 'Listen', desc: 'Plays on speaker' },
            ].map(s => (
              <div key={s.step} className="space-y-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center mx-auto">
                  {s.step}
                </div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
