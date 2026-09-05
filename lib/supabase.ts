import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('seu-projeto') && 
    supabaseUrl.startsWith('http')
  );
};

// Inicializa o cliente do Supabase de forma segura
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export async function getAuthenticatedUser() {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

