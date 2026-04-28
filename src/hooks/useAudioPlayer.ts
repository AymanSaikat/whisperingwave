import { useState, useRef, useCallback, useEffect } from 'react';
import { useYouTubePlayer, extractYouTubeId } from './useYouTubePlayer';

export interface QueueItem {
  id: string;
  url: string;
  title: string;
  isYouTube: boolean;
  youtubeId?: string;
  addedAt: Date;
}

type QueueItemSeed = {
  title?: string;
  isYouTube?: boolean;
  youtubeId?: string;
};

function extractTitle(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube') || u.hostname.includes('youtu.be')) return 'YouTube Video';
    if (u.hostname.includes('spotify')) return 'Spotify Track';
    if (u.hostname.includes('soundcloud')) return 'SoundCloud Track';
    const path = u.pathname.split('/').pop() || '';
    return decodeURIComponent(path) || u.hostname;
  } catch { return url.slice(0, 40); }
}

export function useAudioPlayer(onTrackEnded?: () => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<'html' | 'youtube'>('html');
  const onTrackEndedRef = useRef(onTrackEnded);
  onTrackEndedRef.current = onTrackEnded;

  const queueRef = useRef(queue);
  queueRef.current = queue;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const yt = useYouTubePlayer('yt-hidden-player');

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Sync YouTube state
  useEffect(() => {
    if (activeSource === 'youtube') {
      setCurrentTime(yt.currentTime);
      setDuration(yt.duration);
      // YT.PlayerState: PLAYING=1, PAUSED=2, ENDED=0
      if (yt.playerState === 1) setIsPlaying(true);
      else if (yt.playerState === 2) setIsPlaying(false);
      else if (yt.playerState === 0) {
        // ended
        setIsPlaying(false);
        onTrackEndedRef.current?.();
        const idx = currentIndexRef.current;
        const q = queueRef.current;
        if (idx < q.length - 1) {
          playIndexInternal(idx + 1);
        }
      }
    }
  }, [activeSource, yt.currentTime, yt.duration, yt.playerState]);

  // HTML Audio setup
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      if (activeSource === 'html') setCurrentTime(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', () => {
      if (activeSource === 'html') { setDuration(audio.duration); setIsLoading(false); }
    });
    audio.addEventListener('ended', () => {
      if (activeSource !== 'html') return;
      setIsPlaying(false);
      onTrackEndedRef.current?.();
      const idx = currentIndexRef.current;
      const q = queueRef.current;
      if (idx < q.length - 1) playIndexInternal(idx + 1);
    });
    audio.addEventListener('error', () => {
      if (activeSource !== 'html') return;
      setError('Failed to load audio. Make sure the URL points to a direct audio file (e.g. .mp3).');
      setIsLoading(false);
      setIsPlaying(false);
    });

    return () => { audio.pause(); audio.src = ''; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAll = useCallback(() => {
    audioRef.current?.pause();
    yt.pause();
  }, [yt]);

  const playItemByTrack = useCallback((item: QueueItem) => {
    stopAll();
    setError(null);
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);

    if (item.isYouTube && item.youtubeId) {
      setActiveSource('youtube');
      yt.loadVideo(item.youtubeId);
      yt.setVolume(volume);
      setIsLoading(false);
    } else {
      setActiveSource('html');
      const audio = audioRef.current;
      if (!audio) return;
      audio.src = item.url;
      audio.play().then(() => setIsPlaying(true)).catch(() => {
        setError('Playback failed. Try clicking Play again (browsers block autoplay).');
        setIsLoading(false);
      });
    }
  }, [stopAll, yt, volume]);

  const playItemRef = useRef(playItemByTrack);
  playItemRef.current = playItemByTrack;

  const playIndexInternal = useCallback((index: number) => {
    const q = queueRef.current;
    if (index < 0 || index >= q.length) return;
    setCurrentIndex(index);
    playItemRef.current(q[index]);
  }, []);

  const playIndex = useCallback((index: number) => {
    playIndexInternal(index);
  }, [playIndexInternal]);

  const createQueueItem = useCallback((url: string, seed?: QueueItemSeed): QueueItem => {
    const ytId = seed?.youtubeId ?? extractYouTubeId(url);
    return {
      id: crypto.randomUUID(),
      url,
      title: seed?.title?.trim() || extractTitle(url),
      isYouTube: seed?.isYouTube ?? !!ytId,
      youtubeId: ytId || undefined,
      addedAt: new Date(),
    };
  }, []);

  const playNow = useCallback((url: string, seed?: QueueItemSeed) => {
    const item = createQueueItem(url, seed);
    setQueue(prev => {
      const newQueue = [...prev, item];
      queueRef.current = newQueue;
      return newQueue;
    });
    setCurrentIndex(prev => {
      const q = queueRef.current;
      return q.length - 1;
    });
    playItemByTrack(item);
  }, [createQueueItem, playItemByTrack]);

  const playSingle = useCallback((url: string, seed?: QueueItemSeed) => {
    const item = createQueueItem(url, seed);
    setQueue([item]);
    queueRef.current = [item];
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    playItemByTrack(item);
  }, [createQueueItem, playItemByTrack]);

  const addToQueue = useCallback((url: string, seed?: QueueItemSeed) => {
    const item = createQueueItem(url, seed);
    setQueue(prev => {
      const newQueue = [...prev, item];
      queueRef.current = newQueue;
      if (prev.length === 0) {
        setCurrentIndex(0);
        playItemRef.current(item);
      }
      return newQueue;
    });
  }, [createQueueItem]);

  const togglePlay = useCallback(() => {
    if (activeSource === 'youtube') {
      if (isPlaying) yt.pause();
      else yt.play();
    } else {
      const audio = audioRef.current;
      if (!audio || !audio.src) return;
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else { audio.play().then(() => setIsPlaying(true)).catch(() => {}); }
    }
  }, [isPlaying, activeSource, yt]);

  const seek = useCallback((time: number) => {
    if (activeSource === 'youtube') {
      yt.seekTo(time);
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  }, [activeSource, yt]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    yt.setVolume(v);
  }, [yt]);

  const skipNext = useCallback(() => {
    const idx = currentIndexRef.current;
    const q = queueRef.current;
    if (idx < q.length - 1) playIndexInternal(idx + 1);
  }, [playIndexInternal]);

  const skipPrev = useCallback(() => {
    const idx = currentIndexRef.current;
    if (idx > 0) playIndexInternal(idx - 1);
  }, [playIndexInternal]);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => {
      const newQueue = prev.filter(item => item.id !== id);
      queueRef.current = newQueue;
      return newQueue;
    });
  }, []);

  return {
    isPlaying, currentTime, duration, volume, queue, currentTrack, currentIndex,
    error, isLoading, togglePlay, seek, changeVolume, addToQueue, playNow, playSingle,
    skipNext, skipPrev, removeFromQueue, playIndex,
    _audioElement: audioRef.current,
  };
}
