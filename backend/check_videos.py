"""
Diagnostic script to check and fix video-project links
"""

from database import db
import asyncio


async def check_and_fix_videos():
    print("=" * 80)
    print("DIAGNOSTIC: Checking Videos and Project Links")
    print("=" * 80)

    # Check all videos
    print("\n1. Checking all videos in database...")
    videos_result = db.client.table("videos").select("id, title").execute()
    videos = videos_result.data if videos_result.data else []

    print(f"   Found {len(videos)} videos total:")
    for video in videos:
        print(f"   - {video['id']}: {video['title']}")

    # Check all projects
    print("\n2. Checking all projects...")
    projects_result = db.client.table("projects").select("id, project_name").execute()
    projects = projects_result.data if projects_result.data else []

    print(f"   Found {len(projects)} projects:")
    for project in projects:
        print(f"   - {project['id']}: {project['project_name']}")

    # Check project_videos links
    print("\n3. Checking project_videos junction table...")
    junction_result = db.client.table("project_videos").select("*").execute()
    links = junction_result.data if junction_result.data else []

    print(f"   Found {len(links)} video-project links")
    if links:
        for link in links:
            print(f"   - Video {link['video_id']} → Project {link['project_id']}")

    # Find orphaned videos (not linked to any project)
    linked_video_ids = {link['video_id'] for link in links}
    all_video_ids = {video['id'] for video in videos}
    orphaned_ids = all_video_ids - linked_video_ids

    if orphaned_ids:
        print(f"\n⚠️  Found {len(orphaned_ids)} ORPHANED VIDEOS (not linked to any project):")
        for vid_id in orphaned_ids:
            video = next((v for v in videos if v['id'] == vid_id), None)
            if video:
                print(f"   - {vid_id}: {video['title']}")

        if projects:
            print("\n" + "=" * 80)
            print("FIX AVAILABLE")
            print("=" * 80)
            print("\nYou can link these orphaned videos to a project.")
            print("\nAvailable projects:")
            for i, project in enumerate(projects, 1):
                print(f"{i}. {project['project_name']} (ID: {project['id']})")

            print("\nTo link orphaned videos to a project, run:")
            print("python link_videos.py <project_id>")
            print(f"\nExample: python link_videos.py {projects[0]['id']}")

            return {
                "orphaned_videos": list(orphaned_ids),
                "projects": projects
            }
    else:
        print("\n✅ All videos are linked to projects!")
        return None


if __name__ == "__main__":
    result = asyncio.run(check_and_fix_videos())
