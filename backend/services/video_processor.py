import yt_dlp
from typing import Dict, Optional
import hashlib
from models import VideoSegment, VideoTranscript


class VideoProcessor:
    def __init__(self):
        self.ydl_opts = {
            'format': 'best',
            'quiet': True,
            'no_warnings': True,
        }

    def extract_video_info(self, url: str) -> Dict:
        """Extract video information from URL"""
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return {
                    'title': info.get('title', 'Untitled Video'),
                    'duration': info.get('duration', 0),
                    'url': url,
                    'thumbnail': info.get('thumbnail'),
                    'description': info.get('description', ''),
                }
        except Exception as e:
            # For direct video URLs or non-YouTube sources
            return {
                'title': 'Video',
                'duration': 0,
                'url': url,
                'thumbnail': None,
                'description': '',
            }

    def generate_video_id(self, url: str) -> str:
        """Extract YouTube video ID from URL or generate hash for other URLs"""
        # Try to extract YouTube video ID
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                # For YouTube videos, use the video ID
                if 'id' in info and info.get('extractor') == 'youtube':
                    return info['id']
        except Exception:
            pass

        # Fallback: generate hash for non-YouTube or failed extractions
        return hashlib.md5(url.encode()).hexdigest()

    def get_video_url(self, url: str) -> str:
        """Get direct video URL if it's a platform video"""
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                # Return the best video URL
                if 'url' in info:
                    return info['url']
                elif 'formats' in info and info['formats']:
                    return info['formats'][-1]['url']
        except Exception:
            pass
        return url

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
