'use client';

import { useEffect, useRef, useState } from 'react';
import { formatTime } from '@/lib/utils';

interface VideoPlayerProps {
  videoUrl: string;
  onTimeUpdate?: (currentTime: number) => void;
  seekTo?: number | null;
  shouldPause?: boolean;
}

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({
  videoUrl,
  onTimeUpdate,
  seekTo,
  shouldPause,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isYouTube, setIsYouTube] = useState(false);
  const [videoId, setVideoId] = useState('');
  const [playerReady, setPlayerReady] = useState(false);

  // Check if URL is YouTube
  useEffect(() => {
    if (!videoUrl) return;

    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = videoUrl.match(youtubeRegex);

    if (match && match[1]) {
      setIsYouTube(true);
      setVideoId(match[1]);
    } else {
      setIsYouTube(false);
      setVideoId('');
    }
  }, [videoUrl]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!isYouTube) return;

    // Load YouTube IFrame API script if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Initialize player when API is ready
    const initPlayer = () => {
      if (window.YT && window.YT.Player && videoId) {
        playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
          },
          events: {
            onReady: (event: any) => {
              setPlayerReady(true);
              setDuration(event.target.getDuration());
            },
            onStateChange: (event: any) => {
              // YT.PlayerState.PLAYING = 1
              if (event.data === 1) {
                setIsPlaying(true);
                startTimeTracking();
              } else {
                setIsPlaying(false);
                stopTimeTracking();
              }
            },
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      stopTimeTracking();
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [isYouTube, videoId]);

  // Time tracking for YouTube
  const startTimeTracking = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    }, 500); // Update every 500ms
  };

  const stopTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Handle seek for YouTube
  useEffect(() => {
    if (seekTo !== null && seekTo !== undefined) {
      if (isYouTube && playerRef.current && playerReady) {
        playerRef.current.seekTo(seekTo, true);
        playerRef.current.playVideo();
      } else if (videoRef.current) {
        videoRef.current.currentTime = seekTo;
        videoRef.current.play();
      }
    }
  }, [seekTo, isYouTube, playerReady]);

  // Handle pause/resume
  useEffect(() => {
    if (shouldPause === undefined) return;

    if (shouldPause) {
      // Pause the video
      if (isYouTube && playerRef.current && playerReady) {
        playerRef.current.pauseVideo();
      } else if (videoRef.current) {
        videoRef.current.pause();
      }
    } else {
      // Resume is handled by user clicking play
      // We don't auto-resume to let the user control when to continue
    }
  }, [shouldPause, isYouTube, playerReady]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  if (isYouTube) {
    return (
      <div className="w-full">
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
          <div
            id={`youtube-player-${videoId}`}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls
        />
      </div>

      {/* Custom Timeline */}
      <div className="mt-4 space-y-2">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
