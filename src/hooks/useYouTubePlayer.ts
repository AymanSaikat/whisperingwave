/// <reference types="youtube" />
import { useRef, useState, useCallback, useEffect } from 'react';

let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (apiReady) { resolve(); return; }
    readyCallbacks.push(resolve);
    if (apiLoaded) return;
    apiLoaded = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    (window as unknown as Record<string, unknown>).onYouTubeIframeAPIReady = () => {
      apiReady = true;
      readyCallbacks.forEach(cb => cb());
      readyCallbacks.length = 0;
    };
  });
}

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0];
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2];
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
    }
    return null;
  } catch { return null; }
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

interface UseYouTubePlayerReturn {
  loadVideo: (videoId: string) => void;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  destroy: () => void;
  isReady: boolean;
  playerState: number;
  currentTime: number;
  duration: number;
}

export function useYouTubePlayer(containerId: string): UseYouTubePlayerReturn {
  const playerRef = useRef<YT.Player | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [playerState, setPlayerState] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const startTimeUpdates = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      const p = playerRef.current;
      if (p && typeof p.getCurrentTime === 'function') {
        setCurrentTime(p.getCurrentTime());
        setDuration(p.getDuration() || 0);
      }
    }, 250);
  }, []);

  const stopTimeUpdates = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    return () => { stopTimeUpdates(); };
  }, [stopTimeUpdates]);

  const loadVideo = useCallback(async (videoId: string) => {
    await loadYouTubeAPI();

    // Ensure container exists
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.position = 'absolute';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.overflow = 'hidden';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    // Destroy old player
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }

    // Create fresh div inside container
    container.innerHTML = '';
    const playerDiv = document.createElement('div');
    playerDiv.id = containerId + '-inner';
    container.appendChild(playerDiv);

    playerRef.current = new window.YT.Player(playerDiv.id, {
      height: '1',
      width: '1',
      videoId,
      playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1 },
      events: {
        onReady: () => {
          setIsReady(true);
          startTimeUpdates();
        },
        onStateChange: (e: YT.OnStateChangeEvent) => {
          setPlayerState(e.data);
          if (e.data === YT.PlayerState.PLAYING) startTimeUpdates();
          else if (e.data === YT.PlayerState.ENDED || e.data === YT.PlayerState.PAUSED) stopTimeUpdates();
        },
        onError: (e: YT.OnErrorEvent) => {
          console.error('YouTube player error:', e.data);
        },
      },
    });
  }, [containerId, startTimeUpdates, stopTimeUpdates]);

  const play = useCallback(() => { playerRef.current?.playVideo(); }, []);
  const pause = useCallback(() => { playerRef.current?.pauseVideo(); }, []);
  const seekTo = useCallback((s: number) => { playerRef.current?.seekTo(s, true); }, []);
  const setVolume = useCallback((v: number) => { playerRef.current?.setVolume(v * 100); }, []);

  const destroy = useCallback(() => {
    stopTimeUpdates();
    if (playerRef.current) { try { playerRef.current.destroy(); } catch {} playerRef.current = null; }
    setIsReady(false);
  }, [stopTimeUpdates]);

  return { loadVideo, play, pause, seekTo, setVolume, destroy, isReady, playerState, currentTime, duration };
}
