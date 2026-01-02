import yt_dlp
from typing import Dict, Optional
import hashlib
import asyncio
from concurrent.futures import ThreadPoolExecutor
from models import VideoSegment, VideoTranscript

from routes.video_helper import video_format


class VideoProcessor:
    def __init__(self):
        self.ydl_opts = {
            'skip_download': True,           # Don't download the video
            'writeautomaticsub': False,       # Don't write subtitle files to disk
            'writesubtitles': False,
            'quiet': True,
            'format': 'best',
            'no_warnings': True,              # Suppress warnings
            'extract_flat': False,
            'no_check_certificate': True,
            'geo_bypass': True,
            'socket_timeout': 3,
        }

    async def extract_video_info_async(self, url: str) -> Dict:
        """Use async to prevent blocking"""
        loop = asyncio.get_event_loop()

        video_id = self.get_video_id(url)
        direct_video_url = self.get_video_url(video_id)
        def _extract():
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                return ydl.extract_info(direct_video_url, download=False)

        # Run in thread pool to avoid blocking
        with ThreadPoolExecutor(max_workers=1) as executor:
            info = await loop.run_in_executor(executor, _extract)

        return {
            'title': info.get('title', 'Untitled Video'),
            'duration': info.get('duration', 0),
            'url': url,
            'thumbnail': info.get('thumbnail'),
            'description': info.get('description', ''),
            'language': info.get('language', ''),
        }

    def get_video_id(self, url: str) -> str:
        """Extract YouTube video ID from URL or generate hash for other URLs"""
        # Try to extract YouTube video ID
        try:
            return video_format.extract_youtube_video_id(url)
        except Exception:
            pass

    def get_video_url(self, video_id: str) -> str:
        """Get direct video URL if it's a platform video"""
        return f"https://www.youtube.com/watch?v={video_id}"

    async def segment_transcript(self, transcript_text: str, duration: float,
                                 interval: int = 120) -> VideoTranscript:
        """
        Segment transcript into time-based chunks
        This is a simplified version - in production, you'd use Whisper API
        which provides timestamps automatically
        """
        # Calculate number of segments
        num_segments = max(1, int(duration / interval))
        segment_duration = duration / num_segments

        # Split text into roughly equal segments
        words = transcript_text.split()
        words_per_segment = max(1, len(words) // num_segments)

        segments = []
        for i in range(num_segments):
            start_idx = i * words_per_segment
            end_idx = (i + 1) * words_per_segment if i < num_segments - 1 else len(words)

            segment_text = ' '.join(words[start_idx:end_idx])
            segments.append(VideoSegment(
                start_time=i * segment_duration,
                end_time=(i + 1) * segment_duration,
                text=segment_text
            ))

        return VideoTranscript(
            segments=segments,
            full_text=transcript_text,
            duration=duration
        )


video_processor = VideoProcessor()
