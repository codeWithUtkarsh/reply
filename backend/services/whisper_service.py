from openai import OpenAI
from config import settings
from typing import List, Optional
from models import VideoSegment, VideoTranscript
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
import yt_dlp
import tempfile
import os
from logging_config import get_logger

logger = get_logger(__name__)


class WhisperService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)

    async def transcribe_video(self, video_url: str, duration: float) -> VideoTranscript:
        """
        Transcribe video using multiple methods:
        1. YouTube Transcript API (primary - fast, free, built-in captions)
        2. OpenAI Whisper API (fallback - download audio and transcribe)
        """
        try:
            # Extract video ID from URL
            video_id = self._extract_video_id(video_url)

            logger.info(f"Attempting to get YouTube transcript for video ID: {video_id}")

            # Try YouTube Transcript API first (fast and free)
            try:
                transcript = await self._get_youtube_transcript(video_id, duration)
                logger.info(f"✅ Successfully retrieved YouTube transcript with {len(transcript.segments)} segments")
                return transcript
            except (TranscriptsDisabled, NoTranscriptFound) as e:
                logger.warning(f"YouTube transcript not available: {str(e)}")
                logger.info("Falling back to Whisper API...")

                # Fall back to Whisper API
                return await self._transcribe_with_whisper(video_url, duration)

        except Exception as e:
            logger.error(f"Transcription failed: {str(e)}")
            raise Exception(f"Transcription failed: {str(e)}")

    def _extract_video_id(self, video_url: str) -> str:
        """Extract YouTube video ID from URL"""
        if 'youtu.be' in video_url:
            return video_url.split('/')[-1].split('?')[0]
        elif 'youtube.com' in video_url:
            if 'v=' in video_url:
                return video_url.split('v=')[1].split('&')[0]

        # If it's already just the ID
        if len(video_url) == 11:
            return video_url

        raise ValueError(f"Could not extract video ID from URL: {video_url}")

    async def _get_youtube_transcript(self, video_id: str, duration: float) -> VideoTranscript:
        """
        Get transcript from YouTube's built-in captions
        This is the PRIMARY method - fast, free, and has accurate timestamps
        """
        # Get transcript with timestamps
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)

        # Convert to our VideoSegment format and create meaningful chunks
        segments = self._create_segments_from_youtube_transcript(transcript_list, duration)

        # Combine all text
        full_text = " ".join([seg.text for seg in segments])

        return VideoTranscript(
            segments=segments,
            full_text=full_text,
            duration=duration
        )

    def _create_segments_from_youtube_transcript(
        self,
        transcript_list: List[dict],
        duration: float,
        target_segment_duration: float = 120.0  # 2 minutes per segment
    ) -> List[VideoSegment]:
        """
        Create meaningful segments from YouTube transcript
        Groups transcript entries into ~2 minute chunks for better learning
        """
        if not transcript_list:
            return []

        segments = []
        current_segment_text = []
        current_segment_start = transcript_list[0]['start']
        current_segment_duration = 0

        for entry in transcript_list:
            current_segment_text.append(entry['text'])
            current_segment_duration = (entry['start'] + entry['duration']) - current_segment_start

            # Create a new segment if we've reached target duration
            if current_segment_duration >= target_segment_duration:
                segments.append(VideoSegment(
                    start_time=current_segment_start,
                    end_time=entry['start'] + entry['duration'],
                    text=" ".join(current_segment_text)
                ))

                # Reset for next segment
                current_segment_text = []
                # Start next segment at current position
                if transcript_list.index(entry) + 1 < len(transcript_list):
                    current_segment_start = transcript_list[transcript_list.index(entry) + 1]['start']
                current_segment_duration = 0

        # Add remaining text as final segment
        if current_segment_text:
            last_entry = transcript_list[-1]
            segments.append(VideoSegment(
                start_time=current_segment_start,
                end_time=last_entry['start'] + last_entry['duration'],
                text=" ".join(current_segment_text)
            ))

        logger.info(f"Created {len(segments)} segments from YouTube transcript")
        return segments

    async def _transcribe_with_whisper(self, video_url: str, duration: float) -> VideoTranscript:
        """
        FALLBACK: Use OpenAI Whisper API when YouTube transcripts aren't available
        This downloads the audio and sends it to Whisper
        """
        logger.info("Downloading audio for Whisper transcription...")

        # Download audio using yt-dlp
        audio_path = None
        try:
            # Create temporary file for audio
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
                audio_path = tmp_file.name

            # Download audio
            ydl_opts = {
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'outtmpl': audio_path.replace('.mp3', ''),
                'quiet': True,
                'no_warnings': True,
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])

            logger.info(f"Audio downloaded to: {audio_path}")

            # Transcribe with Whisper API
            logger.info("Sending audio to Whisper API...")
            with open(audio_path, 'rb') as audio_file:
                transcript_response = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )

            # Convert Whisper response to our format
            segments = self._create_segments_from_whisper_response(
                transcript_response,
                duration
            )

            full_text = " ".join([seg.text for seg in segments])

            logger.info(f"✅ Whisper transcription complete with {len(segments)} segments")

            return VideoTranscript(
                segments=segments,
                full_text=full_text,
                duration=duration
            )

        finally:
            # Clean up temporary audio file
            if audio_path and os.path.exists(audio_path):
                os.remove(audio_path)
                logger.info("Cleaned up temporary audio file")

    def _create_segments_from_whisper_response(
        self,
        whisper_response,
        duration: float,
        target_segment_duration: float = 120.0
    ) -> List[VideoSegment]:
        """
        Create segments from Whisper API response
        Groups Whisper segments into meaningful chunks
        """
        if not hasattr(whisper_response, 'segments') or not whisper_response.segments:
            # Fallback if no segments
            return [VideoSegment(
                start_time=0,
                end_time=duration,
                text=whisper_response.text
            )]

        segments = []
        current_segment_text = []
        current_segment_start = whisper_response.segments[0]['start']
        current_segment_duration = 0

        for seg in whisper_response.segments:
            current_segment_text.append(seg['text'])
            current_segment_duration = seg['end'] - current_segment_start

            # Create new segment at target duration
            if current_segment_duration >= target_segment_duration:
                segments.append(VideoSegment(
                    start_time=current_segment_start,
                    end_time=seg['end'],
                    text=" ".join(current_segment_text).strip()
                ))

                # Reset for next segment
                current_segment_text = []
                current_segment_start = seg['end']
                current_segment_duration = 0

        # Add remaining as final segment
        if current_segment_text:
            last_seg = whisper_response.segments[-1]
            segments.append(VideoSegment(
                start_time=current_segment_start,
                end_time=last_seg['end'],
                text=" ".join(current_segment_text).strip()
            ))

        logger.info(f"Created {len(segments)} segments from Whisper response")
        return segments


whisper_service = WhisperService()
