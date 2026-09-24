import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.warn('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
