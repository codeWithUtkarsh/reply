"""
Link orphaned videos to a specific project
Usage: python link_videos.py <project_id>
"""

from database import db
import asyncio
import sys


async def link_orphaned_videos(project_id: str):
    print("=" * 80)
    print(f"LINKING ORPHANED VIDEOS TO PROJECT: {project_id}")
    print("=" * 80)

    # Get all videos
    videos_result = db.client.table("videos").select("id, title").execute()
    videos = videos_result.data if videos_result.data else []

    # Get existing links
    junction_result = db.client.table("project_videos").select("video_id").execute()
    links = junction_result.data if junction_result.data else []
    linked_video_ids = {link['video_id'] for link in links}

    # Find orphaned videos
    orphaned_videos = [v for v in videos if v['id'] not in linked_video_ids]

    if not orphaned_videos:
        print("\n✅ No orphaned videos found!")
        return

    print(f"\nFound {len(orphaned_videos)} orphaned videos to link:")
    for video in orphaned_videos:
        print(f"  - {video['id']}: {video['title']}")

    print(f"\nLinking all orphaned videos to project {project_id}...")

    success_count = 0
    for video in orphaned_videos:
        try:
            result = await db.link_video_to_project(video['id'], project_id)
            if result:
                success_count += 1
                print(f"  ✅ Linked: {video['title']}")
        except Exception as e:
            print(f"  ❌ Failed to link {video['title']}: {e}")

    print("\n" + "=" * 80)
    print(f"✅ Successfully linked {success_count}/{len(orphaned_videos)} videos")
    print("=" * 80)
    print("\nYou can now refresh your project page to see the videos!")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python link_videos.py <project_id>")
        print("\nRun 'python check_videos.py' first to see available projects")
        sys.exit(1)

    project_id = sys.argv[1]
    asyncio.run(link_orphaned_videos(project_id))
