import { writable, derived } from 'svelte/store';
import { supabase, type User } from '$lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    session: null,
    loading: true,
    error: null
};

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>(initialState);

    return {
        subscribe,
        
        async initialize() {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                
                if (session?.user) {
                    set({
                        user: {
                            id: session.user.id,
                            email: session.user.email || '',
                            user_metadata: session.user.user_metadata
                        },
                        session,
                        loading: false,
                        error: null
                    });
                } else {
                    set({ ...initialState, loading: false });
                }

                supabase.auth.onAuthStateChange((_event, session) => {
                    if (session?.user) {
                        set({
                            user: {
                                id: session.user.id,
                                email: session.user.email || '',
                                user_metadata: session.user.user_metadata
                            },
                            session,
                            loading: false,
                            error: null
                        });
                    } else {
                        set({ ...initialState, loading: false });
                    }
                });
            } catch (error) {
                set({
                    ...initialState,
                    loading: false,
                    error: error instanceof Error ? error.message : 'Failed to initialize auth'
                });
            }
        },

        async signUp(email: string, password: string, fullName?: string) {
            update(state => ({ ...state, loading: true, error: null }));
            try {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName }
                    }
                });
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Sign up failed';
                update(state => ({ ...state, loading: false, error: message }));
                return { success: false, error: message };
            }
        },

        async signIn(email: string, password: string) {
            update(state => ({ ...state, loading: true, error: null }));
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Sign in failed';
                update(state => ({ ...state, loading: false, error: message }));
                return { success: false, error: message };
            }
        },

        async signOut() {
            update(state => ({ ...state, loading: true }));
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                set({ ...initialState, loading: false });
                return { success: true };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Sign out failed';
                update(state => ({ ...state, loading: false, error: message }));
                return { success: false, error: message };
            }
        },

        clearError() {
            update(state => ({ ...state, error: null }));
        }
    };
}

export const auth = createAuthStore();
export const isAuthenticated = derived(auth, $auth => !!$auth.user);
export const currentUser = derived(auth, $auth => $auth.user);
