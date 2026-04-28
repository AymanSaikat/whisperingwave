import { useState, useEffect, useCallback, useRef } from 'react';

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audiooutput';
}

export function useAudioDevices() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const refreshDevices = useCallback(async () => {
    try {
      // Need permission first
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop()));
      const all = await navigator.mediaDevices.enumerateDevices();
      const outputs = all
        .filter(d => d.kind === 'audiooutput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || 'Speaker', kind: 'audiooutput' as const }));
      setDevices(outputs.length > 0 ? outputs : [{ deviceId: 'default', label: 'Default Speaker', kind: 'audiooutput' }]);
    } catch {
      setDevices([{ deviceId: 'default', label: 'Default Speaker', kind: 'audiooutput' }]);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices?.addEventListener('devicechange', refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener('devicechange', refreshDevices);
  }, [refreshDevices]);

  const selectDevice = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (audioRef.current && 'setSinkId' in audioRef.current) {
      try {
        await (audioRef.current as any).setSinkId(deviceId);
      } catch (e) {
        console.warn('setSinkId failed:', e);
      }
    }
  }, []);

  const attachAudioElement = useCallback((audio: HTMLAudioElement) => {
    audioRef.current = audio;
    if ('setSinkId' in audio && selectedDeviceId !== 'default') {
      (audio as any).setSinkId(selectedDeviceId).catch(() => {});
    }
  }, [selectedDeviceId]);

  return { devices, selectedDeviceId, selectDevice, attachAudioElement, refreshDevices };
}
