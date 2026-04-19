import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "./database.types";

export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl === "your_supabase_project_url") {
    // Return a mock client that returns empty data if Supabase is not configured
    return {
      from: () => ({
        select: () => ({ single: async () => ({ data: null, error: null }), order: () => ({ data: [], error: null }), eq: () => ({ single: async () => ({ data: null, error: null }), order: () => ({ data: [], error: null }), neq: () => ({ count: 0, error: null }), lt: () => ({ count: 0, error: null }) }) }),
        update: () => ({ eq: () => ({ data: null, error: null }) }),
        insert: () => ({ data: null, error: null }),
        delete: () => ({ eq: () => ({ data: null, error: null }) }),
      }),
    } as any;
  }

  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server component - can be ignored
        }
      },
    },
  });
}

