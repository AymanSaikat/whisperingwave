import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Announcement {
  id: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addAnnouncement = useCallback(async (message: string) => {
    const { error } = await supabase.from('announcements').insert({ message });
    if (!error) fetch();
    return { error };
  }, [fetch]);

  const toggleAnnouncement = useCallback(async (id: string, is_active: boolean) => {
    const { error } = await supabase.from('announcements').update({ is_active }).eq('id', id);
    if (!error) fetch();
    return { error };
  }, [fetch]);

  const removeAnnouncement = useCallback(async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) fetch();
    return { error };
  }, [fetch]);

  return { announcements, addAnnouncement, toggleAnnouncement, removeAnnouncement, refresh: fetch };
}
