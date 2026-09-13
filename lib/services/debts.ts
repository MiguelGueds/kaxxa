import { supabase, supabaseAdmin, getAuthenticatedUser } from '@/lib/supabase';

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
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalDebts(userId: string, items: DbDebt[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar dívidas no localStorage:', e);
  }
}

export const debtsService = {
  getCachedDebts(): DbDebt[] {
    if (typeof window === 'undefined') return [];
    try {
      const rawUser = localStorage.getItem('kaxxa_user_cache');
      if (!rawUser) return [];
      const user = JSON.parse(rawUser);
      if (!user || !user.id) return [];
      return getLocalDebts(user.id);
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

        // Tenta buscar e migrar dívidas com o ID legado de e-mail (ex: usr_somoskaxxa_gmail_com)
        if (user.email) {
          const legacyId = 'usr_' + user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (legacyId !== user.id) {
            const { data: legacyDebts } = await client
              .from('debts')
              .select('*, amortizations(*)')
              .eq('user_id', legacyId);

            if (legacyDebts && legacyDebts.length > 0) {
              await client
                .from('debts')
                .update({ user_id: user.id })
                .eq('user_id', legacyId);

              legacyDebts.forEach(d => {
                if (!rawList.some(r => r.id === d.id)) {
                  rawList.push({ ...d, user_id: user.id });
                }
              });
            }
          }
        }

        const formatted = rawList as DbDebt[];

        const localItems = getLocalDebts(user.id);
        const pendingLocal = localItems.filter(local =>
          local.id.startsWith('dbt-') &&
          !formatted.some(remote => remote.id === local.id || remote.name.toLowerCase() === local.name.toLowerCase())
        );

        const uninsertedPending: DbDebt[] = [];
        if (pendingLocal.length > 0) {
          for (const item of pendingLocal) {
            try {
              const { user_id, amortizations, ...cleanItem } = item;
              const payloadToSync = {
                ...cleanItem,
                id: item.id || ('dbt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)),
                user_id: user.id
              };
              const { data: inserted } = await client
                .from('debts')
                .insert(payloadToSync)
                .select('*, amortizations(*)')
                .single();

              if (inserted) {
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

    const newItem: DbDebt = {
      ...debtData,
      id: 'dbt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      user_id: user.id,
    };

    const payload = {
      ...debtData,
      id: newItem.id,
      user_id: user.id,
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
