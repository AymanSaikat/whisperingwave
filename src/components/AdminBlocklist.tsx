import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Ban } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { BlockedDomain } from '@/hooks/useBlockedDomains';

interface AdminBlocklistProps {
  domains: BlockedDomain[];
  onAdd: (domain: string, reason: string) => Promise<{ error: any }>;
  onRemove: (id: string) => Promise<{ error: any }>;
}

export default function AdminBlocklist({ domains, onAdd, onRemove }: AdminBlocklistProps) {
  const [newDomain, setNewDomain] = useState('');
  const [newReason, setNewReason] = useState('');

  const handleAdd = async () => {
    if (!newDomain.trim()) {
      toast({ title: 'Enter a domain', variant: 'destructive' });
      return;
    }
    const { error } = await onAdd(newDomain.trim().toLowerCase(), newReason.trim());
    if (error) toast({ title: 'Error', description: 'Failed to add domain.', variant: 'destructive' });
    else { setNewDomain(''); setNewReason(''); toast({ title: 'Domain blocked' }); }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Ban className="h-5 w-5 text-destructive" /> Blocked Domains
      </h2>
      <p className="text-sm text-muted-foreground">
        Block specific domains from being submitted. Links from these domains will be rejected.
      </p>

      {/* Add domain */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <div className="flex gap-2">
          <Input
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            placeholder="e.g. example.com"
            className="bg-secondary border-glass-border"
          />
          <Input
            value={newReason}
            onChange={e => setNewReason(e.target.value)}
            placeholder="Reason (optional)"
            className="bg-secondary border-glass-border"
          />
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Block Domain
        </Button>
      </div>

      {/* List */}
      <div className="glass-panel rounded-2xl p-5">
        {domains.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No blocked domains</p>
        ) : (
          <div className="space-y-2">
            {domains.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-all">
                <Ban className="h-4 w-4 text-destructive flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{d.domain}</p>
                  {d.reason && <p className="text-xs text-muted-foreground">{d.reason}</p>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => onRemove(d.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
