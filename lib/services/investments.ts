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

const STORAGE_KEY = 'kaxxa_investments_backup';

function getLocalInvestments(userId: string): DbInvestment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalInvestments(userId: string, items: DbInvestment[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar investimentos no localStorage:', e);
  }
}

export const investmentsService = {
  async fetchInvestments(): Promise<DbInvestment[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data !== null) {
        const formatted = data.map(inv => ({
          ...inv,
          quantity: Number(inv.quantity || 0),
          average_price: Number(inv.average_price || 0),
          invested_amount: Number(inv.invested_amount || 0),
          current_value: Number(inv.current_value || 0),
          profitability_pct: Number(inv.profitability_pct || 0),
        })) as DbInvestment[];

        // Sincroniza itens locais criados em offline/pendentes que ainda não subiram para o Supabase
        const localItems = getLocalInvestments(user.id);
        const pendingLocal = localItems.filter(local => 
          (local.id.startsWith('inv-') || local.id.startsWith('rf-') || local.id.startsWith('rv-')) &&
          !formatted.some(remote => remote.id === local.id || (remote.name === local.name && remote.category === local.category))
        );

        if (pendingLocal.length > 0) {
          for (const item of pendingLocal) {
            try {
              const { id, user_id, ...cleanItem } = item;
              const { data: inserted } = await supabase
                .from('investments')
                .insert({ ...cleanItem, user_id: user.id })
                .select()
                .single();
              if (inserted) {
                formatted.unshift({
                  ...inserted,
                  quantity: Number(inserted.quantity || 0),
                  average_price: Number(inserted.average_price || 0),
                  invested_amount: Number(inserted.invested_amount || 0),
                  current_value: Number(inserted.current_value || 0),
                  profitability_pct: Number(inserted.profitability_pct || 0),
                } as DbInvestment);
              }
            } catch (e) {
              console.warn('Erro ao sincronizar investimento pendente para o Supabase:', e);
            }
          }
        }

        saveLocalInvestments(user.id, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn('Supabase indisponível para busca de investimentos, usando backup local:', err);
    }

    const localData = getLocalInvestments(user.id);
    return localData;
  },

  async createInvestment(inv: Omit<DbInvestment, 'id' | 'user_id'> & { created_at?: string }): Promise<DbInvestment | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const newItem: DbInvestment = {
      ...inv,
      id: 'inv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      user_id: user.id,
      created_at: inv.created_at || new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('investments')
        .insert({
          ...inv,
          user_id: user.id,
          created_at: inv.created_at || new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        const saved = {
          ...data,
          quantity: Number(data.quantity || 0),
          average_price: Number(data.average_price || 0),
          invested_amount: Number(data.invested_amount || 0),
          current_value: Number(data.current_value || 0),
          profitability_pct: Number(data.profitability_pct || 0),
        } as DbInvestment;

        const currentLocal = getLocalInvestments(user.id);
        saveLocalInvestments(user.id, [saved, ...currentLocal.filter(i => i.id !== saved.id)]);
        return saved;
      }
    } catch (err) {
      console.warn('Erro ao inserir investimento no Supabase, salvando localmente:', err);
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
      const { error } = await supabase
        .from('investments')
        .update(updates)
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
      const { error } = await supabase
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

