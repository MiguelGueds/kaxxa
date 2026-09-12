import { supabase, getAuthenticatedUser } from '@/lib/supabase';

export interface DbAccount {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  initial_balance: number;
  color?: string;
  created_at?: string;
}

const STORAGE_KEY = 'kaxxa_accounts_backup';

function getLocalAccounts(userId: string): DbAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAccounts(userId: string, items: DbAccount[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar contas no localStorage:', e);
  }
}

export const accountsService = {
  getCachedAccounts(): DbAccount[] {
    if (typeof window === 'undefined') return [];
    try {
      const rawUser = localStorage.getItem('kaxxa_user_cache');
      if (!rawUser) return [];
      const user = JSON.parse(rawUser);
      if (!user || !user.id) return [];
      return getLocalAccounts(user.id);
    } catch {
      return [];
    }
  },

  async fetchAccounts(): Promise<DbAccount[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (!error && data !== null) {
        const formatted = (data || []).map(acc => ({
          ...acc,
          balance: Number(acc.balance ?? acc.initial_balance ?? 0),
          initial_balance: Number(acc.initial_balance ?? 0),
        })) as DbAccount[];
        saveLocalAccounts(user.id, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn('Erro ao buscar contas do Supabase, usando backup local:', err);
    }

    return getLocalAccounts(user.id);
  },

  async createAccount(acc: { name: string; type: string; balance: number; color?: string }): Promise<DbAccount | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        name: acc.name,
        type: acc.type,
        initial_balance: acc.balance,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar conta:', error);
      throw error;
    }

    return {
      ...data,
      balance: Number(data.balance ?? data.initial_balance ?? 0),
      initial_balance: Number(data.initial_balance ?? 0),
    } as DbAccount;
  },

  async updateBalance(id: string, deltaAmount: number): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const { data: acc } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!acc) return false;

    const currentBal = Number(acc.balance ?? acc.initial_balance ?? 0);
    const newBalance = currentBal + deltaAmount;

    const { error } = await supabase
      .from('accounts')
      .update({ initial_balance: newBalance })
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  },

  async deleteAccount(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  }
};

