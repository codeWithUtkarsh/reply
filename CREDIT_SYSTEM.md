# Credit System Documentation

## Overview
This document describes the credit system implemented for the video learning platform. The credit system allows users to process videos and generate notes using a credit-based model.

## Credit Types

### 1. Transcription Credits
- **Purpose**: Used for video transcription via Whisper API
- **Cost**: 1 credit per minute of video (rounded up)
- **Example**: A 5.5-minute video costs 6 transcription credits

### 2. Notes Generation Credits
- **Purpose**: Used for AI-generated study notes
- **Cost**: 1 credit per 50,000 characters of transcript
- **Example**: A 75,000-character transcript costs 2 notes credits

## User Roles

### USER (Default)
- Starts with **50 transcription credits** and **50 notes credits**
- Credits are deducted as features are used
- When credits reach 0, the respective feature is disabled

### DEVELOPER
- **Unlimited credits** for both transcription and notes
- No credit deduction occurs
- Indicated by "∞" symbol in the UI

### ADMIN / SUPERVISOR
- Same credit system as USER role
- May be configured for different credit allocations in the future

## Initial Credit Allocation

New users receive:
- **50 Transcription Credits** (50 minutes of video transcription)
- **50 Notes Generation Credits** (up to 2.5M characters of notes)

This is configured in the database trigger: `/backend/migrations/add_credit_system.sql`

## How Credits Work

### Video Processing Flow
1. User submits a video for processing
2. System calculates required credits based on video duration
3. System checks if user has sufficient transcription credits
4. If insufficient: Returns HTTP 402 error with details
5. If sufficient: Processes video in background
6. After successful processing: Deducts credits from user account

### Notes Generation Flow
1. User requests notes for a video
2. System calculates required credits based on transcript length
3. System checks if user has sufficient notes credits
4. If insufficient: Returns HTTP 402 error with details
5. If sufficient: Generates notes using GPT-4o
6. After successful generation: Deducts credits from user account

## Database Schema

### User Table Columns
```sql
transcription_credits INTEGER DEFAULT 50
notes_credits INTEGER DEFAULT 50
role VARCHAR(20) CHECK (role IN ('admin', 'user', 'supervisor', 'developer'))
```

### Migration File
Location: `/backend/migrations/add_credit_system.sql`

## Backend Implementation

### Credit Management Functions (database.py)
- `get_user_profile(user_id)` - Fetch user profile with credit info
- `check_transcription_credits(user_id, required)` - Verify sufficient credits
- `check_notes_credits(user_id, required)` - Verify sufficient credits
- `deduct_transcription_credits(user_id, amount)` - Deduct after processing
- `deduct_notes_credits(user_id, amount)` - Deduct after generation
- `add_credits(user_id, transcription, notes)` - Admin function to add credits

### API Endpoints

#### Get User Credits
```
GET /api/users/{user_id}/credits
Response: {
  transcription_credits: number,
  notes_credits: number,
  role: string,
  has_unlimited: boolean
}
```

#### Get User Profile
```
GET /api/users/{user_id}/profile
Response: {
  id: string,
  role: string,
  transcription_credits: number,
  notes_credits: number,
  ...
}
```

#### Process Video (with credit check)
```
POST /api/video/process-async
Body: {
  video_url: string,
  title?: string,
  project_id?: string,
  user_id?: string  // Required for credit check
}
```

#### Generate Notes (with credit check)
```
POST /api/notes/generate
Body: {
  video_id: string,
  user_id?: string  // Required for credit check
}
```

### Error Responses
When credits are insufficient:
```json
{
  "status_code": 402,
  "detail": {
    "error": "Insufficient transcription credits",
    "required": 10,
    "available": 5,
    "message": "You need 10 transcription credits but only have 5..."
  }
}
```

## Frontend Implementation

### Credit Display
Credits are displayed in the UserMenu component:
- **Compact view**: `T:50 N:50` (Transcription/Notes credits)
- **Expanded view**: Separate lines with red highlighting when 0
- **Developer role**: Shows "∞ credits" instead of numbers

### API Integration
Updated functions in `/frontend/lib/api.ts`:
- `videoApi.processVideoAsync(url, title, projectId, userId)`
- `notesApi.generateNotes(videoId, userId)`
- `usersApi.getCredits(userId)`
- `usersApi.getProfile(userId)`

### Credit Warnings
- When credits = 0: Text appears in red
- Frontend should handle 402 errors and display user-friendly messages
- Features become disabled when respective credits are exhausted

## Usage Example

### Processing a 10-minute video
```python
# User has 50 transcription credits
# Video duration: 600 seconds (10 minutes)
# Required credits: ceil(600 / 60) = 10 credits

# Before: 50 credits
# After: 40 credits
```

### Generating notes for 120,000-character transcript
```python
# User has 50 notes credits
# Transcript length: 120,000 characters
# Required credits: ceil(120000 / 50000) = 3 credits

# Before: 50 credits
# After: 47 credits
```

## Testing the Credit System

### Manual Testing Steps

1. **Create a new user** - Verify they receive 50+50 credits
2. **Process a video** - Check credit deduction (1 per minute)
3. **Generate notes** - Check credit deduction (1 per 50k chars)
4. **Exhaust credits** - Verify error when credits = 0
5. **Test DEVELOPER role** - Verify unlimited credits work

### Database Queries

Check user credits:
```sql
SELECT id, role, transcription_credits, notes_credits
FROM users
WHERE id = 'user-id-here';
```

Update user role to DEVELOPER:
```sql
UPDATE users
SET role = 'developer'
WHERE id = 'user-id-here';
```

Manually add credits:
```sql
UPDATE users
SET transcription_credits = transcription_credits + 100,
    notes_credits = notes_credits + 100
WHERE id = 'user-id-here';
```

## Running the Migration

To apply the credit system to your database:

```bash
# Using psql
psql -h your-db-host -U your-username -d your-database -f backend/migrations/add_credit_system.sql

# Using Supabase SQL editor
# Copy contents of backend/migrations/add_credit_system.sql
# Paste into Supabase SQL Editor and run
```

## Future Enhancements

Potential improvements to the credit system:

1. **Credit Purchase System** - Allow users to buy more credits
2. **Subscription Tiers** - Monthly credit allocations
3. **Credit History** - Track credit usage over time
4. **Credit Expiry** - Credits expire after a certain period
5. **Promotional Credits** - Bonus credits for referrals
6. **Usage Analytics** - Dashboard showing credit consumption
7. **Admin Panel** - GUI for managing user credits
8. **Webhook Notifications** - Alert users when credits are low

## Support

For questions or issues with the credit system:
1. Check database migration status
2. Verify user role is correctly set
3. Check backend logs for credit-related errors
4. Ensure frontend is passing `user_id` parameter

## Changelog

### 2025-12-25 - Initial Implementation
- Added separate transcription and notes credits
- Implemented DEVELOPER role with unlimited credits
- Created credit management functions
- Added credit display in UI
- Implemented credit checks in video and notes endpoints
