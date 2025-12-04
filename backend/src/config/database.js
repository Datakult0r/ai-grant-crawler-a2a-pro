import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials missing in .env file');
}

export const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey)
    : {
        from: () => ({
            select: () => ({ eq: () => ({ data: [], error: null }), data: [], error: null }),
            insert: () => ({ select: () => ({ data: [], error: null }), data: [], error: null }),
            update: () => ({ eq: () => ({ data: [], error: null }), data: [], error: null }),
            delete: () => ({ eq: () => ({ data: [], error: null }), data: [], error: null })
        })
      };
