import { supabase, getAuthenticatedUser } from '@/lib/supabase';

export interface DbThirdPartyDebt {
  id: string;
  user_id: string;
  person_name: string;
  description: string;
  origin_type: 'CARD' | 'ACCOUNT';
  origin_bank_or_card?: string;
  total_amount: number;
  paid_amount: number;
  installments_total: number;
  current_installment: number;
  due_date?: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  notes?: string;
  created_at?: string;
}

export const thirdPartiesService = {
  async fetchDebts(): Promise<DbThirdPartyDebt[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('third_party_debts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar débitos de terceiros:', error);
      return null;
    }

    return (data || []).map(d => ({
      ...d,
      total_amount: Number(d.total_amount || 0),
      paid_amount: Number(d.paid_amount || 0),
    })) as DbThirdPartyDebt[];
  },

  async createDebt(debt: Omit<DbThirdPartyDebt, 'id' | 'user_id' | 'created_at'>): Promise<DbThirdPartyDebt | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('third_party_debts')
      .insert({
        ...debt,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao cadastrar débito de terceiro:', error);
      throw error;
    }

    return {
      ...data,
      total_amount: Number(data.total_amount || 0),
      paid_amount: Number(data.paid_amount || 0),
    } as DbThirdPartyDebt;
  },

  async updateDebt(id: string, updates: Partial<DbThirdPartyDebt>): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const { error } = await supabase
      .from('third_party_debts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  },

  async deleteDebt(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const { error } = await supabase
      .from('third_party_debts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  }
};

