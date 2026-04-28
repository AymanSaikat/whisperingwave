import { Monitor, Smartphone, Speaker, Headphones, Check, RefreshCw } from 'lucide-react';
import { AudioDevice } from '@/hooks/useAudioDevices';

interface DeviceSelectorProps {
  devices: AudioDevice[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  onRefresh: () => void;
}

function getDeviceIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('headphone') || l.includes('airpod') || l.includes('buds')) return Headphones;
  if (l.includes('phone') || l.includes('mobile')) return Smartphone;
  if (l.includes('speaker') || l.includes('jbl') || l.includes('sonos')) return Speaker;
  return Monitor;
}

export default function DeviceSelector({ devices, selectedDeviceId, onSelectDevice, onRefresh }: DeviceSelectorProps) {
  return (
    <div className="glass-panel rounded-2xl p-6 w-full max-w-md animate-slide-up">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <Speaker className="h-4 w-4 text-primary" /> Audio Output
        <button onClick={onRefresh} className="ml-auto text-muted-foreground hover:text-primary transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </h3>
      <div className="space-y-2">
        {devices.map(device => {
          const Icon = getDeviceIcon(device.label);
          const isSelected = selectedDeviceId === device.deviceId;
          return (
            <button
              key={device.deviceId}
              onClick={() => onSelectDevice(device.deviceId)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                isSelected
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-surface-hover border border-transparent'
              }`}
            >
              <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`flex-1 text-left text-sm ${isSelected ? 'text-foreground font-medium' : 'text-secondary-foreground'}`}>
                {device.label}
              </span>
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </button>
          );
        })}
        {devices.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No audio devices found. Click refresh to scan.</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Select which audio output device plays your music.
      </p>
    </div>
  );
}
