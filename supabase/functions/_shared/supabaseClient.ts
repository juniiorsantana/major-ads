import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const createSupabaseClient = (req: Request) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const authHeader = req.headers.get('Authorization');

    return createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader! } },
    });
};

export const createAdminClient = () => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('PRIVATE_SERVICE_ROLE_KEY') ?? '';

    return createClient(supabaseUrl, supabaseServiceKey);
};
