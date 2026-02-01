import { createBrowserClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';

// Only create Supabase client in the browser, not during SSR
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabase = () => {
    if (!browser) {
        // Return a mock client during SSR
        return null;
    }

    if (!supabaseInstance) {
        const supabaseUrl = env.PUBLIC_SUPABASE_URL || '';
        const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || '';

        if (!supabaseUrl || !supabaseAnonKey) {
            console.warn('[Supabase] Missing environment variables');
            return null;
        }

        supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }

    return supabaseInstance;
};

// Backward compatibility
export const supabase = getSupabase();

export type User = {
    id: string;
    email: string;
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
    };
};
