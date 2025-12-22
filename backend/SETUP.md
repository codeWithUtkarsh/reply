# Backend Setup Guide

## ⚠️ Critical: Supabase Service Role Key

The backend **MUST** use the **Supabase Service Role Key**, not the anon key.

### Why?

- The backend is a trusted service that needs to bypass Row Level Security (RLS) policies
- RLS policies check `auth.uid()` which doesn't exist in backend context
- Using the anon key will result in RLS policy violations:
  ```
  APIError: {'message': 'new row violates row-level security policy for table "videos"', 'code': '42501'}
  ```

### How to Get Your Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Under "Project API keys", find **service_role key** (marked as secret)
4. Copy this key (starts with `eyJ...`)
5. Add it to your `.env` file:

```env
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Your service_role key
```

### ⚠️ Security Note

- **Never** commit the service role key to version control
- **Never** expose it to the frontend
- It has full access to your database, bypassing all RLS policies
- Only use it in secure backend environments

## Setup Steps

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your credentials:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase **service_role** key (not anon key!)

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the server:
   ```bash
   python main.py
   ```

## Troubleshooting

### RLS Policy Violation Error

**Error:**
```
APIError: {'message': 'new row violates row-level security policy for table "videos"', 'code': '42501'}
```

**Solution:**
- Verify you're using the **service_role** key, not the **anon** key
- Check your `.env` file has the correct key
- Restart the backend server after updating `.env`

### Video Already Exists

The backend now automatically handles duplicate videos:
- If a video with the same ID exists, it reuses the existing entry
- If the project_id is different, it updates it
- No duplicate videos will be created

## Logging

All API requests and database operations are now logged with:
- Request/response details
- Video ID and Project ID for traceability
- Error messages with full stack traces
- Performance metrics (request duration)

Check your console output for detailed logs.
