'use client';

import { useEffect, useRef, useState } from 'react';
import { formatTime } from '@/lib/utils';

interface VideoPlayerProps {
  videoUrl: string;
  onTimeUpdate?: (currentTime: number) => void;
  seekTo?: number | null;
}

export default function VideoPlayer({
  videoUrl,
  onTimeUpdate,
  seekTo,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isYouTube, setIsYouTube] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');

  // Check if URL is YouTube
  useEffect(() => {
    if (!videoUrl) return;

    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = videoUrl.match(youtubeRegex);

    if (match && match[1]) {
      setIsYouTube(true);
      setEmbedUrl(`https://www.youtube.com/embed/${match[1]}?enablejsapi=1`);
    } else {
      setIsYouTube(false);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (seekTo !== null && seekTo !== undefined) {
      if (isYouTube && iframeRef.current) {
        // For YouTube, update the embed URL with start time
        const videoId = embedUrl.split('/embed/')[1]?.split('?')[0];
        if (videoId) {
          const newUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&start=${Math.floor(seekTo)}&autoplay=1`;
          setEmbedUrl(newUrl);
        }
      } else if (videoRef.current) {
        videoRef.current.currentTime = seekTo;
        videoRef.current.play();
      }
    }
  }, [seekTo, isYouTube, embedUrl]);

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
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> YouTube video detected. Flashcards will appear at the designated times, but you'll need to manually navigate using YouTube's controls when reviewing specific segments.
          </p>
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
