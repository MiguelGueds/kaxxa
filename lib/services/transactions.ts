import { supabase, getAuthenticatedUser } from '@/lib/supabase';
import { accountsService } from './accounts';

export interface DbTransaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  account_id?: string;
  credit_card_id?: string;
  category_id?: string;
  category_name?: string;
  third_party_id?: string;
  third_party_name?: string;
  installments?: number;
  current_installment?: number;
  is_paid?: boolean;
  notes?: string;
  created_at?: string;
}

const STORAGE_KEY = 'kaxxa_transactions_backup';

function getLocalTransactions(userId: string): DbTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTransactions(userId: string, items: DbTransaction[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar transações no localStorage:', e);
  }
}

export const transactionsService = {
  getCachedTransactions(): DbTransaction[] {
    if (typeof window === 'undefined') return [];
    try {
      const rawUser = localStorage.getItem('kaxxa_user_cache');
      if (!rawUser) return [];
      const user = JSON.parse(rawUser);
      if (!user || !user.id) return [];
      return getLocalTransactions(user.id);
    } catch {
      return [];
    }
  },

  async fetchTransactions(limit = 100): Promise<DbTransaction[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (!error && data !== null) {
        const formatted = (data || []).map(t => ({
          ...t,
          amount: Number(t.amount || 0),
        })) as DbTransaction[];
        saveLocalTransactions(user.id, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn('Erro ao buscar transações do Supabase, usando backup local:', err);
    }

    return getLocalTransactions(user.id);
  },

  async createTransaction(tx: Omit<DbTransaction, 'id' | 'user_id' | 'created_at'>): Promise<DbTransaction | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...tx,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao cadastrar transação:', error);
      throw error;
    }

    // Se estiver associada a uma conta e paga, atualiza o saldo da conta
    if (tx.account_id && tx.is_paid !== false) {
      const delta = tx.type === 'INCOME' ? Number(tx.amount) : -Number(tx.amount);
      await accountsService.updateBalance(tx.account_id, delta);
    }

    return {
      ...data,
      amount: Number(data.amount || 0),
    } as DbTransaction;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    // Buscar transação antes de excluir para reverter saldo
    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (tx && tx.account_id && tx.is_paid !== false) {
      const revertDelta = tx.type === 'INCOME' ? -Number(tx.amount) : Number(tx.amount);
      await accountsService.updateBalance(tx.account_id, revertDelta);
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  }
};

