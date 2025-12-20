-- Drop existing video policies
DROP POLICY IF EXISTS "Users can view videos in their projects" ON videos;
DROP POLICY IF EXISTS "Users can create videos in their projects" ON videos;
DROP POLICY IF EXISTS "Users can update videos in their projects" ON videos;

-- Recreate video policies to allow NULL project_id
-- This allows the backend to insert videos without project_id initially
-- and then the frontend can link them to projects later

CREATE POLICY "Users can view videos in their projects" ON videos
    FOR SELECT USING (
        project_id IS NULL OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = videos.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create videos in their projects" ON videos
    FOR INSERT WITH CHECK (
        project_id IS NULL OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = videos.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update videos in their projects" ON videos
    FOR UPDATE USING (
        project_id IS NULL OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = videos.project_id
            AND projects.user_id = auth.uid()
        )
    );
