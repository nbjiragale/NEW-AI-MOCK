import { createClient } from '@supabase/supabase-js';

// Securely access Supabase credentials from environment variables.
// These variables must be configured in your deployment environment for authentication to work.
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';


// A check to warn the developer if they are using placeholder credentials.
// This helps prevent deploying the app with non-functional authentication.
if (supabaseUrl === 'https://your-project-id.supabase.co') {
    console.warn(`
********************************************************************************
* WARNING: Supabase environment variables are not set.                         *
* The application is using placeholder credentials. Authentication will fail.  *
* Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.         *
********************************************************************************
`);
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);