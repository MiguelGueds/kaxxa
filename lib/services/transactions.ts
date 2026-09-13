import { supabase, supabaseAdmin, getAuthenticatedUser } from '@/lib/supabase';
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
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (!error && data !== null) {
        let rawList = [...data];

        // Tenta buscar e migrar transações com o ID legado de e-mail (ex: usr_somoskaxxa_gmail_com)
        if (user.email) {
          const legacyId = 'usr_' + user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (legacyId !== user.id) {
            const { data: legacyTransactions } = await client
              .from('transactions')
              .select('*')
              .eq('user_id', legacyId);

            if (legacyTransactions && legacyTransactions.length > 0) {
              await client
                .from('transactions')
                .update({ user_id: user.id })
                .eq('user_id', legacyId);

              legacyTransactions.forEach(t => {
                if (!rawList.some(r => r.id === t.id)) {
                  rawList.push({ ...t, user_id: user.id });
                }
              });
            }
          }
        }

        const formatted = rawList.map(t => ({
          ...t,
          amount: Number(t.amount || 0),
        })) as DbTransaction[];

        // Sincroniza transações criadas localmente pendentes que ainda não subiram para o Supabase
        const localItems = getLocalTransactions(user.id);
        const pendingLocal = localItems.filter(local =>
          local.id.startsWith('tx-') &&
          !formatted.some(remote => remote.id === local.id || (remote.description === local.description && remote.date === local.date && Number(remote.amount) === Number(local.amount)))
        );

        const uninsertedPending: DbTransaction[] = [];
        if (pendingLocal.length > 0) {
          for (const item of pendingLocal) {
            try {
              const { user_id, ...cleanItem } = item;
              const payloadToSync = {
                ...cleanItem,
                id: item.id || ('tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)),
                user_id: user.id
              };
              const { data: inserted } = await client
                .from('transactions')
                .insert(payloadToSync)
                .select()
                .single();
              if (inserted) {
                formatted.unshift({
                  ...inserted,
                  amount: Number(inserted.amount || 0),
                } as DbTransaction);
              } else {
                uninsertedPending.push(item);
              }
            } catch (e) {
              console.warn('Erro ao sincronizar transação pendente para o Supabase:', e);
              uninsertedPending.push(item);
            }
          }
        }

        const mergedAll = [...formatted, ...uninsertedPending];
        saveLocalTransactions(user.id, mergedAll);
        return mergedAll;
      }
    } catch (err) {
      console.warn('Erro ao buscar transações do Supabase, usando backup local:', err);
    }

    return getLocalTransactions(user.id);
  },

  async createTransaction(tx: Omit<DbTransaction, 'id' | 'user_id' | 'created_at'>): Promise<DbTransaction | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const newItem: DbTransaction = {
      ...tx,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    const payload = {
      ...tx,
      id: newItem.id,
      user_id: user.id,
    };

    let insertedData = null;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        insertedData = data;
      } else {
        if (supabaseAdmin) {
          const { data: adminData, error: adminErr } = await supabaseAdmin
            .from('transactions')
            .insert(payload)
            .select()
            .single();

          if (!adminErr && adminData) {
            insertedData = adminData;
          }
        }
      }
    } catch (err) {
      console.warn('Exceção ao cadastrar transação no Supabase, salvando localmente:', err);
    }

    if (tx.account_id && tx.is_paid !== false) {
      const delta = tx.type === 'INCOME' ? Number(tx.amount) : -Number(tx.amount);
      await accountsService.updateBalance(tx.account_id, delta);
    }

    if (insertedData) {
      const saved = {
        ...insertedData,
        amount: Number(insertedData.amount || 0),
      } as DbTransaction;

      const currentLocal = getLocalTransactions(user.id);
      saveLocalTransactions(user.id, [saved, ...currentLocal.filter(t => t.id !== saved.id)]);
      return saved;
    }

    const currentLocal = getLocalTransactions(user.id);
    const updated = [newItem, ...currentLocal.filter(t => t.id !== newItem.id)];
    saveLocalTransactions(user.id, updated);
    return newItem;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const client = supabaseAdmin || supabase;
    const { data: tx } = await client
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (tx && tx.account_id && tx.is_paid !== false) {
      const revertDelta = tx.type === 'INCOME' ? -Number(tx.amount) : Number(tx.amount);
      await accountsService.updateBalance(tx.account_id, revertDelta);
    }

    const currentLocal = getLocalTransactions(user.id);
    saveLocalTransactions(user.id, currentLocal.filter(t => t.id !== id));

    const { error } = await client
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  }
};
