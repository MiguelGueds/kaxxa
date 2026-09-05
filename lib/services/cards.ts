import { supabase, getAuthenticatedUser } from '@/lib/supabase';

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

export const cardsService = {
  async fetchCards(): Promise<DbCard[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar cartões:', error);
      return null;
    }

    return (data || []).map(c => ({
      ...c,
      credit_limit: Number(c.credit_limit || 0),
      limit_used: Number(c.limit_used || 0),
    })) as DbCard[];
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

    const { data, error } = await supabase
      .from('credit_cards')
      .insert({
        ...card,
        user_id: user.id,
        limit_used: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao cadastrar cartão:', error);
      throw error;
    }

    return {
      ...data,
      credit_limit: Number(data.credit_limit || 0),
      limit_used: Number(data.limit_used || 0),
    } as DbCard;
  },

  async deleteCard(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  },

  async fetchCardExpenses(cardId?: string): Promise<DbCardExpense[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    let query = supabase
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

    const { data, error } = await supabase
      .from('transactions')
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao registrar despesa no cartão:', error);
      throw error;
    }

    return {
      ...data,
      amount: Number(data.amount || 0),
    } as DbCardExpense;
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

    const { data, error } = await supabase
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

    const { error } = await supabase
      .from('transactions')
      .update({
        ...expense,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao atualizar despesa do cartão:', error);
      return false;
    }
    return true;
  },

  async deleteCardExpense(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao excluir despesa do cartão:', error);
      return false;
    }
    return true;
  }
};
