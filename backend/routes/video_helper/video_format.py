import re
from urllib.parse import urlparse, parse_qs


def extract_youtube_video_id(url: str) -> str | None:
    """
    Extract video ID from various YouTube URL formats (excluding Shorts).

    Args:
        url: YouTube URL in any supported format

    Returns:
        Video ID string or None if not found (returns None for Shorts)

    Supports:
        - https://www.youtube.com/watch?v=VIDEO_ID
        - https://youtube.com/watch?v=VIDEO_ID
        - https://m.youtube.com/watch?v=VIDEO_ID
        - https://youtu.be/VIDEO_ID
        - https://www.youtube.com/embed/VIDEO_ID
        - https://www.youtube.com/v/VIDEO_ID
        - https://www.youtube.com/live/VIDEO_ID
        - https://gaming.youtube.com/watch?v=VIDEO_ID
        - https://music.youtube.com/watch?v=VIDEO_ID

    Does NOT support:
        - https://www.youtube.com/shorts/VIDEO_ID (returns None)
    """

    if not url:
        return None

    # Clean the URL
    url = url.strip()

    # EXCLUDE YouTube Shorts
    if 'youtube.com/shorts/' in url:
        return None

    # Pattern for standard YouTube video ID (11 characters)
    video_id_pattern = r'([a-zA-Z0-9_-]{11})'

    # Method 1: Standard youtube.com/watch URLs
    if 'youtube.com/watch' in url:
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        if 'v' in query_params:
            return query_params['v'][0]

    # Method 2: Short youtu.be URLs
    if 'youtu.be/' in url:
        match = re.search(r'youtu\.be/(' + video_id_pattern + ')', url)
        if match:
            return match.group(1)

    # Method 3: Embed URLs
    if 'youtube.com/embed/' in url:
        match = re.search(r'embed/(' + video_id_pattern + ')', url)
        if match:
            return match.group(1)

    # Method 4: /v/ URLs (older format)
    if 'youtube.com/v/' in url:
        match = re.search(r'/v/(' + video_id_pattern + ')', url)
        if match:
            return match.group(1)

    # Method 5: YouTube Live
    if 'youtube.com/live/' in url:
        match = re.search(r'live/(' + video_id_pattern + ')', url)
        if match:
            return match.group(1)

    # Method 6: YouTube Music/Gaming
    if 'music.youtube.com/watch' in url or 'gaming.youtube.com/watch' in url:
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        if 'v' in query_params:
            return query_params['v'][0]

    # Method 7: Mobile URLs
    if 'm.youtube.com/watch' in url:
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        if 'v' in query_params:
            return query_params['v'][0]

    # Method 8: Fallback - try to find any 11-character ID in the URL
    # This is less reliable but catches edge cases
    match = re.search(r'[=/](' + video_id_pattern + ')(?:[?&#/]|$)', url)
    if match:
        return match.group(1)

    return None


# Enhanced version with validation and Shorts detection
def extract_youtube_video_id_validated(url: str) -> dict:
    """
    Extract and validate YouTube video ID with additional metadata.
    Returns None for Shorts URLs.

    Returns:
        Dictionary with:
        - video_id: The extracted ID or None
        - url_type: Type of YouTube URL
        - is_valid: Boolean indicating if ID looks valid
        - is_shorts: Boolean indicating if it's a Shorts URL
        - original_url: Cleaned input URL
    """

    result = {
        'video_id': None,
        'url_type': None,
        'is_valid': False,
        'is_shorts': False,
        'original_url': url.strip() if url else None
    }

    if not url:
        return result

    url = url.strip()

    # Check if it's a Shorts URL
    if 'youtube.com/shorts/' in url:
        result['is_shorts'] = True
        result['url_type'] = 'shorts'
        return result  # Return early, don't extract ID

    # Detect URL type
    if 'youtu.be/' in url:
        result['url_type'] = 'short'
    elif 'youtube.com/live/' in url:
        result['url_type'] = 'live'
    elif 'youtube.com/embed/' in url:
        result['url_type'] = 'embed'
    elif 'music.youtube.com' in url:
        result['url_type'] = 'music'
    elif 'gaming.youtube.com' in url:
        result['url_type'] = 'gaming'
    elif 'youtube.com/watch' in url:
        result['url_type'] = 'watch'
    elif 'm.youtube.com' in url:
        result['url_type'] = 'mobile'

    # Extract ID
    video_id = extract_youtube_video_id(url)

    if video_id:
        result['video_id'] = video_id
        # Validate: YouTube IDs are exactly 11 chars with specific allowed characters
        result['is_valid'] = bool(re.match(r'^[a-zA-Z0-9_-]{11}$', video_id))

    return result


# Utility function to check if URL is supported
def is_supported_youtube_url(url: str) -> bool:
    """
    Check if a YouTube URL is supported (not Shorts).

    Returns:
        True if supported, False if Shorts or invalid
    """
    if not url:
        return False

    if 'youtube.com/shorts/' in url:
        return False

    video_id = extract_youtube_video_id(url)
    return video_id is not None