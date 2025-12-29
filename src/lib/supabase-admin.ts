import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Trim whitespace from the service key to prevent issues with environment variables
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!.trim();

// This admin client is created once per server instance.
// It is configured for server-to-server authentication and is isolated
// from any user-specific request context.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});
