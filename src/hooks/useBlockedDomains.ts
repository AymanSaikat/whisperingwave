import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BlockedDomain {
  id: string;
  domain: string;
  reason: string;
  created_at: string;
}

export function useBlockedDomains() {
  const [domains, setDomains] = useState<BlockedDomain[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('blocked_domains').select('*').order('created_at', { ascending: false });
    if (data) setDomains(data);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addDomain = useCallback(async (domain: string, reason: string) => {
    const { error } = await supabase.from('blocked_domains').insert({ domain, reason });
    if (!error) fetch();
    return { error };
  }, [fetch]);

  const removeDomain = useCallback(async (id: string) => {
    const { error } = await supabase.from('blocked_domains').delete().eq('id', id);
    if (!error) fetch();
    return { error };
  }, [fetch]);

  return { domains, addDomain, removeDomain, refresh: fetch };
}
