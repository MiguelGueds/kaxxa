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

const STORAGE_KEY = 'kaxxa_third_party_debts_backup';

function getLocalDebts(userId: string): DbThirdPartyDebt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalDebts(userId: string, items: DbThirdPartyDebt[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar débitos no localStorage:', e);
  }
}

export const thirdPartiesService = {
  async fetchDebts(): Promise<DbThirdPartyDebt[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('third_party_debts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data !== null) {
        const formatted = (data || []).map(d => ({
          ...d,
          total_amount: Number(d.total_amount || 0),
          paid_amount: Number(d.paid_amount || 0),
        })) as DbThirdPartyDebt[];

        // Sincroniza débitos criados localmente em offline/pendentes que ainda não subiram para o Supabase
        const localItems = getLocalDebts(user.id);
        const pendingLocal = localItems.filter(local => 
          local.id.startsWith('tp-') &&
          !formatted.some(remote => remote.id === local.id || (remote.person_name === local.person_name && remote.description === local.description))
        );

        if (pendingLocal.length > 0) {
          for (const item of pendingLocal) {
            try {
              const { id, user_id, ...cleanItem } = item;
              const { data: inserted } = await supabase
                .from('third_party_debts')
                .insert({ ...cleanItem, user_id: user.id })
                .select()
                .single();
              if (inserted) {
                formatted.unshift({
                  ...inserted,
                  total_amount: Number(inserted.total_amount || 0),
                  paid_amount: Number(inserted.paid_amount || 0),
                } as DbThirdPartyDebt);
              }
            } catch (e) {
              console.warn('Erro ao sincronizar débito de terceiro para o Supabase:', e);
            }
          }
        }

        saveLocalDebts(user.id, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn('Supabase indisponível para busca de débitos, usando backup local:', err);
    }

    const localData = getLocalDebts(user.id);
    return localData;
  },

  async createDebt(debt: Omit<DbThirdPartyDebt, 'id' | 'user_id' | 'created_at'>): Promise<DbThirdPartyDebt | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const newItem: DbThirdPartyDebt = {
      ...debt,
      id: 'tp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('third_party_debts')
        .insert({
          ...debt,
          user_id: user.id,
        })
        .select()
        .single();

      if (!error && data) {
        const saved = {
          ...data,
          total_amount: Number(data.total_amount || 0),
          paid_amount: Number(data.paid_amount || 0),
        } as DbThirdPartyDebt;

        const currentLocal = getLocalDebts(user.id);
        saveLocalDebts(user.id, [saved, ...currentLocal.filter(d => d.id !== saved.id)]);
        return saved;
      }
    } catch (err) {
      console.warn('Erro ao inserir débito no Supabase, salvando localmente:', err);
    }

    const currentLocal = getLocalDebts(user.id);
    const updated = [newItem, ...currentLocal.filter(d => d.id !== newItem.id)];
    saveLocalDebts(user.id, updated);
    return newItem;
  },

  async updateDebt(id: string, updates: Partial<DbThirdPartyDebt>): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const currentLocal = getLocalDebts(user.id);
    const updatedLocal = currentLocal.map(item => item.id === id ? { ...item, ...updates } : item);
    saveLocalDebts(user.id, updatedLocal);

    try {
      const { error } = await supabase
        .from('third_party_debts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      return !error;
    } catch {
      return true;
    }
  },

  async deleteDebt(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const currentLocal = getLocalDebts(user.id);
    const updatedLocal = currentLocal.filter(item => item.id !== id);
    saveLocalDebts(user.id, updatedLocal);

    try {
      const { error } = await supabase
        .from('third_party_debts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      return !error;
    } catch {
      return true;
    }
  }
};

