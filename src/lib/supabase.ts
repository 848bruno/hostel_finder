import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Supabase is no longer the primary data source.
// Fallback values prevent runtime errors while pages are migrated to api.ts.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
