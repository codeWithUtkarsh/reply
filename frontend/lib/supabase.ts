import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Types for our database tables
export interface User {
  id: string;
  role: 'admin' | 'user' | 'supervisor' | 'developer';
  scope: Record<string, any>;
  company?: string;
  credit_available: number;  // Deprecated - kept for backwards compatibility
  transcription_credits?: number;
  notes_credits?: number;
  subscription_id?: string;
  country?: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  project_name: string;
  project_desc?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string; // YouTube video ID
  title: string;
  video_length: number;
  transcript: any;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: string;
  project_id?: string;
  video_id?: string;
  activity_desc: string;
  activity_type?: string;
  metadata: Record<string, any>;
  created_at: string;
}
