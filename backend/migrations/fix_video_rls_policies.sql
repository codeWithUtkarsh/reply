-- Drop existing video policies
DROP POLICY IF EXISTS "Users can view videos in their projects" ON videos;
DROP POLICY IF EXISTS "Users can create videos in their projects" ON videos;
DROP POLICY IF EXISTS "Users can update videos in their projects" ON videos;

-- Recreate video policies
-- Videos must always be associated with a project owned by the authenticated user

CREATE POLICY "Users can view videos in their projects" ON videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = videos.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create videos in their projects" ON videos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = videos.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update videos in their projects" ON videos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = videos.project_id
            AND projects.user_id = auth.uid()
        )
    );
