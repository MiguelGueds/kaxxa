import { supabase, getAuthenticatedUser } from '@/lib/supabase';

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
  notes?: string;
  created_at?: string;
}

export const investmentsService = {
  async fetchInvestments(): Promise<DbInvestment[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar investimentos:', error);
      return null;
    }

    return (data || []).map(inv => ({
      ...inv,
      quantity: Number(inv.quantity || 0),
      average_price: Number(inv.average_price || 0),
      invested_amount: Number(inv.invested_amount || 0),
      current_value: Number(inv.current_value || 0),
      profitability_pct: Number(inv.profitability_pct || 0),
    })) as DbInvestment[];
  },

  async createInvestment(inv: Omit<DbInvestment, 'id' | 'user_id' | 'created_at'>): Promise<DbInvestment | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('investments')
      .insert({
        ...inv,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao cadastrar investimento:', error);
      throw error;
    }

    return {
      ...data,
      quantity: Number(data.quantity || 0),
      average_price: Number(data.average_price || 0),
      invested_amount: Number(data.invested_amount || 0),
      current_value: Number(data.current_value || 0),
      profitability_pct: Number(data.profitability_pct || 0),
    } as DbInvestment;
  },

  async updateInvestment(id: string, updates: Partial<DbInvestment>): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const { error } = await supabase
      .from('investments')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  },

  async deleteInvestment(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  }
};

