import { supabase, supabaseAdmin, getAuthenticatedUser } from '@/lib/supabase';
import { generateUuid, isValidUuid } from '@/lib/utils/uuid';
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
    const itemsMap = new Map<string, DbTransaction>();
    const candidateKeys = [
      `${STORAGE_KEY}_${userId}`,
      STORAGE_KEY,
      `${STORAGE_KEY}_usr_miguelguedes110_gmail_com`,
      'mindfinance_transactions_backup',
      'kaxxa_transactions',
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('kaxxa_transactions') || k.includes('transactions_backup') || k.includes('transac') || k.includes('lancamentos'))) {
        if (!candidateKeys.includes(k)) candidateKeys.push(k);
      }
    }

    for (const key of candidateKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            for (const item of list) {
              if (item && (item.description || item.amount)) {
                const dedupeKey = `${(item.description || '').trim().toLowerCase()}_${item.date || ''}_${item.amount || 0}`;
                if (!itemsMap.has(dedupeKey)) {
                  itemsMap.set(dedupeKey, item);
                }
              }
            }
          }
        }
      } catch {}
    }

    return Array.from(itemsMap.values());
  } catch {
    return [];
  }
}

function saveLocalTransactions(userId: string, items: DbTransaction[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar transações no localStorage:', e);
  }
}

export const transactionsService = {
  getCachedTransactions(): DbTransaction[] {
    if (typeof window === 'undefined') return [];
    try {
      const rawUser = localStorage.getItem('kaxxa_user_cache');
      const userId = rawUser ? JSON.parse(rawUser)?.id || 'default' : 'default';
      return getLocalTransactions(userId);
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

        const formatted = rawList.map(t => ({
          ...t,
          amount: Number(t.amount || 0),
        })) as DbTransaction[];

        // Sincroniza transações criadas localmente pendentes que ainda não subiram para o Supabase
        const localItems = getLocalTransactions(user.id);
        const pendingLocal = localItems.filter(local =>
          (!isValidUuid(local.id) || local.id.startsWith('tx-')) &&
          !formatted.some(remote => (remote.description === local.description && remote.date === local.date && Number(remote.amount) === Number(local.amount)))
        );

        const uninsertedPending: DbTransaction[] = [];
        if (pendingLocal.length > 0) {
          for (const item of pendingLocal) {
            try {
              const { user_id, ...cleanItem } = item;
              const newUuid = isValidUuid(item.id) ? item.id : generateUuid();
              const payloadToSync = {
                id: newUuid,
                user_id: user.id,
                description: item.description || 'Sem descrição',
                amount: Number(item.amount || 0),
                type: item.type || 'EXPENSE',
                category_id: isValidUuid(item.category_id) ? item.category_id : null,
                account_id: isValidUuid(item.account_id) ? item.account_id : null,
                credit_card_id: isValidUuid(item.credit_card_id) ? item.credit_card_id : null,
                date: item.date || new Date().toISOString().split('T')[0],
                is_paid: item.is_paid !== undefined ? Boolean(item.is_paid) : true,
                notes: item.notes || null,
              };
              const { data: inserted, error: insertErr } = await client
                .from('transactions')
                .insert(payloadToSync)
                .select()
                .single();
              if (inserted && !insertErr) {
                formatted.unshift({
                  ...item,
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

    const generatedId = generateUuid();
    const newItem: DbTransaction = {
      ...tx,
      id: generatedId,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    const payload = {
      id: generatedId,
      user_id: user.id,
      description: tx.description || 'Sem descrição',
      amount: Number(tx.amount || 0),
      type: tx.type || 'EXPENSE',
      category_id: isValidUuid(tx.category_id) ? tx.category_id : null,
      account_id: isValidUuid(tx.account_id) ? tx.account_id : null,
      credit_card_id: isValidUuid(tx.credit_card_id) ? tx.credit_card_id : null,
      date: tx.date || new Date().toISOString().split('T')[0],
      is_paid: tx.is_paid !== undefined ? Boolean(tx.is_paid) : true,
      notes: tx.notes || null,
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

    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', table: 'transactions', id }),
        });
      }
      await client
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    } catch {}

    return true;
  }
};
