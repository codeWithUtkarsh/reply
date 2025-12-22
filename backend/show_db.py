"""
Simple diagnostic to show current database state
"""

from database import db
import asyncio


async def show_database_state():
    print("\n" + "=" * 80)
    print("DATABASE STATE")
    print("=" * 80)

    # Videos
    print("\nVIDEOS TABLE:")
    videos = db.client.table("videos").select("id, title").execute().data or []
    if videos:
        for v in videos:
            print(f"  ID: {v['id']}")
            print(f"  Title: {v['title']}")
            print()
    else:
        print("  (empty)")

    # Projects
    print("\nPROJECTS TABLE:")
    projects = db.client.table("projects").select("id, project_name").execute().data or []
    if projects:
        for p in projects:
            print(f"  ID: {p['id']}")
            print(f"  Name: {p['project_name']}")
            print()
    else:
        print("  (empty)")

    # Junction table
    print("\nPROJECT_VIDEOS JUNCTION TABLE:")
    links = db.client.table("project_videos").select("*").execute().data or []
    if links:
        for link in links:
            print(f"  Video {link['video_id']} → Project {link['project_id']}")
    else:
        print("  (empty) ⚠️  THIS IS THE PROBLEM!")

    if videos and projects and not links:
        print("\n" + "=" * 80)
        print("FIX: Run this command to link your videos to your project:")
        print("=" * 80)
        print(f"\n  python link_videos.py {projects[0]['id']}")
        print()


if __name__ == "__main__":
    asyncio.run(show_database_state())
