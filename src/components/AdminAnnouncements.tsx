import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Megaphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Announcement } from '@/hooks/useAnnouncements';

interface AdminAnnouncementsProps {
  announcements: Announcement[];
  onAdd: (message: string) => Promise<{ error: any }>;
  onToggle: (id: string, is_active: boolean) => Promise<{ error: any }>;
  onRemove: (id: string) => Promise<{ error: any }>;
}

export default function AdminAnnouncements({ announcements, onAdd, onToggle, onRemove }: AdminAnnouncementsProps) {
  const [newMessage, setNewMessage] = useState('');

  const handleAdd = async () => {
    if (!newMessage.trim()) {
      toast({ title: 'Enter a message', variant: 'destructive' });
      return;
    }
    const { error } = await onAdd(newMessage.trim());
    if (error) toast({ title: 'Error', variant: 'destructive' });
    else { setNewMessage(''); toast({ title: 'Announcement created' }); }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-accent" /> Announcements
      </h2>
      <p className="text-sm text-muted-foreground">
        Display messages on the public page. Only active announcements are shown to visitors.
      </p>

      {/* Add */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Type an announcement..."
          className="bg-secondary border-glass-border"
        />
        <Button onClick={handleAdd} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Add Announcement
        </Button>
      </div>

      {/* List */}
      <div className="glass-panel rounded-2xl p-5">
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No announcements</p>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-all">
                <Switch
                  checked={a.is_active}
                  onCheckedChange={() => onToggle(a.id, !a.is_active)}
                />
                <p className={`text-sm flex-1 ${a.is_active ? '' : 'text-muted-foreground line-through'}`}>
                  {a.message}
                </p>
                <Button size="sm" variant="ghost" onClick={() => onRemove(a.id)}>
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
