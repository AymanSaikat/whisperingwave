import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAppSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from('app_settings').select('key, value');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(r => { if (r.key && r.value !== null) map[r.key] = r.value; });
      setSettings(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const updateSetting = useCallback(async (key: string, value: string) => {
    // Use upsert so settings are created if they don't exist
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    if (!error) setSettings(prev => ({ ...prev, [key]: value }));
    return { error };
  }, []);

  return { settings, loading, updateSetting, refresh: fetchSettings };
}
