// Supabase Configuration
const SUPABASE_URL = 'https://jdmbbflqnsbsnkjuhklk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWJiZmxxbnNic25ranVoa2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3ODkyNzIsImV4cCI6MjA5MTM2NTI3Mn0.kP--dprbv7kcmFeSET8MxJx22d6G_O36WUv0tlwOfxk';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
