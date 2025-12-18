# Authentication Setup Guide

This guide explains the authentication system implemented in the Preply Video Learning application using Supabase Auth.

## Overview

The application now includes:
- User authentication (email/password and Google OAuth)
- User profiles with roles and credits
- Project management (users can have multiple projects)
- Video organization by projects
- Activity logging for user actions

## Database Schema

### Tables

1. **users** - User profiles linked to Supabase Auth
   - `id` (UUID) - Links to auth.users
   - `role` (enum: admin, user, supervisor)
   - `scope` (JSONB) - Custom permissions
   - `company` (string)
   - `credit_available` (integer) - Credits for video processing
   - `subscription_id` (string)
   - `country` (string)
   - `currency` (string)

2. **projects** - User projects
   - `id` (UUID)
   - `project_name` (string)
   - `project_desc` (text)
   - `user_id` (UUID) - Foreign key to users

3. **videos** - Video content
   - `id` (string) - YouTube video ID (e.g., AL2GL2GUfHk)
   - `project_id` (UUID) - Foreign key to projects
   - `title` (string)
   - `video_length` (float)
   - `transcript` (JSONB)
   - `url` (string)

4. **activity_log** - User activity tracking
   - `id` (bigint)
   - `user_id` (UUID)
   - `project_id` (UUID)
   - `video_id` (string)
   - `activity_desc` (text) - e.g., "User took flashcard test and secured 85%"
   - `activity_type` (string) - e.g., 'flashcard_test', 'quiz_completed'
   - `metadata` (JSONB) - Additional data like score, time spent

### Row Level Security (RLS)

The database uses RLS policies to ensure users can only access their own data:
- Users can view/update their own profiles
- Users can CRUD their own projects
- Users can access videos only in their projects
- Users can access their own progress, results, attempts, and reports

## Setup Instructions

### 1. Supabase Configuration

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `backend/supabase_schema.sql` in the Supabase SQL Editor
3. Enable Email Auth in Supabase Dashboard > Authentication > Providers
4. (Optional) Enable Google OAuth:
   - Get OAuth credentials from Google Cloud Console
   - Add them to Supabase Dashboard > Authentication > Providers > Google

### 2. Environment Variables

Update your `.env` file in the frontend directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Deploy the Schema

Run the SQL schema in your Supabase project:
1. Go to Supabase Dashboard > SQL Editor
2. Copy the contents of `backend/supabase_schema.sql`
3. Paste and run the SQL

## Features

### User Authentication

- **Email/Password Sign Up**: Users can create accounts with email and password
- **Email/Password Sign In**: Existing users can sign in
- **Google OAuth**: Users can sign in with their Google account
- **Auto Profile Creation**: User profiles are automatically created when users sign up (via database trigger)
- **Session Management**: Sessions are automatically managed and persisted

### User Interface

- **Home Page**: Shows sign in/sign up buttons for unauthenticated users
- **User Menu**: Displays user info, credits, and sign out option for authenticated users
- **Auth Modal**: Clean modal interface for sign in/sign up
- **Protected Actions**: Users must be signed in to process videos

### Components

1. **AuthContext** (`/contexts/AuthContext.tsx`)
   - Manages authentication state
   - Provides auth methods (signIn, signUp, signOut)
   - Fetches user profile data

2. **AuthModal** (`/components/AuthModal.tsx`)
   - Sign in/sign up modal
   - Email/password authentication
   - Google OAuth integration

3. **UserMenu** (`/components/UserMenu.tsx`)
   - User profile dropdown
   - Displays credits and role
   - Sign out functionality

## Usage

### Accessing Authentication in Components

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function MyComponent() {
  const { user, userProfile, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <p>Credits: {userProfile?.credit_available}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Activity Logging

To log user activities, insert records into the `activity_log` table:

```typescript
import { supabase } from '@/lib/supabase';

await supabase.from('activity_log').insert({
  user_id: user.id,
  video_id: videoId,
  activity_desc: `${user.email} took flashcard test and secured ${score}%`,
  activity_type: 'flashcard_test',
  metadata: { score, totalQuestions, correctAnswers }
});
```

## Video ID Structure

Videos use YouTube video IDs as their unique identifier:
- URL: `https://youtu.be/AL2GL2GUfHk` → ID: `AL2GL2GUfHk`
- URL: `https://www.youtube.com/watch?v=AL2GL2GUfHk` → ID: `AL2GL2GUfHk`

This ensures each video has a globally unique, consistent identifier.

## Security Considerations

1. **Row Level Security**: All tables have RLS enabled
2. **Auth Policies**: Users can only access their own data
3. **Server-Side Validation**: Always validate user permissions on the backend
4. **OAuth Redirect**: Auth callback is handled securely via `/auth/callback`

## Next Steps

1. Set up Supabase project and run the schema
2. Configure environment variables
3. Test authentication flow
4. Implement project creation UI
5. Update video processing to associate with projects
6. Add activity logging throughout the app

## Support

For issues or questions, refer to:
- Supabase Auth Documentation: https://supabase.com/docs/guides/auth
- Next.js Documentation: https://nextjs.org/docs
