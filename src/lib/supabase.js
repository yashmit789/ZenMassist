import { createClient } from '@supabase/supabase-js'

// Use the Project URL and Anon Key from your Supabase Dashboard Settings
export const supabase = createClient(
  'https://yjxexgxbpyktimmkhqts.supabase.co', 
  'sb_publishable_fx1elpMg-2EB2C5Zgk2GXA_RjSnsWbf'
)