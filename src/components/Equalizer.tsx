interface EqualizerProps {
  isPlaying: boolean;
}

export default function Equalizer({ isPlaying }: EqualizerProps) {
  const bars = 20;
  return (
    <div className="flex items-end justify-center gap-[3px] h-12 opacity-50">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full bg-primary transition-all duration-300 ${
            isPlaying ? 'animate-equalizer' : ''
          }`}
          style={{
            height: isPlaying ? undefined : '3px',
            animationDelay: `${(i * 0.07) % 0.5}s`,
            animationDuration: `${0.5 + Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}
