import { supabase, isSupabaseConfigured, getAuthenticatedUser } from '@/lib/supabase';

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

export const debtsService = {
  async fetchDebts(): Promise<DbDebt[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('debts')
      .select('*, amortizations(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar dívidas:', error);
      return null;
    }

    return data as DbDebt[];
  },

  async createDebt(debtData: Omit<DbDebt, 'id' | 'user_id' | 'amortizations'>): Promise<DbDebt | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('debts')
      .insert({
        ...debtData,
        user_id: user.id,
      })
      .select('*, amortizations(*)')
      .single();

    if (error) {
      console.error('Erro ao cadastrar dívida:', error);
      throw error;
    }

    return data as DbDebt;
  },

  async updateDebt(id: string, updates: Partial<DbDebt>): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const { error } = await supabase
      .from('debts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao atualizar dívida:', error);
      return false;
    }

    return true;
  },

  async deleteDebt(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao excluir dívida:', error);
      return false;
    }

    return true;
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

    // 1. Inserir amortização
    const { error: amortError } = await supabase
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
      return false;
    }

    // 2. Buscar dívida atual para recalcular saldo
    const { data: debt, error: fetchError } = await supabase
      .from('debts')
      .select('*')
      .eq('id', debtId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !debt) {
      return true; // amortização salva
    }

    const newPaid = Number(debt.total_paid || 0) + Number(amortData.amountPaid);
    const newDiscounts = Number(debt.total_discounts || 0) + Number(amortData.discountOrSavedInterest);
    const reduction = Number(amortData.amountPaid) + Number(amortData.discountOrSavedInterest);
    const newBalance = Math.max(0, Number(debt.current_balance || 0) - reduction);
    const newPaidInstallments = Number(debt.paid_installments || 0) + (amortData.type === 'REGULAR' ? 1 : 0);
    const isPaidOff = newBalance <= 0;

    await supabase
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

