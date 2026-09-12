import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('seu-projeto') && 
    supabaseUrl.startsWith('http')
  );
};

// Cliente padrão do Supabase (opera no contexto do cliente/usuário)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Cliente administrativo do Supabase (para operações de backend)
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key'
);

export function getCachedUser(): { id: string; email?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('kaxxa_user_cache');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser() {
  if (!isSupabaseConfigured()) return getCachedUser() as any;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('kaxxa_user_cache', JSON.stringify({ id: session.user.id, email: session.user.email }));
      }
      return session.user;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user && typeof window !== 'undefined') {
      localStorage.setItem('kaxxa_user_cache', JSON.stringify({ id: user.id, email: user.email }));
    }
    return user;
  } catch {
    return getCachedUser() as any;
  }
}

export async function performGlobalSignOut() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kaxxa_access_granted');
    localStorage.removeItem('kaxxa_trial_active');
    localStorage.removeItem('kaxxa_pending_coupon');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !k.includes('_backup') && (k.startsWith('kaxxa_') || k.startsWith('sb-') || k.includes('auth') || k.includes('mindfinance_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('SignOut error:', e);
    }
  }
}

