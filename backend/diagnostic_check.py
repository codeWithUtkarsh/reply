"""
Diagnostic script to check the state of videos and project_videos tables
Run this to understand why videos aren't showing up in the project dashboard
"""

from database import db
import asyncio


async def check_database_state():
    print("=" * 80)
    print("DATABASE DIAGNOSTIC CHECK")
    print("=" * 80)

    # Check videos table
    print("\n1. Checking videos table...")
    videos_result = db.client.table("videos").select("id, title, created_at").execute()
    videos = videos_result.data if videos_result.data else []

    print(f"   Found {len(videos)} videos in database")
    if videos:
        print("\n   Sample videos:")
        for video in videos[:5]:
            print(f"   - {video['id']}: {video['title']}")

    # Check projects table
    print("\n2. Checking projects table...")
    projects_result = db.client.table("projects").select("id, project_name, user_id").execute()
    projects = projects_result.data if projects_result.data else []

    print(f"   Found {len(projects)} projects in database")
    if projects:
        print("\n   Sample projects:")
        for project in projects[:5]:
            print(f"   - {project['id']}: {project['project_name']}")

    # Check project_videos junction table
    print("\n3. Checking project_videos junction table...")
    junction_result = db.client.table("project_videos").select("*").execute()
    junction_entries = junction_result.data if junction_result.data else []

    print(f"   Found {len(junction_entries)} video-project links")
    if junction_entries:
        print("\n   Sample links:")
        for entry in junction_entries[:5]:
            print(f"   - Video {entry['video_id']} -> Project {entry['project_id']}")

    # Identify orphaned videos (videos not linked to any project)
    print("\n4. Checking for orphaned videos...")
    linked_video_ids = {entry['video_id'] for entry in junction_entries}
    all_video_ids = {video['id'] for video in videos}
    orphaned_ids = all_video_ids - linked_video_ids

    if orphaned_ids:
        print(f"\n   ⚠️  Found {len(orphaned_ids)} orphaned videos (not linked to any project)!")
        print("   These videos exist in the database but won't show up in any project:")
        for vid_id in list(orphaned_ids)[:10]:
            video = next((v for v in videos if v['id'] == vid_id), None)
            if video:
                print(f"   - {vid_id}: {video['title']}")

        if len(orphaned_ids) > 10:
            print(f"   ... and {len(orphaned_ids) - 10} more")
    else:
        print("   ✅ All videos are linked to at least one project")

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total videos: {len(videos)}")
    print(f"Total projects: {len(projects)}")
    print(f"Total video-project links: {len(junction_entries)}")
    print(f"Orphaned videos: {len(orphaned_ids)}")

    if orphaned_ids and projects:
        print("\n" + "=" * 80)
        print("SUGGESTED FIX")
        print("=" * 80)
        print("You have orphaned videos that need to be linked to projects.")
        print("\nOptions:")
        print("1. Re-process the videos through the UI (they will be linked automatically)")
        print("2. Run the migration script to link existing videos to a default project")
        print("3. Manually link them using the Supabase dashboard")

    print("\n" + "=" * 80)

    return {
        "videos_count": len(videos),
        "projects_count": len(projects),
        "links_count": len(junction_entries),
        "orphaned_count": len(orphaned_ids),
        "orphaned_ids": orphaned_ids,
        "projects": projects
    }


async def link_orphaned_videos_to_project(project_id: str):
    """
    Link all orphaned videos to a specific project
    """
    print(f"\n\nLinking orphaned videos to project: {project_id}")
    print("=" * 80)

    # Get diagnostic data
    data = await check_database_state()

    if not data['orphaned_ids']:
        print("\n✅ No orphaned videos to link!")
        return

    orphaned_ids = list(data['orphaned_ids'])
    print(f"\nLinking {len(orphaned_ids)} videos to project {project_id}...")

    success_count = 0
    for video_id in orphaned_ids:
        try:
            result = await db.link_video_to_project(video_id, project_id)
            if result:
                success_count += 1
                print(f"  ✅ Linked video {video_id}")
        except Exception as e:
            print(f"  ❌ Failed to link video {video_id}: {e}")

    print(f"\n✅ Successfully linked {success_count}/{len(orphaned_ids)} videos")
    print("=" * 80)


if __name__ == "__main__":
    import sys

    # Run diagnostic check
    result = asyncio.run(check_database_state())

    # If there are orphaned videos and projects, offer to link them
    if result['orphaned_count'] > 0 and result['projects_count'] > 0:
        print("\nWould you like to link these orphaned videos to a project?")
        print("\nAvailable projects:")
        for i, project in enumerate(result['projects'], 1):
            print(f"{i}. {project['project_name']} (ID: {project['id']})")

        if len(sys.argv) > 1:
            # Project ID provided as command line argument
            project_id = sys.argv[1]
            asyncio.run(link_orphaned_videos_to_project(project_id))
        else:
            print("\nTo link videos to a project, run:")
            print(f"python diagnostic_check.py <project_id>")
            print(f"\nExample: python diagnostic_check.py {result['projects'][0]['id']}")
