import { Music, Users, TrendingUp, Radio, ListMusic, Activity } from 'lucide-react';
import type { QueueSubmission } from '@/hooks/useQueueSubmissions';
import NowPlayingCard from '@/components/NowPlayingCard';

interface AdminDashboardProps {
  submissions: QueueSubmission[];
}

export default function AdminDashboard({ submissions }: AdminDashboardProps) {
  const pending = submissions.filter(s => s.status === 'pending').length;
  const approved = submissions.filter(s => s.status === 'approved').length;
  const playing = submissions.find(s => s.status === 'playing');
  const played = submissions.filter(s => s.status === 'played').length;
  const rejected = submissions.filter(s => s.status === 'rejected').length;
  const total = submissions.length;
  const uniqueSubmitters = new Set(submissions.map(s => s.submitted_by)).size;
  const upNext = submissions.filter(s => s.status === 'pending' || s.status === 'approved').length;

  const stats = [
    { label: 'Total Tracks', value: total, icon: Music },
    { label: 'Up Next', value: upNext, icon: ListMusic },
    { label: 'Played', value: played, icon: TrendingUp },
    { label: 'Submitters', value: uniqueSubmitters, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="surface-elevated rounded-3xl border border-border/60 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Control Room</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Admin Dashboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">Monitor queue flow, live playback, and audience activity.</p>
          </div>
          <div className="rounded-2xl bg-secondary px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-medium">Queue Health</span>
            </div>
            <p className="mt-1 text-muted-foreground">{pending} waiting approval · {approved} approved · {rejected} rejected</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="surface-elevated rounded-3xl border border-border/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {playing && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            <Radio className="h-4 w-4 text-primary animate-pulse" />
            <span>Live Playback</span>
          </div>
          <NowPlayingCard track={playing} />
        </div>
      )}

      <div className="surface-elevated rounded-3xl border border-border/60 p-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Recent Activity</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {submissions.slice(0, 10).map(sub => (
            <div key={sub.id} className="flex items-center gap-3 p-2 rounded-lg">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                sub.status === 'playing' ? 'bg-primary/10 text-primary' :
                sub.status === 'pending' ? 'bg-secondary text-foreground' :
                sub.status === 'approved' ? 'bg-secondary text-primary' :
                sub.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                'bg-muted text-muted-foreground'
              }`}>
                {sub.status}
              </span>
              <span className="text-sm truncate flex-1">{sub.title}</span>
              <span className="text-xs text-muted-foreground">{sub.submitted_by}</span>
            </div>
          ))}
          {submissions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No submissions yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="surface-elevated rounded-3xl border border-border/60 p-4">
          <p className="text-xs text-muted-foreground mb-1">Approval Rate</p>
          <p className="text-xl font-bold tabular-nums">
            {total > 0 ? Math.round(((played + approved) / total) * 100) : 0}%
          </p>
        </div>
        <div className="surface-elevated rounded-3xl border border-border/60 p-4">
          <p className="text-xs text-muted-foreground mb-1">Rejected</p>
          <p className="text-xl font-bold tabular-nums">{rejected}</p>
        </div>
      </div>
    </div>
  );
}
