import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QueueSubmission {
  id: string;
  url: string;
  title: string;
  submitted_by: string;
  status: string;
  created_at: string;
  thumbnail: string | null;
  duration_seconds: number | null;
}

interface SubmitLinkOptions {
  submittedBy?: string;
  thumbnail?: string;
  durationSeconds?: number;
  status?: string;
}

export function useQueueSubmissions() {
  const [submissions, setSubmissions] = useState<QueueSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(async () => {
    const { data } = await supabase
      .from('queue_submissions')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setSubmissions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubmissions();

    const channel = supabase
      .channel('queue-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_submissions' }, () => {
        fetchSubmissions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSubmissions]);

  const submitLink = useCallback(async (url: string, title: string, options: SubmitLinkOptions = {}) => {
    const { error } = await supabase
      .from('queue_submissions')
      .insert({
        url,
        title,
        submitted_by: options.submittedBy || 'Anonymous',
        thumbnail: options.thumbnail || null,
        duration_seconds: options.durationSeconds || null,
        status: options.status || 'pending',
      });
    return { error };
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase
      .from('queue_submissions')
      .update({ status })
      .eq('id', id);
    if (!error) fetchSubmissions();
    return { error };
  }, [fetchSubmissions]);

  const removeSubmission = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('queue_submissions')
      .delete()
      .eq('id', id);
    if (!error) fetchSubmissions();
    return { error };
  }, [fetchSubmissions]);

  return { submissions, loading, submitLink, updateStatus, removeSubmission, refresh: fetchSubmissions };
}
