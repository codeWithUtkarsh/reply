-- Migration: Convert videos to many-to-many relationship with projects
-- This allows the same video to belong to multiple projects without re-processing

-- Step 1: Create project_videos junction table
CREATE TABLE IF NOT EXISTS project_videos (
    id BIGSERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    video_id VARCHAR(255) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, video_id)
);

-- Step 2: Migrate existing project_id data from videos to project_videos
INSERT INTO project_videos (project_id, video_id, created_at)
SELECT project_id, id, created_at
FROM videos
WHERE project_id IS NOT NULL
ON CONFLICT (project_id, video_id) DO NOTHING;

-- Step 3: Remove project_id column from videos table
ALTER TABLE videos DROP COLUMN IF EXISTS project_id;

-- Step 4: Update indexes
DROP INDEX IF EXISTS idx_videos_project_id;
CREATE INDEX IF NOT EXISTS idx_project_videos_project_id ON project_videos(project_id);
CREATE INDEX IF NOT EXISTS idx_project_videos_video_id ON project_videos(video_id);

-- Step 5: Enable RLS on project_videos
ALTER TABLE project_videos ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop old video RLS policies
DROP POLICY IF EXISTS "Users can view videos in their projects" ON videos;
DROP POLICY IF EXISTS "Users can create videos in their projects" ON videos;
DROP POLICY IF EXISTS "Users can update videos in their projects" ON videos;
DROP POLICY IF EXISTS "Allow video creation" ON videos;

-- Step 7: Create new video RLS policies
CREATE POLICY "Users can view videos in their projects" ON videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_videos
            JOIN projects ON projects.id = project_videos.project_id
            WHERE project_videos.video_id = videos.id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow video creation" ON videos
    FOR INSERT WITH CHECK (true);

-- Step 8: Create project_videos RLS policies
CREATE POLICY "Users can view their project-video links" ON project_videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_videos.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can link videos to their projects" ON project_videos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_videos.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove videos from their projects" ON project_videos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_videos.project_id
            AND projects.user_id = auth.uid()
        )
    );
