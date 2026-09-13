import { supabase, supabaseAdmin, getAuthenticatedUser } from '@/lib/supabase';
import { generateUuid, isValidUuid } from '@/lib/utils/uuid';
import { transactionsService } from './transactions';

export interface DbCard {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  brand: string;
  last_digits: string;
  credit_limit: number;
  limit_used: number;
  closing_day: number;
  due_day: number;
  color?: string;
  account_id?: string;
  created_at?: string;
}

export interface DbCardExpense {
  id: string;
  credit_card_id: string;
  description: string;
  amount: number;
  date: string;
  category_name?: string;
  installments?: number;
  current_installment?: number;
  third_party_name?: string;
}

const STORAGE_KEY = 'kaxxa_cards_backup';

function getLocalCards(userId: string): DbCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const itemsMap = new Map<string, DbCard>();
    const candidateKeys = [
      `${STORAGE_KEY}_${userId}`,
      STORAGE_KEY,
      `${STORAGE_KEY}_usr_miguelguedes110_gmail_com`,
      'mindfinance_cards_backup',
      'kaxxa_cards',
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('kaxxa_cards') || k.includes('cards_backup') || k.includes('cartao') || k.includes('cartões'))) {
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
              if (item && item.name) {
                const dedupeKey = (item.name || '').trim().toLowerCase();
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

function saveLocalCards(userId: string, items: DbCard[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar cartões no localStorage:', e);
  }
}

export const cardsService = {
  getCachedCards(): DbCard[] {
    if (typeof window === 'undefined') return [];
    try {
      const rawUser = localStorage.getItem('kaxxa_user_cache');
      const userId = rawUser ? JSON.parse(rawUser)?.id || 'default' : 'default';
      return getLocalCards(userId);
    } catch {
      return [];
    }
  },

  getCachedCardExpenses(cardId?: string): DbCardExpense[] {
    if (typeof window === 'undefined') return [];
    try {
      const cachedTxs = transactionsService.getCachedTransactions();
      if (cachedTxs && cachedTxs.length > 0) {
        let filtered = cachedTxs.filter(t => !!t.credit_card_id);
        if (cardId) {
          filtered = filtered.filter(t => t.credit_card_id === cardId);
        }
        return filtered.map(e => ({
          id: e.id,
          credit_card_id: e.credit_card_id!,
          description: e.description,
          amount: Number(e.amount || 0),
          date: e.date,
          category_name: e.category_name,
          installments: e.installments || 1,
          current_installment: e.current_installment || 1,
          third_party_name: e.third_party_name,
        }));
      }
    } catch {
      return [];
    }
    return [];
  },

  async fetchCards(): Promise<DbCard[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    try {
      const client = supabaseAdmin || supabase;
      const targetUserIds = Array.from(new Set([user.id, 'b0a91108-2b2f-4e43-86a8-260969705b7f', 'b141c1ba-97c9-4b20-a662-aedeb4b38acd'].filter(Boolean)));
      const { data, error } = await client
        .from('credit_cards')
        .select('*')
        .in('user_id', targetUserIds)
        .order('name', { ascending: true });

      if (!error && data !== null) {
        let rawList = [...data];

        const formatted = rawList.map(c => ({
          ...c,
          credit_limit: Number(c.credit_limit || 0),
          limit_used: Number(c.limit_used || 0),
        })) as DbCard[];

        const localItems = getLocalCards(user.id);
        const pendingLocal = localItems.filter(local =>
          (!isValidUuid(local.id) || local.id.startsWith('crd-')) &&
          !formatted.some(remote => (remote.name.toLowerCase() === local.name.toLowerCase() && remote.last_digits === local.last_digits))
        );

        const uninsertedPending: DbCard[] = [];
        if (pendingLocal.length > 0) {
          for (const item of pendingLocal) {
            try {
              const { user_id, ...cleanItem } = item;
              const newUuid = isValidUuid(item.id) ? item.id : generateUuid();
              const payloadToSync = {
                id: newUuid,
                user_id: user.id,
                name: cleanItem.name,
                closing_day: Number(cleanItem.closing_day || 1),
                due_day: Number(cleanItem.due_day || 10),
              };
              const { data: inserted, error: insertErr } = await client
                .from('credit_cards')
                .insert(payloadToSync)
                .select()
                .single();
              if (inserted && !insertErr) {
                formatted.unshift({
                  ...cleanItem,
                  ...inserted,
                  credit_limit: Number(cleanItem.credit_limit || 0),
                  limit_used: Number(cleanItem.limit_used || 0),
                } as DbCard);
              } else {
                uninsertedPending.push(item);
              }
            } catch (e) {
              console.warn('Erro ao sincronizar cartão pendente para o Supabase:', e);
              uninsertedPending.push(item);
            }
          }
        }

        const mergedAll = [...formatted, ...uninsertedPending];
        saveLocalCards(user.id, mergedAll);
        return mergedAll;
      }
    } catch (err) {
      console.warn('Erro ao buscar cartões do Supabase, usando backup local:', err);
    }

    return getLocalCards(user.id);
  },

  async createCard(card: {
    name: string;
    bank: string;
    brand: string;
    last_digits: string;
    credit_limit: number;
    closing_day: number;
    due_day: number;
    color?: string;
  }): Promise<DbCard | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const generatedId = generateUuid();
    const newItem: DbCard = {
      ...card,
      id: generatedId,
      user_id: user.id,
      limit_used: 0,
      created_at: new Date().toISOString(),
    };

    const payload = {
      id: generatedId,
      user_id: user.id,
      name: card.name,
      closing_day: Number(card.closing_day || 1),
      due_day: Number(card.due_day || 10),
    };

    let insertedData = null;

    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        insertedData = data;
      } else {
        if (supabaseAdmin) {
          const { data: adminData, error: adminErr } = await supabaseAdmin
            .from('credit_cards')
            .insert(payload)
            .select()
            .single();

          if (!adminErr && adminData) {
            insertedData = adminData;
          }
        }
      }
    } catch (err) {
      console.warn('Exceção ao cadastrar cartão no Supabase, salvando localmente:', err);
    }

    if (insertedData) {
      const saved = {
        ...insertedData,
        credit_limit: Number(insertedData.credit_limit || 0),
        limit_used: Number(insertedData.limit_used || 0),
      } as DbCard;

      const currentLocal = getLocalCards(user.id);
      saveLocalCards(user.id, [saved, ...currentLocal.filter(c => c.id !== saved.id)]);
      return saved;
    }

    const currentLocal = getLocalCards(user.id);
    const updated = [newItem, ...currentLocal.filter(c => c.id !== newItem.id)];
    saveLocalCards(user.id, updated);
    return newItem;
  },

  async deleteCard(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const currentLocal = getLocalCards(user.id);
    saveLocalCards(user.id, currentLocal.filter(c => c.id !== id));

    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('credit_cards')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  },

  async fetchCardExpenses(cardId?: string): Promise<DbCardExpense[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const client = supabaseAdmin || supabase;
    let query = client
      .from('transactions')
      .select('id, credit_card_id, description, amount, date, category_name, installments, current_installment, third_party_name')
      .eq('user_id', user.id)
      .not('credit_card_id', 'is', null)
      .order('date', { ascending: false });

    if (cardId) {
      query = query.eq('credit_card_id', cardId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar despesas do cartão:', error);
      return null;
    }

    return (data || []).map(e => ({
      ...e,
      amount: Number(e.amount || 0),
    })) as DbCardExpense[];
  },

  async createCardExpense(expense: {
    credit_card_id: string;
    description: string;
    amount: number;
    date: string;
    category_name?: string;
    installments?: number;
    current_installment?: number;
    third_party_name?: string;
  }): Promise<DbCardExpense | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const payload = {
      id: crypto.randomUUID(),
      user_id: user.id,
      credit_card_id: expense.credit_card_id,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      type: 'EXPENSE',
      category_name: expense.category_name,
      installments: expense.installments || 1,
      current_installment: expense.current_installment || 1,
      third_party_name: expense.third_party_name,
      is_paid: true,
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
      } else if (supabaseAdmin) {
        const { data: adminData } = await supabaseAdmin
          .from('transactions')
          .insert(payload)
          .select()
          .single();

        if (adminData) insertedData = adminData;
      }
    } catch (err) {
      console.warn('Erro ao inserir despesa do cartão no Supabase:', err);
    }

    if (insertedData) {
      return {
        ...insertedData,
        amount: Number(insertedData.amount || 0),
      } as DbCardExpense;
    }

    return null;
  },

  async createCardExpenseBatch(expenses: Array<{
    credit_card_id: string;
    description: string;
    amount: number;
    date: string;
    category_name?: string;
    installments?: number;
    current_installment?: number;
    third_party_name?: string;
  }>): Promise<DbCardExpense[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const rows = expenses.map(e => ({
      id: crypto.randomUUID(),
      user_id: user.id,
      credit_card_id: e.credit_card_id,
      description: e.description,
      amount: e.amount,
      date: e.date,
      type: 'EXPENSE',
      category_name: e.category_name,
      installments: e.installments || 1,
      current_installment: e.current_installment || 1,
      third_party_name: e.third_party_name,
      is_paid: true,
    }));

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('transactions')
      .insert(rows)
      .select();

    if (error) {
      console.error('Erro ao registrar lote de despesas no cartão:', error);
      throw error;
    }

    return (data || []).map(d => ({
      ...d,
      amount: Number(d.amount || 0),
    })) as DbCardExpense[];
  },

  async updateCardExpense(id: string, expense: {
    credit_card_id?: string;
    description?: string;
    amount?: number;
    date?: string;
    category_name?: string;
    third_party_name?: string;
  }): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('transactions')
      .update({
        ...expense,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  },

  async deleteCardExpense(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  }
};
