import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a tolerant client: avoid crashing the app if env vars are missing
let supabase: any;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    'Supabase env vars missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
  // Minimal stub to keep UI working; calls will resolve with an error so components can fallback
  supabase = {
    from: (_table: string) => {
      const builder = {
        eq: (_col: string, _val: any) => builder,
        order: (_col: string, _opts?: any) => builder,
        limit: async (_n: number) => ({ data: [], error: { message: 'Supabase not configured' } }),
        maybeSingle: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      };
      return {
        insert: async (_payload: any) => ({ data: null, error: { message: 'Supabase not configured' } }),
        select: (_cols: string, _options?: any) => builder,
        update: (_payload: any) => ({
          eq: async (_col: string, _val: any) => ({ data: null, error: { message: 'Supabase not configured' } }),
        }),
        delete: () => ({
          eq: async (_col: string, _val: any) => ({ data: null, error: { message: 'Supabase not configured' } }),
        }),
      };
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: { message: 'Supabase not configured' } }),
      onAuthStateChange: (cb: any) => {
        const subscription = { unsubscribe: () => {} };
        try { cb('INITIAL', null); } catch {}
        return { data: { subscription } };
      },
      signInWithPassword: async (_params: any) => ({ data: { session: null }, error: { message: 'Supabase not configured' } }),
      signInWithOtp: async (_params: any) => ({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: { message: 'Supabase not configured' } }),
    },
    functions: {
      invoke: async (_name: string, _args?: any) => ({ data: null, error: { message: 'Supabase not configured' } }),
    },
  };
}

export { supabase };