import { supabase, supabaseAdmin, getAuthenticatedUser } from '@/lib/supabase';
import { generateUuid, isValidUuid } from '@/lib/utils/uuid';

export interface DbAmortization {
  id: string;
  debt_id: string;
  user_id: string;
  date: string;
  amount_paid: number;
  discount_or_saved_interest: number;
  type: 'REGULAR' | 'EXTRAORDINARY';
  notes?: string;
}

export interface DbDebt {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  creditor_type: 'BANK' | 'PERSON';
  category: string;
  original_amount: number;
  current_balance: number;
  monthly_payment: number;
  total_paid: number;
  total_discounts: number;
  total_installments: number;
  paid_installments: number;
  interest_rate: string;
  interest_numeric: number;
  due_day: number;
  start_date?: string;
  estimated_end_date?: string;
  status: 'ACTIVE' | 'PAID_OFF';
  is_third_party_responsibility: boolean;
  third_party_debtor_name?: string;
  notes?: string;
  amortizations?: DbAmortization[];
}

const STORAGE_KEY = 'kaxxa_debts_backup';

function getLocalDebts(userId: string): DbDebt[] {
  if (typeof window === 'undefined') return [];
  try {
    const itemsMap = new Map<string, DbDebt>();
    const candidateKeys = [
      `${STORAGE_KEY}_${userId}`,
      STORAGE_KEY,
      `${STORAGE_KEY}_usr_miguelguedes110_gmail_com`,
      'mindfinance_debts_backup',
      'kaxxa_debts',
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('kaxxa_debts') || k.includes('debts_backup') || k.includes('divida') || k.includes('dívida'))) {
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

function saveLocalDebts(userId: string, items: DbDebt[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar dívidas no localStorage:', e);
  }
}

export const debtsService = {
  getCachedDebts(): DbDebt[] {
    if (typeof window === 'undefined') return [];
    try {
      const rawUser = localStorage.getItem('kaxxa_user_cache');
      const userId = rawUser ? JSON.parse(rawUser)?.id || 'default' : 'default';
      return getLocalDebts(userId);
    } catch {
      return [];
    }
  },

  async fetchDebts(): Promise<DbDebt[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    try {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('debts')
        .select('*, amortizations(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data !== null) {
        let rawList = [...data];

        const formatted = rawList as DbDebt[];

        const localItems = getLocalDebts(user.id);
        const pendingLocal = localItems.filter(local =>
          (!isValidUuid(local.id) || local.id.startsWith('dbt-')) &&
          !formatted.some(remote => remote.id === local.id || remote.name.toLowerCase() === local.name.toLowerCase())
        );

        const uninsertedPending: DbDebt[] = [];
        if (pendingLocal.length > 0) {
          for (const item of pendingLocal) {
            try {
              const { user_id, amortizations, ...cleanItem } = item;
              const newUuid = isValidUuid(item.id) ? item.id : generateUuid();
              const payloadToSync = {
                ...cleanItem,
                id: newUuid,
                user_id: user.id,
                monthly_payment: Number(cleanItem.monthly_payment || 0),
                original_amount: Number(cleanItem.original_amount || 0),
                current_balance: Number(cleanItem.current_balance || 0),
              };
              const { data: inserted, error: insertErr } = await client
                .from('debts')
                .insert(payloadToSync)
                .select('*, amortizations(*)')
                .single();

              if (inserted && !insertErr) {
                formatted.unshift(inserted as DbDebt);
              } else {
                uninsertedPending.push(item);
              }
            } catch (e) {
              console.warn('Erro ao sincronizar dívida pendente para o Supabase:', e);
              uninsertedPending.push(item);
            }
          }
        }

        const mergedAll = [...formatted, ...uninsertedPending];
        saveLocalDebts(user.id, mergedAll);
        return mergedAll;
      }
    } catch (err) {
      console.warn('Erro ao buscar dívidas do Supabase, usando backup local:', err);
    }

    return getLocalDebts(user.id);
  },

  async createDebt(debtData: Omit<DbDebt, 'id' | 'user_id' | 'amortizations'>): Promise<DbDebt | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const generatedId = generateUuid();
    const newItem: DbDebt = {
      ...debtData,
      id: generatedId,
      user_id: user.id,
    };

    const payload = {
      ...debtData,
      id: generatedId,
      user_id: user.id,
      monthly_payment: Number(debtData.monthly_payment || 0),
      original_amount: Number(debtData.original_amount || 0),
      current_balance: Number(debtData.current_balance || 0),
    };

    let insertedData = null;

    try {
      const { data, error } = await supabase
        .from('debts')
        .insert(payload)
        .select('*, amortizations(*)')
        .single();

      if (!error && data) {
        insertedData = data;
      } else if (supabaseAdmin) {
        const { data: adminData } = await supabaseAdmin
          .from('debts')
          .insert(payload)
          .select('*, amortizations(*)')
          .single();

        if (adminData) insertedData = adminData;
      }
    } catch (err) {
      console.warn('Exceção ao cadastrar dívida no Supabase, salvando localmente:', err);
    }

    if (insertedData) {
      const saved = insertedData as DbDebt;
      const currentLocal = getLocalDebts(user.id);
      saveLocalDebts(user.id, [saved, ...currentLocal.filter(d => d.id !== saved.id)]);
      return saved;
    }

    const currentLocal = getLocalDebts(user.id);
    const updated = [newItem, ...currentLocal.filter(d => d.id !== newItem.id)];
    saveLocalDebts(user.id, updated);
    return newItem;
  },

  async updateDebt(id: string, updates: Partial<DbDebt>): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const currentLocal = getLocalDebts(user.id);
    saveLocalDebts(user.id, currentLocal.map(item => item.id === id ? { ...item, ...updates } : item));

    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('debts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  },

  async deleteDebt(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const currentLocal = getLocalDebts(user.id);
    saveLocalDebts(user.id, currentLocal.filter(item => item.id !== id));

    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('debts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  },

  async addAmortization(debtId: string, amortData: {
    date: string;
    amountPaid: number;
    discountOrSavedInterest: number;
    type: 'REGULAR' | 'EXTRAORDINARY';
    notes?: string;
  }): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const client = supabaseAdmin || supabase;
    const { error: amortError } = await client
      .from('amortizations')
      .insert({
        debt_id: debtId,
        user_id: user.id,
        date: amortData.date,
        amount_paid: amortData.amountPaid,
        discount_or_saved_interest: amortData.discountOrSavedInterest,
        type: amortData.type,
        notes: amortData.notes || '',
      });

    if (amortError) {
      console.error('Erro ao registrar amortização:', amortError);
    }

    const { data: debt } = await client
      .from('debts')
      .select('*')
      .eq('id', debtId)
      .eq('user_id', user.id)
      .single();

    if (!debt) return true;

    const newPaid = Number(debt.total_paid || 0) + Number(amortData.amountPaid);
    const newDiscounts = Number(debt.total_discounts || 0) + Number(amortData.discountOrSavedInterest);
    const reduction = Number(amortData.amountPaid) + Number(amortData.discountOrSavedInterest);
    const newBalance = Math.max(0, Number(debt.current_balance || 0) - reduction);
    const newPaidInstallments = Number(debt.paid_installments || 0) + (amortData.type === 'REGULAR' ? 1 : 0);
    const isPaidOff = newBalance <= 0;

    await client
      .from('debts')
      .update({
        current_balance: newBalance,
        total_paid: newPaid,
        total_discounts: newDiscounts,
        paid_installments: newPaidInstallments,
        status: isPaidOff ? 'PAID_OFF' : debt.status,
      })
      .eq('id', debtId)
      .eq('user_id', user.id);

    return true;
  }
};
