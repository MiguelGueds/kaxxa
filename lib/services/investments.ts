import { supabase, supabaseAdmin, getAuthenticatedUser } from '@/lib/supabase';
import { generateUuid, isValidUuid } from '@/lib/utils/uuid';

export interface DbInvestment {
  id: string;
  user_id: string;
  macro_type: 'FIXA' | 'VARIAVEL';
  category: string;
  name: string;
  ticker?: string;
  institution: string;
  rate_or_yield?: string;
  liquidity?: string;
  due_date?: string;
  quantity: number;
  average_price: number;
  invested_amount: number;
  current_value: number;
  profitability_pct: number;
  total_dividends_received?: number;
  account_id?: string;
  notes?: string;
  created_at?: string;
}

const STORAGE_KEY = 'kaxxa_investments_backup';

function getLocalInvestments(userId: string): DbInvestment[] {
  if (typeof window === 'undefined') return [];
  try {
    const itemsMap = new Map<string, DbInvestment>();
    const staticMockIds = new Set(['rf-1', 'rf-2', 'rf-3', 'rf-4', 'rf-5', 'rv-1', 'rv-2', 'rv-3', 'rv-4', 'rv-5']);

    const candidateKeys = [
      `${STORAGE_KEY}_${userId}`,
      STORAGE_KEY,
      `${STORAGE_KEY}_usr_miguelguedes110_gmail_com`,
      'mindfinance_investments_backup',
      'kaxxa_investments',
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('kaxxa_investments') || k.includes('investments_backup') || k.includes('investimento'))) {
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
              if (item && item.name && !staticMockIds.has(item.id)) {
                const dedupeKey = `${(item.name || '').trim().toLowerCase()}_${item.category || ''}`;
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

function saveLocalInvestments(userId: string, items: DbInvestment[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar investimentos no localStorage:', e);
  }
}

export const investmentsService = {
  getCachedInvestments(): DbInvestment[] {
    if (typeof window === 'undefined') return [];
    try {
      const rawUser = localStorage.getItem('kaxxa_user_cache');
      const userId = rawUser ? JSON.parse(rawUser)?.id || 'default' : 'default';
      const staticMockIds = new Set(['rf-1', 'rf-2', 'rf-3', 'rf-4', 'rf-5', 'rv-1', 'rv-2', 'rv-3', 'rv-4', 'rv-5']);
      return getLocalInvestments(userId).filter(i => !staticMockIds.has(i.id));
    } catch {
      return [];
    }
  },

  async fetchInvestments(): Promise<DbInvestment[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    try {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data !== null) {
        let rawList = [...data];

        const formatted = rawList.map(inv => ({
          ...inv,
          quantity: Number(inv.quantity || 0),
          average_price: Number(inv.average_price || 0),
          invested_amount: Number(inv.invested_amount || 0),
          current_value: Number(inv.current_value || 0),
          profitability_pct: Number(inv.profitability_pct || 0),
          total_dividends_received: Number(inv.total_dividends_received || 0),
        })) as DbInvestment[];

        // Purga apenas os IDs estáticos fictícios de demonstração antiga
        const staticMockIds = new Set(['rf-1', 'rf-2', 'rf-3', 'rf-4', 'rf-5', 'rv-1', 'rv-2', 'rv-3', 'rv-4', 'rv-5']);
        const localItems = getLocalInvestments(user.id);
        const realPendingLocal = localItems.filter(local => 
          !staticMockIds.has(local.id) &&
          !formatted.some(remote => remote.id === local.id || (remote.name.toLowerCase() === local.name.toLowerCase() && remote.category === local.category))
        );

        const uninsertedPending: DbInvestment[] = [];
        if (realPendingLocal.length > 0) {
          for (const item of realPendingLocal) {
            try {
              const newUuid = isValidUuid(item.id) ? item.id : generateUuid();
              const payloadToSync = {
                id: newUuid,
                user_id: user.id,
                macro_type: item.macro_type || 'VARIAVEL',
                category: item.category,
                name: item.name,
                ticker: item.ticker || null,
                institution: item.institution || '',
                rate_or_yield: item.rate_or_yield || null,
                liquidity: item.liquidity || null,
                due_date: item.due_date || null,
                quantity: Number(item.quantity || 0),
                average_price: Number(item.average_price || 0),
                invested_amount: Number(item.invested_amount || 0),
                current_value: Number(item.current_value || 0),
                profitability_pct: Number(item.profitability_pct || 0),
                account_id: item.account_id || null,
                notes: item.notes || null,
                created_at: item.created_at || new Date().toISOString(),
              };
              const { data: inserted, error: insertErr } = await client
                .from('investments')
                .insert(payloadToSync)
                .select()
                .single();
              if (inserted && !insertErr) {
                formatted.unshift({
                  ...inserted,
                  quantity: Number(inserted.quantity || 0),
                  average_price: Number(inserted.average_price || 0),
                  invested_amount: Number(inserted.invested_amount || 0),
                  current_value: Number(inserted.current_value || 0),
                  profitability_pct: Number(inserted.profitability_pct || 0),
                  total_dividends_received: Number(item.total_dividends_received || 0),
                } as DbInvestment);
              } else {
                uninsertedPending.push(item);
              }
            } catch (e) {
              console.warn('Erro ao sincronizar investimento pendente para o Supabase:', e);
              uninsertedPending.push(item);
            }
          }
        }

        const mergedAll = [...formatted, ...uninsertedPending];
        saveLocalInvestments(user.id, mergedAll);
        return mergedAll;
      }
    } catch (err) {
      console.warn('Supabase indisponível para busca de investimentos, usando backup local:', err);
    }

    const staticMockIds = new Set(['rf-1', 'rf-2', 'rf-3', 'rf-4', 'rf-5', 'rv-1', 'rv-2', 'rv-3', 'rv-4', 'rv-5']);
    const localData = getLocalInvestments(user.id);
    return localData.filter(i => !staticMockIds.has(i.id));
  },

  async createInvestment(inv: Omit<DbInvestment, 'id' | 'user_id'> & { created_at?: string }): Promise<DbInvestment | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const generatedId = generateUuid();
    const newItem: DbInvestment = {
      ...inv,
      id: generatedId,
      user_id: user.id,
      created_at: inv.created_at || new Date().toISOString(),
    };

    const cleanPayload = {
      id: generatedId,
      user_id: user.id,
      macro_type: inv.macro_type || 'VARIAVEL',
      category: inv.category,
      name: inv.name,
      ticker: inv.ticker || null,
      institution: inv.institution || '',
      rate_or_yield: inv.rate_or_yield || null,
      liquidity: inv.liquidity || null,
      due_date: inv.due_date || null,
      quantity: Number(inv.quantity || 0),
      average_price: Number(inv.average_price || 0),
      invested_amount: Number(inv.invested_amount || 0),
      current_value: Number(inv.current_value || 0),
      profitability_pct: Number(inv.profitability_pct || 0),
      account_id: (inv as any).account_id || null,
      notes: inv.notes || null,
      created_at: newItem.created_at,
    };

    let insertedData = null;

    try {
      const { data, error } = await supabase
        .from('investments')
        .insert(cleanPayload)
        .select()
        .single();

      if (!error && data) {
        insertedData = data;
      } else if (supabaseAdmin) {
        const { data: adminData } = await supabaseAdmin
          .from('investments')
          .insert(cleanPayload)
          .select()
          .single();

        if (adminData) insertedData = adminData;
      }
    } catch (err) {
      console.warn('Erro ao inserir investimento no Supabase, salvando localmente:', err);
    }

    if (insertedData) {
      const saved = {
        ...insertedData,
        quantity: Number(insertedData.quantity || 0),
        average_price: Number(insertedData.average_price || 0),
        invested_amount: Number(insertedData.invested_amount || 0),
        current_value: Number(insertedData.current_value || 0),
        profitability_pct: Number(insertedData.profitability_pct || 0),
        total_dividends_received: Number(inv.total_dividends_received || 0),
      } as DbInvestment;

      const currentLocal = getLocalInvestments(user.id);
      saveLocalInvestments(user.id, [saved, ...currentLocal.filter(i => i.id !== saved.id)]);
      return saved;
    }

    const currentLocal = getLocalInvestments(user.id);
    const updated = [newItem, ...currentLocal.filter(i => i.id !== newItem.id)];
    saveLocalInvestments(user.id, updated);
    return newItem;
  },

  async updateInvestment(id: string, updates: Partial<DbInvestment>): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const currentLocal = getLocalInvestments(user.id);
    const updatedLocal = currentLocal.map(item => item.id === id ? { ...item, ...updates } : item);
    saveLocalInvestments(user.id, updatedLocal);

    try {
      const client = supabaseAdmin || supabase;
      const { total_dividends_received, ...cleanUpdates } = updates as any;
      const { error } = await client
        .from('investments')
        .update(cleanUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      return !error;
    } catch {
      return true;
    }
  },

  async deleteInvestment(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const currentLocal = getLocalInvestments(user.id);
    const updatedLocal = currentLocal.filter(item => item.id !== id);
    saveLocalInvestments(user.id, updatedLocal);

    try {
      const client = supabaseAdmin || supabase;
      const { error } = await client
        .from('investments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      return !error;
    } catch {
      return true;
    }
  }
};
