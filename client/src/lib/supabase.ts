import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cogrkxxduyclyzfupbzx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ3JreHhkdXljbHl6ZnVwYnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDQyMzcsImV4cCI6MjA2MTE4MDIzN30.yIxAOZIKbSFijyjAR_6PsB-cQptBf2Pkn08hVZodPxo';

export const supabase = createClient(supabaseUrl, supabaseKey);